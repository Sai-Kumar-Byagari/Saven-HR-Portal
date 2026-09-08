const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { uploadInterviewRecording } = require('../middleware/upload');
const interviewsController = require('../controllers/interviews.controller');

router.post('/schedule', authMiddleware, rbac('super_admin', 'hr', 'manager'), interviewsController.scheduleRound);
router.get('/candidate/:candidate_id/rounds', authMiddleware, rbac('super_admin', 'hr', 'manager'), interviewsController.getRoundsByCandidate);
router.get('/rounds/:round_id', authMiddleware, rbac('super_admin', 'hr', 'manager'), interviewsController.getRoundById);
router.post('/rounds/:round_id/feedback', authMiddleware, rbac('super_admin', 'hr', 'manager'), interviewsController.submitRoundFeedback);
router.post('/rounds/:round_id/recording', authMiddleware, rbac('super_admin', 'hr', 'manager'), uploadInterviewRecording, interviewsController.uploadRecordingAndEvaluate);
router.put('/rounds/:round_id/decision', authMiddleware, rbac('super_admin', 'manager'), interviewsController.makeFinalDecision);

module.exports = router;
