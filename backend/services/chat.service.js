/**
 * AI Chat Service — Zero Hallucination Architecture
 *
 * Every question is answered ONLY from real DB data fetched fresh.
 * We fetch ALL relevant data for the user's role before calling the AI.
 * AI is instructed: "If the data isn't here, say you don't have it."
 */

const Groq = require('groq-sdk');
const { Op, Sequelize } = require('sequelize');
const {
  User, EmployeeProfile, EmployeeDocument, Attendance, Leave, LeaveBalance,
  Notification, Payroll, ProjectUpdate, Project, Team, TeamMember,
  JobPosition, JobDescription, Candidate, InterviewRound,
  Policy, HolidayCalendar, ResignationForm, ResignationFeedback,
  EmployeeVoice, OnboardingTask, AuditLog,
} = require('../models');
const { getFinancialYear } = require('../utils/dateHelpers');

function getGroqClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

async function fetchFullContext(userId, userRole) {
  const today = new Date().toISOString().split('T')[0];
  const now   = new Date();
  const fy    = getFinancialYear();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const ctx   = {};

  // ── WHO AM I ──────────────────────────────────────────────────────────────
  const me = await User.findByPk(userId, {
    attributes: ['id','first_name','last_name','work_email','role','doj','office_location','is_active'],
    include: [{ model: EmployeeProfile, as: 'profile', required: false }],
  });
  ctx.who_i_am = {
    name:           `${me.first_name} ${me.last_name}`,
    email:          me.work_email,
    role:           me.role,
    date_of_joining: me.doj,
    office_location: me.office_location,
    gender:          me.profile?.gender || null,
    dob:             me.profile?.dob || null,
    blood_group:     me.profile?.blood_group || null,
    phone:           me.profile?.phone || null,
    emergency_contact: me.profile?.emergency_contact || null,
    address:         me.profile?.address || null,
    bank_name:       me.profile?.bank_name || null,
    account_number:  me.profile?.account_number ? '****' + me.profile.account_number.slice(-4) : null,
    ifsc_code:       me.profile?.ifsc_code || null,
  };

  // ── ATTENDANCE (current month + today) ───────────────────────────────────
  const attRecords = await Attendance.findAll({
    where: { user_id: userId, date: { [Op.gte]: monthStart } },
    order: [['date','DESC']],
  });
  const todayAtt = attRecords.find(a => a.date === today);
  ctx.attendance = {
    today:            todayAtt ? { clock_in: todayAtt.clock_in, clock_out: todayAtt.clock_out, status: todayAtt.status, duration_mins: todayAtt.duration_mins } : 'Not clocked in today',
    this_month_days_present: attRecords.filter(a => a.status === 'present').length,
    this_month_on_leave:     attRecords.filter(a => a.status === 'on_leave').length,
    this_month_total_records: attRecords.length,
    recent_7_days: attRecords.slice(0, 7).map(a => ({ date: a.date, status: a.status, clock_in: a.clock_in, clock_out: a.clock_out })),
  };

  // Org-wide today attendance (for admin/hr/manager)
  if (['super_admin','hr','manager'].includes(userRole)) {
    let whereClause = { date: today };
    if (userRole === 'manager') {
      const teamIds = (await User.findAll({ where: { reporting_manager_id: userId, is_active: true }, attributes: ['id'] })).map(u=>u.id);
      whereClause.user_id = { [Op.in]: teamIds };
    }
    const orgTodayAtt = await Attendance.findAll({ where: whereClause });
    const totalActive = userRole === 'manager'
      ? (await User.count({ where: { reporting_manager_id: userId, is_active: true } }))
      : (await User.count({ where: { is_active: true } }));
    ctx.org_attendance_today = {
      scope: userRole === 'manager' ? 'my team' : 'entire organization',
      total_employees: totalActive,
      present:  orgTodayAtt.filter(a=>a.status==='present').length,
      on_leave: orgTodayAtt.filter(a=>a.status==='on_leave').length,
      clocked_in_so_far: orgTodayAtt.length,
      not_checked_in_yet: totalActive - orgTodayAtt.length,
      note: 'present = clocked in today; on_leave = approved leave; not_checked_in_yet = no record yet',
    };
  }

  // ── LEAVE BALANCE + HISTORY ───────────────────────────────────────────────
  const bal = await LeaveBalance.findOne({ where: { user_id: userId, financial_year: fy } });
  const myLeaves = await Leave.findAll({
    where: { user_id: userId },
    include: [{ model: User, as: 'approver', attributes: ['first_name','last_name'], required: false }],
    order: [['applied_at','DESC']], limit: 15,
  });
  ctx.leave = {
    financial_year: fy,
    total_entitlement: bal?.total_leaves || 18,
    used:             bal ? parseFloat(bal.used_leaves) : 0,
    remaining:        bal ? (bal.total_leaves - parseFloat(bal.used_leaves)) : 18,
    this_month_used:  bal ? parseFloat(bal.current_month_used) : 0,
    applications: myLeaves.map(l => ({
      type: l.leave_type.replace(/_/g,' '),
      from: l.from_date, to: l.to_date, days: l.days,
      status: l.status, reason: l.reason,
      approver: l.approver ? `${l.approver.first_name} ${l.approver.last_name}` : null,
      comment: l.approver_comment || null,
    })),
  };

  // ── PROJECTS (my team memberships) ───────────────────────────────────────
  const memberships = await TeamMember.findAll({
    where: { user_id: userId },
    include: [{ model: Team, as: 'team', attributes: ['name'],
      include: [{ model: Project, as: 'projects',
        include: [{ model: ProjectUpdate, as: 'updates', where: { user_id: userId }, required: false, limit: 3, order: [['created_at','DESC']] }] }] }],
  });
  ctx.my_projects = memberships.map(m => ({
    team: m.team?.name, tech_role: m.tech_role,
    responsibilities: m.responsibilities || null,
    member_deadline: m.member_deadline || null,
    projects: (m.team?.projects||[]).map(p => ({
      name: p.name, status: p.status, tech_stack: p.tech_stack,
      deadline: p.end_date,
      my_recent_updates: (p.updates||[]).map(u => ({ message: u.message, progress: u.progress_pct, date: u.created_at })),
    })),
  }));

  // ── PAYSLIPS ──────────────────────────────────────────────────────────────
  const pays = await Payroll.findAll({
    where: { user_id: userId }, order: [['year','DESC'],['month','DESC']], limit: 6,
  });
  ctx.payslips = pays.map(p => ({
    period: `${p.month}/${p.year}`, basic: `₹${p.basic}`, hra: `₹${p.hra}`,
    allowances: `₹${p.allowances}`, pf_deduction: `₹${p.pf_deduction}`,
    professional_tax: `₹${p.professional_tax}`, tds: `₹${p.tds}`,
    net_pay: `₹${p.net_pay}`,
  }));

  // ── DOCUMENTS ─────────────────────────────────────────────────────────────
  const docs = await EmployeeDocument.findAll({ where: { user_id: userId } });
  ctx.my_documents = docs.map(d => ({ type: d.display_name, uploaded_on: d.uploaded_at }));

  // ── NOTIFICATIONS (unread) ────────────────────────────────────────────────
  const notifs = await Notification.findAll({
    where: { user_id: userId, is_read: false }, order: [['created_at','DESC']], limit: 10,
  });
  ctx.unread_notifications = { count: notifs.length, items: notifs.map(n=>({ title: n.title, message: n.message })) };

  // ── UPCOMING HOLIDAYS ─────────────────────────────────────────────────────
  const holidays = await HolidayCalendar.findAll({
    where: { date: { [Op.gte]: today } }, order: [['date','ASC']], limit: 10,
  });
  ctx.upcoming_holidays = holidays.map(h => ({ name: h.name, date: h.date, type: h.type }));

  // ── POLICIES (all visible to everyone) ───────────────────────────────────
  const policies = await Policy.findAll({ attributes: ['title','category'], order: [['created_at','DESC']], limit: 20 });
  ctx.company_policies = policies.map(p => ({ title: p.title, category: p.category }));

  // ── RESIGNATION (if submitted) ────────────────────────────────────────────
  const res = await ResignationForm.findOne({ where: { user_id: userId }, order: [['submitted_at','DESC']] });
  ctx.resignation = res ? { status: res.status, last_working_day: res.last_working_day, reason: res.reason } : 'No resignation submitted';

  // ── ONBOARDING STATUS ─────────────────────────────────────────────────────
  const tasks = await OnboardingTask.findAll({ where: { user_id: userId }, order: [['order_index','ASC']] });
  ctx.onboarding = tasks.length > 0 ? {
    tasks: tasks.map(t => ({ task: t.task_name, completed: t.is_completed })),
    completed_count: tasks.filter(t=>t.is_completed).length,
    total_count: tasks.length,
  } : 'Onboarding already completed or not applicable';

  // ── EMPLOYEE DIRECTORY (visible to all roles — same as directory page) ─────
  const directoryUsers = await User.findAll({
    where: { is_active: true },
    attributes: ['id', 'first_name', 'last_name', 'work_email', 'role', 'office_location', 'doj'],
    include: [{ model: EmployeeProfile, as: 'profile', attributes: ['phone'], required: false }],
    order: [['first_name', 'ASC']],
  });
  ctx.employee_directory = directoryUsers.map(u => ({
    name: `${u.first_name} ${u.last_name}`,
    email: u.work_email,
    role: u.role,
    location: u.office_location || null,
    date_of_joining: u.doj || null,
    phone: u.profile?.phone || null,
  }));
  ctx.total_employees = directoryUsers.length;

  // ── ORG CHART (reporting structure) ────────────────────────────────────────
  const orgData = await User.findAll({
    where: { is_active: true },
    attributes: ['id', 'first_name', 'last_name', 'role', 'reporting_manager_id'],
  });
  const managerMap = {};
  orgData.forEach(u => { managerMap[u.id] = `${u.first_name} ${u.last_name}`; });
  ctx.org_chart = orgData.map(u => ({
    name: `${u.first_name} ${u.last_name}`,
    role: u.role,
    reports_to: u.reporting_manager_id ? (managerMap[u.reporting_manager_id] || 'Unknown') : 'No one (top level)',
  }));

  // ════════════════════════════════════════════════════════════════════════
  // ROLE-SPECIFIC CONTEXT
  // ════════════════════════════════════════════════════════════════════════

  // ── ADMIN / HR full org view ──────────────────────────────────────────────
  if (['super_admin','hr'].includes(userRole)) {
    const allUsers = await User.findAll({ where: { is_active: true }, attributes: ['id','first_name','last_name','work_email','role','doj'] });
    const roleCounts = {};
    allUsers.forEach(u => { roleCounts[u.role] = (roleCounts[u.role]||0)+1; });

    const pendingLeaves = await Leave.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'user', attributes: ['first_name','last_name'] }],
    });

    const openPositions = await JobPosition.findAll({ where: { status: 'open' }, attributes: ['id','title','department','min_score'] });
    const pendingApproval = await JobPosition.findAll({ where: { status: 'pending_approval' }, attributes: ['id','title','department'] });

    const newJoiners = allUsers.filter(u => {
      if (!u.doj) return false;
      const joined = new Date(u.doj);
      return joined.getMonth() === now.getMonth() && joined.getFullYear() === now.getFullYear();
    });

    const pendingOnboarding = await User.count({ where: { employee_type: 'new', onboarding_complete: false, is_active: true } });

    ctx.org_overview = {
      total_active_employees: allUsers.length,
      employees_by_role: roleCounts,
      new_joiners_this_month: newJoiners.map(u => ({ name: `${u.first_name} ${u.last_name}`, role: u.role, doj: u.doj })),
      pending_onboarding_count: pendingOnboarding,
      pending_leave_approvals: pendingLeaves.map(l => ({ employee: `${l.user.first_name} ${l.user.last_name}`, type: l.leave_type.replace(/_/g,' '), from: l.from_date, to: l.to_date, days: l.days })),
      open_positions: openPositions.map(p => ({ title: p.title, department: p.department })),
      jd_pending_approval: pendingApproval.map(p => ({ title: p.title, department: p.department })),
      total_policies: await Policy.count(),
      all_employees: allUsers.map(u => ({ name: `${u.first_name} ${u.last_name}`, email: u.work_email, role: u.role, doj: u.doj })),
    };

    // All resignations
    const resignations = await ResignationForm.findAll({
      include: [{ model: User, as: 'employee', attributes: ['first_name','last_name','role'] }],
      order: [['submitted_at','DESC']], limit: 10,
    });
    ctx.resignations_inbox = resignations.map(r => ({ employee: `${r.employee.first_name} ${r.employee.last_name}`, role: r.employee.role, status: r.status, last_working_day: r.last_working_day }));

    // Voice inbox
    const voices = await EmployeeVoice.findAll({
      include: [{ model: User, as: 'user', attributes: ['first_name','last_name'] }],
      order: [['created_at','DESC']], limit: 10,
    });
    ctx.employee_voice_inbox = voices.map(v => ({ from: v.is_anonymous ? 'Anonymous' : `${v.user.first_name} ${v.user.last_name}`, type: v.type, status: v.status, message: v.message.substring(0,100) }));
  }

  // ── MANAGER view ──────────────────────────────────────────────────────────
  if (userRole === 'manager') {
    const teamMembers = await User.findAll({
      where: { reporting_manager_id: userId, is_active: true },
      attributes: ['id','first_name','last_name','work_email','role','doj'],
      include: [{ model: EmployeeProfile, as: 'profile', attributes: ['phone'], required: false }],
    });
    const memberIds = teamMembers.map(m=>m.id);

    const teamPendingLeaves = await Leave.findAll({
      where: { user_id: { [Op.in]: memberIds }, status: 'pending' },
      include: [{ model: User, as: 'user', attributes: ['first_name','last_name'] }],
    });

    const teamTodayAtt = await Attendance.findAll({ where: { user_id: { [Op.in]: memberIds }, date: today } });
    const presentToday = teamTodayAtt.filter(a=>a.status==='present').map(a=>a.user_id);
    const onLeaveToday = teamTodayAtt.filter(a=>a.status==='on_leave').map(a=>a.user_id);

    const myManagedTeams = await Team.findAll({
      where: { manager_id: userId },
      include: [
        { model: TeamMember, as: 'members', include: [{ model: User, as: 'employee', attributes: ['first_name','last_name','role'] }] },
        { model: Project, as: 'projects',
          include: [{ model: ProjectUpdate, as: 'updates', limit: 2, order: [['created_at','DESC']],
            include: [{ model: User, as: 'author', attributes: ['first_name','last_name'] }] }] },
      ],
    });

    const assignedPositions = await JobPosition.findAll({ where: { assigned_manager_id: userId }, attributes: ['id','title','status','department'] });

    ctx.my_team = {
      total_members: teamMembers.length,
      members: teamMembers.map(m => ({ name: `${m.first_name} ${m.last_name}`, role: m.role, email: m.work_email, doj: m.doj,
        present_today: presentToday.includes(m.id), on_leave_today: onLeaveToday.includes(m.id) })),
      pending_leave_approvals: teamPendingLeaves.map(l => ({ from: `${l.user.first_name} ${l.user.last_name}`, type: l.leave_type.replace(/_/g,' '), dates: `${l.from_date} to ${l.to_date}`, days: l.days })),
      present_today_count: presentToday.length,
      on_leave_today_count: onLeaveToday.length,
      not_checked_in: teamMembers.length - teamTodayAtt.length,
    };

    ctx.my_managed_teams = myManagedTeams.map(t => ({
      team_name: t.name, member_count: t.members?.length||0,
      project_count: t.projects?.length||0,
      projects: (t.projects||[]).map(p=>({
        name: p.name, status: p.status,
        recent_updates: (p.updates||[]).map(u=>({ by: `${u.author?.first_name} ${u.author?.last_name}`, progress: u.progress_pct, note: u.message })),
      })),
    }));

    ctx.assigned_job_positions = assignedPositions.map(p=>({ title: p.title, department: p.department, status: p.status }));

    // Voice inbox for manager
    const mVoices = await EmployeeVoice.findAll({
      where: { user_id: { [Op.in]: memberIds } },
      include: [{ model: User, as: 'user', attributes: ['first_name','last_name'] }],
      order: [['created_at','DESC']], limit: 5,
    });
    ctx.team_voice = mVoices.map(v=>({ from: v.is_anonymous?'Anonymous':`${v.user.first_name} ${v.user.last_name}`, type: v.type, status: v.status }));
  }

  // ── RECRUITMENT context (HR + Manager — full details) ────────────────────
  if (['super_admin','hr','manager'].includes(userRole)) {
    const positions = await JobPosition.findAll({
      where: { status: { [Op.in]: ['open','pending_approval','closed'] } },
      attributes: ['id','title','department','status','min_score','experience_years','salary_lpa','deadline'],
      order: [['created_at','DESC']], limit: 20,
    });
    const totalCandidates = await Candidate.count();
    const shortlisted = await Candidate.count({ where: { status: 'shortlisted' } });
    const hired = await Candidate.count({ where: { status: 'hired' } });
    ctx.recruitment = {
      positions: positions.map(p=>({
        title: p.title, dept: p.department, status: p.status,
        min_score: p.min_score, experience: p.experience_years,
        salary: p.salary_lpa, deadline: p.deadline,
      })),
      candidates_summary: { total: totalCandidates, shortlisted, hired },
    };
  }

  // ── OPEN POSITIONS (visible to ALL roles — employees can ask about openings) ──
  if (['employee','it','payroll'].includes(userRole)) {
    const openPositions = await JobPosition.findAll({
      where: { status: 'open' },
      attributes: ['title','department','experience_years','salary_lpa','deadline','min_score'],
      order: [['created_at','DESC']],
    });
    ctx.open_positions = openPositions.length > 0
      ? openPositions.map(p => ({
          title: p.title,
          department: p.department,
          experience_required: p.experience_years,
          salary: p.salary_lpa ? `${p.salary_lpa} LPA` : 'Not disclosed',
          deadline: p.deadline || 'Open',
        }))
      : 'No open positions currently';
  }

  return ctx;
}

async function answerQuestion(userId, userRole, question) {
  const context = await fetchFullContext(userId, userRole);
  const client = getGroqClient();

  const rolePages = {
    super_admin: {
      dashboard: 'Admin Dashboard — shows total employees, attendance today, pending leaves, open positions, recent activity',
      pages: [
        'Employee Management (/employees) — view, add, edit, delete all employees',
        'All Attendance (/attendance/all) — view every employee\'s attendance records',
        'Leave Approvals (/leaves/approval) — approve or reject leave requests',
        'Leave Management (/leaves/management) — view all leave data across organization',
        'Payroll Management (/payroll/manage) — generate and manage payslips for all employees',
        'Recruitment — Create positions, manage JDs, view candidates',
        'JD Approvals (/recruitment/jd-approvals) — approve job descriptions',
        'Interviews — schedule and manage interview rounds',
        'Teams (/teams) — create teams, assign projects, manage members',
        'Onboarding (/onboarding/summary) — track new joiner onboarding progress',
        'Verify Forms (/onboarding/verify-forms) — review submitted employee forms',
        'Voice Inbox (/voice/inbox) — read employee feedback and grievances',
        'Resignation Inbox (/resignation/inbox) — handle resignation requests',
        'Holiday Calendar — view and add holidays',
        'Policies — view and upload company policies',
        'Audit Logs (/settings/audit-logs) — track all system activities',
        'Directory & Org Chart — view all employees and reporting structure',
      ],
    },
    hr: {
      dashboard: 'HR Dashboard — shows headcount, pending leaves, open positions, onboarding status',
      pages: [
        'Employee Management (/employees) — view, add, edit, delete employees',
        'My JDs (/recruitment/my-jds) — create and manage job descriptions',
        'Create Position (/recruitment/create) — create new job positions with AI-generated JDs',
        'Interviews — manage interview rounds and feedback',
        'Onboarding (/onboarding/summary) — track new joiner progress',
        'Verify Forms (/onboarding/verify-forms) — review employee submitted forms',
        'Holiday Calendar — view and add holidays',
        'Policies — view and upload policies',
        'Leave Management (/leaves/management) — view all leave data',
        'Directory & Org Chart — view all employees',
      ],
    },
    manager: {
      dashboard: 'Manager Dashboard — shows team size, team attendance, pending approvals, projects',
      pages: [
        'Teams (/teams) — manage your teams, assign projects, track progress',
        'Team Attendance (/attendance/team) — view your team\'s attendance',
        'Leave Approvals (/leaves/approval) — approve/reject your team\'s leave requests',
        'JD Approvals (/recruitment/jd-approvals) — review and approve job descriptions sent by HR',
        'Interviews — conduct and provide feedback on interview rounds',
        'Voice Inbox (/voice/inbox) — read your team\'s feedback',
        'Resignation Inbox (/resignation/inbox) — handle your team\'s resignations',
        'Open Positions — view and close positions you are assigned to',
        'Directory & Org Chart — view all employees',
      ],
    },
    employee: {
      dashboard: 'Employee Dashboard — shows attendance, leave balance, project updates, notifications',
      pages: [
        'My Attendance (/attendance/my) — clock in/out, view attendance history',
        'My Leaves (/leaves/my) — view leave history and balance',
        'Apply Leave (/leaves/apply) — apply for casual, sick, earned, WFH, etc.',
        'My Projects (/my-projects) — view assigned projects, submit daily updates',
        'My Payslips (/payroll/my) — view monthly payslips with salary breakdown',
        'Open Positions (/recruitment/positions) — view open jobs, download JDs, refer friends',
        'Employee Voice (/voice) — submit anonymous or named feedback/suggestions',
        'Resignation (/resignation) — submit resignation form',
        'Holiday Calendar — view upcoming holidays',
        'Policies — view company policies',
        'Directory & Org Chart — find colleagues, view reporting structure',
        'Settings — update profile, bank details, documents',
        'My Forms (/onboarding/my-forms) — view submitted onboarding forms',
      ],
    },
    payroll: {
      dashboard: 'Payroll Dashboard — shows payroll stats',
      pages: [
        'Payroll Management (/payroll/manage) — generate payslips for employees',
        'All Attendance (/attendance/all) — view all employees\' attendance',
        'Leave Management (/leaves/management) — view all leave data',
        'My Projects (/my-projects) — view assigned projects',
        'Open Positions — view open jobs, download JDs',
        'Directory & Org Chart — find colleagues',
      ],
    },
    it: {
      dashboard: 'IT Dashboard',
      pages: [
        'My Projects (/my-projects) — view assigned projects, submit updates',
        'Open Positions — view open jobs, download JDs',
        'Directory & Org Chart — find colleagues',
      ],
    },
  };

  const userPages = rolePages[userRole] || rolePages.employee;

  const systemPrompt = `You are the Saven HR Portal AI Assistant for ${context.who_i_am.name} (${context.who_i_am.role} at Saven Technologies, Hyderabad, India).

════════════════ ABSOLUTE RULES ════════════════
1. ONLY use the data provided in the JSON context below. NEVER guess, infer, or assume.
2. If the exact data is not in the context, say: "I don't have that information in the system."
3. NEVER make up names, numbers, dates, or any facts.
4. Be concise, warm, and professional.
5. Use ₹ for currency, DD/MM/YYYY for dates.
6. If asked about something not HR-related, politely say you can only help with HR matters.
7. Always give exact numbers from the data. Say the number confidently.
8. Never say you don't have information if it IS in the context above.
════════════════════════════════════════════════

════════════════ ROLE-AWARE GUIDANCE ════════════════
This user is a "${userRole}". Their portal has:
• Dashboard: ${userPages.dashboard}
• Available pages:
${userPages.pages.map(p => `  - ${p}`).join('\n')}

When answering:
- Guide users to the correct page for their request (e.g., "You can apply leave from the Apply Leave page")
- If they ask about a feature they DON'T have access to, politely explain: "That feature is available to [role]. You can contact your [HR/manager/admin] for help."
- For directory/colleague questions — use employee_directory data to give names, emails, phone numbers, roles
- For org chart questions — use org_chart data to show who reports to whom
- For "how many employees" — use total_employees count
- For attendance questions (admin/payroll) — use org_attendance_today data
- For team attendance (manager) — use my_team data
- For leave balance — use leave.remaining (exact number)
- For payslip/salary — use payslips data (exact net_pay)
- For projects — use my_projects data
- For open positions — use open_positions or recruitment.positions data
- For policies — use company_policies data
- For holidays — use upcoming_holidays data
- For "what can I do" or "help" — list the pages and features available to their role
- For "what can you tell me about me" — summarize their profile, attendance, leaves, payslips, projects from context
════════════════════════════════════════════════

COMPLETE REAL DATA FROM DATABASE FOR THIS USER:
${JSON.stringify(context, null, 2)}

Answer the question using ONLY the above data. Be direct, precise, and helpful. Guide the user to the right page when relevant.`;

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
    temperature: 0.05, // near-zero creativity — purely factual
    max_tokens: 600,
  });

  return completion.choices[0].message.content;
}

module.exports = { answerQuestion };
