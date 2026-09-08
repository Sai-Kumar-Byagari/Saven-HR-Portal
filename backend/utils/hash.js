const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

async function hashOtp(otp) {
  return bcrypt.hash(String(otp), 10);
}

async function compareOtp(otp, hash) {
  return bcrypt.compare(String(otp), hash);
}

module.exports = { hashPassword, comparePassword, hashOtp, compareOtp };
