'use strict';

const Message = require('../models/Message');
const User    = require('../models/User');
const { fetchMessageById, listNewMessageIds } = require('../services/gmailService');

/**
 * GET /api/messages
 * Retrieves live conversational streams filtered by pending status
 */
exports.getMessages = async (req, res) => {
  try {
    // Return only incoming, pending items to the workspace view
    const messages = await Message.find({ 
      status: 'pending'
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (err) {
    console.error('[Controller Read Failure]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to aggregate active channel streams.',
      error: err.message
    });
  }
};

/**
 * Called by the Gmail Pub/Sub webhook handler whenever Google reports a
 * mailbox change. Pub/Sub only gives you a historyId — it never tells you
 * *what* changed — so this resolves the actual new message IDs via
 * gmail.users.history.list(), fetches each one, and stores it (deduped)
 * in the unified Message collection.
 *
 * @param {Object} tenant      - the User document (must have _id)
 * @param {String} newHistoryId - the historyId from the Pub/Sub payload
 */
exports.syncGmailHistory = async (tenant, newHistoryId) => {
  try {
    if (!tenant.lastGmailHistoryId) {
      // First watch trigger ever received for this tenant — there's nothing
      // to diff against yet, so just record the baseline and wait for the
      // *next* change to actually sync anything.
      await User.findByIdAndUpdate(tenant._id, { lastGmailHistoryId: newHistoryId });
      console.log(`[Gmail Sync] Baseline historyId set for tenant ${tenant._id}.`);
      return;
    }

    const messageIds = await listNewMessageIds(tenant._id, tenant.lastGmailHistoryId);

    for (const messageId of messageIds) {
      const alreadyStored = await Message.findOne({
        tenantId: tenant._id,
        platform: 'gmail',
        externalId: messageId,
      });
      if (alreadyStored) continue;

      const emailData = await fetchMessageById(tenant._id, messageId);

      await Message.create({
        tenantId: tenant._id,
        platform: 'gmail',
        externalId: messageId,
        sender: emailData.from,
        subject: emailData.subject,
        text: emailData.snippet,
        receivedAt: new Date(),
        raw: emailData.rawPayload,
      });
    }

    await User.findByIdAndUpdate(tenant._id, { lastGmailHistoryId: newHistoryId });
    console.log(`[Gmail Sync] Synced ${messageIds.length} new message(s) for tenant ${tenant._id}.`);
  } catch (error) {
    console.error(`[Gmail Sync] Failed for tenant ${tenant._id}:`, error.message);
  }
};