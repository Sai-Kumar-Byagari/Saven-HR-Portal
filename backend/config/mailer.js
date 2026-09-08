require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail({ to, subject, html, text, attachments }) {
  const mailOptions = {
    from: `"Saven Technologies" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
    attachments: attachments || [],
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { transporter, sendMail };
