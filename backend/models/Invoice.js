'use strict';

const mongoose = require('mongoose');

// ── Line Item sub-schema ───────────────────────────────────────────────────
const LineItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  hsnCode:     { type: String, trim: true },          // HSN for goods, SAC for services
  quantity:    { type: Number, required: true, min: 0 },
  unit:        { type: String, trim: true, default: 'pcs' },
  rate:        { type: Number, required: true, min: 0 },  // per unit, ex-GST

  // GST breakdown (auto-computed)
  cgstRate:    { type: Number, default: 0 },
  sgstRate:    { type: Number, default: 0 },
  igstRate:    { type: Number, default: 0 },
  cgstAmount:  { type: Number, default: 0 },
  sgstAmount:  { type: Number, default: 0 },
  igstAmount:  { type: Number, default: 0 },
  total:       { type: Number, required: true },       // inclusive of GST
}, { _id: false });

// ── Party sub-schema (Bill From / Bill To) ─────────────────────────────────
const PartySchema = new mongoose.Schema({
  name:    { type: String, trim: true },
  email:   { type: String, trim: true, lowercase: true },
  phone:   { type: String, trim: true },
  address: { type: String, trim: true },
  gstin:   { type: String, trim: true, uppercase: true },
  pan:     { type: String, trim: true, uppercase: true },
  // For billFrom — auto-filled from User profile
  companyName: { type: String, trim: true },
  ownerName:   { type: String, trim: true },
}, { _id: false });

// ── Invoice schema ─────────────────────────────────────────────────────────
const InvoiceSchema = new mongoose.Schema({
  // Tenant isolation
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  },

  // Invoice identity — per-tenant yearly: INV-2024-0001
  invoiceNumber: {
    type:     String,
    required: true,
    trim:     true,
    index:    true,
  },

  status: {
    type:    String,
    enum:    ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'],
    default: 'draft',
    index:   true,
  },

  // Parties
  billFrom: PartySchema,   // seller (auto-filled from user profile)
  billTo:   PartySchema,   // buyer (entered by user)

  // Line items
  lineItems: [LineItemSchema],

  // Totals (in INR by default)
  subtotal:    { type: Number, default: 0 },   // ex-GST total
  totalGST:    { type: Number, default: 0 },   // CGST + SGST or IGST
  grandTotal:  { type: Number, default: 0 },   // subtotal + totalGST
  currency:    { type: String, default: 'INR', trim: true },

  // Payment tracking
  amountPaid:    { type: Number, default: 0 },
  amountDue:     { type: Number, default: 0 },  // grandTotal - amountPaid
  paidAt:        { type: Date },
  paymentMethod: { type: String, trim: true },  // UPI, Bank Transfer, Cash, etc.
  paymentTerms:  { type: String, trim: true },  // 'Net 30', 'Due on Receipt' etc.
  dueDate:       { type: Date },

  // UPI / Bank details (for QR code)
  upiId:        { type: String, trim: true },
  bankDetails:  {
    accountNo: String,
    ifsc:      String,
    bankName:  String,
  },

  // PDF
  pdfPath: { type: String },   // absolute path on server

  // OCR source
  scannedFrom:  { type: Boolean, default: false },
  rawOcrText:   { type: String },

  // Vector store reference
  vectorId: { type: String },

  // Notes
  notes: { type: String, trim: true },

}, { timestamps: true });

// ── Compound index for tenant isolation + listing ──────────────────────────
InvoiceSchema.index({ userId: 1, createdAt: -1 });
InvoiceSchema.index({ userId: 1, status: 1 });

// ── Static: generate next invoice number for this user (yearly) ────────────
InvoiceSchema.statics.nextNumber = async function (userId) {
  const year  = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const last = await this.findOne(
    { userId, invoiceNumber: new RegExp(`^${prefix}`) },
    { invoiceNumber: 1 },
    { sort: { createdAt: -1 } }
  );

  let seq = 1;
  if (last) {
    const parts = last.invoiceNumber.split('-');
    seq = (parseInt(parts[parts.length - 1], 10) || 0) + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
};

module.exports = mongoose.model('Invoice', InvoiceSchema);
