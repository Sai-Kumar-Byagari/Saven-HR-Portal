const { OtpToken } = require('../models');
const { hashOtp, compareOtp } = require('../utils/hash');
const { sendMail } = require('../config/mailer');

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createAndSendOtp(personalEmail) {
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any previous unused OTPs for this email
  await OtpToken.update(
    { is_used: true },
    { where: { personal_email: personalEmail, is_used: false } }
  );

  await OtpToken.create({
    personal_email: personalEmail,
    otp_hash: otpHash,
    expires_at: expiresAt,
    is_used: false,
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #2563EB;">Saven Technologies - Password Reset OTP</h2>
      <p>You requested a password reset for your Saven HR Portal account.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <h1 style="color: #0F1623; letter-spacing: 8px; font-size: 36px;">${otp}</h1>
      </div>
      <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p>If you did not request this, please ignore this email.</p>
      <br/>
      <p>— Saven Technologies HR Team</p>
    </div>
  `;

  await sendMail({
    to: personalEmail,
    subject: 'Saven HR Portal - Password Reset OTP',
    html,
    text: `Your OTP for Saven HR Portal password reset is: ${otp}. Valid for 10 minutes.`,
  });

  return true;
}

async function verifyOtp(personalEmail, otp) {
  const tokenRecord = await OtpToken.findOne({
    where: {
      personal_email: personalEmail,
      is_used: false,
    },
    order: [['created_at', 'DESC']],
  });

  if (!tokenRecord) {
    return { valid: false, message: 'No OTP found. Please request a new one.' };
  }

  if (new Date() > tokenRecord.expires_at) {
    await tokenRecord.update({ is_used: true });
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  const isMatch = await compareOtp(otp, tokenRecord.otp_hash);
  if (!isMatch) {
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }

  await tokenRecord.update({ is_used: true });
  return { valid: true };
}

module.exports = { createAndSendOtp, verifyOtp };
