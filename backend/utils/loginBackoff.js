'use strict';

/**
 * Exponential backoff for failed login attempts.
 *
 * DESIGN RATIONALE — Why backoff instead of hard lockout?
 * ========================================================
 * A hard lockout (e.g. "lock account after 5 failed attempts") is exploitable:
 * an attacker who knows a victim's email can intentionally deny them access to
 * their own account by submitting 5 wrong passwords on purpose. This is a
 * trivial, cheap denial-of-service attack against the victim.
 *
 * Exponential backoff imposes real cost on an attacker (each failure makes the
 * next attempt slower) without permanently blocking a legitimate user — they
 * just have to wait a bit before trying again.
 *
 * COMPLEMENTARY DEFENCE: An IP-level rate limiter (middleware/rateLimiter.js)
 * catches attackers who spread attempts across many different accounts to avoid
 * per-account backoff. Both mechanisms are needed; neither is sufficient alone.
 *
 * Backoff schedule (indexed by failedLoginAttempts count after the failed attempt):
 *   0 → 0 s   (first attempt, free)
 *   1 → 0 s   (second attempt, free)
 *   2 → 5 s
 *   3 → 30 s
 *   4 → 120 s
 *   5+ → 300 s (5-minute cap — not a lockout, just a slow rate)
 */

const BACKOFF_SECONDS = [0, 0, 5, 30, 120];
const MAX_BACKOFF_SECONDS = 300; // 5-minute cap

/**
 * Returns the number of seconds a user must wait before their next login attempt,
 * given how many consecutive failed attempts they have accumulated.
 *
 * @param {number} failedAttempts
 * @returns {number} seconds
 */
const getBackoffSeconds = (failedAttempts) => {
  if (failedAttempts < BACKOFF_SECONDS.length) {
    return BACKOFF_SECONDS[failedAttempts];
  }
  return MAX_BACKOFF_SECONDS;
};

/**
 * Returns the Date until which the user must wait, or null if no wait is needed.
 * Call this AFTER incrementing failedLoginAttempts for the current failed attempt.
 *
 * @param {number} failedAttempts - updated count (after incrementing for this failure)
 * @returns {Date|null}
 */
const computeBackoffUntil = (failedAttempts) => {
  const seconds = getBackoffSeconds(failedAttempts);
  if (seconds === 0) return null;
  return new Date(Date.now() + seconds * 1000);
};

module.exports = { getBackoffSeconds, computeBackoffUntil };
