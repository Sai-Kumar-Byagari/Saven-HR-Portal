const { validationResult } = require('express-validator');
const {
  User, EmployeeProfile, EmployeeForm, EmployeeDocument, Attendance,
  Leave, LeaveBalance, Notification, OnboardingTask, Payroll,
  EmployeeVoice, ResignationForm, ResignationFeedback, OrgChart,
  AuditLog, TeamMember, TaskUpdate, ProjectUpdate, ProjectMessage,
  OtpToken, Task,
} = require('../models');
const { hashPassword } = require('../utils/hash');
const { getPagination, getPaginationMeta } = require('../utils/paginate');
const { createNotification } = require('../services/notification.service');
const { Op } = require('sequelize');

const DEFAULT_ONBOARDING_TASKS = [
  { task_name: 'Complete Personal Details', task_key: 'personal_details', order_index: 1 },
  { task_name: 'Upload Documents', task_key: 'documents', order_index: 2 },
  { task_name: 'Provide Bank Details', task_key: 'bank_details', order_index: 3 },
  { task_name: 'Review and Submit', task_key: 'review', order_index: 4 },
];

async function createEmployee(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error.', errors: errors.array() });
    }

    const {
      first_name, last_name, personal_email, work_email, doj,
      reporting_manager_id, employee_type, role, temporary_password, emp_id,
    } = req.body;

    if (!emp_id || !emp_id.trim()) {
      return res.status(400).json({ success: false, message: 'Employee ID is required.', errors: [] });
    }
    if (!doj) {
      return res.status(400).json({ success: false, message: 'Date of Joining is required.', errors: [] });
    }
    if (!personal_email || !personal_email.trim()) {
      return res.status(400).json({ success: false, message: 'Personal email is required.', errors: [] });
    }

    const existing = await User.findOne({ where: { work_email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Work email already in use.', errors: [] });
    }

    const existingEmpId = await User.findOne({ where: { emp_id: emp_id.trim() } });
    if (existingEmpId) {
      return res.status(400).json({ success: false, message: `Employee ID "${emp_id}" is already in use.`, errors: [] });
    }

    // HR cannot create super_admin
    if (req.user.role === 'hr' && role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'HR cannot create a Super Admin account.', errors: [] });
    }

    const hashed = await hashPassword(temporary_password);
    const user = await User.create({
      emp_id: emp_id.trim(),
      first_name, last_name,
      personal_email: personal_email.trim(),
      work_email,
      password_hash: hashed, role, doj,
      reporting_manager_id: reporting_manager_id || null,
      employee_type: employee_type || 'new',
      is_first_login: true, is_active: true,
      onboarding_complete: employee_type === 'existing',
      office_location: 'Hyderabad',
      created_by: req.user.id,
    });

    // Create profile placeholder
    await EmployeeProfile.create({ user_id: user.id });

    // Create onboarding tasks for new employees
    if (employee_type !== 'existing') {
      await OnboardingTask.bulkCreate(
        DEFAULT_ONBOARDING_TASKS.map((t) => ({ ...t, user_id: user.id }))
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: {
        id: user.id,
        workEmail: user.work_email,
        role: user.role,
        employeeType: user.employee_type,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getAllEmployees(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, role, is_active } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { work_email: { [Op.like]: `%${search}%` } },
      ];
    }
    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [
        { model: EmployeeProfile, as: 'profile', required: false },
        { model: User, as: 'reportingManager', attributes: ['id', 'first_name', 'last_name', 'work_email'], required: false },
      ],
      attributes: { exclude: ['password_hash', 'refresh_token_hash'] },
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Employees fetched.',
      data: rows,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

async function getEmployeeById(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      include: [
        { model: EmployeeProfile, as: 'profile', required: false },
        { model: User, as: 'reportingManager', attributes: ['id', 'first_name', 'last_name', 'work_email', 'role'], required: false },
      ],
      attributes: { exclude: ['password_hash', 'refresh_token_hash'] },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found.', errors: [] });
    }

    return res.status(200).json({ success: true, message: 'Employee fetched.', data: user });
  } catch (err) {
    next(err);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error.', errors: errors.array() });
    }

    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found.', errors: [] });
    }

    req.auditOldValue = { id: user.id, role: user.role, is_active: user.is_active };

    const allowedFields = ['first_name', 'last_name', 'personal_email', 'role',
      'doj', 'reporting_manager_id', 'employee_type', 'is_active', 'office_location'];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    // HR cannot assign super_admin role — only super_admin can do that
    if (req.user.role === 'hr' && updateData.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'HR cannot assign the Super Admin role. Only an Admin can do that.',
        errors: [],
      });
    }

    // HR cannot change role of existing super_admin
    if (req.user.role === 'hr' && user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'HR cannot modify a Super Admin account.',
        errors: [],
      });
    }

    await user.update(updateData);
    return res.status(200).json({ success: true, message: 'Employee updated.', data: { id: user.id, ...updateData } });
  } catch (err) {
    next(err);
  }
}

async function deactivateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.', errors: [] });
    }
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found.', errors: [] });
    }
    await user.update({ is_active: false });
    return res.status(200).json({ success: true, message: 'Employee deactivated.', data: { id } });
  } catch (err) {
    next(err);
  }
}

async function getTeamEmployees(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { count, rows } = await User.findAndCountAll({
      where: { reporting_manager_id: req.user.id, is_active: true },
      include: [{ model: EmployeeProfile, as: 'profile', required: false }],
      attributes: { exclude: ['password_hash', 'refresh_token_hash'] },
      limit,
      offset,
    });
    return res.status(200).json({
      success: true,
      message: 'Team members fetched.',
      data: rows,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

async function permanentDeleteEmployee(req, res, next) {
  const { sequelize } = require('../models');
  const { InterviewRound, InterviewFeedback, JdApproval, JobPosition,
          JobDescription, Candidate, Team, Project, Policy, HolidayCalendar } = require('../models');

  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Cannot delete yourself
    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.', errors: [] });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found.', errors: [] });
    }

    // HR cannot delete super_admin
    if (req.user.role === 'hr' && user.role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'HR cannot delete a Super Admin account.', errors: [] });
    }

    const userName = `${user.first_name} ${user.last_name}`;
    const personalEmail = user.personal_email;

    // Use raw SQL to bypass all Sequelize model validations
    await sequelize.transaction(async (t) => {
      const run = (sql) => sequelize.query(sql, { replacements: [userId], transaction: t });

      // 1. Nullify all FK references from other records pointing to this user
      await run('UPDATE users SET reporting_manager_id = NULL WHERE reporting_manager_id = ?');
      await run('UPDATE leaves SET approved_by = NULL WHERE approved_by = ?');
      await run('UPDATE payroll SET generated_by = NULL WHERE generated_by = ?');
      await run('UPDATE holiday_calendar SET created_by = NULL WHERE created_by = ?');
      await run('UPDATE policies SET uploaded_by = NULL WHERE uploaded_by = ?');
      await run('UPDATE job_positions SET created_by_hr = NULL WHERE created_by_hr = ?');
      await run('UPDATE job_positions SET assigned_manager_id = NULL WHERE assigned_manager_id = ?');
      await run('UPDATE job_positions SET approved_by_manager = NULL WHERE approved_by_manager = ?');
      await run('UPDATE candidates SET referred_by = NULL WHERE referred_by = ?');
      await run('UPDATE interview_rounds SET conducted_by = NULL WHERE conducted_by = ?');
      await run('UPDATE interview_feedback SET given_by = NULL WHERE given_by = ?');
      await run('UPDATE teams SET manager_id = NULL WHERE manager_id = ?');
      await run('UPDATE projects SET manager_id = NULL WHERE manager_id = ?');
      await run('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = ?');
      await run('UPDATE tasks SET assigned_by = NULL WHERE assigned_by = ?');

      // 2. Delete join/reference records
      await run('DELETE FROM jd_approvals WHERE manager_id = ?');
      await run('DELETE FROM project_messages WHERE target_user_id = ?');
      await run('DELETE FROM org_chart WHERE manager_id = ?');

      // 3. Delete resignation feedback (linked via resignation_forms)
      await sequelize.query(
        'DELETE rf FROM resignation_feedback rf INNER JOIN resignation_forms r ON rf.resignation_id = r.id WHERE r.user_id = ?',
        { replacements: [userId], transaction: t }
      );

      // 4. Delete all direct user data
      await run('DELETE FROM employee_profiles WHERE user_id = ?');
      await run('DELETE FROM employee_forms WHERE user_id = ?');
      await run('DELETE FROM employee_documents WHERE user_id = ?');
      await run('DELETE FROM attendance WHERE user_id = ?');
      await run('DELETE FROM leaves WHERE user_id = ?');
      await run('DELETE FROM leave_balances WHERE user_id = ?');
      await run('DELETE FROM notifications WHERE user_id = ?');
      await run('DELETE FROM onboarding_tasks WHERE user_id = ?');
      await run('DELETE FROM payroll WHERE user_id = ?');
      await run('DELETE FROM employee_voice WHERE user_id = ?');
      await run('DELETE FROM resignation_forms WHERE user_id = ?');
      await run('DELETE FROM org_chart WHERE user_id = ?');
      await run('DELETE FROM audit_logs WHERE user_id = ?');
      await run('DELETE FROM team_members WHERE user_id = ?');
      await run('DELETE FROM task_updates WHERE user_id = ?');
      await run('DELETE FROM project_updates WHERE user_id = ?');
      await run('DELETE FROM project_messages WHERE sender_id = ?');

      // OtpToken uses personal_email
      if (personalEmail) {
        await sequelize.query('DELETE FROM otp_tokens WHERE personal_email = ?', { replacements: [personalEmail], transaction: t });
      }

      // 5. Finally delete the user
      await run('DELETE FROM users WHERE id = ?');
    });

    return res.status(200).json({ success: true, message: `Employee "${userName}" permanently deleted.` });
  } catch (err) {
    next(err);
  }
}

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

async function adminResetPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error.', errors: errors.array() });
    }

    const { id } = req.params;
    const { new_password } = req.body;

    if (!PASSWORD_REGEX.test(new_password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.',
        errors: [],
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found.', errors: [] });
    }

    // HR cannot reset super_admin password
    if (req.user.role === 'hr' && user.role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'HR cannot reset a Super Admin password.', errors: [] });
    }

    const hashed = await hashPassword(new_password);
    await user.update({
      password_hash: hashed,
      is_first_login: true,
      refresh_token_hash: null,
    });

    return res.status(200).json({
      success: true,
      message: `Password reset for ${user.first_name} ${user.last_name}. They will be asked to set a new password on next login.`,
      data: {},
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createEmployee, getAllEmployees, getEmployeeById, updateEmployee, deactivateEmployee, getTeamEmployees, permanentDeleteEmployee, adminResetPassword };
