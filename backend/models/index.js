const { sequelize } = require('../config/database');

const User = require('./User');
const Team = require('./Team');
const TeamMember = require('./TeamMember');
const Project = require('./Project');
const Task = require('./Task');
const TaskUpdate = require('./TaskUpdate');
const ProjectUpdate = require('./ProjectUpdate');
const ProjectMessage = require('./ProjectMessage');
const JdApproval = require('./JdApproval');
const EmployeeForm = require('./EmployeeForm');
const EmployeeProfile = require('./EmployeeProfile');
const EmployeeDocument = require('./EmployeeDocument');
const Attendance = require('./Attendance');
const Leave = require('./Leave');
const LeaveBalance = require('./LeaveBalance');
const HolidayCalendar = require('./HolidayCalendar');
const OrgChart = require('./OrgChart');
const Notification = require('./Notification');
const JobPosition = require('./JobPosition');
const JobDescription = require('./JobDescription');
const Candidate = require('./Candidate');
const InterviewRound = require('./InterviewRound');
const InterviewFeedback = require('./InterviewFeedback');
const EmployeeVoice = require('./EmployeeVoice');
const Payroll = require('./Payroll');
const ResignationForm = require('./ResignationForm');
const ResignationFeedback = require('./ResignationFeedback');
const Policy = require('./Policy');
const OnboardingTask = require('./OnboardingTask');
const AuditLog = require('./AuditLog');
const OtpToken = require('./OtpToken');

// ─── Self-referential (User → ReportingManager) ──────────────────────────────
User.belongsTo(User, { as: 'reportingManager', foreignKey: 'reporting_manager_id' });
User.hasMany(User, { as: 'directReports', foreignKey: 'reporting_manager_id' });

// ─── EmployeeForm ─────────────────────────────────────────────────────────────
User.hasOne(EmployeeForm, { foreignKey: 'user_id', as: 'employeeForm', onDelete: 'CASCADE' });
EmployeeForm.belongsTo(User, { foreignKey: 'user_id', as: 'employee' });
User.hasMany(EmployeeForm, { foreignKey: 'reviewed_by', as: 'reviewedForms' });
EmployeeForm.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });

// ─── EmployeeProfile ──────────────────────────────────────────────────────────
User.hasOne(EmployeeProfile, { foreignKey: 'user_id', as: 'profile', onDelete: 'CASCADE' });
EmployeeProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── EmployeeDocument ─────────────────────────────────────────────────────────
User.hasMany(EmployeeDocument, { foreignKey: 'user_id', as: 'documents', onDelete: 'CASCADE' });
EmployeeDocument.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── Attendance ───────────────────────────────────────────────────────────────
User.hasMany(Attendance, { foreignKey: 'user_id', as: 'attendanceRecords', onDelete: 'CASCADE' });
Attendance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── Leave ────────────────────────────────────────────────────────────────────
User.hasMany(Leave, { foreignKey: 'user_id', as: 'leaves', onDelete: 'CASCADE' });
Leave.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Leave, { foreignKey: 'approved_by', as: 'approvedLeaves' });
Leave.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// ─── LeaveBalance ─────────────────────────────────────────────────────────────
User.hasMany(LeaveBalance, { foreignKey: 'user_id', as: 'leaveBalances', onDelete: 'CASCADE' });
LeaveBalance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── HolidayCalendar ──────────────────────────────────────────────────────────
User.hasMany(HolidayCalendar, { foreignKey: 'created_by', as: 'createdHolidays' });
HolidayCalendar.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ─── OrgChart ─────────────────────────────────────────────────────────────────
User.hasOne(OrgChart, { foreignKey: 'user_id', as: 'orgPosition', onDelete: 'CASCADE' });
OrgChart.belongsTo(User, { foreignKey: 'user_id', as: 'employee' });
OrgChart.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

// ─── Notification ─────────────────────────────────────────────────────────────
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── JobPosition ──────────────────────────────────────────────────────────────
User.hasMany(JobPosition, { foreignKey: 'created_by_hr', as: 'createdPositions' });
JobPosition.belongsTo(User, { foreignKey: 'created_by_hr', as: 'hrCreator' });
User.hasMany(JobPosition, { foreignKey: 'assigned_manager_id', as: 'assignedPositions' });
JobPosition.belongsTo(User, { foreignKey: 'assigned_manager_id', as: 'assignedManager' });
User.hasMany(JobPosition, { foreignKey: 'approved_by_manager', as: 'approvedPositions' });
JobPosition.belongsTo(User, { foreignKey: 'approved_by_manager', as: 'approvalManager' });

// ─── JobDescription ───────────────────────────────────────────────────────────
JobPosition.hasMany(JobDescription, { foreignKey: 'position_id', as: 'descriptions', onDelete: 'CASCADE' });
JobDescription.belongsTo(JobPosition, { foreignKey: 'position_id', as: 'position' });

// ─── Candidate ────────────────────────────────────────────────────────────────
JobPosition.hasMany(Candidate, { foreignKey: 'position_id', as: 'candidates', onDelete: 'CASCADE' });
Candidate.belongsTo(JobPosition, { foreignKey: 'position_id', as: 'position' });
User.hasMany(Candidate, { foreignKey: 'referred_by', as: 'referredCandidates' });
Candidate.belongsTo(User, { foreignKey: 'referred_by', as: 'referrer' });

// ─── InterviewRound ───────────────────────────────────────────────────────────
Candidate.hasMany(InterviewRound, { foreignKey: 'candidate_id', as: 'rounds', onDelete: 'CASCADE' });
InterviewRound.belongsTo(Candidate, { foreignKey: 'candidate_id', as: 'candidate' });
User.hasMany(InterviewRound, { foreignKey: 'conducted_by', as: 'conductedRounds' });
InterviewRound.belongsTo(User, { foreignKey: 'conducted_by', as: 'conductor' });

// ─── InterviewFeedback ────────────────────────────────────────────────────────
InterviewRound.hasMany(InterviewFeedback, { foreignKey: 'round_id', as: 'feedbacks', onDelete: 'CASCADE' });
InterviewFeedback.belongsTo(InterviewRound, { foreignKey: 'round_id', as: 'round' });
User.hasMany(InterviewFeedback, { foreignKey: 'given_by', as: 'givenFeedbacks' });
InterviewFeedback.belongsTo(User, { foreignKey: 'given_by', as: 'feedbackGiver' });

// ─── EmployeeVoice ────────────────────────────────────────────────────────────
User.hasMany(EmployeeVoice, { foreignKey: 'user_id', as: 'voices', onDelete: 'CASCADE' });
EmployeeVoice.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── Payroll ──────────────────────────────────────────────────────────────────
User.hasMany(Payroll, { foreignKey: 'user_id', as: 'payslips', onDelete: 'CASCADE' });
Payroll.belongsTo(User, { foreignKey: 'user_id', as: 'employee' });
User.hasMany(Payroll, { foreignKey: 'generated_by', as: 'generatedPayslips' });
Payroll.belongsTo(User, { foreignKey: 'generated_by', as: 'generator' });

// ─── ResignationForm ──────────────────────────────────────────────────────────
User.hasMany(ResignationForm, { foreignKey: 'user_id', as: 'resignations', onDelete: 'CASCADE' });
ResignationForm.belongsTo(User, { foreignKey: 'user_id', as: 'employee' });

// ─── ResignationFeedback ──────────────────────────────────────────────────────
ResignationForm.hasOne(ResignationFeedback, { foreignKey: 'resignation_id', as: 'feedback', onDelete: 'CASCADE' });
ResignationFeedback.belongsTo(ResignationForm, { foreignKey: 'resignation_id', as: 'resignation' });

// ─── Policy ───────────────────────────────────────────────────────────────────
User.hasMany(Policy, { foreignKey: 'uploaded_by', as: 'uploadedPolicies' });
Policy.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// ─── OnboardingTask ───────────────────────────────────────────────────────────
User.hasMany(OnboardingTask, { foreignKey: 'user_id', as: 'onboardingTasks', onDelete: 'CASCADE' });
OnboardingTask.belongsTo(User, { foreignKey: 'user_id', as: 'employee' });

// ─── AuditLog ─────────────────────────────────────────────────────────────────
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'actor' });

// ─── JdApproval ──────────────────────────────────────────────────────────────
JobPosition.hasMany(JdApproval, { foreignKey: 'position_id', as: 'approvals', onDelete: 'CASCADE' });
JdApproval.belongsTo(JobPosition, { foreignKey: 'position_id', as: 'position' });
User.hasMany(JdApproval, { foreignKey: 'manager_id', as: 'jdApprovals' });
JdApproval.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

// ─── Team & Project associations ─────────────────────────────────────────────
User.hasMany(Team, { foreignKey: 'manager_id', as: 'managedTeams' });
Team.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

Team.hasMany(TeamMember, { foreignKey: 'team_id', as: 'members', onDelete: 'CASCADE' });
TeamMember.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });
User.hasMany(TeamMember, { foreignKey: 'user_id', as: 'teamMemberships' });
TeamMember.belongsTo(User, { foreignKey: 'user_id', as: 'employee' });

Team.hasMany(Project, { foreignKey: 'team_id', as: 'projects', onDelete: 'CASCADE' });
Project.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });
User.hasMany(Project, { foreignKey: 'manager_id', as: 'managedProjects' });
Project.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
User.hasMany(Task, { foreignKey: 'assigned_to', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
User.hasMany(Task, { foreignKey: 'assigned_by', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'assigned_by', as: 'assigner' });

Task.hasMany(TaskUpdate, { foreignKey: 'task_id', as: 'updates', onDelete: 'CASCADE' });
TaskUpdate.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
User.hasMany(TaskUpdate, { foreignKey: 'user_id', as: 'taskUpdates' });
TaskUpdate.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// ─── ProjectUpdate (daily employee progress updates on a project) ──────────
Project.hasMany(ProjectUpdate, { foreignKey: 'project_id', as: 'updates', onDelete: 'CASCADE' });
ProjectUpdate.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
User.hasMany(ProjectUpdate, { foreignKey: 'user_id', as: 'projectUpdates' });
ProjectUpdate.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// ─── ProjectMessage (manager ↔ team communication) ────────────────────────
Project.hasMany(ProjectMessage, { foreignKey: 'project_id', as: 'messages', onDelete: 'CASCADE' });
ProjectMessage.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
User.hasMany(ProjectMessage, { foreignKey: 'sender_id', as: 'sentProjectMessages' });
ProjectMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
User.hasMany(ProjectMessage, { foreignKey: 'target_user_id', as: 'receivedProjectMessages' });
ProjectMessage.belongsTo(User, { foreignKey: 'target_user_id', as: 'targetUser' });
// Self-referential: replies
ProjectMessage.hasMany(ProjectMessage, { foreignKey: 'parent_id', as: 'replies', onDelete: 'CASCADE' });
ProjectMessage.belongsTo(ProjectMessage, { foreignKey: 'parent_id', as: 'parent' });

module.exports = {
  sequelize,
  User,
  Team, TeamMember, Project, Task, TaskUpdate, ProjectUpdate, ProjectMessage,
  JdApproval, EmployeeForm,
  EmployeeProfile,
  EmployeeDocument,
  Attendance,
  Leave,
  LeaveBalance,
  HolidayCalendar,
  OrgChart,
  Notification,
  JobPosition,
  JobDescription,
  Candidate,
  InterviewRound,
  InterviewFeedback,
  EmployeeVoice,
  Payroll,
  ResignationForm,
  ResignationFeedback,
  Policy,
  OnboardingTask,
  AuditLog,
  OtpToken,
};
