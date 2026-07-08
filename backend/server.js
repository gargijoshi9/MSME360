'use strict';
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const connectDB  = require('./config/db');
const authRoutes = require('./routes/auth.routes');

// ── Connect to MongoDB (fails fast if MONGO_URI is missing) ─────────────────
connectDB();

const app = express();

// ── Global middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Auth routes (Phase 1) ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Future routes — NOT mounted yet; see individual route files for Phase 2+ ─
// app.use('/api/settings',  require('./routes/settings.routes'));
// app.use('/api/webhooks',  require('./routes/webhook.routes'));
// app.use('/api/messages',  require('./routes/messages.routes'));
// app.use('/api/unmatched', require('./routes/unmatched.routes'));
// app.use('/api/subsidies', require('./routes/subsidy.routes'));

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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`[Server] Running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
);
