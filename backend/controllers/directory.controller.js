const { User, EmployeeProfile } = require('../models');
const { Op } = require('sequelize');
const { getPagination, getPaginationMeta } = require('../utils/paginate');

async function getDirectory(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, role } = req.query;

    const where = { is_active: true };
    if (search) {
      // Map search text to matching role values (e.g. "manager" → "manager", "CEO" → "super_admin")
      const roleLabels = {
        super_admin: 'CEO', manager: 'Manager', hr: 'HR',
        employee: 'Employee', it: 'IT Engineer', payroll: 'Payroll Executive',
      };
      const matchingRoles = Object.entries(roleLabels)
        .filter(([, label]) => label.toLowerCase().includes(search.toLowerCase()))
        .map(([key]) => key);

      const orConditions = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { work_email: { [Op.like]: `%${search}%` } },
        { role: { [Op.like]: `%${search}%` } },
      ];
      if (matchingRoles.length > 0) {
        orConditions.push({ role: { [Op.in]: matchingRoles } });
      }
      where[Op.or] = orConditions;
    }
    if (role) where.role = role;

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{
        model: EmployeeProfile, as: 'profile',
        attributes: ['phone'],
        required: false,
      }],
      attributes: ['id', 'first_name', 'last_name', 'work_email', 'role', 'profile_photo', 'office_location'],
      limit,
      offset,
      order: [['first_name', 'ASC']],
    });

    const data = rows.map((u) => ({
      id: u.id,
      fullName: `${u.first_name} ${u.last_name}`,
      firstName: u.first_name,
      lastName: u.last_name,
      workEmail: u.work_email,
      role: u.role,
      designation: getRoleLabel(u.role),
      phone: u.profile?.phone || null,
      profilePhoto: u.profile_photo,
      officeLocation: u.office_location,
    }));

    return res.status(200).json({
      success: true,
      message: 'Directory fetched.',
      data,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

function getRoleLabel(role) {
  const labels = {
    super_admin: 'CEO', manager: 'Manager', hr: 'HR',
    employee: 'Employee', it: 'IT Engineer', payroll: 'Payroll Executive',
  };
  return labels[role] || role;
}

module.exports = { getDirectory };
