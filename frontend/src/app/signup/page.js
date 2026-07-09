'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { Zap, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Basic client validations
    if (!formData.companyName.trim() || !formData.ownerName.trim() || !formData.email.trim() || !formData.password) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 10) {
      setError('Password must be at least 10 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.signup({
        companyName: formData.companyName.trim(),
        ownerName: formData.ownerName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setSuccess(response.message || 'Account created successfully! Redirecting...');
      
      // Auto redirect to OTP verification after 1.5 seconds
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`);
      }, 1500);

    } catch (err) {
      setError(err.message || 'An error occurred during signup.');
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
        <h2 className="text-2xl font-bold tracking-tight text-center mb-1">Create your account</h2>
        <p className="text-sm text-muted text-center mb-8">
          Start managing your business communications today.
        </p>

        {error && (
          <div className="flex items-start gap-2.5 p-4 mb-6 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/30">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2.5 p-4 mb-6 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-900/30 animate-pulse">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Company Name</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="e.g. Acme Enterprises"
              className="w-full px-4 py-3 rounded-xl border border-border bg-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Owner Name</label>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              placeholder="e.g. Rajesh Kumar"
              className="w-full px-4 py-3 rounded-xl border border-border bg-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="rajesh@acme.com"
              className="w-full px-4 py-3 rounded-xl border border-border bg-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 10 characters"
              className="w-full px-4 py-3 rounded-xl border border-border bg-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:bg-muted text-white font-semibold rounded-xl transition-all shadow hover:shadow-primary/20 flex items-center justify-center gap-2 transform hover:-translate-y-[1px]"
          >
            {loading ? 'Creating Account...' : 'Continue'} <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-sm text-center text-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
