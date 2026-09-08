const { User, EmployeeProfile } = require('../models');

async function getOrgChart(req, res, next) {
  try {
    const allUsers = await User.findAll({
      where: { is_active: true },
      attributes: ['id', 'first_name', 'last_name', 'work_email', 'role', 'reporting_manager_id', 'profile_photo'],
    });

    // Build node map
    const nodeMap = {};
    allUsers.forEach((u) => {
      nodeMap[u.id] = {
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        workEmail: u.work_email,
        role: u.role,
        designation: getRoleLabel(u.role),
        profilePhoto: u.profile_photo,
        managerId: u.reporting_manager_id,
        children: [],
      };
    });

    // Find super_admin as the single root
    const superAdmin = allUsers.find((u) => u.role === 'super_admin');
    const rootId = superAdmin ? superAdmin.id : null;

    // Attach children to parents
    // Any node without a valid parent (except super_admin) gets attached to super_admin
    Object.values(nodeMap).forEach((node) => {
      if (node.id === rootId) return; // skip root

      if (node.managerId && nodeMap[node.managerId] && node.managerId !== node.id) {
        nodeMap[node.managerId].children.push(node);
      } else if (rootId) {
        // No valid parent — attach directly under super_admin
        nodeMap[rootId].children.push(node);
      }
    });

    // Always return single root (super_admin), never a virtual node
    const result = rootId ? [nodeMap[rootId]] : Object.values(nodeMap).filter(n => !n.managerId || !nodeMap[n.managerId]);

    return res.status(200).json({ success: true, message: 'Org chart fetched.', data: result });
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

module.exports = { getOrgChart };
