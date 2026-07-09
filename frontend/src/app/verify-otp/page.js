'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/utils/api';
import { Zap, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const otpInputRef = useRef(null);

  // Extract email from query string safely on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const emailParam = searchParams.get('email');
      if (emailParam) {
        setEmail(emailParam.toLowerCase().trim());
      } else {
        setError('No email address provided. Please return to the signup page.');
      }
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email address is missing.');
      return;
    }
    if (otp.length !== 6 || isNaN(otp)) {
      setError('Please enter a valid 6-digit numeric verification code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.verifyOtp({ email, otp });
      
      // Save JWT token and basic user info to localStorage
      localStorage.setItem('msme360_token', response.token);
      localStorage.setItem('msme360_user', JSON.stringify(response.user));
      
      setSuccess('Verification successful! Logging you in...');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.resendOtp({ email });
      setSuccess(response.message || 'A new verification code has been sent.');
      setCooldown(60); // Set a 60-second cooldown
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-6 py-12 transition-colors duration-200">
      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight text-primary mb-8">
        <span className="p-1.5 bg-primary text-white rounded-lg shadow-sm">
          <Zap className="h-5 w-5 fill-current" />
        </span>
        MSME360
      </Link>

      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 transition-colors duration-200">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-1">Verify your email</h2>
        <p className="text-sm text-muted text-center mb-6">
          We sent a 6-digit verification code to <span className="font-semibold text-foreground">{email || 'your email'}</span>.
        </p>

        {error && (
          <div className="flex items-start gap-2.5 p-4 mb-6 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/30">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2.5 p-4 mb-6 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-3 text-center">
              Verification Code
            </label>
            <input
              ref={otpInputRef}
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0 0 0 0 0 0"
              className="w-full text-center px-4 py-4 rounded-xl border border-border bg-input font-bold tracking-[0.75em] text-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              autoFocus
              disabled={loading || !email}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:bg-muted text-white font-semibold rounded-xl transition-all shadow hover:shadow-primary/20 flex items-center justify-center gap-2 transform hover:-translate-y-[1px]"
          >
            {loading ? 'Verifying...' : 'Verify Code'} <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-sm">
          <span className="text-muted">Didn't receive the code?</span>
          {cooldown > 0 ? (
            <span className="text-subtle font-medium">
              Resend in {cooldown}s
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending || !email}
              className="text-primary hover:text-primary-hover font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              {resending && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Resend Code
            </button>
          )}
        </div>
        
        <div className="text-center mt-6 text-xs text-muted">
          <Link href="/signup" className="hover:underline">
            Back to Signup
          </Link>
        </div>
      </div>
    </div>
  );
}
