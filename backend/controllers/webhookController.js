/**
 * NOT USED — Phase 1 (auth module)
 *
 * webhookController.js will be implemented in Phase 2.
 * It will handle:
 *   - GET  /api/webhooks/whatsapp  — WhatsApp Cloud API verification challenge
 *   - POST /api/webhooks/whatsapp  — inbound WhatsApp messages
 *   - POST /api/webhooks/gmail     — Gmail Pub/Sub push notifications
 *
 * IMPORTANT (tenant isolation): Any handler here MUST look up the tenant via
 * the exact routing fields (whatsappPhoneNumberId / tenantInboundEmail /
 * googleEmail). If no tenant is found, write to UnmatchedMessage and stop.
 * See the tenant isolation comment at the top of models/User.js.
 */
