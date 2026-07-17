'use strict';
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
const connectDB  = require('./config/db');

// ── Workers ──────────────────────────────────────────────────────────────────
const { startGmailPullListener } = require('./workers/gmailWorkers');

// ── Routes ───────────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/auth.routes');
const chatRoutes    = require('./routes/chat.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const financeRoutes = require('./routes/finance.routes');
const webhookRoutes = require('./routes/webhook.routes');
const messagesRoutes = require('./routes/messages.routes');

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Global middleware ────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Bypass Localtunnel Reminder Page for Meta ─────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('bypass-tunnel-reminder', 'true');
  next();
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '2.0' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/chat',     chatRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api',          webhookRoutes);
app.use('/api',          messagesRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found.' })
);

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  console.log(`[Server] Running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);

  // Start checking Pub/Sub subscription for new email alerts (completely non-blocking)
  try {
    startGmailPullListener();
  } catch (err) {
    console.error('[Boot] Gmail execution listener failed to bind:', err.message);
  }

  // Boot ChromaDB knowledge base (non-blocking)
  bootKnowledgeBase().catch(err =>
    console.warn('[Boot] Knowledge base indexing failed (non-fatal):', err.message)
  );
});

// ── Knowledge base boot (INFINITE RETRY, COMPLETELY NON-BLOCKING) ─────────────────

async function bootKnowledgeBase() {
  const kbPath = path.join(__dirname, 'data', 'msme_knowledge_base.json');
  if (!fs.existsSync(kbPath)) {
    console.warn('[Boot] Knowledge base file not found, skipping.');
    return;
  }

  const { ping, indexKnowledgeBase } = require('./services/vectorStore');
  const { embedBatch } = require('./services/embedder');

  console.log('[Boot] Initializing background listener loop for ChromaDB...');
  let attempts = 0;

  // We define an internal execution frame to keep the loop isolated
  async function checkConnection() {
    try {
      const ready = await ping();
      
      if (ready) {
        console.log('[Boot] ChromaDB connected! Indexing MSME knowledge base...');
        const entries    = JSON.parse(fs.readFileSync(kbPath, 'utf-8'));
        const texts      = entries.map(e => e.text);
        const embeddings = await embedBatch(texts);
        await indexKnowledgeBase(entries, embeddings);
        console.log(`[Boot] ✅ Knowledge base ready — ${entries.length} entries indexed in ChromaDB.`);
        return; // Exits the tracking loop completely on success!
      }
    } catch (err) {
      // Catching system socket connection crashes so the server never goes down
      console.warn('[Boot] Vector store ping threw a network glitch, retrying...');
    }

    attempts++;
    if (attempts === 1 || attempts % 10 === 0) {
      console.log(`[Boot] ChromaDB not detected (attempt ${attempts}), checking again in 5s... [Dashboard Active]`);
    }

    // 👈 THE SECRET SAUCE: setTimeout pushes the next check out of the main thread
    // This allows the event loop to breathe and process your frontend requests immediately.
    setTimeout(checkConnection, 5000);
  }

  // Fire off the first check asynchronously
  checkConnection();
}