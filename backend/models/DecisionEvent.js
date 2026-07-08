'use strict';
const mongoose = require('mongoose');

/**
 * DecisionEvent — an audit record for every significant action taken on a
 * classified inbound message (e.g. message received, reply sent, sheet updated).
 *
 * IMPORTANT: Do NOT add an embedding / vector field to this model.
 * Vector search is not implemented. A missing feature is honest;
 * a fake/placeholder embedding (e.g. a hash dressed up as a vector) is a
 * liability — it creates the appearance of a capability that doesn't exist.
 * If semantic search is funded in a future phase, add it then with a real
 * embedding provider.
 */
const DecisionEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      // Examples: 'message_received', 'reply_sent', 'sheet_updated',
      //           'message_escalated', 'message_discarded'
    },

    content: {
      sender:        { type: String },
      text:          { type: String },   // included in text index (see below)
      platform:      { type: String },
      summary:       { type: String },   // included in text index (see below)
      category:      { type: String },
      priority:      { type: String, enum: ['high', 'medium', 'low', null], default: null },
      isRead:        { type: Boolean, default: false },
      gmailMessageId:{ type: String },
    },
  },
  { timestamps: true }
);

// Keyword search index — MongoDB $text search on the two free-text fields.
// No embedding field exists; semantic search is not implemented.
DecisionEventSchema.index(
  { 'content.text': 'text', 'content.summary': 'text' },
  { name: 'content_text_search' }
);

module.exports = mongoose.model('DecisionEvent', DecisionEventSchema);
