const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Custom application error that wraps API error payloads.
 */
export class ApiError extends Error {
  constructor(status, message, payload = {}) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Core wrapper around fetch to handle authorization tokens, JSON formatting, and error parsing.
 */
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('msme360_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = { success: false, message: 'Invalid server response.' };
  }

  // Inside utils/api.js -> function request()
if (!response.ok) {
  // Check for both data.message or data.error to prevent fallback text swallowing actual logs
  const errorMessage = data.message || data.error || 'An error occurred.';
  throw new ApiError(response.status, errorMessage, data);
}

  return data;
}

export const api = {
  async signup({
    email, password,
    companyName, ownerName, phone, businessType,
    city, address, gstin, pan, currency, taxRate,
  }) {
    return request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email, password,
        companyName, ownerName, phone, businessType,
        city, address, gstin, pan, currency, taxRate,
      }),
    });
  },

  async verifyOtp({ email, otp }) {
    return request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  async resendOtp({ email }) {
    return request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async login({ email, password }) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // ── Chat ────────────────────────────────────────────────────────────────
  async chat({ message, history = [] }) {
    return request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history: JSON.stringify(history) }),
    });
  },

  async chatWithFile({ message, file, history = [] }) {
    const formData = new FormData();
    if (message) formData.append('message', message);
    formData.append('file', file);
    formData.append('history', JSON.stringify(history));

    const token = typeof window !== 'undefined' ? localStorage.getItem('msme360_token') : null;
    const response = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    let data;
    try { data = await response.json(); } catch { data = { success: false, message: 'Invalid response.' }; }
    if (!response.ok) throw new ApiError(response.status, data.message || 'Chat error.', data);
    return data;
  },

  async confirmInvoice({ draftData }) {
    return request('/invoices/confirm', {
      method: 'POST',
      body: JSON.stringify({ draftData }),
    });
  },

  // ── Invoices ─────────────────────────────────────────────────────────────
  async getInvoices({ status, page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    return request(`/invoices?${params}`);
  },

  async getInvoice(id) {
    return request(`/invoices/${id}`);
  },

  async updateInvoiceStatus(id, { status, amountPaid }) {
    return request(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, amountPaid }),
    });
  },

  async saveScannedInvoice({ structured, rawText }) {
    return request('/invoices/from-scan', {
      method: 'POST',
      body: JSON.stringify({ structured, rawText }),
    });
  },

  // ── Finances ──────────────────────────────────────────────────────────────
  async getFinanceOverview()  { return request('/finances/overview');    },
  async getGstSummary()       { return request('/finances/gst-summary'); },
  async getCashFlow()         { return request('/finances/cash-flow');   },
  async getAging()            { return request('/finances/aging');       },

  // ── Unified Inbox (NEW) ──────────────────────────────────────────────────
  /**
   * Returns stored WhatsApp + Gmail (+ future channels) messages for the
   * logged-in tenant, newest first.
   */
  async getMessages() {
    return request('/messages');
  },

  // ── Gmail Sync & Onboarding ───────────────────────────────────────────────
  async renewGmailWatch() {
    return request('/gmail/watch-renew', {
      method: 'POST',
    });
  },

  async fetchGmailMessageById(messageId) {
    return request('/gmail/fetch', {
      method: 'POST',
      body: JSON.stringify({ messageId }),
    });
  },

  async getProfile() {
    return request('/auth/me');
  }
};