'use strict';

const path = require('path');
const fs   = require('fs');

const Invoice            = require('../models/Invoice');
const User               = require('../models/User');
const { generateInvoicePdf } = require('../services/invoiceGenerator');
const { embedText }      = require('../services/embedder');
const { indexInvoice, deleteInvoice } = require('../services/vectorStore');

// ── POST /api/invoices/confirm ─────────────────────────────────────────────
// Saves the draft invoice from chat, generates PDF, indexes in vector store

const confirmInvoice = async (req, res) => {
  try {
    const { draftData } = req.body;
    if (!draftData) {
      return res.status(400).json({ success: false, message: 'Invoice draft data is required.' });
    }

    const invoiceNumber = await Invoice.nextNumber(req.user.id);

    const invoice = await Invoice.create({
      userId:   req.user.id,
      invoiceNumber,
      status:   'sent',
      ...draftData,
    });

    // Generate PDF
    const pdfPath = await generateInvoicePdf(invoice);
    invoice.pdfPath = pdfPath;
    await invoice.save();

    // Index in vector store
    const text = buildInvoiceText(invoice);
    const vec  = await embedText(text);
    await indexInvoice(invoice, vec);

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully.',
      invoice: formatInvoice(invoice),
      pdfUrl:  `/invoices/${invoice._id}/pdf`,
    });
  } catch (err) {
    console.error('[InvoiceController/confirm]', err);
    return res.status(500).json({ success: false, message: 'Failed to create invoice.' });
  }
};

// ── GET /api/invoices ──────────────────────────────────────────────────────

const listInvoices = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user.id };
    if (status) filter.status = status;

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      invoices: invoices.map(formatInvoice),
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[InvoiceController/list]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch invoices.' });
  }
};

// ── GET /api/invoices/:id ──────────────────────────────────────────────────

const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    return res.json({ success: true, invoice: formatInvoice(invoice) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch invoice.' });
  }
};

// ── GET /api/invoices/:id/pdf ──────────────────────────────────────────────

const downloadPdf = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    // Regenerate if file missing
    if (!invoice.pdfPath || !fs.existsSync(invoice.pdfPath)) {
      invoice.pdfPath = await generateInvoicePdf(invoice);
      await invoice.save();
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    fs.createReadStream(invoice.pdfPath).pipe(res);
  } catch (err) {
    console.error('[InvoiceController/pdf]', err);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF.' });
  }
};

// ── PATCH /api/invoices/:id/status ────────────────────────────────────────

const updateStatus = async (req, res) => {
  try {
    const { status, amountPaid } = req.body;
    const valid = ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    invoice.status = status;
    if (status === 'paid') {
      invoice.amountPaid = invoice.grandTotal;
      invoice.amountDue  = 0;
      invoice.paidAt     = new Date();
    } else if (status === 'partially_paid' && amountPaid !== undefined) {
      invoice.amountPaid = amountPaid;
      invoice.amountDue  = invoice.grandTotal - amountPaid;
    }

    await invoice.save();

    // Re-index with updated status
    const vec = await embedText(buildInvoiceText(invoice));
    await indexInvoice(invoice, vec);

    return res.json({ success: true, invoice: formatInvoice(invoice) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update invoice.' });
  }
};

// ── POST /api/invoices/from-scan ──────────────────────────────────────────
// Save a scanned invoice (from OCR result confirmed by user)

const saveScannedInvoice = async (req, res) => {
  try {
    const { structured, rawText } = req.body;
    if (!structured) return res.status(400).json({ success: false, message: 'Structured data required.' });

    const user = await User.findById(req.user.id);
    const invoiceNumber = await Invoice.nextNumber(req.user.id);

    const lineItems = (structured.lineItems || []).map(item => ({
      description: item.description || 'Item',
      hsnCode:     item.hsnCode || '',
      quantity:    item.quantity || 1,
      rate:        item.rate || 0,
      cgstRate:    0,
      sgstRate:    0,
      igstRate:    0,
      cgstAmount:  0,
      sgstAmount:  0,
      igstAmount:  0,
      total:       item.amount || 0,
    }));

    const invoice = await Invoice.create({
      userId: req.user.id,
      invoiceNumber,
      status: 'sent',
      scannedFrom: true,
      rawOcrText: rawText,
      billFrom: {
        companyName: user.companyName,
        ownerName:   user.ownerName,
        gstin:       user.gstin,
      },
      billTo: {
        name:  structured.vendorName,
        gstin: structured.vendorGstin,
        address: structured.vendorAddress,
      },
      lineItems,
      subtotal:   structured.subtotal || 0,
      totalGST:   structured.totalGST || 0,
      grandTotal: structured.grandTotal || 0,
      amountDue:  structured.grandTotal || 0,
      currency:   'INR',
    });

    const vec = await embedText(buildInvoiceText(invoice));
    await indexInvoice(invoice, vec);

    return res.status(201).json({
      success: true,
      message: 'Scanned invoice saved.',
      invoice: formatInvoice(invoice),
    });
  } catch (err) {
    console.error('[InvoiceController/scan]', err);
    return res.status(500).json({ success: false, message: 'Failed to save scanned invoice.' });
  }
};

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
  ].join(' | ');
}

function formatInvoice(inv) {
  return {
    id:            inv._id,
    invoiceNumber: inv.invoiceNumber,
    status:        inv.status,
    billTo:        inv.billTo,
    billFrom:      inv.billFrom,
    lineItems:     inv.lineItems,
    subtotal:      inv.subtotal,
    totalGST:      inv.totalGST,
    grandTotal:    inv.grandTotal,
    amountPaid:    inv.amountPaid,
    amountDue:     inv.amountDue,
    currency:      inv.currency,
    paymentTerms:  inv.paymentTerms,
    dueDate:       inv.dueDate,
    paidAt:        inv.paidAt,
    scannedFrom:   inv.scannedFrom,
    notes:         inv.notes,
    pdfUrl:        `/invoices/${inv._id}/pdf`,
    createdAt:     inv.createdAt,
    updatedAt:     inv.updatedAt,
  };
}

module.exports = {
  confirmInvoice,
  listInvoices,
  getInvoice,
  downloadPdf,
  updateStatus,
  saveScannedInvoice,
};
