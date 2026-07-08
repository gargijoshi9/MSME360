'use strict';
const express = require('express');
const router  = express.Router();

const { signup, verifyOtp, resendOtp, login } = require('../controllers/authController');
const { loginRateLimiter, otpRateLimiter }    = require('../middleware/rateLimiter');

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// POST /api/auth/resend-otp — IP rate-limited (+ per-user limit enforced in controller)
router.post('/resend-otp', otpRateLimiter, resendOtp);

// POST /api/auth/login — IP rate-limited (+ per-account backoff enforced in controller)
router.post('/login', loginRateLimiter, login);

module.exports = router;
