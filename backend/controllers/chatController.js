'use strict';

const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const User            = require('../models/User');
const Invoice         = require('../models/Invoice');
const { classifyIntent, INTENTS } = require('../services/intentRouter');
const { runRag }      = require('../services/ragService');
const { extractJson } = require('../services/geminiService');
const { scanInvoice } = require('../services/ocrService');
const { generateInvoicePdf } = require('../services/invoiceGenerator');
const { embedText, embedBatch } = require('../services/embedder');
const { indexInvoice } = require('../services/vectorStore');

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');

// ── Multer for file uploads ────────────────────────────────────────────────
const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp', '.pdf'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
}).single('file');

// ── POST /api/chat ─────────────────────────────────────────────────────────

const sendMessage = async (req, res) => {
  // Handle multipart (file upload) or JSON
  upload(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ success: false, message: uploadErr.message });
    }

    try {
      const message      = req.body.message || '';
      const historyRaw   = req.body.history  || '[]';
      const hasFile      = !!req.file;

      let chatHistory = [];
      try { chatHistory = JSON.parse(historyRaw); } catch {}

      if (!message && !hasFile) {
        return res.status(400).json({ success: false, message: 'Message or file is required.' });
      }

      // Load user's business context
      const user = await User.findById(req.user.id);
      if (!user) return res.status(401).json({ success: false, message: 'User not found.' });

      const businessCtx = {
        companyName:  user.companyName,
        ownerName:    user.ownerName,
        city:         user.city,
        gstin:        user.gstin,
        businessType: user.businessType,
        pan:          user.pan,
        upiId:        user.upiId,
      };

      // ── OCR: file uploaded ───────────────────────────────────────────
      if (hasFile) {
        const { rawText, structured } = await scanInvoice(req.file.path);
        // Cleanup uploaded file
        fs.unlink(req.file.path, () => {});

        return res.json({
          success:    true,
          type:       'ocr_result',
          rawText,
          structured,
          message:    'Invoice scanned successfully. Please review the extracted details.',
          suggestion: 'Would you like me to save this as a new invoice in your records?',
        });
      }

      // ── Classify intent ──────────────────────────────────────────────
      const { intent, extracted } = await classifyIntent(message, false);

      // ── Create Invoice via chat ──────────────────────────────────────
      if (intent === INTENTS.CREATE_INVOICE && extracted?.clientName) {
        return await handleInvoiceCreation(req, res, user, businessCtx, message, extracted);
      }

      // ── All other intents: RAG pipeline ──────────────────────────────
      const { response, sources } = await runRag(
        req.user.id,
        message,
        intent,
        businessCtx,
        chatHistory
      );

      return res.json({
        success: true,
        type:    'chat',
        intent,
        response,
        sources: sources.slice(0, 3),
      });

    } catch (err) {
      console.error('[ChatController] Error:', err);
      return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
  });
};

// ── Invoice creation from chat ─────────────────────────────────────────────

async function handleInvoiceCreation(req, res, user, businessCtx, message, extracted) {
  try {
    // Ask Gemini to build a full invoice structure from the extracted data
    const prompt = `
The user wants to create an invoice with these details:
${JSON.stringify(extracted, null, 2)}

User message: "${message}"

Business (seller) details:
- Company: ${businessCtx.companyName || 'N/A'}
- Owner: ${businessCtx.ownerName || 'N/A'}
- GSTIN: ${businessCtx.gstin || 'Not provided'}
- PAN: ${businessCtx.pan || 'Not provided'}
- Default GST rate: 18%

Build a complete invoice JSON:
{
  "clientName": "string",
  "clientGstin": "string or null",
  "clientAddress": "string or null",
  "clientEmail": "string or null",
  "clientPhone": "string or null",
  "lineItems": [{ "description": "string", "hsnCode": "string or null", "quantity": number, "unit": "pcs/hr/kg/etc", "rate": number, "gstRate": number }],
  "paymentTerms": "Net 30 or similar",
  "notes": "string or null",
  "upiId": "${user.upiId || ''}",
  "discount": number, // Flat discount in INR. Extract if specified in the user message/query (e.g. "give a discount of 500" or "10% discount". Calculate flat INR value).
  "extraCharges": number, // Flat extra charges in INR. Extract if specified (e.g., "add 200 extra charges").
  "exemptGst": boolean // true if the user query requests to omit/exempt GST (e.g. "exempt GST", "no GST", "without GST").
}

Compute gstRate from context. Default to 18% GST if not specified. If exemptGst is true, gstRate MUST be 0.`;

    const invoiceData = await extractJson(prompt);

    if (!invoiceData) {
      return res.json({
        success:  true,
        type:     'chat',
        intent:   INTENTS.CREATE_INVOICE,
        response: "I couldn't extract enough details to create the invoice. Could you please specify the client name, items, and amounts?",
      });
    }

    const isGstExempt = !!invoiceData.exemptGst;

    // Compute line item totals
    const lineItems = (invoiceData.lineItems || []).map(item => {
      const gstRate   = isGstExempt ? 0 : (item.gstRate || 18);
      const subtotal  = item.quantity * item.rate;
      const gstAmount = subtotal * gstRate / 100;
      const interState = false; // simplified; could detect from GSTINs

      return {
        description: item.description,
        hsnCode:     item.hsnCode || '',
        quantity:    item.quantity,
        unit:        item.unit || 'pcs',
        rate:        item.rate,
        cgstRate:    gstRate / 2,
        sgstRate:    gstRate / 2,
        igstRate:    0,
        cgstAmount:  gstAmount / 2,
        sgstAmount:  gstAmount / 2,
        igstAmount:  0,
        total:       subtotal + gstAmount,
      };
    });

    const subtotal   = lineItems.reduce((s, i) => s + i.quantity * i.rate, 0);
    const totalGST   = lineItems.reduce((s, i) => s + i.cgstAmount + i.sgstAmount, 0);
    const discount   = invoiceData.discount || 0;
    const extraCharges = invoiceData.extraCharges || 0;
    const grandTotal = Math.max(0, subtotal + totalGST - discount + extraCharges);
    const invoiceNumber = await Invoice.nextNumber(req.user.id);

    return res.json({
      success:       true,
      type:          'invoice_preview',
      intent:        INTENTS.CREATE_INVOICE,
      response:      `Here's the invoice draft for **${invoiceData.clientName}**. Please review and confirm to generate the PDF.`,
      invoicePreview: {
        invoiceNumber,
        clientName:   invoiceData.clientName,
        clientGstin:  invoiceData.clientGstin,
        lineItems,
        subtotal:     Math.round(subtotal * 100) / 100,
        totalGST:     Math.round(totalGST * 100) / 100,
        grandTotal:   Math.round(grandTotal * 100) / 100,
        discount:     Math.round(discount * 100) / 100,
        extraCharges: Math.round(extraCharges * 100) / 100,
        exemptGst:    isGstExempt,
        paymentTerms: invoiceData.paymentTerms || 'Net 30',
        upiId:        invoiceData.upiId,
        notes:        invoiceData.notes,
      },
      draftData: {
        userId:    req.user.id,
        billFrom: {
          companyName: user.companyName,
          ownerName:   user.ownerName,
          address:     user.address,
          gstin:       user.gstin,
          pan:         user.pan,
          phone:       user.phone,
        },
        billTo: {
          name:    invoiceData.clientName,
          gstin:   invoiceData.clientGstin,
          address: invoiceData.clientAddress,
          email:   invoiceData.clientEmail,
          phone:   invoiceData.clientPhone,
        },
        lineItems,
        subtotal:     Math.round(subtotal * 100) / 100,
        totalGST:     Math.round(totalGST * 100) / 100,
        grandTotal:   Math.round(grandTotal * 100) / 100,
        discount:     Math.round(discount * 100) / 100,
        extraCharges: Math.round(extraCharges * 100) / 100,
        exemptGst:    isGstExempt,
        amountDue:    Math.round(grandTotal * 100) / 100,
        paymentTerms: invoiceData.paymentTerms || 'Net 30',
        upiId:        invoiceData.upiId || user.upiId,
        notes:        invoiceData.notes,
        currency:     user.currency || 'INR',
      },
    });

  } catch (err) {
    console.error('[Chat/InvoiceCreation] Error:', err);
    return res.json({
      success:  true,
      type:     'chat',
      response: "I had trouble building the invoice. Could you try again with more details like client name, items, and amounts?",
    });
  }
}

module.exports = { sendMessage };
