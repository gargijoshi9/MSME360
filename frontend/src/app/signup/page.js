'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import {
  Zap,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  User,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────────

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX   = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'Partnership Firm',
  'Limited Liability Partnership (LLP)',
  'Private Limited Company',
  'One Person Company (OPC)',
  'Hindu Undivided Family (HUF)',
  'Trust / NGO',
  'Others',
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // Union Territories
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi (NCT)', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const CURRENCIES = [
  { code: 'INR', label: 'INR — Indian Rupee (₹)' },
  { code: 'USD', label: 'USD — US Dollar ($)' },
  { code: 'EUR', label: 'EUR — Euro (€)' },
  { code: 'GBP', label: 'GBP — British Pound (£)' },
  { code: 'AED', label: 'AED — UAE Dirham (د.إ)' },
];

/** Returns a 0–4 password strength score */
function getPasswordStrength(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 10) score++;
  if (pwd.length >= 14) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];

// ── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }) {
  const steps = [
    { n: 1, label: 'Credentials' },
    { n: 2, label: 'Business Info' },
    { n: 3, label: 'GST & Tax' },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-8 w-full">
      {steps.map((step, idx) => {
        const done    = currentStep > step.n;
        const active  = currentStep === step.n;
        return (
          <div key={step.n} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
                  done
                    ? 'bg-accent border-accent text-white'
                    : active
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-card border-border text-muted'
                }`}
              >
                {done ? <CheckCircle2 className="h-5 w-5" /> : step.n}
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${
                  active ? 'text-primary' : done ? 'text-accent' : 'text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
            {/* Connector */}
            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 w-12 sm:w-20 mx-1 mb-5 transition-all duration-500 ${
                  currentStep > step.n ? 'bg-accent' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, hint, error, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle pointer-events-none" />
        )}
        {children}
      </div>
      {hint && !error && (
        <p className="mt-1 text-[11px] text-subtle">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-[11px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}

const inputClass = (hasIcon, hasError) =>
  `w-full py-3 pr-4 rounded-xl border ${
    hasError ? 'border-red-400 focus:ring-red-400/20' : 'border-border focus:ring-primary/20 focus:border-primary'
  } bg-input outline-none transition-all text-sm focus:ring-2 ${hasIcon ? 'pl-10' : 'pl-4'}`;

// ── Main component ───────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess]   = useState('');

  // All form fields
  const [form, setForm] = useState({
    // Step 1
    email:    '',
    password: '',
    // Step 2
    companyName:  '',
    ownerName:    '',
    phone:        '',
    businessType: '',
    city:         '',
    state:        '',
    address:      '',
    // Step 3
    gstin:    '',
    pan:      '',
    currency: 'INR',
    taxRate:  18,
  });

  // Per-field errors
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleChange = (e) => set(e.target.name, e.target.value);

  // ── Step 1 validation ──────────────────────────────────────────────────────

  const validateStep1 = () => {
    const errs = {};
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim())            errs.email    = 'Email is required.';
    else if (!emailRx.test(form.email)) errs.email   = 'Enter a valid email address.';
    if (!form.password)                 errs.password = 'Password is required.';
    else if (form.password.length < 10) errs.password = 'Password must be at least 10 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Step 2 validation ──────────────────────────────────────────────────────

  const validateStep2 = () => {
    const errs = {};
    const phoneRx = /^[6-9]\d{9}$/;
    if (!form.companyName.trim())  errs.companyName  = 'Business name is required.';
    if (!form.ownerName.trim())    errs.ownerName    = 'Owner name is required.';
    if (!form.phone.trim())        errs.phone        = 'Mobile number is required.';
    else if (!phoneRx.test(form.phone.replace(/\s/g, '')))
                                   errs.phone        = 'Enter a valid 10-digit Indian mobile number.';
    if (!form.businessType)        errs.businessType = 'Please select a business type.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Step 3 validation ──────────────────────────────────────────────────────

  const validateStep3 = () => {
    const errs = {};
    if (form.gstin.trim() && !GSTIN_REGEX.test(form.gstin.toUpperCase()))
      errs.gstin = 'Invalid GSTIN format. Expected: 22AAAAA0000A1Z5';
    if (form.pan.trim() && !PAN_REGEX.test(form.pan.toUpperCase()))
      errs.pan   = 'Invalid PAN format. Expected: ABCDE1234F';
    const rate = Number(form.taxRate);
    if (isNaN(rate) || rate < 0 || rate > 100)
      errs.taxRate = 'Tax rate must be between 0 and 100.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goNext = () => {
    setApiError('');
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const goBack = () => {
    setApiError('');
    setErrors({});
    setStep((s) => s - 1);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    setApiError('');
    setSuccess('');

    try {
      const response = await api.signup({
        email:        form.email.trim().toLowerCase(),
        password:     form.password,
        companyName:  form.companyName.trim(),
        ownerName:    form.ownerName.trim(),
        phone:        form.phone.trim(),
        businessType: form.businessType,
        city:         form.city.trim(),
        state:        form.state,
        address:      form.address.trim(),
        gstin:        form.gstin.trim().toUpperCase() || undefined,
        pan:          form.pan.trim().toUpperCase()   || undefined,
        currency:     form.currency,
        taxRate:      Number(form.taxRate),
      });

      setSuccess(response.message || 'Account created! Redirecting to email verification...');

      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
      }, 1500);
    } catch (err) {
      setApiError(err.message || 'An error occurred during signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwdStrength      = getPasswordStrength(form.password);
  const pwdStrengthLabel = STRENGTH_LABELS[pwdStrength];
  const pwdStrengthColor = STRENGTH_COLORS[pwdStrength];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12 transition-colors duration-200">

      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight text-primary mb-6">
        <span className="p-1.5 bg-primary text-white rounded-lg shadow-sm">
          <Zap className="h-5 w-5 fill-current" />
        </span>
        MSME360
      </Link>

      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl p-8 transition-colors duration-200">

        <h2 className="text-2xl font-bold tracking-tight text-center mb-1">Create your account</h2>
        <p className="text-sm text-muted text-center mb-6">
          Register your business on MSME360 — it takes under 2 minutes.
        </p>

        <StepIndicator currentStep={step} />

        {/* API Error */}
        {apiError && (
          <div className="flex items-start gap-2.5 p-4 mb-5 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/30">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-start gap-2.5 p-4 mb-5 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-900/30 animate-pulse">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* ── STEP 1: Credentials ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <Field label="Work / Business Email" icon={FileText} error={errors.email}>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="rajesh@acmebusiness.com"
                className={inputClass(true, !!errors.email)}
                autoFocus
              />
            </Field>

            <Field
              label="Password"
              hint="Min 10 characters. Mix uppercase, numbers & symbols for a strong password."
              error={errors.password}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a secure password"
                className={`${inputClass(false, !!errors.password)} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle hover:text-muted transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>

            {/* Strength meter */}
            {form.password && (
              <div className="space-y-1 -mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="h-1.5 flex-1 rounded-full transition-all duration-300"
                      style={{ backgroundColor: n <= pwdStrength ? pwdStrengthColor : 'var(--border)' }}
                    />
                  ))}
                </div>
                <p className="text-[11px] font-semibold" style={{ color: pwdStrengthColor }}>
                  {pwdStrengthLabel}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={goNext}
              className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all shadow hover:shadow-primary/20 flex items-center justify-center gap-2 transform hover:-translate-y-[1px]"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-sm text-center text-muted">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* ── STEP 2: Business Info ───────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">

            {/* Section heading */}
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-bold text-foreground">Business Details</span>
            </div>

            <Field label="Business / Company Name *" icon={Building2} error={errors.companyName}>
              <input
                type="text"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="e.g. Acme Enterprises"
                className={inputClass(true, !!errors.companyName)}
                autoFocus
              />
            </Field>

            <Field label="Owner / Proprietor Name *" icon={User} error={errors.ownerName}>
              <input
                type="text"
                name="ownerName"
                value={form.ownerName}
                onChange={handleChange}
                placeholder="e.g. Rajesh Kumar"
                className={inputClass(true, !!errors.ownerName)}
              />
            </Field>

            <Field
              label="Mobile / WhatsApp Number *"
              hint="10-digit Indian mobile number (used for WhatsApp integration)"
              icon={Phone}
              error={errors.phone}
            >
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle text-xs font-semibold pointer-events-none select-none">
                +91
              </div>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="9876543210"
                maxLength={10}
                className={`${inputClass(false, !!errors.phone)} pl-12`}
              />
            </Field>

            <Field label="Business Type *" error={errors.businessType}>
              <div className="relative">
                <select
                  name="businessType"
                  value={form.businessType}
                  onChange={handleChange}
                  className={`${inputClass(false, !!errors.businessType)} appearance-none pr-10 cursor-pointer`}
                >
                  <option value="">Select your business structure...</option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle pointer-events-none" />
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="City" icon={MapPin} error={errors.city}>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  className={inputClass(true, !!errors.city)}
                />
              </Field>

              <Field label="State / UT" error={errors.state}>
                <div className="relative">
                  <select
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className={`${inputClass(false, !!errors.state)} appearance-none pr-8 cursor-pointer`}
                  >
                    <option value="">Select state...</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-subtle pointer-events-none" />
                </div>
              </Field>
            </div>

            <Field label="Business Address" hint="Full registered address (optional at signup)">
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Shop No. 12, MG Road, Mumbai – 400001"
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-border bg-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm resize-none"
              />
            </Field>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 py-3.5 border border-border text-muted hover:text-foreground hover:border-foreground/30 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={goNext}
                className="flex-[2] py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all shadow hover:shadow-primary/20 flex items-center justify-center gap-2 transform hover:-translate-y-[1px]"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: GST & Tax ───────────────────────────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Section heading */}
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-accent/10 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-accent" />
              </div>
              <span className="text-sm font-bold text-foreground">GST & Compliance</span>
              <span className="text-[11px] text-subtle ml-auto font-medium">All optional — add later</span>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-2.5 p-3 bg-primary/5 border border-primary/15 rounded-xl text-xs text-muted">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                GSTIN and PAN are used for GST invoice generation and compliance. 
                You can skip these now and add them from Settings later.
              </span>
            </div>

            <Field
              label="GSTIN"
              hint="15-character GST Identification Number · e.g. 22AAAAA0000A1Z5"
              error={errors.gstin}
            >
              <input
                type="text"
                name="gstin"
                value={form.gstin}
                onChange={(e) => set('gstin', e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className={`${inputClass(false, !!errors.gstin)} font-mono tracking-widest`}
                autoFocus
              />
            </Field>

            <Field
              label="PAN"
              hint="10-character Permanent Account Number · e.g. ABCDE1234F"
              error={errors.pan}
            >
              <input
                type="text"
                name="pan"
                value={form.pan}
                onChange={(e) => set('pan', e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
                className={`${inputClass(false, !!errors.pan)} font-mono tracking-widest`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Default Currency">
                <div className="relative">
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className={`${inputClass(false, false)} appearance-none pr-8 cursor-pointer`}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-subtle pointer-events-none" />
                </div>
              </Field>

              <Field
                label="Default GST Rate (%)"
                hint="Standard: 18%"
                error={errors.taxRate}
              >
                <div className="relative">
                  <select
                    name="taxRate"
                    value={form.taxRate}
                    onChange={handleChange}
                    className={`${inputClass(false, !!errors.taxRate)} appearance-none pr-8 cursor-pointer`}
                  >
                    {[0, 5, 12, 18, 28].map((r) => (
                      <option key={r} value={r}>{r}%</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-subtle pointer-events-none" />
                </div>
              </Field>
            </div>

            {/* Summary card before submit */}
            <div className="bg-input border border-border rounded-xl p-4 space-y-2 text-xs">
              <p className="font-bold text-foreground text-sm mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Registration Summary
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-muted">
                <span className="font-semibold text-subtle uppercase tracking-wider">Email</span>
                <span className="truncate font-medium text-foreground">{form.email}</span>
                <span className="font-semibold text-subtle uppercase tracking-wider">Company</span>
                <span className="truncate font-medium text-foreground">{form.companyName}</span>
                <span className="font-semibold text-subtle uppercase tracking-wider">Owner</span>
                <span className="truncate font-medium text-foreground">{form.ownerName}</span>
                <span className="font-semibold text-subtle uppercase tracking-wider">Phone</span>
                <span className="font-medium text-foreground">+91 {form.phone}</span>
                <span className="font-semibold text-subtle uppercase tracking-wider">Type</span>
                <span className="truncate font-medium text-foreground">{form.businessType}</span>
                {form.city && <>
                  <span className="font-semibold text-subtle uppercase tracking-wider">City</span>
                  <span className="font-medium text-foreground">{form.city}</span>
                </>}
                {form.gstin && <>
                  <span className="font-semibold text-subtle uppercase tracking-wider">GSTIN</span>
                  <span className="font-mono font-medium text-foreground">{form.gstin}</span>
                </>}
                {form.pan && <>
                  <span className="font-semibold text-subtle uppercase tracking-wider">PAN</span>
                  <span className="font-mono font-medium text-foreground">{form.pan}</span>
                </>}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="flex-1 py-3.5 border border-border text-muted hover:text-foreground hover:border-foreground/30 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-3.5 bg-primary hover:bg-primary-hover disabled:bg-muted text-white font-semibold rounded-xl transition-all shadow hover:shadow-primary/20 flex items-center justify-center gap-2 transform hover:-translate-y-[1px] disabled:transform-none"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-center text-subtle pt-1">
              By registering, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
