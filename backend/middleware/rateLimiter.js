'use strict';
const rateLimit = require('express-rate-limit');

/**
 * IP-level rate limiter for the POST /api/auth/login route.
 *
 * Complements per-account exponential backoff (utils/loginBackoff.js).
 * Per-account backoff catches brute-force against a single account.
 * This IP limiter catches attackers who spread attempts across MANY different
 * accounts — a pattern that per-account backoff alone would not slow down.
 *
 * 20 requests / 15-minute window / IP.
 * Successful requests don't count toward the limit (skipSuccessfulRequests).
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again later.',
  },
});

/**
 * IP-level rate limiter for the POST /api/auth/resend-otp route.
 *
 * The per-user limit (3 resends / 15 min) is enforced inside authController.
 * This IP limiter adds a complementary layer for unauthenticated abuse.
 *
 * 10 requests / 15-minute window / IP.
 */
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests from this IP. Please try again later.',
  },
});

module.exports = { loginRateLimiter, otpRateLimiter };
