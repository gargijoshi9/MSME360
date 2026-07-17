'use strict';

const Message = require('../models/Message');
const User    = require('../models/User');
const { fetchMessageById, listNewMessageIds } = require('../services/gmailService');

/**
 * GET /api/messages
 * Retrieves the full conversational history for the authenticated tenant only.
 * FIX: previously filtered status: 'pending' only, which hid outbound/'resolved'
 * messages (i.e. replies you just sent) from ever appearing in the inbox/dashboard.
 * Now returns the whole thread, scoped strictly to req.user.id so one tenant
 * never sees another tenant's messages.
 */
exports.getMessages = async (req, res) => {
  try {
    const { status, direction, priority, platform } = req.query;
 
    const filter = { tenantId: req.user.id };
    filter.direction = direction || 'inbound';
    filter.status = status || 'pending';
    if (priority) filter.priority = priority;
    if (platform) filter.platform = platform;
 
    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
 
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
  if (!tenant.lastGmailHistoryId) {
    // First watch trigger ever received for this tenant — nothing to diff
    // against yet, so just record the baseline and wait for the next change.
    await User.findByIdAndUpdate(tenant._id, { lastGmailHistoryId: newHistoryId });
    console.log(`[Gmail Sync] Baseline historyId set for tenant ${tenant._id}.`);
    return;
  }

  let syncedCount = 0;

  try {
    const messageIds = await listNewMessageIds(tenant._id, tenant.lastGmailHistoryId);

    for (const messageId of messageIds) {
      // FIX: try/catch now wraps EACH message individually. A single 404
      // (message deleted/moved before we could fetch it) used to throw out
      // of the whole loop, skip every remaining message in the batch, and
      // — critically — never advance lastGmailHistoryId, causing the same
      // stale diff (and the same dead message) to be retried forever.
      try {
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
          direction: 'inbound'
        });
        syncedCount++;
      } catch (perMessageErr) {
        // Message was likely deleted/moved between the history event firing
        // and us fetching it. Log and move on — don't let it kill the batch.
        console.warn(
          `[Gmail Sync] Skipped message ${messageId} for tenant ${tenant._id}: ${perMessageErr.message}`
        );
      }
    }
  } catch (error) {
    // This now only catches failures in listNewMessageIds itself (e.g. the
    // historyId being too old/expired), not per-message fetch failures.
    console.error(`[Gmail Sync] Failed to list history for tenant ${tenant._id}:`, error.message);
  } finally {
    // Always advance the baseline, even if some individual messages were
    // skipped — otherwise you re-process (and re-fail on) the same dead
    // message ID on every future webhook event indefinitely.
    await User.findByIdAndUpdate(tenant._id, { lastGmailHistoryId: newHistoryId });
    console.log(`[Gmail Sync] Synced ${syncedCount} new message(s) for tenant ${tenant._id}.`);
  }
};