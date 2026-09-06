const crypto = require("crypto");

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const VERIFIED_WINDOW_MS = 15 * 60 * 1000;

const getOtpSecret = () =>
  process.env.JWT_SECRET || process.env.PASSWORD_RESET_SECRET || "password-reset-secret";

const hashOtp = (otp, email) =>
  crypto
    .createHmac("sha256", getOtpSecret())
    .update(`${String(email).toLowerCase().trim()}:${String(otp).trim()}`)
    .digest("hex");

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

module.exports = {
  OTP_EXPIRY_MS,
  RESEND_COOLDOWN_MS,
  VERIFIED_WINDOW_MS,
  hashOtp,
  generateOtp,
};
