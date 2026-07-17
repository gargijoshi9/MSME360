'use strict';

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

/**
 * PHASE 2 WHATSAPP ENDPOINTS
 * Using '/webhook' ensures both GET and POST hit the same endpoint structure
 */
router.get('/webhook', webhookController.verifyWhatsapp);
router.post('/webhook', webhookController.handleInboundWhatsapp);

/**
 * PHASE 2 GMAIL PUB/SUB ENDPOINT
 */
router.post('/gmail', webhookController.handleInboundGmailPush);

module.exports = router;