const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const c       = require('../controllers/teams.controller');

// ── IMPORTANT: Static/prefixed routes must come BEFORE /:id ──────────────────

// ── Employee self-service (must be before /:id) ───────────────────────────────
router.get('/my/projects',          auth, c.getMyProjects);
router.get('/my/projects/:id',      auth, c.getProjectDetailForMember);

// ── Progress overview (must be before /:id) ───────────────────────────────────
router.get('/progress',             auth, rbac('super_admin','manager'), c.getTeamProgress);

// ── Projects (must be before /:id) ────────────────────────────────────────────
router.post('/projects',                                        auth, rbac('super_admin','manager'), c.createProject);
router.get('/projects/:id',                                     auth, c.getProjectDetail);
router.put('/projects/:id',                                     auth, rbac('super_admin','manager'), c.updateProject);
router.delete('/projects/:id',                                  auth, rbac('super_admin','manager'), c.deleteProject);

// ── Project Updates ────────────────────────────────────────────────────────────
router.post('/projects/:project_id/updates',                    auth, c.addProjectUpdate);
router.get('/projects/:project_id/updates',                     auth, c.getProjectUpdates);

// ── Project Messages ──────────────────────────────────────────────────────────
router.post('/projects/:project_id/messages',                   auth, c.postProjectMessage);
router.post('/projects/:project_id/messages/:message_id/reply', auth, c.replyToMessage);
router.get('/projects/:project_id/messages',                    auth, c.getProjectMessages);

// ── Teams CRUD (/:id must come AFTER all static routes) ──────────────────────
router.post('/',                                                auth, rbac('super_admin','manager'), c.createTeam);
router.get('/',                                                 auth, rbac('super_admin','manager'), c.getMyTeams);
router.get('/:id',                                              auth, rbac('super_admin','manager'), c.getTeamById);
router.put('/:id',                                              auth, rbac('super_admin','manager'), c.updateTeam);
router.delete('/:id',                                           auth, rbac('super_admin','manager'), c.deleteTeam);

// ── Members ────────────────────────────────────────────────────────────────────
router.post('/:id/members',                                     auth, rbac('super_admin','manager'), c.addMember);
router.delete('/:id/members/:userId',                           auth, rbac('super_admin','manager'), c.removeMember);
router.put('/:id/members/:userId',                              auth, rbac('super_admin','manager'), c.updateMemberRole);

module.exports = router;
