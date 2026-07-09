'use strict';
const express = require('express');
const router  = express.Router();
const protect = require('../middleware/auth');
const { getOverview, getGstSummary, getCashFlow, getAging } = require('../controllers/financeController');

router.get('/overview',     protect, getOverview);
router.get('/gst-summary',  protect, getGstSummary);
router.get('/cash-flow',    protect, getCashFlow);
router.get('/aging',        protect, getAging);

module.exports = router;
