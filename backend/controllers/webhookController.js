'use strict';

const User = require('../models/User');
const { classifyIntent } = require('../services/intentRouter');
const messageController = require('./messageController');

/**
 * GET /api/webhook — Meta validation handshake
 */
exports.verifyWhatsapp = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('--- Webhook Verified Successfully! ---');
    return res.status(200).send(challenge);
  }

  console.error('Webhook verification failed. Token mismatch.');
  return res.sendStatus(403);
};

/**
 * POST /api/webhook — Processes real-time incoming WhatsApp traffic
 * (unchanged from your original — not touching this per your request)
 */
exports.handleInboundWhatsapp = async (req, res) => {
  const body = req.body;
  res.status(200).send('EVENT_RECEIVED');

  try {
    const messageValue = body.entry?.[0]?.changes?.[0]?.value;
    if (!messageValue || !messageValue.messages?.[0]) return;

    const metadata = messageValue.metadata;
    const incomingMessage = messageValue.messages[0];

    const phoneNumberId = metadata?.phone_number_id;
    const messageText = incomingMessage.text?.body || '';

    let tenant = await User.findOne({ whatsappPhoneNumberId: phoneNumberId });

    if (!tenant && phoneNumberId === process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.log(`[Master Sandbox Session] Active for Phone ID: ${phoneNumberId}`);
      tenant = { _id: 'MASTER_ENV_ADMIN' };
    }

    if (!tenant) {
      console.warn(`[Tenant Isolation Violation] Dropped WhatsApp payload. No tenant registered with Phone ID: ${phoneNumberId}`);
      return;
    }

    const analysis = await classifyIntent(messageText, !!incomingMessage.image);
    console.log(`[Isolated Tenant: ${tenant._id}] Message routed as: ${analysis.intent}`);
  } catch (error) {
    console.error('[Webhook WhatsApp Engine Error]:', error.message);
  }
};

/**
 * POST /api/gmail — Receives real-time Google Cloud Pub/Sub push notifications.
 *
 * FIXED: previously queried `'googleTokens.email'`, which doesn't exist on
 * the User schema (it's the flat field `googleEmail`) — so this handler was
 * silently dropping every single Gmail push as "no tenant matches."
 *
 * FIXED: previously logged the historyId and did nothing else. Now actually
 * resolves + fetches + stores the new message(s) via messageController.syncGmailHistory.
 */
exports.handleInboundGmailPush = async (req, res) => {
  try {
    const messagePayload = req.body.message;
    if (!messagePayload || !messagePayload.data) {
      return res.sendStatus(400);
    }

    const decodedString = Buffer.from(messagePayload.data, 'base64').toString('utf-8');
    const pubSubData = JSON.parse(decodedString);

    const emailAddress = (pubSubData.emailAddress || '').toLowerCase();
    const historyId = pubSubData.historyId;

    const tenant = await User.findOne({ googleEmail: emailAddress });
    if (!tenant) {
      console.warn(`[Tenant Isolation Violation] Dropped Gmail push. No tenant matches inbox address: ${emailAddress}`);
      return res.sendStatus(200); // 200 so Pub/Sub clears the message and doesn't retry forever
    }

    console.log(`[Isolated Tenant: ${tenant._id}] Gmail history changed, historyId: ${historyId}`);
    await messageController.syncGmailHistory(tenant, historyId);

    res.sendStatus(200);
  } catch (error) {
    console.error('[Webhook Gmail Engine Error]:', error.message);
    res.sendStatus(500);
  }
};