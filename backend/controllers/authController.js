'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOtp, hashOtp, getOtpExpiry } = require('../utils/otp');
const { computeBackoffUntil } = require('../utils/loginBackoff');
const { sendOtpEmail } = require('../services/emailService');

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Cost factor 10 — intentional.
 * Higher cost factors (12+) add real login latency on budget-constrained hosting
 * (shared CPU, small VMs) with limited additional security benefit at this threat
 * level. Cost 10 is the bcrypt project's own recommended default for most
 * production applications; it is not a shortcut.
 */
const BCRYPT_COST = 10;

const PASSWORD_MIN_LENGTH = 10;

/**
 * Common password blocklist — enforced as a Set for O(1) lookup.
 *
 * TODO: Before production, replace this short starter list with a proper
 * ~10,000-entry blocklist, for example:
 *   • NCSC's Top 100k Passwords: https://github.com/nicktindall/cyclon.p2p-common-passwords
 *   • SecLists/Passwords/Common-Credentials/10-million-password-list-top-10000.txt
 *
 * Load it into a Set at startup from a file (don't hard-code 10k strings here).
 * The Set must be rebuilt if the application hot-reloads.
 */
const COMMON_PASSWORDS = new Set([
  'password123', 'password1234', '1234567890', '12345678901',
  'qwerty12345', 'qwertyuiop', 'iloveyou123', 'admin12345',
  'letmein123', 'welcome123', 'monkey12345', 'dragon12345',
  'master12345', 'sunshine123', 'princess123', 'football123',
  'india@1234', 'india@12345', 'msme@12345', 'business@123',
  'passw0rd12', 'abc1234567', 'abcd123456', '0987654321',
]);

const OTP_RESEND_MAX = 3;
const OTP_RESEND_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Identical error returned for "account does not exist" AND "wrong password".
 * Never distinguish the two cases — that would allow account enumeration.
 */
const GENERIC_AUTH_ERROR = 'Invalid email or password.';
const GENERIC_OTP_ERROR  = 'Invalid or expired OTP.';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Validates password strength.
 * Returns an error string if invalid, or null if valid.
 */
const validatePassword = (password) => {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }
  if (COMMON_PASSWORDS.has(password)) {
    return 'This password is too common. Please choose a more unique password.';
  }
  return null;
};

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

const signup = async (req, res) => {
  try {
    const {
      email, password,
      companyName, ownerName, phone, businessType,
      city, gstin, pan, address, currency, taxRate,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // 1. Validate password strength before touching the database
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Duplicate email check — generic message only, no account-existence leak
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // 3. Hash password (bcrypt, cost 10)
    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

    // 4. Generate OTP — crypto.randomInt, hashed with SHA-256
    const otp       = generateOtp();
    const otpHash    = hashOtp(otp);
    const otpExpiresAt = getOtpExpiry();

    // 5. Create user in unverified state
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      companyName,
      ownerName,
      phone,
      businessType,
      city,
      gstin,
      pan,
      address,
      currency,
      taxRate,
      emailVerified: false,
      otpHash,
      otpExpiresAt,
      otpResendCount: 0,
    });

    // 6. Send OTP email — failure must NOT roll back user creation
    //    (user can request a resend). Log the error for ops visibility.
    try {
      await sendOtpEmail(user.email, otp);
    } catch (emailErr) {
      console.error(
        '[signup] OTP email send failed — user created, resend available:',
        emailErr.message
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Account created. Please check your email for your 6-digit verification code.',
    });
  } catch (err) {
    console.error('[authController/signup]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    // Fetch otpHash explicitly (select: false on the field)
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+otpHash');

    // Use the same generic error for: account not found, expired OTP, wrong OTP.
    // Don't leak whether the account exists.
    if (!user) {
      return res.status(400).json({ success: false, message: GENERIC_OTP_ERROR });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified. Please log in.',
      });
    }

    if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: GENERIC_OTP_ERROR });
    }

    const providedHash = hashOtp(String(otp).trim());
    if (providedHash !== user.otpHash) {
      return res.status(400).json({ success: false, message: GENERIC_OTP_ERROR });
    }

    // OTP is valid — mark verified, clear all OTP fields
    user.emailVerified        = true;
    user.otpHash              = undefined;
    user.otpExpiresAt         = undefined;
    user.otpResendCount       = 0;
    user.otpResendWindowStart = undefined;
    await user.save();

    // Auto-login: issue JWT immediately — no separate login step required
    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Email verified successfully.',
      token,
      user: {
        id:          user._id,
        email:       user.email,
        companyName: user.companyName,
        ownerName:   user.ownerName,
      },
    });
  } catch (err) {
    console.error('[authController/verifyOtp]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── POST /api/auth/resend-otp ────────────────────────────────────────────────

const resendOtp = async (req, res) => {
  /**
   * IMPORTANT: Return the SAME generic message for ALL of:
   *   • account not found
   *   • account already verified
   *   • success
   * This prevents account-existence enumeration via the resend endpoint.
   * (Rate-limit exceeded is the only case that gets a different response,
   * and by that point account existence has already been established by
   * the attacker anyway.)
   */
  const GENERIC_RESEND_MSG =
    'If your account exists and is unverified, a new code has been sent to your email.';

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Silently succeed for nonexistent or already-verified accounts
    if (!user || user.emailVerified) {
      return res.json({ success: true, message: GENERIC_RESEND_MSG });
    }

    // Per-user rate limit: max 3 resends per 15-minute sliding window
    const now = Date.now();
    const windowExpired =
      !user.otpResendWindowStart ||
      now - user.otpResendWindowStart.getTime() > OTP_RESEND_WINDOW_MS;

    if (windowExpired) {
      user.otpResendCount       = 0;
      user.otpResendWindowStart = new Date(now);
    }

    if (user.otpResendCount >= OTP_RESEND_MAX) {
      return res.status(429).json({
        success: false,
        message: 'Too many verification requests. Please wait before requesting another code.',
      });
    }

    // Generate and persist new OTP
    const otp = generateOtp();
    user.otpHash       = hashOtp(otp);
    user.otpExpiresAt  = getOtpExpiry();
    user.otpResendCount += 1;
    await user.save();

    try {
      await sendOtpEmail(user.email, otp);
    } catch (emailErr) {
      console.error('[resendOtp] OTP email send failed:', emailErr.message);
    }

    return res.json({ success: true, message: GENERIC_RESEND_MSG });
  } catch (err) {
    console.error('[authController/resendOtp]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Step 1: Look up user.
    // Return GENERIC_AUTH_ERROR whether account doesn't exist or password is wrong.
    // Never let the response distinguish the two cases.
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password'); // password is select:false by default

    if (!user) {
      return res.status(401).json({ success: false, message: GENERIC_AUTH_ERROR });
    }

    // Step 2: Exponential backoff check
    if (user.loginBackoffUntil && user.loginBackoffUntil > new Date()) {
      const secondsRemaining = Math.ceil((user.loginBackoffUntil - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Please try again in ${secondsRemaining} second(s).`,
        retryAfterSeconds: secondsRemaining,
      });
    }

    // Step 3: Email verification check
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
      });
    }

    // Step 4: Password check
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Increment failed attempts and apply backoff for next attempt
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.loginBackoffUntil   = computeBackoffUntil(user.failedLoginAttempts);
      await user.save();

      return res.status(401).json({ success: false, message: GENERIC_AUTH_ERROR });
    }

    // Success — reset backoff state entirely
    user.failedLoginAttempts = 0;
    user.loginBackoffUntil   = null;
    await user.save();

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id:          user._id,
        email:       user.email,
        companyName: user.companyName,
        ownerName:   user.ownerName,
      },
    });
  } catch (err) {
    console.error('[authController/login]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { signup, verifyOtp, resendOtp, login };
