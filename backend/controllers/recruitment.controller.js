const { validationResult } = require('express-validator');
const { JobPosition, JobDescription, JdApproval, Candidate, User } = require('../models');
const { getPagination, getPaginationMeta } = require('../utils/paginate');
const aiService = require('../services/ai.service');
const { createNotification, notifyAllActiveUsers } = require('../services/notification.service');
const { extractTextFromFile } = require('../utils/textExtractor');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// ─── STEP 1: HR creates position → AI generates JD → saved as draft ──────────
async function createPosition(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error.', errors: errors.array() });
    }

    const { title, department, key_responsibilities, required_skills, experience_years, salary_lpa, deadline } = req.body;

    // Create position as draft — no manager assignment yet, no min_score
    const position = await JobPosition.create({
      title, department,
      key_responsibilities, required_skills,
      experience_years: experience_years || null,
      salary_lpa: salary_lpa || null,
      deadline: deadline || null,
      min_score: 70, // default, managers will set when approving
      status: 'draft',
      created_by_hr: req.user.id,
    });

    // Generate AI JD
    let jdContent = 'AI generation pending. Please retry.';
    let aiStatus = 'pending';
    const aiResult = await aiService.generateJobDescription({
      title, department,
      keyResponsibilities: key_responsibilities,
      requiredSkills: required_skills,
      experienceYears: experience_years,
      salaryLpa: salary_lpa,
    });

    if (aiResult.success) {
      jdContent = aiResult.data.full_jd_text || JSON.stringify(aiResult.data, null, 2);
      aiStatus = 'generated';
    } else {
      aiStatus = 'failed';
    }

    const jd = await JobDescription.create({
      position_id: position.id,
      content: jdContent,
      version: 1,
      ai_status: aiStatus,
      raw_ai_response: aiResult.success ? JSON.stringify(aiResult.data) : aiResult.error,
    });

    return res.status(201).json({
      success: true,
      message: 'JD generated and saved as draft. You can now review and send to managers for approval.',
      data: { position, jd },
    });
  } catch (err) {
    next(err);
  }
}

// ─── STEP 2: HR sends JD to selected managers for approval ────────────────────
async function sendJDForApproval(req, res, next) {
  try {
    const { id } = req.params;
    const { manager_ids } = req.body; // array of manager user IDs

    if (!manager_ids || !Array.isArray(manager_ids) || manager_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one manager to send for approval.', errors: [] });
    }

    const position = await JobPosition.findByPk(id, {
      include: [{ model: JobDescription, as: 'descriptions', required: false }],
    });
    if (!position) return res.status(404).json({ success: false, message: 'Position not found.', errors: [] });
    if (!['draft'].includes(position.status)) {
      return res.status(400).json({ success: false, message: 'JD has already been sent for approval or is already open.', errors: [] });
    }

    const jd = position.descriptions?.[0];
    if (!jd || jd.ai_status === 'failed') {
      return res.status(400).json({ success: false, message: 'Please generate the JD successfully before sending for approval.', errors: [] });
    }

    // Verify all IDs are managers
    const managers = await User.findAll({
      where: { id: { [Op.in]: manager_ids }, role: { [Op.in]: ['manager', 'super_admin'] }, is_active: true },
      attributes: ['id', 'first_name', 'last_name'],
    });
    if (managers.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid managers found with the provided IDs.', errors: [] });
    }

    // Create approval records for each manager (skip if already exists)
    const approvalRecords = [];
    for (const manager of managers) {
      const [approval, created] = await JdApproval.findOrCreate({
        where: { position_id: id, manager_id: manager.id },
        defaults: { position_id: id, manager_id: manager.id, status: 'pending' },
      });
      if (!created) {
        // Reset if previously decided
        await approval.update({ status: 'pending', comment: null, decided_at: null });
      }
      approvalRecords.push(approval);

      // Notify each manager
      await createNotification({
        userId: manager.id,
        title: `JD Review Requested: ${position.title}`,
        message: `HR has sent the Job Description for "${position.title}" (${position.department}) for your review. Please approve or reject.`,
        type: 'recruitment',
        referenceId: position.id,
        referenceType: 'job_position',
        navigateTo: `/recruitment/jd-approvals`,
      });
    }

    // Update position status to pending_approval
    await position.update({
      status: 'pending_approval',
      assigned_manager_id: managers[0].id, // keep for legacy compatibility
    });

    return res.status(200).json({
      success: true,
      message: `JD sent to ${managers.length} manager(s) for approval.`,
      data: { position, approvals: approvalRecords },
    });
  } catch (err) {
    next(err);
  }
}

// ─── STEP 3: Manager approves or rejects the JD ───────────────────────────────
async function approveJD(req, res, next) {
  try {
    const { id } = req.params;
    const { action, comment, min_score } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "approve" or "reject".', errors: [] });
    }

    const position = await JobPosition.findByPk(id, {
      include: [{ model: User, as: 'hrCreator', required: false }],
    });
    if (!position) return res.status(404).json({ success: false, message: 'Position not found.', errors: [] });
    if (position.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'Position is not pending approval.', errors: [] });
    }

    // Find this manager's approval record
    const approval = await JdApproval.findOne({
      where: { position_id: id, manager_id: req.user.id },
    });
    // Super admin can approve even without a specific approval record
    if (!approval && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'You were not assigned to review this JD.', errors: [] });
    }

    if (action === 'approve') {
      const parsedMinScore = min_score && !isNaN(parseInt(min_score))
        ? Math.min(100, Math.max(1, parseInt(min_score)))
        : position.min_score;

      // Update this manager's approval record
      if (approval) {
        await approval.update({
          status: 'approved',
          comment: comment || null,
          min_score: parsedMinScore,
          decided_at: new Date(),
        });
      }

      // Update position — first approver wins, position goes open
      await position.update({
        status: 'open',
        approved_by_manager: req.user.id,
        min_score: parsedMinScore,
      });

      // Mark all other pending approvals as resolved
      await JdApproval.update(
        { status: 'approved', decided_at: new Date() },
        { where: { position_id: id, status: 'pending' } }
      );

      // Notify ALL employees of new opening
      await notifyAllActiveUsers({
        title: '🎯 New Job Opening!',
        message: `A new position is open: ${position.title} in ${position.department}. Check open positions!`,
        type: 'recruitment',
        navigateTo: '/recruitment/positions',
      });

      // Notify HR
      if (position.created_by_hr) {
        const approver = await User.findByPk(req.user.id, { attributes: ['first_name', 'last_name'] });
        await createNotification({
          userId: position.created_by_hr,
          title: '✅ JD Approved!',
          message: `${approver.first_name} ${approver.last_name} approved the JD for "${position.title}". Position is now open for candidates.`,
          type: 'recruitment',
          navigateTo: '/recruitment/positions',
        });
      }

    } else {
      // Reject — update this manager's record
      if (approval) {
        await approval.update({
          status: 'rejected',
          comment: comment || null,
          decided_at: new Date(),
        });
      }

      // Position goes back to draft so HR can edit and re-send
      await position.update({ status: 'draft', rejection_comment: comment || null });

      // Notify HR
      if (position.created_by_hr) {
        const rejector = await User.findByPk(req.user.id, { attributes: ['first_name', 'last_name'] });
        await createNotification({
          userId: position.created_by_hr,
          title: '❌ JD Rejected',
          message: `${rejector.first_name} ${rejector.last_name} rejected the JD for "${position.title}". ${comment ? 'Comment: ' + comment : 'Please review and re-send.'}`,
          type: 'recruitment',
          navigateTo: '/recruitment/create',
        });
      }
    }

    return res.status(200).json({ success: true, message: `JD ${action}d successfully.`, data: position });
  } catch (err) {
    next(err);
  }
}

// ─── Get all positions (used by both HR "My JDs" and general list) ─────────────
async function getAllPositions(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status, mine } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    } else {
      where.status = ['open', 'pending_approval', 'closed'];
    }

    // HR can filter their own JDs
    if (mine === 'true') {
      where.created_by_hr = req.user.id;
      // HR should also see their drafts
      if (!status) where.status = { [Op.in]: ['draft', 'pending_approval', 'open', 'closed'] };
    }

    const { count, rows } = await JobPosition.findAndCountAll({
      where,
      include: [
        { model: User, as: 'hrCreator', attributes: ['id', 'first_name', 'last_name'], required: false },
        { model: User, as: 'assignedManager', attributes: ['id', 'first_name', 'last_name'], required: false },
        { model: JobDescription, as: 'descriptions', required: false, order: [['version', 'DESC']], limit: 1 },
        { model: JdApproval, as: 'approvals', required: false,
          include: [{ model: User, as: 'manager', attributes: ['id', 'first_name', 'last_name'] }] },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Positions fetched.',
      data: rows,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get positions assigned to this manager for approval ──────────────────────
async function getManagerJDApprovals(req, res, next) {
  try {
    const { status } = req.query;

    // Find all approval records for this manager
    const approvalWhere = { manager_id: req.user.id };
    if (status) approvalWhere.status = status;

    const approvals = await JdApproval.findAll({
      where: approvalWhere,
      include: [{
        model: JobPosition,
        as: 'position',
        include: [
          { model: User, as: 'hrCreator', attributes: ['id', 'first_name', 'last_name'], required: false },
          { model: JobDescription, as: 'descriptions', required: false, order: [['version', 'DESC']], limit: 1 },
        ],
      }],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({ success: true, message: 'JD approvals fetched.', data: approvals });
  } catch (err) {
    next(err);
  }
}

async function getPositionById(req, res, next) {
  try {
    const { id } = req.params;
    const position = await JobPosition.findByPk(id, {
      include: [
        { model: User, as: 'hrCreator', attributes: ['id', 'first_name', 'last_name'], required: false },
        { model: User, as: 'assignedManager', attributes: ['id', 'first_name', 'last_name'], required: false },
        { model: JobDescription, as: 'descriptions', required: false },
        { model: Candidate, as: 'candidates', required: false },
        { model: JdApproval, as: 'approvals', required: false,
          include: [{ model: User, as: 'manager', attributes: ['id', 'first_name', 'last_name'] }] },
      ],
    });
    if (!position) return res.status(404).json({ success: false, message: 'Position not found.', errors: [] });
    return res.status(200).json({ success: true, message: 'Position fetched.', data: position });
  } catch (err) {
    next(err);
  }
}

async function updateJDContent(req, res, next) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'JD content is required.', errors: [] });
    }
    const position = await JobPosition.findByPk(id);
    if (!position) return res.status(404).json({ success: false, message: 'Position not found.', errors: [] });
    if (!['pending_approval', 'draft'].includes(position.status)) {
      return res.status(400).json({ success: false, message: 'JD can only be edited while in draft or pending approval.', errors: [] });
    }
    const jd = await JobDescription.findOne({ where: { position_id: id }, order: [['version', 'DESC']] });
    if (!jd) return res.status(404).json({ success: false, message: 'No JD found for this position.', errors: [] });
    await jd.update({
      content: content.trim(),
      ai_status: 'generated',
      raw_ai_response: (jd.raw_ai_response || '') + `\n[EDITED by ${req.user.first_name} ${req.user.last_name} at ${new Date().toISOString()}]`,
    });
    return res.status(200).json({ success: true, message: 'JD updated successfully.', data: jd });
  } catch (err) {
    next(err);
  }
}

async function closePosition(req, res, next) {
  try {
    const { id } = req.params;
    const position = await JobPosition.findByPk(id);
    if (!position) return res.status(404).json({ success: false, message: 'Position not found.', errors: [] });

    // Only admin, HR, or the assigned manager of this JD can close
    const role = req.user.role;
    const isAssignedManager = role === 'manager' && position.assigned_manager_id === req.user.id;
    if (!['super_admin', 'hr'].includes(role) && !isAssignedManager) {
      return res.status(403).json({ success: false, message: 'Only Admin, HR, or the assigned manager can close this position.', errors: [] });
    }

    await position.update({ status: 'closed' });
    return res.status(200).json({ success: true, message: 'Position closed.', data: position });
  } catch (err) {
    next(err);
  }
}

async function retryJDGeneration(req, res, next) {
  try {
    const { id } = req.params;
    const position = await JobPosition.findByPk(id);
    if (!position) return res.status(404).json({ success: false, message: 'Position not found.', errors: [] });
    const aiResult = await aiService.generateJobDescription({
      title: position.title, department: position.department,
      keyResponsibilities: position.key_responsibilities,
      requiredSkills: position.required_skills,
      experienceYears: position.experience_years,
      salaryLpa: position.salary_lpa,
    });
    if (!aiResult.success) {
      return res.status(400).json({ success: false, message: aiResult.error, errors: [] });
    }
    const jdContent = aiResult.data.full_jd_text || JSON.stringify(aiResult.data, null, 2);
    const [jd] = await JobDescription.findOrCreate({
      where: { position_id: id },
      defaults: { position_id: id, content: jdContent, version: 1, ai_status: 'generated', raw_ai_response: JSON.stringify(aiResult.data) },
    });
    await jd.update({ content: jdContent, ai_status: 'generated', raw_ai_response: JSON.stringify(aiResult.data) });
    return res.status(200).json({ success: true, message: 'JD regenerated successfully.', data: jd });
  } catch (err) {
    next(err);
  }
}

async function uploadResumesAndShortlist(req, res, next) {
  try {
    const { position_id } = req.params;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No resumes uploaded.', errors: [] });
    }
    const position = await JobPosition.findByPk(position_id, {
      include: [{ model: JobDescription, as: 'descriptions', order: [['version', 'DESC']], limit: 1 }],
    });
    if (!position) return res.status(404).json({ success: false, message: 'Position not found.', errors: [] });
    const jdContent = position.descriptions?.[0]?.content || 'No JD available';
    const createdCandidates = [];
    for (const file of req.files) {
      try {
        const relativePath = file.path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/');
        let resumeText = await extractTextFromFile(relativePath, file.mimetype);
        if (!resumeText || resumeText.length < 50) {
          resumeText = `Resume uploaded: ${file.originalname}. File type: ${file.mimetype}. Text extraction limited.`;
        }
        let candidateInfo = { name: null, email: null, phone: null };
        try { candidateInfo = await aiService.extractCandidateInfo(resumeText); } catch (e) {}
        const rawName = candidateInfo.name || path.basename(file.originalname, path.extname(file.originalname)).replace(/[_-]/g, ' ');
        const candidateName = String(rawName).trim().substring(0, 190) || 'Unknown Candidate';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const rawEmail = candidateInfo.email ? String(candidateInfo.email).trim() : null;
        const candidateEmail = (rawEmail && emailRegex.test(rawEmail) && rawEmail.length <= 255) ? rawEmail : null;
        const rawPhone = candidateInfo.phone ? String(candidateInfo.phone).trim() : null;
        const candidatePhone = rawPhone ? rawPhone.replace(/[^\d+\-() ]/g, '').substring(0, 20) : null;
        const candidate = await Candidate.create({
          position_id, name: candidateName, email: candidateEmail, phone: candidatePhone,
          resume_path: relativePath, resume_text: resumeText, ai_status: 'pending', status: 'new',
        });
        const aiResult = await aiService.shortlistCandidate({ candidateName, resumeText, jdContent, minScore: position.min_score });
        if (aiResult.success) {
          const { score, strengths, gaps, skills_found_in_resume, skills_missing_from_resume, recommendation, justification } = aiResult.data;
          const parsedScore = Math.min(100, Math.max(0, parseInt(score) || 0));
          const newStatus = parsedScore >= position.min_score ? 'shortlisted' : 'rejected';
          await candidate.update({
            ai_score: parsedScore,
            ai_strengths: String(strengths || (skills_found_in_resume?.length ? `Matched: ${skills_found_in_resume.join(', ')}` : 'None')).substring(0, 5000),
            ai_gaps: String(gaps || (skills_missing_from_resume?.length ? `Missing: ${skills_missing_from_resume.join(', ')}` : 'None')).substring(0, 5000),
            ai_recommendation: `${recommendation || (parsedScore >= position.min_score ? 'shortlist' : 'reject')} — ${justification || ''}`.substring(0, 2000),
            ai_status: 'evaluated', status: newStatus,
          });
        } else {
          await candidate.update({ ai_status: 'failed' });
        }
        createdCandidates.push(candidate);
      } catch (fileErr) {
        console.error(`[Resume Upload] Error processing ${file.originalname}:`, fileErr.message);
      }
    }
    if (createdCandidates.length === 0) {
      return res.status(400).json({ success: false, message: 'All resume uploads failed.', errors: [] });
    }
    await createNotification({
      userId: req.user.id,
      title: 'AI Shortlisting Complete',
      message: `${createdCandidates.length} of ${req.files.length} resumes evaluated for "${position.title}".`,
      type: 'recruitment',
      navigateTo: `/recruitment/${position_id}/candidates`,
    });
    return res.status(201).json({ success: true, message: 'Resumes uploaded and shortlisted.', data: createdCandidates });
  } catch (err) {
    next(err);
  }
}

async function getCandidates(req, res, next) {
  try {
    const { position_id } = req.params;
    const { status } = req.query;
    const { page, limit, offset } = getPagination(req.query);
    const where = { position_id };
    if (status) where.status = status;
    const { count, rows } = await Candidate.findAndCountAll({ where, limit, offset, order: [['ai_score', 'DESC']] });
    return res.status(200).json({ success: true, message: 'Candidates fetched.', data: rows, pagination: getPaginationMeta(count, page, limit) });
  } catch (err) { next(err); }
}

async function getCandidateById(req, res, next) {
  try {
    const { id } = req.params;
    const { InterviewRound, InterviewFeedback } = require('../models');
    const candidate = await Candidate.findByPk(id, {
      include: [{ model: InterviewRound, as: 'rounds', include: [{ model: InterviewFeedback, as: 'feedbacks' }] }],
    });
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found.', errors: [] });
    return res.status(200).json({ success: true, message: 'Candidate fetched.', data: candidate });
  } catch (err) { next(err); }
}

module.exports = {
  createPosition, sendJDForApproval, approveJD,
  getAllPositions, getManagerJDApprovals, getPositionById,
  updateJDContent, closePosition, retryJDGeneration,
  uploadResumesAndShortlist, getCandidates, getCandidateById,
};
