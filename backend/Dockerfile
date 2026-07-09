FROM node:20-slim

# ── System dependencies for tesseract.js (OCR) + sharp (image preprocessing) ─
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-hin \
    libvips-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install Node dependencies first (cache layer) ─────────────────────────────
COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev

# ── Copy source ───────────────────────────────────────────────────────────────
COPY . .

# ── Create volume mount points ────────────────────────────────────────────────
RUN mkdir -p .cache uploads

EXPOSE 5001

# ── Pre-warm: download embedding model at BUILD time ─────────────────────────
# Bakes model into Docker layer → zero cold start, works fully offline at runtime
RUN node -e "\
const { pipeline } = require('@xenova/transformers');\
process.env.TRANSFORMERS_CACHE = '/app/.cache';\
pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { cache_dir: '/app/.cache' })\
  .then(() => { console.log('[Docker] Embedding model pre-warmed OK'); process.exit(0); })\
  .catch(e => { console.warn('[Docker] Pre-warm skipped (will download on first request):', e.message); process.exit(0); });\
" || true

CMD ["node", "server.js"]
