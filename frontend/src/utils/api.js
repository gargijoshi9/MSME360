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

  // Attach JWT if present in localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('msme360_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = { success: false, message: 'Invalid server response.' };
  }

  if (!response.ok) {
    throw new ApiError(response.status, data.message || 'An error occurred.', data);
  }

  return data;
}

export const api = {
  // Signup
  async signup({ companyName, ownerName, email, password }) {
    return request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ companyName, ownerName, email, password }),
    });
  },

  // Verify OTP
  async verifyOtp({ email, otp }) {
    return request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  // Resend OTP
  async resendOtp({ email }) {
    return request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Login
  async login({ email, password }) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
};
