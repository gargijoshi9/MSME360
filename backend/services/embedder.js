'use strict';

/**
 * Local embedding service using @xenova/transformers.
 * Model: Xenova/all-MiniLM-L6-v2 — 384-dimensional cosine-normalized vectors.
 * Runs entirely in Node.js — no API key, no external calls, zero cost.
 *
 * The model is cached to MODEL_CACHE_DIR (Docker volume on production,
 * local .cache/ folder on dev). First run downloads ~22MB; after that instant.
 */

const path = require('path');

// Lazy-loaded pipeline instance — initialized once, reused forever
let _pipeline = null;
let _loading  = false;
let _waiters  = [];

const CACHE_DIR  = process.env.MODEL_CACHE_DIR || path.join(__dirname, '..', '.cache');
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

/**
 * Returns the (cached) feature-extraction pipeline.
 * Thread-safe: concurrent callers wait for the first load to finish.
 */
async function getPipeline() {
  if (_pipeline) return _pipeline;

  // If already loading, queue up and wait
  if (_loading) {
    return new Promise((resolve, reject) => {
      _waiters.push({ resolve, reject });
    });
  }

  _loading = true;
  console.log(`[Embedder] Loading model ${MODEL_NAME} from ${CACHE_DIR}...`);

  try {
    // Dynamic import — @xenova/transformers is ESM
    const { pipeline, env } = await import('@xenova/transformers');
    env.cacheDir = CACHE_DIR;

    _pipeline = await pipeline('feature-extraction', MODEL_NAME, {
      cache_dir: CACHE_DIR,
      quantized: true,   // use quantized ONNX for smaller footprint
    });

    console.log('[Embedder] Model loaded and ready.');
    _waiters.forEach(w => w.resolve(_pipeline));
    return _pipeline;
  } catch (err) {
    _loading = false;
    _waiters.forEach(w => w.reject(err));
    _waiters = [];
    throw err;
  }
}

/**
 * Embed a single string.
 * @param {string} text
 * @returns {Promise<number[]>} 384-dimensional vector
 */
async function embedText(text) {
  const pipe = await getPipeline();
  const output = await pipe(text.trim().slice(0, 512), {
    pooling: 'mean',
    normalize: true,
  });
  return Array.from(output.data);
}

/**
 * Embed multiple strings in batch.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
async function embedBatch(texts) {
  return Promise.all(texts.map(embedText));
}

module.exports = { embedText, embedBatch };
