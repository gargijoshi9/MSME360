'use strict';

const { google } = require('googleapis');
const User = require('../models/User');

/**
 * Helper to build an isolated, auto-refreshing OAuth2 Client for a specific tenant.
 * Uses the FLAT fields defined on the User schema (googleAccessToken,
 * googleRefreshToken, googleTokenExpiry) — NOT a nested `googleTokens` object,
 * which does not exist on the schema and would be silently dropped on save.
 */
async function getOAuth2ClientForTenant(tenantId) {
  // googleAccessToken / googleRefreshToken are `select: false` on the schema,
  // so they must be explicitly requested here.
  const user = await User.findById(tenantId).select('+googleAccessToken +googleRefreshToken');

  if (!user || !user.googleRefreshToken) {
    throw new Error(`[Gmail OAuth] Tenant ${tenantId} has not completed Google onboarding authorization.`);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry ? new Date(user.googleTokenExpiry).getTime() : undefined,
  });

  // Event listener: triggered automatically by googleapis when the access_token expires
  oauth2Client.on('tokens', async (tokens) => {
    console.log(`[Gmail OAuth] Access token refreshed for tenant ${tenantId}.`);

    user.googleAccessToken = tokens.access_token;
    if (tokens.refresh_token) user.googleRefreshToken = tokens.refresh_token;
    if (tokens.expiry_date) user.googleTokenExpiry = new Date(tokens.expiry_date);

    await user.save();
    console.log(`[Gmail OAuth] Tokens persisted for tenant ${tenantId}.`);
  });

  return oauth2Client;
}

/**
 * Message fetching by ID — pulls headers + snippet for a single message.
 */
async function fetchMessageById(tenantId, messageId) {
  try {
    const auth = await getOAuth2ClientForTenant(tenantId);
    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
    });

    const headers = response.data.payload?.headers || [];
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
    const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
    const bodySnippet = response.data.snippet || '';

    return {
      messageId,
      from,
      subject,
      snippet: bodySnippet,
      rawPayload: response.data,
    };
  } catch (error) {
    console.error(`[Gmail Service] Fetching message ${messageId} failed:`, error.message);
    throw error;
  }
}

/**
 * Diffs mailbox history since `startHistoryId` and returns the deduped list
 * of message IDs that were added. This is the piece that was missing before —
 * Pub/Sub only tells you "something changed as of historyId X", never *what*.
 */
async function listNewMessageIds(tenantId, startHistoryId) {
  const auth = await getOAuth2ClientForTenant(tenantId);
  const gmail = google.gmail({ version: 'v1', auth });

  const messageIds = new Set();
  let pageToken;

  do {
    const resp = await gmail.users.history.list({
      userId: 'me',
      startHistoryId,
      historyTypes: ['messageAdded'],
      pageToken,
    });

    (resp.data.history || []).forEach(h => {
      (h.messagesAdded || []).forEach(m => messageIds.add(m.message.id));
    });

    pageToken = resp.data.nextPageToken;
  } while (pageToken);

  return Array.from(messageIds);
}

/**
 * Pub/Sub watch setup (must be renewed every 7 days).
 */
async function setupPubSubWatch(tenantId) {
  try {
    const auth = await getOAuth2ClientForTenant(tenantId);
    const gmail = google.gmail({ version: 'v1', auth });

    const topicName = process.env.GMAIL_PUBSUB_TOPIC;

    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName,
        labelIds: ['INBOX'],
        labelFilterBehavior: 'INCLUDE',
      },
    });

    const expirationEpoch = response.data.expiration;
    console.log(`[Gmail Pub/Sub] Watch established for ${tenantId}. Expires at epoch: ${expirationEpoch}`);

    await User.findByIdAndUpdate(tenantId, {
      gmailWatchExpiration: new Date(Number(expirationEpoch)),
    });

    return response.data;
  } catch (error) {
    console.error(`[Gmail Service] Registering Pub/Sub watch failed:`, error.message);
    throw error;
  }
}

module.exports = {
  getOAuth2ClientForTenant,
  fetchMessageById,
  listNewMessageIds,
  setupPubSubWatch,
};