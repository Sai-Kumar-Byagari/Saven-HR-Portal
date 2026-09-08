const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { uploadResumes } = require('../middleware/upload');
const c = require('../controllers/recruitment.controller');

// ── Position CRUD ─────────────────────────────────────────────────────────────
router.post('/positions', authMiddleware, rbac('super_admin', 'hr'), [
  body('title').notEmpty().trim(),
  body('department').notEmpty().trim(),
  body('key_responsibilities').notEmpty(),
  body('required_skills').notEmpty(),
], c.createPosition);

router.get('/positions',    authMiddleware, c.getAllPositions);
router.get('/positions/:id', authMiddleware, c.getPositionById);
router.put('/positions/:id/close', authMiddleware, rbac('super_admin', 'hr'), c.closePosition);

// ── JD flow ───────────────────────────────────────────────────────────────────
// Step 2: HR sends JD to managers for approval (multiple)
router.post('/positions/:id/send-for-approval', authMiddleware, rbac('super_admin', 'hr'), c.sendJDForApproval);

// Step 3: Manager approves or rejects
router.put('/positions/:id/approve-jd', authMiddleware, rbac('super_admin', 'manager'), c.approveJD);

// HR/Manager: edit JD content
router.put('/positions/:id/update-jd', authMiddleware, rbac('super_admin', 'manager', 'hr'), c.updateJDContent);

// Retry AI JD generation
router.post('/positions/:id/retry-jd', authMiddleware, rbac('super_admin', 'hr'), c.retryJDGeneration);

// ── Manager approval inbox ────────────────────────────────────────────────────
router.get('/jd-approvals/mine', authMiddleware, rbac('super_admin', 'manager'), c.getManagerJDApprovals);

// ── Candidates ────────────────────────────────────────────────────────────────
router.post('/positions/:position_id/resumes', authMiddleware, rbac('super_admin', 'hr'), uploadResumes, c.uploadResumesAndShortlist);
router.get('/positions/:position_id/candidates', authMiddleware, rbac('super_admin', 'hr', 'manager'), c.getCandidates);
router.get('/candidates/:id', authMiddleware, rbac('super_admin', 'hr', 'manager'), c.getCandidateById);

module.exports = router;
