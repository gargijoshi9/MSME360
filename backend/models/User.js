'use strict';
const mongoose = require('mongoose');

/**
 * TENANT ISOLATION — READ BEFORE MODIFYING THIS FILE
 * ====================================================
 * The ONLY valid way to identify which tenant owns an inbound message is to
 * perform an EXACT match on one of these three unique, sparse-indexed fields:
 *
 *   • whatsappPhoneNumberId  — WhatsApp Cloud API phone number ID
 *   • tenantInboundEmail     — dedicated inbound email address for this tenant
 *   • googleEmail            — connected Google account email
 *
 * Every webhook / inbound-message handler (WhatsApp, Gmail, or any future
 * channel) MUST follow this rule without exception:
 *
 *   1. Query User by the appropriate routing field.
 *   2. Exactly ONE user found → process the message for that tenant.
 *   3. ZERO users found       → write the raw payload to UnmatchedMessage
 *                               and stop. Do NOT fall back to "the first user
 *                               in the database", a hardcoded ObjectId, or any
 *                               other implicit routing heuristic.
 *
 * Violating rule 3 risks cross-tenant data leakage, which is a critical
 * security and privacy failure for a multi-tenant SaaS product.
 */

const UserSchema = new mongoose.Schema(
  {
    // ── Authentication ──────────────────────────────────────────────────────
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // never returned by default; must use .select('+password')
    },

    // ── Business identity ───────────────────────────────────────────────────
    companyName:  { type: String, trim: true },
    ownerName:    { type: String, trim: true },
    phone:        { type: String, trim: true },
    businessType: { type: String, trim: true },
    city:         { type: String, trim: true },
    gstin:        { type: String, trim: true, uppercase: true },
    pan:          { type: String, trim: true, uppercase: true },
    address:      { type: String, trim: true },
    currency:     { type: String, trim: true, default: 'INR' },
    taxRate:      { type: Number, default: 18 },

    // ── Tenant routing keys (see isolation comment above) ───────────────────
    // sparse: true allows multiple documents to omit the field (null ≠ duplicate)
    whatsappPhoneNumberId: { type: String, unique: true, sparse: true, trim: true },
    tenantInboundEmail:    { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    googleEmail:           { type: String, unique: true, sparse: true, lowercase: true, trim: true },

    // ── Google integration (future phases) ──────────────────────────────────
    googleSheetId:        { type: String },
    googleAccessToken:    { type: String, select: false },
    googleRefreshToken:   { type: String, select: false },
    googleTokenExpiry:    { type: Date },
    lastGmailHistoryId:   { type: String },

    // ── Email verification ──────────────────────────────────────────────────
    emailVerified:        { type: Boolean, default: false },
    otpHash:              { type: String, select: false },   // SHA-256 of the OTP
    otpExpiresAt:         { type: Date },
    otpResendCount:       { type: Number, default: 0 },
    otpResendWindowStart: { type: Date },

    // ── Login backoff (see utils/loginBackoff.js for schedule) ──────────────
    failedLoginAttempts: { type: Number, default: 0 },
    loginBackoffUntil:   { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
