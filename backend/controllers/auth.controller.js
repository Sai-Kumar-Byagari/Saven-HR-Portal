const { validationResult } = require('express-validator');
const { User } = require('../models');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { createAndSendOtp, verifyOtp } = require('../services/otp.service');
const bcrypt = require('bcrypt');

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error.', errors: errors.array() });
    }

    const { work_email, password } = req.body;
    const user = await User.findOne({ where: { work_email, is_active: true } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.', errors: [] });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.', errors: [] });
    }

    const payload = { id: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store hashed refresh token
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await user.update({ refresh_token_hash: refreshHash });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        accessToken,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          workEmail: user.work_email,
          personalEmail: user.personal_email,
          empId: user.emp_id,
          role: user.role,
          isFirstLogin: user.is_first_login,
          employeeType: user.employee_type,
          onboardingComplete: user.onboarding_complete,
          profilePhoto: user.profile_photo,
          doj: user.doj,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function refreshToken(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token missing.', errors: [] });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.', errors: [] });
    }

    const user = await User.findOne({ where: { id: decoded.id, is_active: true } });
    if (!user || !user.refresh_token_hash) {
      return res.status(401).json({ success: false, message: 'Session invalidated. Please log in again.', errors: [] });
    }

    const isValid = await bcrypt.compare(token, user.refresh_token_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Refresh token mismatch.', errors: [] });
    }

    // Rotate refresh token
    const payload = { id: user.id, role: user.role };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);
    const newRefreshHash = await bcrypt.hash(newRefreshToken, 10);
    await user.update({ refresh_token_hash: newRefreshHash });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Token refreshed.',
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    if (req.user) {
      await User.update({ refresh_token_hash: null }, { where: { id: req.user.id } });
    }
    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Logged out successfully.', data: {} });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error.', errors: errors.array() });
    }

    const { personal_email } = req.body;
    const user = await User.findOne({ where: { personal_email, is_active: true } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ success: true, message: 'If that email exists, an OTP has been sent.', data: {} });
    }

    await createAndSendOtp(personal_email);
    return res.status(200).json({ success: true, message: 'OTP sent to your personal email.', data: {} });
  } catch (err) {
    next(err);
  }
}

async function verifyOtpHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error.', errors: errors.array() });
    }

    const { personal_email, otp } = req.body;
    const result = await verifyOtp(personal_email, otp);

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message, errors: [] });
    }

    return res.status(200).json({ success: true, message: 'OTP verified successfully.', data: { verified: true } });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error.', errors: errors.array() });
    }

    const { personal_email, otp, new_password } = req.body;

    if (!PASSWORD_REGEX.test(new_password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.',
        errors: [],
      });
    }

    const result = await verifyOtp(personal_email, otp);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message, errors: [] });
    }

    const user = await User.findOne({ where: { personal_email, is_active: true } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.', errors: [] });
    }

    const hashed = await hashPassword(new_password);
    await user.update({ password_hash: hashed, refresh_token_hash: null });

    return res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.', data: {} });
  } catch (err) {
    next(err);
  }
}

async function setFirstLoginPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error.', errors: errors.array() });
    }

    const { new_password } = req.body;

    if (!req.user.is_first_login) {
      return res.status(400).json({ success: false, message: 'Password already set.', errors: [] });
    }

    if (!PASSWORD_REGEX.test(new_password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.',
        errors: [],
      });
    }

    const hashed = await hashPassword(new_password);
    await User.update(
      { password_hash: hashed, is_first_login: false },
      { where: { id: req.user.id } }
    );

    // Return updated user data so frontend store can update employeeType correctly
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: ['id','first_name','last_name','work_email','personal_email','emp_id','role','employee_type','onboarding_complete','profile_photo','doj'],
    });

    return res.status(200).json({
      success: true,
      message: 'Password set successfully.',
      data: {
        isFirstLogin: false,
        employeeType: updatedUser.employee_type,
        onboardingComplete: updatedUser.onboarding_complete,
        personalEmail: updatedUser.personal_email,
        empId: updatedUser.emp_id,
        doj: updatedUser.doj,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refreshToken, logout, forgotPassword, verifyOtpHandler, resetPassword, setFirstLoginPassword };
