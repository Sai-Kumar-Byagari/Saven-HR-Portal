const { InterviewRound, InterviewFeedback, Candidate, JobPosition, JobDescription, User } = require('../models');
const aiService = require('../services/ai.service');
const { createNotification } = require('../services/notification.service');
const { sendInterviewCalendarInvite } = require('../services/calendar.service');
const { getPagination, getPaginationMeta } = require('../utils/paginate');

async function scheduleRound(req, res, next) {
  try {
    const { candidate_id, round_number, round_type, conducted_by, scheduled_at, meeting_link, duration_mins } = req.body;

    const candidate = await Candidate.findByPk(candidate_id, {
      include: [{ model: JobPosition, as: 'position', required: false }],
    });
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found.', errors: [] });

    const existing = await InterviewRound.findOne({ where: { candidate_id, round_number } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Round ${round_number} already exists.`, errors: [] });
    }

    const round = await InterviewRound.create({
      candidate_id, round_number, round_type, conducted_by, scheduled_at,
      meeting_link: meeting_link || null,
      duration_mins: duration_mins || 60,
      status: 'scheduled',
    });

    // ── Send calendar invite email + in-app notifications ─────────────────
    if (scheduled_at && candidate.position) {
      try {
        const hrUser = await User.findByPk(req.user.id, { attributes: ['id','first_name','last_name','work_email'] });
        const managerUser = candidate.position.assigned_manager_id
          ? await User.findByPk(candidate.position.assigned_manager_id, { attributes: ['id','first_name','last_name','work_email'] })
          : null;

        // Send .ics calendar invite to HR + manager
        await sendInterviewCalendarInvite({
          round: { ...round.toJSON(), meeting_link, duration_mins: duration_mins || 60 },
          candidate,
          position: candidate.position,
          hrUser,
          managerUser,
        });

        // In-app notification to manager
        if (candidate.position.assigned_manager_id) {
          const roundLabels = { phone: 'Telephonic', technical: 'Technical', hr: 'Final HR' };
          const scheduledTime = new Date(scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
          await createNotification({
            userId: candidate.position.assigned_manager_id,
            title: `📅 Interview Scheduled: ${candidate.name}`,
            message: `${roundLabels[round_type] || round_type} round for ${candidate.name} (${candidate.position.title}) is scheduled on ${scheduledTime} IST.${meeting_link ? ' Meeting link ready.' : ''}`,
            type: 'interview',
            referenceId: round.id,
            referenceType: 'interview_round',
            navigateTo: `/recruitment/candidates/${candidate_id}`,
          });
        }

        // In-app notification to HR confirming schedule
        if (req.user.id !== candidate.position.assigned_manager_id) {
          await createNotification({
            userId: req.user.id,
            title: `✅ Interview Scheduled`,
            message: `Round ${round_number} for ${candidate.name} has been scheduled. Calendar invites sent.`,
            type: 'interview',
            navigateTo: `/recruitment/candidates/${candidate_id}`,
          });
        }
      } catch (emailErr) {
        console.error('[Interview] Calendar invite failed:', emailErr.message);
      }
    }

    return res.status(201).json({ success: true, message: 'Interview round scheduled. Calendar invites sent.', data: round });
  } catch (err) {
    next(err);
  }
}

async function submitRoundFeedback(req, res, next) {
  try {
    const { round_id } = req.params;
    const { notes } = req.body;

    const round = await InterviewRound.findByPk(round_id, {
      include: [{ model: Candidate, as: 'candidate', include: [{ model: JobPosition, as: 'position', include: [{ model: JobDescription, as: 'descriptions' }] }] }],
    });

    if (!round) return res.status(404).json({ success: false, message: 'Round not found.', errors: [] });

    const candidate = round.candidate;

    // ── Only assigned manager (approved_by_manager) or HR/admin can give feedback ──
    if (req.user.role === 'manager') {
      const approvedBy = candidate?.position?.approved_by_manager;
      if (approvedBy && approvedBy !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Only the manager who approved this JD can submit interview feedback.', errors: [] });
      }
    }

    const jdContent = candidate?.position?.descriptions?.[0]?.content || 'No JD available';

    // AI evaluation based on round type
    let aiResult;
    if (round.round_type === 'phone') {
      aiResult = await aiService.evaluateTelephoneInterview({ jdContent, notes, candidateName: candidate.name });
    } else if (round.round_type === 'technical') {
      aiResult = await aiService.evaluateTechnicalInterview({ jdContent, notes, candidateName: candidate.name });
    } else {
      aiResult = await aiService.evaluateFinalHRInterview({ jdContent, notes, candidateName: candidate.name });
    }

    let aiFeedback = notes;
    let aiScore = null;
    let aiStatus = 'failed';

    if (aiResult.success) {
      aiFeedback = JSON.stringify(aiResult.data, null, 2);
      aiScore = aiResult.data.overall_score;
      aiStatus = 'evaluated';
    }

    await round.update({ ai_feedback: aiFeedback, ai_score: aiScore, ai_status: aiStatus, status: 'completed' });

    // Manual feedback record
    if (req.user) {
      // Normalize AI recommendation to a clean, consistent value
      let recRaw = '';
      if (aiResult.success) {
        recRaw = (
          aiResult.data.recommendation ||
          aiResult.data.final_recommendation ||
          ''
        ).toLowerCase().trim();
      }

      // Map any AI phrasing to clean stored values
      let recommendation = 'hold'; // safe default
      if (recRaw.includes('proceed') || recRaw.includes('hire') || recRaw.includes('shortlist') || recRaw.includes('select')) {
        recommendation = 'proceed';
      } else if (recRaw.includes('reject') || recRaw.includes('no') || recRaw.includes('fail')) {
        recommendation = 'reject';
      } else if (recRaw.includes('hold') || recRaw.includes('consider') || recRaw.includes('maybe')) {
        recommendation = 'hold';
      } else if (recRaw.length > 0) {
        // Store as-is but capped at 50 chars if it doesn't match known patterns
        recommendation = recRaw.substring(0, 50);
      }

      await InterviewFeedback.create({
        round_id:       round.id,
        given_by:       req.user.id,
        feedback_text:  aiFeedback,
        score:          aiScore,
        recommendation: aiResult.success ? recommendation : null,
      });
    }

    // Notify HR + Manager
    const position = candidate?.position;
    if (position?.created_by_hr) {
      await createNotification({
        userId: position.created_by_hr,
        title: 'Interview Feedback Ready',
        message: `Round ${round.round_number} feedback for ${candidate.name} is ready for review.`,
        type: 'interview',
        referenceId: candidate.id,
        referenceType: 'candidate',
        navigateTo: `/recruitment/candidates/${candidate.id}`,
      });
    }
    if (position?.assigned_manager_id) {
      await createNotification({
        userId: position.assigned_manager_id,
        title: 'Interview Feedback Ready',
        message: `Round ${round.round_number} feedback for ${candidate.name} (${position.title}) is ready.`,
        type: 'interview',
        referenceId: candidate.id,
        referenceType: 'candidate',
        navigateTo: `/recruitment/candidates/${candidate.id}`,
      });
    }

    return res.status(200).json({ success: true, message: 'Feedback submitted and AI evaluation done.', data: round });
  } catch (err) {
    next(err);
  }
}

async function makeFinalDecision(req, res, next) {
  try {
    const { round_id } = req.params;
    const { decision, comment } = req.body;

    const round = await InterviewRound.findByPk(round_id, {
      include: [{ model: Candidate, as: 'candidate' }],
    });
    if (!round) return res.status(404).json({ success: false, message: 'Round not found.', errors: [] });

    await round.update({ final_decision: decision, decision_comment: comment });

    // Update candidate status
    if (decision === 'selected') {
      await Candidate.update({ status: 'hired' }, { where: { id: round.candidate_id } });
    } else if (decision === 'rejected') {
      await Candidate.update({ status: 'rejected' }, { where: { id: round.candidate_id } });
    }

    return res.status(200).json({ success: true, message: 'Decision recorded.', data: round });
  } catch (err) {
    next(err);
  }
}

async function getRoundsByCandidate(req, res, next) {
  try {
    const { candidate_id } = req.params;
    const rounds = await InterviewRound.findAll({
      where: { candidate_id },
      include: [{ model: InterviewFeedback, as: 'feedbacks' }],
      order: [['round_number', 'ASC']],
    });
    return res.status(200).json({ success: true, message: 'Rounds fetched.', data: rounds });
  } catch (err) {
    next(err);
  }
}

async function uploadRecordingAndEvaluate(req, res, next) {
  try {
    const { round_id } = req.params;
    const { notes } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.', errors: [] });
    }

    const relativePath = req.file.path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/');
    await InterviewRound.update({ recording_path: relativePath }, { where: { id: round_id } });

    const { extractInterviewContent } = require('../utils/interviewExtractor');
    const extracted = await extractInterviewContent(relativePath, req.file.mimetype, notes);

    // Build the evaluation content — transcript takes priority over notes
    let evaluationNotes = '';

    if (extracted.type === 'transcript' && extracted.transcribed) {
      // ✅ Real transcription from Groq Whisper — AI evaluates the actual conversation
      evaluationNotes = `[INTERVIEW RECORDING TRANSCRIPT — Auto-transcribed by Groq Whisper AI]\n[File: ${extracted.fileName}]\n\n${extracted.content}`;
      if (notes && notes.trim().length > 5) {
        evaluationNotes += `\n\n[Additional Interviewer Notes]\n${notes}`;
      }
    } else if (extracted.type === 'document' || extracted.type === 'text') {
      // PDF / DOCX / TXT — extracted text
      evaluationNotes = `[Document Content from: ${req.file.originalname}]\n\n${extracted.content}`;
      if (notes && notes.trim().length > 5) {
        evaluationNotes += `\n\nAdditional Notes:\n${notes}`;
      }
    } else {
      // Recording uploaded but transcription failed / too large / no content
      // Fall back to interviewer notes
      if (extracted.note) {
        console.log('[InterviewController]', extracted.note);
      }
      evaluationNotes = notes
        ? `[Recording uploaded: ${req.file.originalname}]\n[Transcription not available: ${extracted.source}]\n\nInterviewer Notes:\n${notes}`
        : null;
    }

    if (!evaluationNotes || evaluationNotes.trim().length < 10) {
      // No useful evaluation content at all
      return res.status(200).json({
        success: true,
        message: extracted.transcribed
          ? 'Recording transcribed but content was empty. Add notes for AI evaluation.'
          : 'Recording saved. Please add interview notes to get AI evaluation.',
        data: {
          recording_path: relativePath,
          transcribed: false,
          transcription_note: extracted.note || null,
        },
      });
    }

    // Proceed to AI evaluation with the assembled content
    req.params.round_id = round_id;
    req.body.notes = evaluationNotes;
    req.body._transcribed = extracted.transcribed; // pass flag to response
    return submitRoundFeedback(req, res, next);
  } catch (err) {
    next(err);
  }
}

async function getRoundById(req, res, next) {
  try {
    const { round_id } = req.params;
    const round = await InterviewRound.findByPk(round_id, {
      include: [
        { model: Candidate, as: 'candidate', include: [{ model: JobPosition, as: 'position', include: [{ model: JobDescription, as: 'descriptions' }] }] },
        { model: InterviewFeedback, as: 'feedbacks' },
        { model: User, as: 'conductor', attributes: ['id','first_name','last_name'], required: false },
      ],
    });
    if (!round) return res.status(404).json({ success: false, message: 'Round not found.', errors: [] });
    return res.status(200).json({ success: true, message: 'Round fetched.', data: round });
  } catch (err) { next(err); }
}

module.exports = { scheduleRound, submitRoundFeedback, makeFinalDecision, getRoundsByCandidate, uploadRecordingAndEvaluate, getRoundById };
