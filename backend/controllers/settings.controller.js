const { User, AuditLog } = require('../models');
const { getPagination, getPaginationMeta } = require('../utils/paginate');
const { Op } = require('sequelize');

async function getAuditLogs(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { user_id, action, table_name, from_date, to_date } = req.query;

    const where = {};
    if (user_id) where.user_id = user_id;
    if (action) where.action = action;
    if (table_name) where.table_name = table_name;
    if (from_date && to_date) where.created_at = { [Op.between]: [new Date(from_date), new Date(to_date + 'T23:59:59')] };

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{
        model: User, as: 'actor',
        attributes: ['id', 'first_name', 'last_name', 'work_email'],
        required: false,
      }],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Audit logs fetched.',
      data: rows,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

async function getSystemInfo(req, res, next) {
  try {
    const totalUsers = await User.count({ where: { is_active: true } });
    const totalDeactivated = await User.count({ where: { is_active: false } });
    return res.status(200).json({
      success: true,
      message: 'System info.',
      data: {
        totalActiveUsers: totalUsers,
        totalDeactivatedUsers: totalDeactivated,
        nodeVersion: process.version,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function globalSearch(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, message: 'Query must be at least 2 characters.', errors: [] });
    }

    const { Policy, JobPosition, HolidayCalendar, Leave, Payroll, Team, Project } = require('../models');
    const role = req.user.role;
    const userId = req.user.id;
    const s = `%${q}%`;
    const results = {};

    // ── Employees / People ── visible to all (navigate to /directory for employees, /employees/:id for admin/hr)
    const empWhere = {
      is_active: true,
      [Op.or]: [
        { first_name: { [Op.like]: s } },
        { last_name: { [Op.like]: s } },
        { work_email: { [Op.like]: s } },
        { role: { [Op.like]: s } },
        { office_location: { [Op.like]: s } },
      ],
    };
    const employees = await User.findAll({ where: empWhere, attributes: ['id','first_name','last_name','work_email','role','office_location'], limit: 8 });
    if (employees.length) {
      results.employees = employees.map(e => ({
        id: e.id,
        name: `${e.first_name} ${e.last_name}`,
        subtitle: `${e.role?.replace(/_/g,' ')} · ${e.work_email}`,
        icon: '👤',
        link: ['super_admin','hr'].includes(role) ? `/employees/${e.id}` : `/directory`,
      }));
    }

    // ── Policies ── all roles
    const policies = await Policy.findAll({
      where: { [Op.or]: [{ title: { [Op.like]: s } }, { category: { [Op.like]: s } }] },
      attributes: ['id','title','category'], limit: 5,
    });
    if (policies.length) {
      results.policies = policies.map(p => ({
        id: p.id, name: p.title, subtitle: p.category, icon: '📄', link: '/policies',
      }));
    }

    // ── Job Positions ── all roles can see open ones
    const posWhere = { title: { [Op.like]: s } };
    if (!['super_admin','hr','manager'].includes(role)) posWhere.status = 'open';
    const positions = await JobPosition.findAll({
      where: posWhere, attributes: ['id','title','department','status','salary_lpa'], limit: 5,
    });
    if (positions.length) {
      results.positions = positions.map(p => ({
        id: p.id,
        name: p.title,
        subtitle: `${p.department}${p.salary_lpa ? ' · ' + p.salary_lpa + ' LPA' : ''} · ${p.status}`,
        icon: '💼',
        link: '/recruitment/positions',
      }));
    }

    // ── Holidays ── all roles
    const holidays = await HolidayCalendar.findAll({
      where: { name: { [Op.like]: s } },
      attributes: ['id','name','date','type'], limit: 5,
    });
    if (holidays.length) {
      results.holidays = holidays.map(h => ({
        id: h.id, name: h.name, subtitle: `${h.date} · ${h.type}`, icon: '🎊', link: '/holidays',
      }));
    }

    // ── My Leaves ── for the user's own leaves
    const myLeaves = await Leave.findAll({
      where: {
        user_id: userId,
        [Op.or]: [
          { leave_type: { [Op.like]: s } },
          { reason: { [Op.like]: s } },
          { status: { [Op.like]: s } },
        ],
      },
      attributes: ['id','leave_type','status','from_date','to_date','reason'], limit: 5,
    });
    if (myLeaves.length) {
      results.leaves = myLeaves.map(l => ({
        id: l.id,
        name: `${l.leave_type.replace(/_/g,' ')} leave`,
        subtitle: `${l.from_date} to ${l.to_date} · ${l.status}`,
        icon: '📅',
        link: '/leaves/my',
      }));
    }

    // ── Payslips ── own payslips (search by month/year)
    const payWhere = { user_id: userId };
    const monthMatch = parseInt(q);
    if (!isNaN(monthMatch) && monthMatch >= 1 && monthMatch <= 12) payWhere.month = monthMatch;
    else if (!isNaN(parseInt(q)) && parseInt(q) > 2000) payWhere.year = parseInt(q);
    if (payWhere.month || payWhere.year) {
      const payslips = await Payroll.findAll({
        where: payWhere, attributes: ['id','month','year','net_pay'], limit: 5,
      });
      if (payslips.length) {
        results.payslips = payslips.map(p => ({
          id: p.id, name: `Payslip ${p.month}/${p.year}`, subtitle: `Net Pay: ₹${p.net_pay}`, icon: '💰', link: '/payroll/my',
        }));
      }
    }

    // ── Teams ── for manager: own teams; for employee: teams they belong to
    if (['super_admin','manager'].includes(role)) {
      const teams = await Team.findAll({
        where: { name: { [Op.like]: s }, manager_id: role === 'manager' ? userId : { [Op.ne]: null } },
        attributes: ['id','name'], limit: 5,
      });
      if (teams.length) {
        results.teams = teams.map(t => ({
          id: t.id, name: t.name, subtitle: 'Team', icon: '👥',
          link: role === 'manager' ? `/teams/${t.id}` : '/teams',
        }));
      }
    }

    // ── Projects ── for all roles
    const projects = await Project.findAll({
      where: { name: { [Op.like]: s } },
      attributes: ['id','name','status'], limit: 5,
    });
    if (projects.length) {
      results.projects = projects.map(p => ({
        id: p.id, name: p.name, subtitle: `Project · ${p.status}`, icon: '🏗',
        link: ['super_admin','manager'].includes(role) ? '/teams' : '/my-projects',
      }));
    }

    // ── Admins only: search all leaves by employee name ──────────────────
    if (['super_admin','hr'].includes(role)) {
      const allLeaves = await Leave.findAll({
        where: { status: { [Op.like]: s } },
        include: [{ model: User, as: 'user', attributes: ['first_name','last_name'], required: true }],
        attributes: ['id','leave_type','status','from_date'], limit: 5,
      });
      if (allLeaves.length) {
        results.leave_approvals = allLeaves.map(l => ({
          id: l.id,
          name: `${l.user.first_name} ${l.user.last_name}`,
          subtitle: `${l.leave_type.replace(/_/g,' ')} · ${l.status}`,
          icon: '📋',
          link: '/leaves/approval',
        }));
      }
    }

    const hasAny = Object.values(results).some(arr => arr.length > 0);
    return res.status(200).json({
      success: true,
      message: hasAny ? 'Search results found.' : 'No results found.',
      data: results,
    });
  } catch (err) {
    next(err);
  }
}

async function triggerBirthdayWishes(req, res, next) {
  try {
    const { runBirthdayWisher } = require('../jobs/birthdayWisher.job');
    const result = await runBirthdayWisher();
    return res.status(200).json({
      success: true,
      message: result.count > 0
        ? `Birthday wishes sent for ${result.count} employee(s) with birthday on ${result.date}.`
        : `No birthdays today (${result.date}).`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

async function triggerFestivalWishes(req, res, next) {
  try {
    const { runFestivalWisherNow } = require('../jobs/festivalWisher.job');
    const result = await runFestivalWisherNow();
    return res.status(200).json({
      success: true,
      message: result.triggered
        ? `Festival wishes sent for: ${result.holiday} on ${result.date}.`
        : result.message || 'No holiday today.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAuditLogs, getSystemInfo, globalSearch, triggerBirthdayWishes, triggerFestivalWishes };
