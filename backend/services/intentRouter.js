'use strict';

/**
 * Intent Router — classifies user messages into action categories
 * so the chat controller knows which tool to invoke.
 *
 * Uses Gemini JSON mode for reliable structured output.
 * Falls back to 'general_chat' if classification fails.
 */

const { extractJson } = require('./geminiService');

const INTENTS = {
  CREATE_INVOICE:  'create_invoice',
  INVOICE_QUERY:   'invoice_query',
  FINANCE_SUMMARY: 'finance_summary',
  BUSINESS_ADVICE: 'business_advice',
  OCR_SCAN:        'ocr_scan',
  GENERAL_CHAT:    'general_chat',
};

const PROMPT = `You are a message intent classifier for an Indian MSME business management app.

Classify the user's message into exactly ONE of these intents:

- create_invoice: User wants to create, make, generate, or draft an invoice or bill
- invoice_query: User asks about a specific past invoice, wants to find or search an invoice
- finance_summary: User asks about financial summaries — total sales, pending payments, GST due, cash flow, earnings
- business_advice: User asks for business advice, tips, government schemes, loans, compliance, legal info
- ocr_scan: User mentions uploading, scanning, or attaching a document/image/bill
- general_chat: Everything else — greetings, unclear messages, unrelated questions

User message: "{MESSAGE}"

Respond with JSON: { "intent": "<one of the above>", "confidence": <0-1>, "extracted": {} }

For create_invoice, extract what you can into "extracted":
  { "clientName": "", "items": [{ "description": "", "qty": 0, "rate": 0 }], "gstRate": 18, "dueDate": "" }

For invoice_query, extract:
  { "query": "<what they're looking for>", "clientName": "", "dateHint": "" }

For finance_summary, extract:
  { "period": "month|quarter|year|all", "metric": "gst|pending|paid|revenue|all" }`;

/**
 * Classify a user message into an intent.
 * @param {string} message
 * @param {boolean} hasAttachment - true if user uploaded a file
 * @returns {Promise<{ intent: string, confidence: number, extracted: object }>}
 */
async function classifyIntent(message, hasAttachment = false) {
  // File attachment always means OCR
  if (hasAttachment) {
    return { intent: INTENTS.OCR_SCAN, confidence: 1.0, extracted: {} };
  }

  try {
    const filled = PROMPT.replace('{MESSAGE}', message);
    const result = await extractJson(filled);

    if (result && INTENTS[result.intent?.toUpperCase().replace('-', '_')]) {
      return result;
    }

    // Validate the intent value directly
    const validIntents = Object.values(INTENTS);
    if (result?.intent && validIntents.includes(result.intent)) {
      return result;
    }

    return { intent: INTENTS.GENERAL_CHAT, confidence: 0.5, extracted: {} };
  } catch (err) {
    console.error('[IntentRouter] Classification failed, falling back to general_chat:', err.message);
    return { intent: INTENTS.GENERAL_CHAT, confidence: 0.3, extracted: {} };
  }
}

module.exports = { classifyIntent, INTENTS };
