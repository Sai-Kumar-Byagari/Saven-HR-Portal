const { EmployeeForm, User } = require('../models');
const { createNotification } = require('../services/notification.service');
const { Op } = require('sequelize');

// ── Employee: get own form (or create draft) ────────────────────────────────
async function getMyForm(req, res, next) {
  try {
    const [form] = await EmployeeForm.findOrCreate({
      where: { user_id: req.user.id },
      defaults: { user_id: req.user.id, status: 'draft' },
    });
    return res.status(200).json({ success: true, message: 'Form fetched.', data: form });
  } catch (err) { next(err); }
}

// ── Employee: save form (draft or final submit) ─────────────────────────────
async function saveForm(req, res, next) {
  try {
    const { submit, ...fields } = req.body;

    const [form] = await EmployeeForm.findOrCreate({
      where: { user_id: req.user.id },
      defaults: { user_id: req.user.id, status: 'draft' },
    });

    // Block edits if already approved
    if (form.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Your forms are already approved.', errors: [] });
    }

    // Parse JSON fields if passed as strings
    const jsonFields = ['qualification_details','employment_history','training_details','family_details'];
    for (const f of jsonFields) {
      if (fields[f] && typeof fields[f] === 'string') {
        try { fields[f] = JSON.parse(fields[f]); } catch {}
      }
    }

    await form.update({ ...fields, status: submit ? 'submitted' : 'draft', submitted_at: submit ? new Date() : form.submitted_at });

    if (submit) {
      // Notify all HR users
      const hrUsers = await User.findAll({
        where: { role: { [Op.in]: ['hr', 'super_admin'] }, is_active: true },
        attributes: ['id'],
      });
      const emp = await User.findByPk(req.user.id, { attributes: ['first_name','last_name','emp_id'] });
      for (const hr of hrUsers) {
        await createNotification({
          userId: hr.id,
          title: '📋 Employee Forms Submitted',
          message: `${emp.first_name} ${emp.last_name} (${emp.emp_id || ''}) has submitted their Joining Letter and Personal Info form for verification.`,
          type: 'onboarding',
          referenceId: form.id,
          referenceType: 'employee_form',
          navigateTo: `/onboarding/verify-forms`,
        });
      }
    }

    return res.status(200).json({ success: true, message: submit ? 'Forms submitted for HR verification.' : 'Draft saved.', data: form });
  } catch (err) { next(err); }
}

// ── HR: get all submitted forms ──────────────────────────────────────────────
async function getAllForms(req, res, next) {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    else where.status = { [Op.in]: ['submitted','approved','rejected'] };

    const forms = await EmployeeForm.findAll({
      where,
      include: [
        { model: User, as: 'employee', attributes: ['id','first_name','last_name','work_email','emp_id','doj','role'], required: true },
        { model: User, as: 'reviewer', attributes: ['id','first_name','last_name'], required: false },
      ],
      order: [['submitted_at','DESC']],
    });
    return res.status(200).json({ success: true, message: 'Forms fetched.', data: forms });
  } catch (err) { next(err); }
}

// ── HR: get single form by ID ────────────────────────────────────────────────
async function getFormById(req, res, next) {
  try {
    const form = await EmployeeForm.findByPk(req.params.id, {
      include: [
        { model: User, as: 'employee', attributes: ['id','first_name','last_name','work_email','emp_id','doj','role'], required: true },
        { model: User, as: 'reviewer', attributes: ['id','first_name','last_name'], required: false },
      ],
    });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found.', errors: [] });
    return res.status(200).json({ success: true, message: 'Form fetched.', data: form });
  } catch (err) { next(err); }
}

// ── HR: approve or reject form ──────────────────────────────────────────────
async function reviewForm(req, res, next) {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;

    if (!['approve','reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject.', errors: [] });
    }

    const form = await EmployeeForm.findByPk(id, {
      include: [{ model: User, as: 'employee', attributes: ['id','first_name','last_name','emp_id'] }],
    });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found.', errors: [] });
    if (form.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Only submitted forms can be reviewed.', errors: [] });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await form.update({
      status: newStatus,
      hr_comment: comment || null,
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
    });

    const reviewer = await User.findByPk(req.user.id, { attributes: ['first_name','last_name'] });
    const emp = form.employee;

    if (action === 'approve') {
      // Mark the employee's onboarding as complete
      await User.update(
        { onboarding_complete: true },
        { where: { id: emp.id } }
      );

      // Mark all onboarding tasks as completed
      const { OnboardingTask } = require('../models');
      await OnboardingTask.update(
        { is_completed: true, completed_at: new Date() },
        { where: { user_id: emp.id } }
      );

      await createNotification({
        userId: emp.id,
        title: '✅ Forms Approved!',
        message: `Your Joining Letter and Personal Information forms have been verified by HR. Your joining details are confirmed.`,
        type: 'onboarding',
        navigateTo: '/onboarding/my-forms',
      });
    } else {
      await createNotification({
        userId: emp.id,
        title: '❌ Forms Need Correction',
        message: `HR has reviewed your forms and requested changes. ${comment ? 'Comment: ' + comment : 'Please review and resubmit.'}`,
        type: 'onboarding',
        navigateTo: '/onboarding/my-forms',
      });
    }

    return res.status(200).json({ success: true, message: `Form ${action}d.`, data: form });
  } catch (err) { next(err); }
}

module.exports = { getMyForm, saveForm, getAllForms, getFormById, reviewForm };
