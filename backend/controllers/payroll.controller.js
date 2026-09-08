const { Payroll, User } = require('../models');
const { getPagination, getPaginationMeta } = require('../utils/paginate');
const { createNotification } = require('../services/notification.service');
const { Op } = require('sequelize');

// ── Upload payslip by emp_id ───────────────────────────────────────────────────
async function uploadPayslip(req, res, next) {
  try {
    const { emp_id, month, year, note } = req.body;

    if (!emp_id || !emp_id.trim()) {
      return res.status(400).json({ success: false, message: 'Employee ID is required.', errors: [] });
    }
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required.', errors: [] });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Payslip file is required.', errors: [] });
    }

    // Find employee by emp_id
    const employee = await User.findOne({
      where: { emp_id: emp_id.trim(), is_active: true },
      attributes: ['id', 'first_name', 'last_name', 'work_email', 'emp_id'],
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: `No active employee found with Employee ID "${emp_id}".`, errors: [] });
    }

    const relativePath = req.file.path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/');
    const parsedMonth = parseInt(month);
    const parsedYear  = parseInt(year);

    // Check if payslip already exists for this month/year — update if so
    const [payslip, created] = await Payroll.findOrCreate({
      where: { user_id: employee.id, month: parsedMonth, year: parsedYear },
      defaults: {
        user_id: employee.id,
        month: parsedMonth,
        year: parsedYear,
        basic: 0, hra: 0, allowances: 0,
        pf_deduction: 0, professional_tax: 0, tds: 0,
        other_deductions: 0, net_pay: 0,
        slip_path: relativePath,
        generated_by: req.user.id,
      },
    });

    if (!created) {
      await payslip.update({ slip_path: relativePath, generated_by: req.user.id });
    }

    // Notify employee
    await createNotification({
      userId: employee.id,
      title: '💰 Payslip Uploaded',
      message: `Your payslip for ${getMonthName(parsedMonth)} ${parsedYear} has been uploaded. Click to view.`,
      type: 'payroll',
      referenceId: payslip.id,
      referenceType: 'payroll',
      navigateTo: '/payroll/my',
    });

    return res.status(201).json({
      success: true,
      message: `Payslip uploaded for ${employee.first_name} ${employee.last_name} (${employee.emp_id}).`,
      data: { ...payslip.toJSON(), employee },
    });
  } catch (err) {
    next(err);
  }
}

// ── My payslips (employee) ────────────────────────────────────────────────────
async function getMyPayslips(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const where = { user_id: req.user.id };
    if (req.query.year) where.year = parseInt(req.query.year);

    const { count, rows } = await Payroll.findAndCountAll({
      where,
      limit, offset,
      order: [['year', 'DESC'], ['month', 'DESC']],
    });

    return res.status(200).json({
      success: true, message: 'Payslips fetched.',
      data: rows,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) { next(err); }
}

// ── All payslips (admin/payroll) ─────────────────────────────────────────────
async function getAllPayslips(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const where = {};
    if (req.query.user_id) where.user_id = parseInt(req.query.user_id);
    if (req.query.month)   where.month   = parseInt(req.query.month);
    if (req.query.year)    where.year    = parseInt(req.query.year);
    if (req.query.emp_id) {
      const emp = await User.findOne({ where: { emp_id: req.query.emp_id }, attributes: ['id'] });
      if (emp) where.user_id = emp.id;
    }

    const { count, rows } = await Payroll.findAndCountAll({
      where,
      include: [{
        model: User, as: 'employee',
        attributes: ['id', 'first_name', 'last_name', 'work_email', 'emp_id'],
      }],
      limit, offset,
      order: [['year', 'DESC'], ['month', 'DESC']],
    });

    return res.status(200).json({
      success: true, message: 'All payslips fetched.',
      data: rows,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) { next(err); }
}

// ── Get single payslip ────────────────────────────────────────────────────────
async function getPayslipById(req, res, next) {
  try {
    const payslip = await Payroll.findByPk(req.params.id, {
      include: [{ model: User, as: 'employee', attributes: ['id','first_name','last_name','work_email','emp_id','doj','role'] }],
    });
    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found.', errors: [] });
    if (!['super_admin','payroll'].includes(req.user.role) && payslip.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.', errors: [] });
    }
    return res.status(200).json({ success: true, message: 'Payslip fetched.', data: payslip });
  } catch (err) { next(err); }
}

function getMonthName(month) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return months[(month || 1) - 1] || month;
}

module.exports = { uploadPayslip, getMyPayslips, getAllPayslips, getPayslipById };
