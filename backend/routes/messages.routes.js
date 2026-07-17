'use strict';

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const User = require('../models/User');
const Message = require('../models/Message'); 
const protect = require('../middleware/auth');
const messageController = require('../controllers/messageController');
const { fetchMessageById, setupPubSubWatch } = require('../services/gmailService');

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

// ── Gmail Authentication Flows ────────────────────────────────────────────────
router.get('/gmail/auth', (req, res) => {
  const { tenantId } = req.query;
  if (!tenantId) return res.status(400).send('Missing required query param: tenantId');

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', 
    scope: scopes,
    prompt: 'consent',
    state: tenantId,
  });
  res.redirect(url);
});

router.get('/gmail/callback', async (req, res) => {
  const { code, state: tenantId } = req.query;
  if (!code || !tenantId) return res.status(400).send('Missing callback initialization data.');

  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const tenant = await User.findById(tenantId);
    if (!tenant) return res.status(404).send('<h1>❌ Error: Tenant profile mismatch.</h1>');

    tenant.googleAccessToken = tokens.access_token;
    if (tokens.refresh_token) tenant.googleRefreshToken = tokens.refresh_token;
    if (tokens.expiry_date) tenant.googleTokenExpiry = new Date(tokens.expiry_date);

    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    
    tenant.googleEmail = profile.data.emailAddress;
    // Set the baseline historyId immediately upon OAuth login
    tenant.lastGmailHistoryId = profile.data.historyId;

    await tenant.save();

    // Automatically establish the Gmail Pub/Sub watch subscription
    try {
      await setupPubSubWatch(tenant._id);
      console.log(`[Gmail Auth Callback] Successfully established Pub/Sub watch for tenant ${tenant._id}`);
    } catch (watchErr) {
      console.error(`[Gmail Auth Callback] Failed to automatically register Pub/Sub watch: ${watchErr.message}`);
    }

    // FIX: redirect back to the frontend settings page instead of dead-ending
    // on a static HTML string the user has to manually navigate away from.
    return res.redirect(`${FRONTEND_URL}/settings?gmail=connected`);
  } catch (error) {
    return res.redirect(`${FRONTEND_URL}/settings?gmail=error&message=${encodeURIComponent(error.message)}`);
  }
});

// ── Background Ingestion Handlers ─────────────────────────────────────────────
router.post('/gmail/fetch', protect, async (req, res) => {
  const { messageId } = req.body;
  if (!messageId) return res.status(400).json({ success: false, error: 'Missing parameter: messageId' });

  try {
    const emailData = await fetchMessageById(req.user.id, messageId);
    return res.status(200).json({ success: true, data: emailData });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/gmail/watch-renew', protect, async (req, res) => {
  try {
    const watchConfirmation = await setupPubSubWatch(req.user.id);
    return res.status(200).json({ success: true, message: 'Pub/Sub loop renewed.', data: watchConfirmation });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ── Inbox Pipeline Feed & Metrics ──────────────────────────────
router.get('/messages', protect, messageController.getMessages);

// FIX: scoped to the authenticated tenant only — was previously a global
// count across every tenant in the database.
router.get('/messages/metrics/today', protect, async (req, res) => {
  try {
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

    const classificationCount = await Message.countDocuments({
      tenantId: req.user.id,
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });
    return res.status(200).json({ success: true, classifiedToday: classificationCount });
  } catch (err) {
    return res.status(500).json({ success: false, classifiedToday: 0, error: err.message });
  }
});

// ── Secure Dynamic Reply Pipeline (Per-Tenant) ──
router.post('/messages/reply', protect, async (req, res) => {
  try {
    const { recipientEmail, subject, replyText, threadId } = req.body;

    // FIX: derive the tenant strictly from the authenticated request.
    // The previous $or with a hardcoded dev-email fallback meant ANY user
    // whose req.user.email lookup failed to match would silently fall
    // through and send/log the reply under that hardcoded account instead
    // of their own — a cross-tenant leak. Removed entirely.
    const currentUser = await User.findById(req.user.id)
      .select('+googleAccessToken +googleRefreshToken');

    if (!currentUser || !currentUser.googleAccessToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Your Gmail account is not connected. Please navigate to Settings and link your Google account first.' 
      });
    }

    if (!recipientEmail || !replyText) {
      return res.status(400).json({ success: false, message: 'Missing recipient email or reply message payload.' });
    }

    // 2. Initialize the OAuth engine using the current user's database tokens
    const userAuth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    userAuth.setCredentials({
      access_token: currentUser.googleAccessToken,
      refresh_token: currentUser.googleRefreshToken,
      expiry_date: currentUser.googleTokenExpiry ? currentUser.googleTokenExpiry.getTime() : null
    });

    // Automatically handle background token refreshes if they expire
    userAuth.on('tokens', async (newTokens) => {
      if (newTokens.access_token) {
        currentUser.googleAccessToken = newTokens.access_token;
        if (newTokens.expiry_date) currentUser.googleTokenExpiry = new Date(newTokens.expiry_date);
        await currentUser.save();
        console.log(`[OAuth Engine] Auto-rotated expired access tokens for tenant: ${currentUser._id}`);
      }
    });

    const gmail = google.gmail({ version: 'v1', auth: userAuth });
    const dynamicSender = currentUser.googleEmail || 'me';

    // 3. Construct the RFC 2822 payload structure
    const emailLines = [
      `From: ${dynamicSender}`,
      `To: ${recipientEmail}`,
      `Subject: ${subject || 'Re: Support Core Ticket Sync'}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0'
    ];

    if (threadId) {
      emailLines.push(`In-Reply-To: ${threadId}`);
      emailLines.push(`References: ${threadId}`);
    }
    emailLines.push('', replyText);
    const rawMessage = emailLines.join('\r\n');

    const encodedRaw = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 4. Dispatch email via official Google Client API
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedRaw, threadId: threadId || undefined }
    });

    // 5. Update state changes locally inside the database
    // FIX: scoped to this tenant only — previously matched on
    // { sender: recipientEmail, platform, status } with no tenantId,
    // meaning it could resolve a DIFFERENT tenant's pending message
    // from the same counterpart address.
    await Message.updateMany(
      { tenantId: currentUser._id, sender: recipientEmail, platform: 'gmail', status: 'pending' },
      { $set: { status: 'resolved' } }
    );

    const documentLog = await Message.create({
      tenantId: currentUser._id, // Tracks ownership securely
      sender: dynamicSender, 
      recipient: recipientEmail,
      subject: subject || 'No Subject',
      body: replyText,
      text: replyText,
      platform: 'gmail',
      direction: 'outbound',
      status: 'resolved',
      timestamp: new Date()
    });

    return res.status(200).json({ 
      success: true, 
      message: `Email response dispatched cleanly via registered account: ${dynamicSender}`, 
      data: documentLog 
    });
  } catch (err) {
    console.error('[Outbound Pipeline Error Details]:', err);
    return res.status(500).json({ success: false, message: 'Critical pipeline reply execution fault.', error: err.message });
  }
});

// GET /api/auth/me — retrieves the current user profile (with googleEmail) from DB
router.get('/auth/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+googleEmail');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

module.exports = router;