const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests. Try again in 15 minutes.', errors: [] },
});

// POST /api/auth/login
router.post('/login', authLimiter, [
  body('work_email').isEmail().withMessage('Valid work email required.'),
  body('password').notEmpty().withMessage('Password required.'),
], authController.login);

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken);

// POST /api/auth/logout
router.post('/logout', authMiddleware, authController.logout);

// POST /api/auth/first-login/set-password
router.post('/first-login/set-password', authMiddleware, [
  body('new_password').notEmpty(),
], authController.setFirstLoginPassword);

module.exports = router;
