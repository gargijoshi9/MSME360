'use strict';
const express = require('express');
const router  = express.Router();
const protect = require('../middleware/auth');
const {
  confirmInvoice,
  listInvoices,
  getInvoice,
  downloadPdf,
  updateStatus,
  saveScannedInvoice,
} = require('../controllers/invoiceController');

router.post   ('/confirm',     protect, confirmInvoice);
router.post   ('/from-scan',   protect, saveScannedInvoice);
router.get    ('/',            protect, listInvoices);
router.get    ('/:id',         protect, getInvoice);
router.get    ('/:id/pdf',     protect, downloadPdf);
router.patch  ('/:id/status',  protect, updateStatus);

module.exports = router;
