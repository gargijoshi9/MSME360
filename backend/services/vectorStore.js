'use strict';

/**
 * ChromaDB vector store client.
 *
 * Two collections per tenant:
 *   msme_invoices  — invoice documents indexed for semantic search
 *   msme_knowledge — MSME business knowledge base (shared, read-only)
 *
 * Uses the official `chromadb` npm client pointing to the ChromaDB
 * Docker container at CHROMA_URL (default: http://localhost:8000).
 */

const { ChromaClient } = require('chromadb');

const CHROMA_URL         = process.env.CHROMA_URL || 'http://localhost:8000';
const INVOICE_COLLECTION = 'msme_invoices';
const KNOWLEDGE_COLLECTION = 'msme_knowledge';

const SIMILARITY_THRESHOLD = 0.45; // minimum cosine similarity to include a result

let _client = null;

function getClient() {
  if (!_client) {
    _client = new ChromaClient({ path: CHROMA_URL });
  }
  return _client;
}

// ── Collection getters (create if not exists) ──────────────────────────────

async function getInvoiceCollection() {
  return getClient().getOrCreateCollection({
    name: INVOICE_COLLECTION,
    metadata: { 'hnsw:space': 'cosine' },
  });
}

async function getKnowledgeCollection() {
  return getClient().getOrCreateCollection({
    name: KNOWLEDGE_COLLECTION,
    metadata: { 'hnsw:space': 'cosine' },
  });
}

// ── Invoice indexing ───────────────────────────────────────────────────────

/**
 * Index an invoice document into ChromaDB.
 * @param {object} invoice - Mongoose Invoice document
 * @param {number[]} embedding - 384-dim vector from embedder
 */
async function indexInvoice(invoice, embedding) {
  const col = await getInvoiceCollection();

  const docText = buildInvoiceText(invoice);
  const vectorId = `inv_${invoice._id}`;

  await col.upsert({
    ids:        [vectorId],
    embeddings: [embedding],
    documents:  [docText],
    metadatas:  [{
      invoiceId:     invoice._id.toString(),
      userId:        invoice.userId.toString(),
      invoiceNumber: invoice.invoiceNumber,
      clientName:    invoice.billTo?.name || '',
      status:        invoice.status,
      grandTotal:    invoice.grandTotal,
      createdAt:     invoice.createdAt?.toISOString() || new Date().toISOString(),
    }],
  });
}

/**
 * Search invoices by semantic similarity for a specific user.
 * @param {string} userId
 * @param {number[]} queryEmbedding
 * @param {number} topK
 * @returns {Promise<Array>} matched invoice metadata + documents
 */
async function searchInvoices(userId, queryEmbedding, topK = 5) {
  const col = await getInvoiceCollection();

  const results = await col.query({
    queryEmbeddings: [queryEmbedding],
    nResults:        topK,
    where:           { userId: userId },   // tenant isolation
    include:         ['documents', 'metadatas', 'distances'],
  });

  return formatResults(results, SIMILARITY_THRESHOLD);
}

/**
 * Delete an invoice from the vector store (e.g., on deletion).
 */
async function deleteInvoice(invoiceId) {
  const col = await getInvoiceCollection();
  await col.delete({ ids: [`inv_${invoiceId}`] });
}

// ── Knowledge base indexing ────────────────────────────────────────────────

/**
 * Bulk-load the MSME knowledge base on server startup.
 * Idempotent: re-indexing the same IDs just overwrites with same data.
 * @param {Array<{id, text, category}>} entries
 * @param {number[][]} embeddings
 */
async function indexKnowledgeBase(entries, embeddings) {
  const col = await getKnowledgeCollection();

  const ids        = entries.map(e => `kb_${e.id}`);
  const documents  = entries.map(e => e.text);
  const metadatas  = entries.map(e => ({ category: e.category, id: e.id }));

  await col.upsert({ ids, embeddings, documents, metadatas });
  console.log(`[VectorStore] Knowledge base: ${entries.length} entries indexed.`);
}

/**
 * Search the knowledge base.
 */
async function searchKnowledge(queryEmbedding, topK = 4) {
  const col = await getKnowledgeCollection();

  const results = await col.query({
    queryEmbeddings: [queryEmbedding],
    nResults:        topK,
    include:         ['documents', 'metadatas', 'distances'],
  });

  return formatResults(results, SIMILARITY_THRESHOLD);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildInvoiceText(inv) {
  const items = (inv.lineItems || [])
    .map(i => `${i.description} (Qty: ${i.quantity} × ₹${i.rate})`)
    .join(', ');

  return [
    `Invoice ${inv.invoiceNumber}`,
    `Client: ${inv.billTo?.name || 'N/A'}`,
    `Date: ${inv.createdAt?.toDateString() || 'N/A'}`,
    `Status: ${inv.status}`,
    `Amount: ₹${inv.grandTotal}`,
    `Items: ${items}`,
    inv.billTo?.address ? `Address: ${inv.billTo.address}` : '',
  ].filter(Boolean).join(' | ');
}

function formatResults(results, threshold) {
  if (!results?.ids?.[0]?.length) return [];

  return results.ids[0]
    .map((id, i) => ({
      id,
      document: results.documents[0][i],
      metadata: results.metadatas[0][i],
      score:    1 - (results.distances[0][i] || 0), // cosine → similarity
    }))
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score);
}

// ── Health check ───────────────────────────────────────────────────────────

async function ping() {
  try {
    await getClient().heartbeat();
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  indexInvoice,
  searchInvoices,
  deleteInvoice,
  indexKnowledgeBase,
  searchKnowledge,
  ping,
};
