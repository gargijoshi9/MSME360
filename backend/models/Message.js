'use strict';

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Ensures data isolation between tenants
  },
  sender: {
    type: String,
    required: true,
    trim: true
  },
  recipient: {
    type: String,
    required: false,
    trim: true
  },
  subject: {
    type: String,
    default: 'No Subject'
  },
  body: {
    type: String,
    required: false
  },
  text: {
    type: String
  },
  platform: {
    type: String,
    enum: ['gmail', 'whatsapp'],
    default: 'gmail'
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    default: 'inbound'
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true 
});

// 🚀 CREATE THE MODEL REPRESENTATION
const Message = mongoose.model('Message', MessageSchema);

// 🛠️ SECURE CONNECTION-AWARE CLEANUP BLOCK
// This waits until the database connection is 100% active before executing the drop command
mongoose.connection.once('open', () => {
  console.log('[Database Core] Connection verified active. Initializing index cleanup check...');
  
  Message.collection.dropIndex('tenantId_1_platform_1_externalId_1')
    .then(() => {
      console.log('[Database Core] Success: Old strict unique index dropped cleanly from the server side.');
    })
    .catch((err) => {
      // Code 27 means the index does not exist or was already deleted, which is a success for us!
      if (err.code === 27 || err.message.includes('index not found')) {
        console.log('[Database Core] Index check passed: Strict unique constraint does not exist.');
      } else {
        console.error('[Database Core] Index cleanup caution:', err.message);
      }
    });
});

module.exports = Message;