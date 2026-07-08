'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { Zap, AlertTriangle, ArrowRight, ShieldAlert, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [backoffSeconds, setBackoffSeconds] = useState(0);

  // Backoff countdown timer
  useEffect(() => {
    if (backoffSeconds <= 0) return;
    const timer = setInterval(() => {
      setBackoffSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [backoffSeconds]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    setError('');
    setUnverified(false);

    try {
      const response = await api.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      // Save credentials and redirect to dashboard
      localStorage.setItem('msme360_token', response.token);
      localStorage.setItem('msme360_user', JSON.stringify(response.user));
      
      router.push('/dashboard');
    } catch (err) {
      // Check status code from backend
      if (err.status === 403) {
        // Email is not verified
        setError(err.message || 'Please verify your email before logging in.');
        setUnverified(true);
      } else if (err.status === 429) {
        // Rate-limit/exponential backoff
        const retryAfter = err.payload?.retryAfterSeconds || 60;
        setBackoffSeconds(retryAfter);
        setError(`Too many failed attempts. Please try again in ${retryAfter} second(s).`);
      } else {
        // Standard authentication failure
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
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
        <h2 className="text-2xl font-bold tracking-tight text-center mb-1">Welcome back</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
          Sign in to your MSME360 dashboard.
        </p>

        {error && (
          <div className="flex items-start gap-2.5 p-4 mb-6 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/30">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2">
              <span>
                {backoffSeconds > 0 
                  ? `Too many failed attempts. Please try again in ${backoffSeconds} second(s).` 
                  : error
                }
              </span>
              
              {unverified && (
                <Link
                  href={`/verify-otp?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`}
                  className="w-fit text-xs font-semibold px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all mt-1"
                >
                  Verify Email Now
                </Link>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="rajesh@acme.com"
              disabled={loading || backoffSeconds > 0}
              className="w-full px-4 py-3 rounded-xl border border-border bg-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm disabled:opacity-50"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
              <a href="#" className="text-xs text-slate-400 hover:text-primary transition-colors">
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••••••"
              disabled={loading || backoffSeconds > 0}
              className="w-full px-4 py-3 rounded-xl border border-border bg-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm disabled:opacity-50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || backoffSeconds > 0}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:bg-slate-400 text-white font-semibold rounded-xl transition-all shadow hover:shadow-primary/20 flex items-center justify-center gap-2 transform hover:-translate-y-[1px]"
          >
            {loading ? (
              'Signing In...'
            ) : backoffSeconds > 0 ? (
              `Locked (${backoffSeconds}s)`
            ) : (
              'Sign In'
            )} 
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-sm text-center text-slate-600 dark:text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
