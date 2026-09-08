const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { uploadProfilePhoto } = require('../middleware/upload');
const profileController = require('../controllers/profile.controller');

router.get('/', authMiddleware, profileController.getMyProfile);
router.put('/', authMiddleware, profileController.updateMyProfile);
router.put('/bank-details', authMiddleware, profileController.updateBankDetails);
router.post('/photo', authMiddleware, uploadProfilePhoto, profileController.uploadProfilePhoto);
router.post('/request-password-otp', authMiddleware, profileController.requestPasswordChangeOtp);
router.put('/change-password', authMiddleware, profileController.changePassword);

module.exports = router;
