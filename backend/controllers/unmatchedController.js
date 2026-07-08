/**
 * NOT USED — Phase 1 (auth module)
 *
 * unmatchedController.js will be implemented in Phase 2.
 * It will handle:
 *   - GET   /api/unmatched           — list pending review-queue items
 *   - PATCH /api/unmatched/:id/review — mark resolved or discarded
 *
 * UnmatchedMessage records are created by webhookController when an inbound
 * message cannot be matched to a tenant (see models/User.js — TENANT ISOLATION).
 */
