'use strict';
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
const connectDB  = require('./config/db');

// ── Routes ───────────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/auth.routes');
const chatRoutes    = require('./routes/chat.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const financeRoutes = require('./routes/finance.routes');

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Global middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '2.0' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/chat',     chatRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/finances', financeRoutes);

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

  // Boot ChromaDB knowledge base (non-blocking)
  bootKnowledgeBase().catch(err =>
    console.warn('[Boot] Knowledge base indexing failed (non-fatal):', err.message)
  );
});

// ── Knowledge base boot ───────────────────────────────────────────────────────

async function bootKnowledgeBase() {
  const kbPath = path.join(__dirname, 'data', 'msme_knowledge_base.json');
  if (!fs.existsSync(kbPath)) {
    console.warn('[Boot] Knowledge base file not found, skipping.');
    return;
  }

  const { ping, indexKnowledgeBase } = require('./services/vectorStore');
  const { embedBatch } = require('./services/embedder');

  // Keep retrying in the background until ChromaDB is reachable
  // (handles slow cold starts — no timeout)
  console.log('[Boot] Waiting for ChromaDB to be ready...');
  let attempts = 0;
  while (true) {
    const ready = await ping();
    if (ready) break;
    attempts++;
    if (attempts === 1 || attempts % 10 === 0) {
      console.log(`[Boot] ChromaDB not ready yet (attempt ${attempts}), retrying in 5s...`);
    }
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log('[Boot] ChromaDB connected! Indexing MSME knowledge base...');
  const entries    = JSON.parse(fs.readFileSync(kbPath, 'utf-8'));
  const texts      = entries.map(e => e.text);
  const embeddings = await embedBatch(texts);
  await indexKnowledgeBase(entries, embeddings);
  console.log(`[Boot] ✅ Knowledge base ready — ${entries.length} entries indexed in ChromaDB.`);
}
