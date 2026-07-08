'use strict';
const mongoose = require('mongoose');

/**
 * UnmatchedMessage — stores inbound messages that could not be matched to any
 * tenant via the tenant routing keys (whatsappPhoneNumberId, tenantInboundEmail,
 * googleEmail). See the TENANT ISOLATION comment in models/User.js.
 *
 * These records form an internal review queue for manual triage.
 */
const UnmatchedMessageSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: ['whatsapp', 'gmail', 'other'],
    },

    // Why the message ended up here (e.g. 'no_tenant_match', 'parse_error')
    reason: {
      type: String,
      required: true,
    },

    // Full raw webhook / API payload — kept for debugging and manual processing
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Best-effort extraction from the raw payload (may be null if parsing failed)
    extractedSender: { type: String },
    extractedText:   { type: String },

    // Review lifecycle
    status: {
      type: String,
      enum: ['pending_review', 'resolved', 'discarded'],
      default: 'pending_review',
    },
    resolvedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UnmatchedMessage', UnmatchedMessageSchema);
