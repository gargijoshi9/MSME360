'use strict';
const nodemailer = require('nodemailer');

// Transporter is created lazily on first use so the server can start even if
// SMTP credentials are not yet configured (the error will surface at send time
// with a clear message rather than on startup).
let _transporter = null;

const getTransporter = () => {
  if (!_transporter) {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_APP_PASSWORD) {
      throw new Error(
        '[emailService] SMTP_EMAIL and SMTP_APP_PASSWORD must be set in .env. ' +
        'Generate an App Password at https://myaccount.google.com/apppasswords — ' +
        'your regular Gmail password will NOT work.'
      );
    }
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_APP_PASSWORD,
      },
    });
  }
  return _transporter;
};

/**
 * Sends a 6-digit OTP verification email.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} otp     - Plaintext 6-digit OTP (hashed version is stored in DB)
 */
const sendOtpEmail = async (toEmail, otp) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"MSME360" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: 'Your MSME360 Verification Code',
    text: [
      `Your MSME360 verification code is: ${otp}`,
      '',
      'This code expires in 10 minutes.',
      'If you did not create an MSME360 account, please ignore this email.',
    ].join('\n'),
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#1a1a2e;margin-bottom:8px">Verify your MSME360 account</h2>
        <p style="color:#444;margin-bottom:20px">Enter the code below to verify your email address:</p>
        <div style="font-size:38px;font-weight:700;letter-spacing:10px;padding:20px;
                    background:#f0f4ff;border-radius:10px;text-align:center;
                    color:#1a1a2e">${otp}</div>
        <p style="color:#888;font-size:13px;margin-top:20px">
          This code expires in <strong>10 minutes</strong>.<br>
          If you did not create an MSME360 account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail };
