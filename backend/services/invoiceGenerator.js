'use strict';

/**
 * GST-compliant PDF invoice generator.
 * Uses pdfkit for layout and qrcode for UPI payment QR.
 *
 * Invoice layout:
 *  - Header: TAX INVOICE + Invoice # + Date
 *  - Bill From / Bill To (two columns)
 *  - Line items table with HSN, Qty, Rate, GST%, Amount
 *  - Totals: Subtotal, CGST/SGST (or IGST), Grand Total
 *  - Amount in words
 *  - Payment info + UPI QR code
 *  - Text signature footer: Name, Designation, Company
 */

const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const path        = require('path');
const fs          = require('fs');

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
const BRAND_COLOR = '#1F5A92';     // primary blue from MSME360 design system

// ── GST State code mapping (first 2 digits of GSTIN) ──────────────────────
const GSTIN_STATE_CODES = {
  '01': 'JK', '02': 'HP', '03': 'PB', '04': 'CH', '05': 'UT', '06': 'HR',
  '07': 'DL', '08': 'RJ', '09': 'UP', '10': 'BR', '11': 'SK', '12': 'AR',
  '13': 'NL', '14': 'MN', '15': 'MZ', '16': 'TR', '17': 'ML', '18': 'AS',
  '19': 'WB', '20': 'JH', '21': 'OD', '22': 'CG', '23': 'MP', '24': 'GJ',
  '25': 'DD', '26': 'DN', '27': 'MH', '28': 'AP', '29': 'KA', '30': 'GA',
  '31': 'LD', '32': 'KL', '33': 'TN', '34': 'PY', '35': 'AN', '36': 'TG',
};

function getStateCode(gstin) {
  return gstin ? GSTIN_STATE_CODES[gstin.substring(0, 2)] || null : null;
}

function isInterState(fromGstin, toGstin) {
  if (!fromGstin || !toGstin) return false;
  return fromGstin.substring(0, 2) !== toGstin.substring(0, 2);
}

// ── Amount in words ────────────────────────────────────────────────────────

function amountInWords(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' ';
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + convert(n % 100);
    if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + convert(n % 1000);
    if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + convert(n % 100000);
    return convert(Math.floor(n / 10000000)) + 'Crore ' + convert(n % 10000000);
  }

  const rupees = Math.floor(amount);
  const paise  = Math.round((amount - rupees) * 100);
  let words = 'Rupees ' + convert(rupees).trim();
  if (paise > 0) words += ` and ${paise} Paise`;
  return words + ' Only';
}

// ── Main PDF generator ─────────────────────────────────────────────────────

/**
 * Generate a GST-compliant PDF invoice.
 *
 * @param {object} invoice - Mongoose Invoice document (fully populated)
 * @returns {Promise<string>} Absolute path to the saved PDF file
 */
async function generateInvoicePdf(invoice) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const filename = `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;
  const filepath = path.join(UPLOADS_DIR, filename);

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 35, left: 45, right: 45 }, bufferPages: true });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      const pageWidth  = doc.page.width  - doc.options.margins.left - doc.options.margins.right;
      const LEFT       = doc.options.margins.left;
      const inter      = isInterState(invoice.billFrom?.gstin, invoice.billTo?.gstin);

      // ── UPI QR Code ────────────────────────────────────────────────────
      let qrBuffer = null;
      if (invoice.upiId) {
        const upiStr = `upi://pay?pa=${invoice.upiId}&pn=${encodeURIComponent(invoice.billFrom?.companyName || '')}&am=${invoice.grandTotal}&cu=INR&tn=${invoice.invoiceNumber}`;
        qrBuffer = await QRCode.toBuffer(upiStr, { type: 'png', width: 60 });
      }

      // ── Header ─────────────────────────────────────────────────────────
      doc.rect(LEFT, 40, pageWidth, 48).fill(BRAND_COLOR);
      doc.fill('white').fontSize(16).font('Helvetica-Bold')
        .text('TAX INVOICE', LEFT + 12, 48);
      doc.fontSize(8.5).font('Helvetica')
        .text(`Invoice No: ${invoice.invoiceNumber}`, LEFT + 12, 66)
        .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, LEFT + 12, 76);

      if (invoice.dueDate) {
        doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, LEFT + 150, 76);
      }

      if (qrBuffer) {
        doc.image(qrBuffer, LEFT + pageWidth - 60, 42, { width: 44, height: 44 });
      }

      // ── Bill From / Bill To ────────────────────────────────────────────
      const col2X = LEFT + pageWidth / 2 + 10;
      doc.fill('#333333').fontSize(8.5).font('Helvetica-Bold');
      doc.text('BILL FROM', LEFT, 98).text('BILL TO', col2X, 98);

      doc.font('Helvetica').fill('#555555').fontSize(8);
      const from = invoice.billFrom || {};
      const to   = invoice.billTo   || {};

      let fromY = 110, toY = 110;

      if (from.companyName) { doc.font('Helvetica-Bold').fill('#222222').text(from.companyName, LEFT, fromY); fromY += 11; doc.font('Helvetica').fill('#555555'); }
      if (from.ownerName)   { doc.text(from.ownerName,  LEFT, fromY); fromY += 10; }
      if (from.address)     { doc.text(from.address,     LEFT, fromY, { width: pageWidth / 2 - 10 }); fromY += 18; }
      if (from.gstin)       { doc.text(`GSTIN: ${from.gstin}`, LEFT, fromY); fromY += 10; }
      if (from.pan)         { doc.text(`PAN: ${from.pan}`,     LEFT, fromY); fromY += 10; }
      if (from.phone)       { doc.text(`Ph: ${from.phone}`,    LEFT, fromY); fromY += 10; }

      if (to.name)    { doc.font('Helvetica-Bold').fill('#222222').text(to.name, col2X, toY); toY += 11; doc.font('Helvetica').fill('#555555'); }
      if (to.address) { doc.text(to.address, col2X, toY, { width: pageWidth / 2 - 10 }); toY += 18; }
      if (to.gstin)   { doc.text(`GSTIN: ${to.gstin}`, col2X, toY); toY += 10; }
      if (to.email)   { doc.text(to.email, col2X, toY); toY += 10; }
      if (to.phone)   { doc.text(to.phone, col2X, toY); toY += 10; }

      // ── Divider ────────────────────────────────────────────────────────
      const tableTop = Math.max(fromY, toY) + 10;
      doc.moveTo(LEFT, tableTop - 2).lineTo(LEFT + pageWidth, tableTop - 2).strokeColor('#cccccc').stroke();

      // ── Line Items Table ───────────────────────────────────────────────
      const cols = {
        no:    { x: LEFT,       w: 22,  label: '#' },
        desc:  { x: LEFT + 22,  w: 155, label: 'Description' },
        hsn:   { x: LEFT + 177, w: 50,  label: 'HSN/SAC' },
        qty:   { x: LEFT + 227, w: 35,  label: 'Qty' },
        rate:  { x: LEFT + 262, w: 55,  label: 'Rate (₹)' },
        gst:   { x: LEFT + 317, w: 38,  label: 'GST%' },
        total: { x: LEFT + 355, w: 60,  label: 'Total (₹)' },
      };

      // Header row
      doc.rect(LEFT, tableTop, pageWidth, 15).fill('#f0f4fa');
      doc.fill('#444444').fontSize(7.5).font('Helvetica-Bold');
      Object.values(cols).forEach(c => {
        doc.text(c.label, c.x + 2, tableTop + 4, { width: c.w - 2 });
      });

      let rowY = tableTop + 15;
      doc.font('Helvetica').fill('#333333');

      (invoice.lineItems || []).forEach((item, idx) => {
        const rowH = 18;
        if (idx % 2 === 0) doc.rect(LEFT, rowY, pageWidth, rowH).fill('#fafafa');
        doc.fill('#333333').fontSize(7.5);
        doc.text(String(idx + 1),                        cols.no.x   + 2, rowY + 5, { width: cols.no.w });
        doc.text(item.description || '',                 cols.desc.x + 2, rowY + 5, { width: cols.desc.w });
        doc.text(item.hsnCode     || '',                 cols.hsn.x  + 2, rowY + 5, { width: cols.hsn.w });
        doc.text(String(item.quantity || 1),             cols.qty.x  + 2, rowY + 5, { width: cols.qty.w });
        doc.text(`₹${(item.rate || 0).toFixed(2)}`,     cols.rate.x + 2, rowY + 5, { width: cols.rate.w });
        const gstPct = inter
          ? (item.igstRate || 0)
          : (item.cgstRate || 0) + (item.sgstRate || 0);
        doc.text(`${gstPct}%`,                           cols.gst.x  + 2, rowY + 5, { width: cols.gst.w });
        doc.text(`₹${(item.total || 0).toFixed(2)}`,    cols.total.x + 2, rowY + 5, { width: cols.total.w });
        rowY += rowH;
      });

      // ── Totals ─────────────────────────────────────────────────────────
      rowY += 6;
      doc.moveTo(LEFT, rowY).lineTo(LEFT + pageWidth, rowY).strokeColor('#cccccc').stroke();
      rowY += 6;

      const totalsX = LEFT + pageWidth - 200;
      const addTotRow = (label, val, bold = false) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .fill(bold ? '#111111' : '#444444')
          .fontSize(bold ? 8.5 : 8);
        doc.text(label, totalsX,         rowY, { width: 110 });
        doc.text(val,   totalsX + 120,   rowY, { width: 80, align: 'right' });
        rowY += bold ? 13 : 11;
      };

      addTotRow('Subtotal',       `₹${(invoice.subtotal    || 0).toFixed(2)}`);
      
      if (!invoice.exemptGst && (invoice.totalGST || 0) > 0) {
        if (inter) {
          addTotRow('IGST',         `₹${(invoice.totalGST    || 0).toFixed(2)}`);
        } else {
          addTotRow('CGST',         `₹${((invoice.totalGST   || 0) / 2).toFixed(2)}`);
          addTotRow('SGST',         `₹${((invoice.totalGST   || 0) / 2).toFixed(2)}`);
        }
      }

      if ((invoice.discount || 0) > 0) {
        addTotRow('Discount',     `-₹${(invoice.discount || 0).toFixed(2)}`);
      }
      if ((invoice.extraCharges || 0) > 0) {
        addTotRow('Extra Charges', `₹${(invoice.extraCharges || 0).toFixed(2)}`);
      }

      addTotRow('Grand Total',    `₹${(invoice.grandTotal  || 0).toFixed(2)}`, true);
      if ((invoice.amountPaid || 0) > 0) {
        addTotRow('Amount Paid',  `₹${(invoice.amountPaid  || 0).toFixed(2)}`);
        addTotRow('Balance Due',  `₹${(invoice.amountDue   || 0).toFixed(2)}`, true);
      }

      // ── Amount in words ────────────────────────────────────────────────
      rowY += 4;
      doc.font('Helvetica').fill('#555555').fontSize(7.5)
        .text(`Amount in words: ${amountInWords(invoice.grandTotal || 0)}`, LEFT, rowY, { width: pageWidth - 210 });

      // ── Payment Terms ──────────────────────────────────────────────────
      if (invoice.paymentTerms) {
        rowY += 12;
        doc.text(`Payment Terms: ${invoice.paymentTerms}`, LEFT, rowY);
      }

      // ── Footer / Signature ─────────────────────────────────────────────
      const footerY = doc.page.height - 110;
      doc.moveTo(LEFT, footerY).lineTo(LEFT + pageWidth, footerY).strokeColor('#e0e0e0').stroke();

      // Left side: bank / UPI note
      doc.font('Helvetica-Bold').fill('#333333').fontSize(8)
        .text('Payment Details', LEFT, footerY + 8);
      doc.font('Helvetica').fill('#555555').fontSize(7.5);
      if (invoice.upiId)   doc.text(`UPI ID: ${invoice.upiId}`, LEFT, footerY + 20);
      if (invoice.bankDetails?.accountNo) {
        doc.text(`Bank A/C: ${invoice.bankDetails.accountNo}`, LEFT, footerY + 30);
        doc.text(`IFSC: ${invoice.bankDetails.ifsc || ''}`, LEFT, footerY + 40);
      }

      // Right side: text signature
      doc.font('Helvetica-Bold').fill('#333333').fontSize(8)
        .text('Authorised Signatory', LEFT + pageWidth - 140, footerY + 8, { width: 140, align: 'center' });

      doc.moveTo(LEFT + pageWidth - 130, footerY + 40)
        .lineTo(LEFT + pageWidth - 10,   footerY + 40)
        .strokeColor('#aaaaaa').stroke();

      doc.font('Helvetica-Bold').fill('#222222').fontSize(8.5)
        .text(from.ownerName || 'Owner',  LEFT + pageWidth - 140, footerY + 44, { width: 140, align: 'center' });
      doc.font('Helvetica').fill('#555555').fontSize(7.5)
        .text(from.companyName || '',      LEFT + pageWidth - 140, footerY + 54, { width: 140, align: 'center' });

      // ── Finalize ───────────────────────────────────────────────────────
      doc.end();
      stream.on('finish', () => resolve(filepath));
      stream.on('error', reject);

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePdf };
