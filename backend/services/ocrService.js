'use strict';

/**
 * OCR Service — extracts text from invoice images/PDFs using Tesseract.js.
 *
 * Pipeline:
 *   1. sharp preprocesses the image (greyscale + contrast boost)
 *   2. tesseract.js runs OCR in eng+hin mode
 *   3. Gemini parses raw OCR text into structured JSON
 *
 * Supports: JPG, PNG, WEBP, TIFF, BMP, and single-page PDFs (via image conversion)
 */

const Tesseract = require('tesseract.js');
const sharp     = require('sharp');
const path      = require('path');
const fs        = require('fs');
const { extractJson } = require('./geminiService');

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');

/**
 * Preprocess an image buffer using sharp for better OCR accuracy.
 * - Convert to greyscale
 * - Increase contrast
 * - Normalize brightness
 */
async function preprocessImage(inputPath) {
  const outputPath = `${inputPath}_processed.png`;

  await sharp(inputPath)
    .greyscale()
    .normalise()
    .sharpen()
    .png()
    .toFile(outputPath);

  return outputPath;
}

/**
 * Run OCR on a file path and return raw extracted text.
 * @param {string} filePath - Path to image file
 * @returns {Promise<string>} Raw OCR text
 */
async function extractText(filePath) {
  const processedPath = await preprocessImage(filePath);

  try {
    const { data: { text } } = await Tesseract.recognize(
      processedPath,
      'eng+hin',   // bilingual: English + Hindi
      {
        logger: () => {},  // suppress progress logs
        tessedit_char_whitelist: '',
      }
    );

    // Cleanup processed file
    fs.unlink(processedPath, () => {});
    return text.trim();
  } catch (err) {
    fs.unlink(processedPath, () => {});
    throw err;
  }
}

/**
 * Parse raw OCR text into a structured invoice object using Gemini.
 * @param {string} rawText
 * @returns {Promise<object>} Structured invoice fields
 */
async function parseOcrText(rawText) {
  const prompt = `
You are an expert at reading Indian invoices and bills.

Extract invoice data from the following OCR text. The text may be imperfect due to OCR errors.
Return a JSON object with these fields (use null for missing fields):

{
  "invoiceNumber": "string or null",
  "invoiceDate": "ISO date string or null",
  "dueDate": "ISO date string or null",
  "vendorName": "string or null",
  "vendorGstin": "string or null",
  "vendorAddress": "string or null",
  "vendorPhone": "string or null",
  "buyerName": "string or null",
  "buyerGstin": "string or null",
  "lineItems": [
    {
      "description": "string",
      "hsnCode": "string or null",
      "quantity": number,
      "rate": number,
      "amount": number
    }
  ],
  "subtotal": number or null,
  "cgst": number or null,
  "sgst": number or null,
  "igst": number or null,
  "totalGST": number or null,
  "grandTotal": number or null,
  "currency": "INR"
}

OCR Text:
---
${rawText.slice(0, 3000)}
---`;

  const parsed = await extractJson(prompt);
  return parsed || { rawText, parseError: true };
}

/**
 * Full OCR pipeline: file → raw text → structured data.
 * @param {string} filePath - Uploaded file path (from multer)
 * @returns {Promise<{ rawText: string, structured: object }>}
 */
async function scanInvoice(filePath) {
  const rawText  = await extractText(filePath);
  const structured = await parseOcrText(rawText);

  return { rawText, structured };
}

module.exports = { scanInvoice, extractText, parseOcrText };
