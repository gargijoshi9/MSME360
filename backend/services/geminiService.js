'use strict';

/**
 * Gemini 1.5 Flash wrapper.
 * Handles chat completions and JSON extraction for the RAG pipeline.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;

function getClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

const BUSINESS_SYSTEM_PROMPT = `You are MSME Saathi — an expert AI assistant embedded inside MSME360, a business management platform for Indian small and medium businesses (MSMEs).

You help business owners with:
1. Creating GST-compliant invoices via conversation
2. Searching and explaining past invoices
3. Answering finance questions (pending amounts, GST liability, cash flow)
4. Providing actionable, India-specific business advice
5. Explaining government schemes (MUDRA, CGTMSE, Udyam, PM Vishwakarma, etc.)

RULES:
- Always reply in simple, friendly language — many users are not tech-savvy
- Use ₹ (INR) for currency unless the user specifies otherwise
- For invoice creation, always confirm details before generating
- Never make up invoice numbers, amounts, or financial data — always use retrieved context
- If you don't have specific data, say so clearly and suggest what to check
- Support Hinglish naturally (mix of Hindi and English is fine)
- Keep responses concise but complete`;

// Available fallback models in priority order
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

/**
 * Executes a function with automatic retry (exponential backoff) and model failover.
 */
async function runWithRetryAndFailover(operation) {
  let lastError;
  
  for (const modelName of MODELS) {
    let delay = 1000; // start with 1s delay
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation(modelName);
      } catch (err) {
        lastError = err;
        const status = err.status || (err.message && err.message.match(/\b(503|429)\b/) ? parseInt(err.message.match(/\b(503|429)\b/)[0]) : null);
        
        // Only retry/failover on rate limits (429) or service unavailable (503)
        if (status === 503 || status === 429 || err.message.includes('503') || err.message.includes('429') || err.message.includes('high demand')) {
          if (attempt < maxRetries) {
            console.warn(`[Gemini SDK] ${modelName} returned temporary error (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            delay *= 2; // exponential backoff
            continue;
          }
          console.warn(`[Gemini SDK] ${modelName} failed after ${maxRetries + 1} attempts. Falling back to next model...`);
          break; // break the retry loop, move to next model in MODELS
        } else {
          // Break immediately on non-retryable errors (e.g. auth, validation)
          throw err;
        }
      }
    }
  }
  throw lastError;
}

/**
 * Send a chat message with retrieved RAG context and get a response.
 * @param {string} userMessage
 * @param {string} ragContext - Retrieved chunks from vector search
 * @param {object} businessContext - { companyName, ownerName, city, gstin, businessType }
 * @param {Array}  chatHistory  - [{ role: 'user'|'model', parts: [{ text }] }]
 * @returns {Promise<string>}
 */
async function chat(userMessage, ragContext = '', businessContext = {}, chatHistory = []) {
  return runWithRetryAndFailover(async (modelName) => {
    const model = getClient().getGenerativeModel({
      model: modelName,
      systemInstruction: buildSystemPrompt(businessContext),
      generationConfig: {
        temperature: 0.3,   // lower = more factual
        maxOutputTokens: 1024,
      },
    });
    
    const contextBlock = ragContext
      ? `\n\n--- RETRIEVED CONTEXT ---\n${ragContext}\n--- END CONTEXT ---\n`
      : '';

    const fullMessage = `${contextBlock}${userMessage}`;

    const chatSession = model.startChat({ history: chatHistory });
    const result = await chatSession.sendMessage(fullMessage);
    return result.response.text();
  });
}

/**
 * Extract structured JSON from an LLM call (used for intent routing and OCR parsing).
 * Returns parsed object or null on failure.
 */
async function extractJson(prompt, schema = '') {
  return runWithRetryAndFailover(async (modelName) => {
    const model = getClient().getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });

    const schemaHint = schema ? `\nOutput schema: ${schema}` : '';
    const result = await model.generateContent(`${prompt}${schemaHint}\n\nRespond with ONLY valid JSON.`);
    const text = result.response.text().trim();

    try {
      return JSON.parse(text);
    } catch {
      // Strip markdown code fences if present
      const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
      try { return JSON.parse(cleaned); } catch { return null; }
    }
  });
}

function buildSystemPrompt(ctx) {
  const lines = [BUSINESS_SYSTEM_PROMPT];
  if (ctx.companyName) lines.push(`\nCurrent business: ${ctx.companyName}`);
  if (ctx.ownerName)   lines.push(`Owner: ${ctx.ownerName}`);
  if (ctx.city)        lines.push(`City: ${ctx.city}`);
  if (ctx.businessType) lines.push(`Business type: ${ctx.businessType}`);
  if (ctx.gstin)       lines.push(`GSTIN: ${ctx.gstin} (GST registered)`);
  else                 lines.push('GST registration: Not provided');
  return lines.join('\n');
}

module.exports = { chat, extractJson };
