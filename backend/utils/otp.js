'use strict';
const crypto = require('crypto');

const OTP_EXPIRY_MINUTES = 10;

/**
 * Generates a cryptographically random 6-digit OTP.
 *
 * Uses crypto.randomInt — NOT Math.random. Math.random is not cryptographically
 * secure and must never be used for security-sensitive tokens; an attacker with
 * knowledge of the PRNG state could predict values.
 *
 * @returns {string} 6-digit string, zero-padded
 */
const generateOtp = () => {
  // randomInt(min, max): inclusive of min, exclusive of max → always 6 digits
  return String(crypto.randomInt(100_000, 1_000_000));
};

/**
 * Hashes an OTP with SHA-256.
 *
 * Why SHA-256 and not bcrypt?
 * OTPs are short-lived (10 min) and already rate-limited. The threat model for
 * a stored OTP hash is: attacker must use the live endpoint, which is rate-limited,
 * not mount an offline brute-force against the hash. In that context bcrypt's
 * intentional slowness wastes server cycles with no meaningful security benefit.
 * Bcrypt's slowness IS justified for password hashes, where an attacker who
 * exfiltrates the database could run unlimited offline guesses.
 *
 * @param {string} otp - Raw OTP string
 * @returns {string} Hex-encoded SHA-256 digest
 */
const hashOtp = (otp) =>
  crypto.createHash('sha256').update(String(otp)).digest('hex');

/**
 * Returns the expiry Date for a newly generated OTP (10 minutes from now).
 *
 * @returns {Date}
 */
const getOtpExpiry = () =>
  new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

module.exports = { generateOtp, hashOtp, getOtpExpiry };
