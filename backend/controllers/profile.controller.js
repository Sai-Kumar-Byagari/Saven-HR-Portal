const { User, EmployeeProfile } = require('../models');
const path = require('path');
const { validationResult } = require('express-validator');
const { hashPassword } = require('../utils/hash');
const { createAndSendOtp, verifyOtp } = require('../services/otp.service');

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

async function getMyProfile(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: EmployeeProfile, as: 'profile', required: false }],
      attributes: { exclude: ['password_hash', 'refresh_token_hash'] },
    });
    return res.status(200).json({ success: true, message: 'Profile fetched.', data: user });
  } catch (err) {
    next(err);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error.', errors: errors.array() });
    }

    const {
      gender, dob, blood_group, phone, emergency_contact,
      emergency_contact_name, address,
    } = req.body;

    const [profile] = await EmployeeProfile.findOrCreate({
      where: { user_id: req.user.id },
      defaults: { user_id: req.user.id },
    });

    await profile.update({
      gender, dob, blood_group, phone, emergency_contact,
      emergency_contact_name, address,
    });

    return res.status(200).json({ success: true, message: 'Profile updated.', data: profile });
  } catch (err) {
    next(err);
  }
}

async function updateBankDetails(req, res, next) {
  try {
    const { account_number, ifsc_code, bank_name, branch_name } = req.body;
    const [profile] = await EmployeeProfile.findOrCreate({
      where: { user_id: req.user.id },
      defaults: { user_id: req.user.id },
    });
    await profile.update({ account_number, ifsc_code, bank_name, branch_name });
    return res.status(200).json({ success: true, message: 'Bank details updated.', data: profile });
  } catch (err) {
    next(err);
  }
}

async function uploadProfilePhoto(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded.', errors: [] });
    }
    const relativePath = req.file.path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/');
    await User.update({ profile_photo: relativePath }, { where: { id: req.user.id } });
    return res.status(200).json({ success: true, message: 'Profile photo updated.', data: { profile_photo: relativePath } });
  } catch (err) {
    next(err);
  }
}

/**
 * Step 1: Admin/HR requests OTP for password change.
 * Verifies the personal email matches the logged-in user's profile.
 */
async function requestPasswordChangeOtp(req, res, next) {
  try {
    // Only super_admin and hr can change their own password
    if (!['super_admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only Admin and HR can change passwords.', errors: [] });
    }

    const { personal_email } = req.body;
    if (!personal_email) {
      return res.status(400).json({ success: false, message: 'Personal email is required.', errors: [] });
    }

    const user = await User.findByPk(req.user.id);
    if (!user || !user.personal_email) {
      return res.status(400).json({ success: false, message: 'No personal email on file. Contact your administrator.', errors: [] });
    }

    // Verify the personal email matches
    if (user.personal_email.toLowerCase() !== personal_email.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Personal email does not match your profile.', errors: [] });
    }

    await createAndSendOtp(user.personal_email);
    return res.status(200).json({ success: true, message: 'OTP sent to your personal email.', data: {} });
  } catch (err) {
    next(err);
  }
}

/**
 * Step 2: Admin/HR changes their password after verifying OTP.
 * Requires personal_email, otp, and new_password.
 */
async function changePassword(req, res, next) {
  try {
    // Only super_admin and hr can change their own password
    if (!['super_admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only Admin and HR can change passwords. Contact your admin for a password reset.', errors: [] });
    }

    const { personal_email, otp, new_password } = req.body;

    if (!personal_email || !otp || !new_password) {
      return res.status(400).json({ success: false, message: 'Personal email, OTP, and new password are required.', errors: [] });
    }

    // Verify OTP
    const otpResult = await verifyOtp(personal_email, otp);
    if (!otpResult.valid) {
      return res.status(400).json({ success: false, message: otpResult.message, errors: [] });
    }

    if (!PASSWORD_REGEX.test(new_password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.',
        errors: [],
      });
    }

    const user = await User.findByPk(req.user.id);
    const hashed = await hashPassword(new_password);
    await user.update({ password_hash: hashed });
    return res.status(200).json({ success: true, message: 'Password changed successfully.', data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyProfile, updateMyProfile, updateBankDetails, uploadProfilePhoto, requestPasswordChangeOtp, changePassword };
