const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { answerQuestion } = require('../services/chat.service');

/**
 * Maps a question + user role to the most relevant page route.
 * Every route returned is verified against AppRouter.jsx routes.
 * Strategy: specific match first, then broad match, then role-default fallback.
 */
function resolveNavigateTo(question, role) {
  const q = question.toLowerCase();

  // ── Payroll / salary / payslip ──────────────────────────────────────────
  if (/payslip|payroll|net.?pay|salary|ctc|stipend|increment|hike|pay.?stub|how much.*paid|my pay/i.test(q)) {
    if (['super_admin','payroll'].includes(role)) return '/payroll/manage';
    return '/payroll/my';
  }

  // ── Leave ────────────────────────────────────────────────────────────────
  if (/leave|vacation|time.?off|wfh|work.?from.?home|day.?off/i.test(q)) {
    if (/approv|pending/i.test(q) && ['super_admin','manager'].includes(role)) return '/leaves/approval';
    if (/manage/i.test(q) && role === 'super_admin') return '/leaves/management';
    if (/apply|request|how to/i.test(q)) return '/leaves/apply';
    return '/leaves/my';
  }

  // ── Attendance / clock / present ─────────────────────────────────────────
  if (/attend|clock.?in|clock.?out|present|check.?in|working.?hour|who.*present/i.test(q)) {
    if (['super_admin','hr'].includes(role)) return '/attendance/all';
    if (role === 'manager') return '/attendance/team';
    return '/attendance/my';
  }

  // ── Candidates / shortlist / resume / interview ───────────────────────────
  if (/candidate|shortlist|resume|applicant|interview/i.test(q)) {
    if (['super_admin','hr','manager'].includes(role)) return '/interviews';
    return '/recruitment/positions';
  }

  // ── Jobs / positions / vacancies / openings / hiring ─────────────────────
  // Very broad — catches "open job positions", "current openings", "job vacancies" etc.
  if (/position|job|vacanc|opening|hiring|recruit/i.test(q)) {
    // JD specific — only for approvers
    if (/\bjd\b|job.?desc|approv/i.test(q) && ['super_admin','manager'].includes(role)) {
      return '/recruitment/jd-approvals';
    }
    // Create position — only HR/admin
    if (/create|post|add.*position/i.test(q) && ['super_admin','hr'].includes(role)) {
      return '/recruitment/create';
    }
    return '/recruitment/positions';
  }

  // ── Onboarding ───────────────────────────────────────────────────────────
  if (/onboard/i.test(q)) {
    if (['super_admin','hr'].includes(role)) return '/onboarding/summary';
    return '/dashboard';
  }

  // ── Employees / headcount / team members / joiners ───────────────────────
  if (/headcount|how many emp|total emp|all emp|staff.?count|new joiner|joiner/i.test(q)) {
    if (['super_admin','hr'].includes(role)) return '/employees';
    return '/directory';
  }

  // ── Employee directory / colleague info ──────────────────────────────────
  if (/directory|colleague|co.?worker|who is|contact.*detail/i.test(q)) {
    return '/directory';
  }

  // ── Org chart ────────────────────────────────────────────────────────────
  if (/org.?chart|hierarchy|reporting.?to|structure|who.*report/i.test(q)) {
    return '/orgchart';
  }

  // ── Holidays / festivals ─────────────────────────────────────────────────
  if (/holiday|festival|public.?holiday|next.?holiday|upcoming.*holiday/i.test(q)) {
    return '/holidays';
  }

  // ── Policies ─────────────────────────────────────────────────────────────
  if (/polic|rule|guideline|handbook/i.test(q)) {
    return '/policies';
  }

  // ── Resignation ──────────────────────────────────────────────────────────
  if (/resign|notice.?period|last.?working|exit/i.test(q)) {
    if (['super_admin','manager'].includes(role)) return '/resignation/inbox';
    return '/resignation';
  }

  // ── Projects ─────────────────────────────────────────────────────────────
  if (/\bproject\b|project.?status|project.?update|my.?project/i.test(q)) {
    if (['super_admin','manager'].includes(role)) return '/teams';
    return '/my-projects';
  }

  // ── Teams ────────────────────────────────────────────────────────────────
  if (/\bteam\b|team.?member|team.?progress|my.?team/i.test(q)) {
    if (['super_admin','manager'].includes(role)) return '/teams';
    return '/my-projects';
  }

  // ── Voice / feedback ─────────────────────────────────────────────────────
  if (/voice|feedback|grievance|complaint|suggestion/i.test(q)) {
    if (['super_admin','manager'].includes(role)) return '/voice/inbox';
    return '/voice';
  }

  // ── Audit logs ───────────────────────────────────────────────────────────
  if (/audit|log|activity/i.test(q)) {
    if (role === 'super_admin') return '/settings/audit-logs';
    return null;
  }

  // ── Profile / bank / documents / settings ────────────────────────────────
  if (/profile|personal.?info|my.?info|bank|account|ifsc|document|update.*detail|my.*detail/i.test(q)) {
    return '/settings';
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  if (/dashboard|overview/i.test(q)) {
    return '/dashboard';
  }

  // ── FALLBACK: always return a sensible default page per role ──────────────
  // So every AI response ALWAYS has a navigation arrow
  const fallback = {
    super_admin: '/dashboard',
    hr:          '/employees',
    manager:     '/teams',
    employee:    '/my-projects',
    it:          '/my-projects',
    payroll:     '/payroll/my',
  };
  return fallback[role] || '/dashboard';
}

router.post('/ask', auth, async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question || question.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Question is required.', errors: [] });
    }
    const q = question.trim();
    const answer = await answerQuestion(req.user.id, req.user.role, q);
    const navigateTo = resolveNavigateTo(q, req.user.role);
    return res.status(200).json({
      success: true,
      message: 'Answer generated.',
      data: { answer, navigateTo },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
