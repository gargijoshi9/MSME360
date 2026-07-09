'use strict';
const express  = require('express');
const router   = express.Router();
const protect  = require('../middleware/auth');
const { sendMessage } = require('../controllers/chatController');

// POST /api/chat — send a message (supports file upload via multipart/form-data)
router.post('/', protect, sendMessage);

module.exports = router;
