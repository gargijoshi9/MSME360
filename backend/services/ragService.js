'use strict';

/**
 * RAG (Retrieval-Augmented Generation) pipeline.
 *
 * Flow:
 *   1. Embed user query (local @xenova model)
 *   2. Parallel semantic search in:
 *        a. User's invoice collection (tenant-scoped)
 *        b. MSME knowledge base (shared)
 *   3. Re-rank and deduplicate results
 *   4. Build a context string for Gemini
 *   5. Call Gemini with context + history → get response
 */

const { embedText }       = require('./embedder');
const { searchInvoices, searchKnowledge } = require('./vectorStore');
const { chat }            = require('./geminiService');

/**
 * Run the full RAG pipeline for a user query.
 *
 * @param {string} userId        - MongoDB user ID for tenant isolation
 * @param {string} message       - User's message
 * @param {string} intent        - Classified intent (from intentRouter)
 * @param {object} businessCtx   - { companyName, ownerName, city, gstin, businessType }
 * @param {Array}  chatHistory   - Previous turns [{ role, parts: [{ text }] }]
 * @returns {Promise<{ response: string, sources: Array }>}
 */
async function runRag(userId, message, intent, businessCtx = {}, chatHistory = []) {
  try {
    // 1. Embed the query
    const queryVec = await embedText(message);

    // 2. Decide which collections to search based on intent
    const [invoiceHits, knowledgeHits] = await Promise.all([
      shouldSearchInvoices(intent)
        ? searchInvoices(userId, queryVec, 5)
        : Promise.resolve([]),
      shouldSearchKnowledge(intent)
        ? searchKnowledge(queryVec, 4)
        : Promise.resolve([]),
    ]);

    // 3. Build context block
    const context = buildContext(invoiceHits, knowledgeHits);

    // 4. Generate response
    const response = await chat(message, context, businessCtx, chatHistory);

    return {
      response,
      sources: [...invoiceHits, ...knowledgeHits].map(h => ({
        type:  h.metadata?.invoiceId ? 'invoice' : 'knowledge',
        score: h.score,
        meta:  h.metadata,
      })),
    };
  } catch (err) {
    console.error('[RAG] Pipeline error:', err.message);
    // Fallback: answer without context
    const response = await chat(
      message,
      '',
      businessCtx,
      chatHistory
    ).catch(() => 'I encountered an issue processing your request. Please try again.');

    return { response, sources: [] };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function shouldSearchInvoices(intent) {
  return ['invoice_query', 'finance_summary', 'create_invoice'].includes(intent);
}

function shouldSearchKnowledge(intent) {
  return ['business_advice', 'general_chat'].includes(intent);
}

function buildContext(invoiceHits, knowledgeHits) {
  const parts = [];

  if (invoiceHits.length > 0) {
    parts.push('=== RELEVANT INVOICES ===');
    invoiceHits.forEach((h, i) => {
      parts.push(`[Invoice ${i + 1}] ${h.document}`);
    });
  }

  if (knowledgeHits.length > 0) {
    parts.push('\n=== BUSINESS KNOWLEDGE ===');
    knowledgeHits.forEach((h, i) => {
      parts.push(`[Knowledge ${i + 1}] (${h.metadata?.category || 'general'}) ${h.document}`);
    });
  }

  return parts.join('\n');
}

module.exports = { runRag };
