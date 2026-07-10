'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Sparkles,
  ReceiptText,
  Store,
  ArrowRight,
  Sun,
  Moon,
  ShieldCheck,
  Zap,
  Mail,
  MessageCircle,
  CheckCircle2,
  Users,
  Lock,
  Clock,
  Phone,
  MapPin,
} from 'lucide-react';


const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.1l-5.5-7.2L4.3 22H1.2l8.1-9.3L.7 2h7.3l5 6.6L18.9 2zm-1.2 18h1.9L7.4 4H5.3l12.4 16z" />
  </svg>
);

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.62 0 4.29 2.38 4.29 5.48v6.26zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
  </svg>
);

const YoutubeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.6 15.5V8.5L15.8 12l-6.2 3.5z" />
  </svg>
);

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('msme360_theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('msme360_theme', 'dark');
      setDarkMode(true);
    }
  };

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#roadmap', label: 'Roadmap' },
    { href: '#about', label: 'About' },
    { href: '#contact', label: 'Contact' },
  ];

  const socialLinks = [
  { href: 'https://twitter.com/msme360hq', label: 'Twitter / X', icon: TwitterIcon },
  { href: 'https://instagram.com/msme360hq', label: 'Instagram', icon: InstagramIcon },
  { href: 'https://linkedin.com/company/msme360', label: 'LinkedIn', icon: LinkedinIcon },
  { href: 'https://youtube.com/@msme360hq', label: 'YouTube', icon: YoutubeIcon },
];

  const trustPoints = [
    {
      icon: Lock,
      title: 'Bank-grade security',
      desc: 'OTP-based authentication and encrypted message storage protect every conversation and transaction record.',
    },
    {
      icon: Clock,
      title: 'Built for busy owners',
      desc: 'No IT team required. Connect WhatsApp Business and Gmail in minutes, not weeks.',
    },
    {
      icon: Users,
      title: 'Made for Indian MSMEs',
      desc: 'Workflows, invoicing, and vendor discovery designed around how small and mid-sized businesses actually operate in India.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/85 backdrop-blur-md transition-colors duration-200">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <span className="p-1.5 bg-primary text-white rounded-lg shadow-sm">
              <Zap className="h-5 w-5 fill-current" />
            </span>
            MSME360
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-input border border-transparent hover:border-border transition-all duration-150"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-muted" />}
            </button>
            <Link href="/login" className="hidden sm:block text-sm font-medium hover:text-primary transition-colors">
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow transition-all duration-150 transform hover:-translate-y-[1px]"
            >
              Start for Free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden pt-20 pb-16 text-center border-b border-border">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in srgb, var(--primary) 12%, transparent), transparent)',
            }}
          />

          <div className="container mx-auto px-6 relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 bg-primary/5 text-primary text-xs font-semibold mb-6">
              <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
              Phase 1 Live: Secure OTP Authentication Shipped
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-foreground">
              Bring Order to Your <span className="text-primary">Business Chaos</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
              Consolidate your WhatsApp chats and Gmail messages into a single, AI-powered Smart
              Inbox. Organize customer requests, track transactions, and run your business from
              one simple place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-lg hover:shadow-primary/20 transition-all duration-150 transform hover:-translate-y-[2px] flex items-center justify-center gap-2"
              >
                Start for Free <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold border border-border bg-card hover:bg-input rounded-xl transition-all duration-150"
              >
                Sign In
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Setup in under 10 minutes
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Built in India, for India
              </span>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section id="features" className="border-t border-border bg-card/30 py-20 transition-colors duration-200">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Core Platform</span>
              <h2 className="text-3xl font-bold tracking-tight mt-2 mb-4">Everything your inbox should already do</h2>
              <p className="text-muted">
                Empower your business communications with unified channel feeds and smart filters.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md">
                <div className="p-3 bg-primary/10 text-primary rounded-xl w-fit mb-6">
                  <Inbox className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  Unified Smart Inbox
                </h3>
                <p className="text-muted leading-relaxed">
                  Route customer queries from WhatsApp Business and Gmail into a single timeline.
                  No more hopping between platforms or losing conversations in spam folders.
                </p>
              </div>

              <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md">
                <div className="p-3 bg-accent/10 text-accent rounded-xl w-fit mb-6">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-accent transition-colors">
                  AI Lead & Query Classification
                </h3>
                <p className="text-muted leading-relaxed">
                  Automatically sort incoming customer requests by intent (Inquiry, Complaint,
                  Lead, Support) and prioritize the ones that need action first.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust / Why MSME360 */}
        <section id="about" className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Why MSME360</span>
              <h2 className="text-3xl font-bold tracking-tight mt-2 mb-4">
                Built by people who understand small business
              </h2>
              <p className="text-muted">
                India has over 60 million MSMEs, and most of them are still running customer
                communication out of a mix of personal WhatsApp numbers, spreadsheets, and memory.
                MSME360 exists to close that gap with tools that are genuinely simple to adopt.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {trustPoints.map((point) => (
                <div key={point.title} className="text-center sm:text-left">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl w-fit mb-4 mx-auto sm:mx-0">
                    <point.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{point.title}</h3>
                  <p className="text-muted leading-relaxed text-sm">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Coming Soon */}
        <section id="roadmap" className="border-t border-border bg-card/30 py-20 transition-colors duration-200">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Roadmap</span>
              <h2 className="text-3xl font-bold tracking-tight mt-2 mb-4">Coming soon in the next phases</h2>
              <p className="text-muted">
                A preview of major product extensions unlocking on our roadmap. Join the waitlist
                inside your dashboard once you sign up.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="p-8 rounded-2xl bg-card border border-border relative overflow-hidden group">
                <div className="absolute top-4 right-4 bg-input border border-border text-muted text-xs font-semibold px-2.5 py-1 rounded-full">
                  Phase 2 Beta
                </div>
                <div className="p-3 bg-input text-muted rounded-xl w-fit mb-6">
                  <ReceiptText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">GST-Compliant Invoicing</h3>
                <p className="text-muted leading-relaxed mb-4">
                  Automate billing and ledger maintenance directly from customer messaging
                  threads. Draft and send GST-compliant invoices in two clicks.
                </p>
                <div className="text-xs text-primary font-semibold flex items-center gap-1.5">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-primary" /> Waitlist open
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-card border border-border relative overflow-hidden group">
                <div className="absolute top-4 right-4 bg-input border border-border text-muted text-xs font-semibold px-2.5 py-1 rounded-full">
                  Phase 3 Beta
                </div>
                <div className="p-3 bg-input text-muted rounded-xl w-fit mb-6">
                  <Store className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">B2B Vendor Marketplace</h3>
                <p className="text-muted leading-relaxed mb-4">
                  Connect with verified raw material suppliers and distributors across India.
                  Search by location, product catalog, and rating.
                </p>
                <div className="text-xs text-primary font-semibold flex items-center gap-1.5">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-primary" /> Preview available
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto rounded-3xl bg-primary text-white px-8 sm:px-14 py-14 text-center relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  background: 'radial-gradient(ellipse 60% 80% at 80% 0%, white, transparent)',
                }}
              />
              <div className="relative z-10">
                <ShieldCheck className="h-10 w-10 mx-auto mb-4 opacity-90" />
                <h2 className="text-3xl font-bold tracking-tight mb-4">Ready to bring order to your inbox?</h2>
                <p className="text-white/85 mb-8 max-w-xl mx-auto">
                  Join the founding cohort of MSME360 users and shape the product roadmap with
                  your feedback.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-primary bg-white hover:bg-white/90 rounded-xl shadow-lg transition-all duration-150 transform hover:-translate-y-[2px]"
                >
                  Start for Free <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="border-t border-border bg-card py-16 transition-colors duration-200">
        <div className="container mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand column */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg text-foreground mb-4">
                <span className="p-1 bg-primary text-white rounded-md">
                  <Zap className="h-4 w-4" />
                </span>
                MSME360
              </Link>
              <p className="text-sm text-muted leading-relaxed mb-6">
                The AI-powered command center for India&apos;s small and mid-sized businesses.
              </p>
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="p-2 rounded-full border border-border text-muted hover:text-primary hover:border-primary/50 transition-all duration-150"
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product column */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-3 text-sm text-muted">
                <li><a href="#features" className="hover:text-primary transition-colors">Smart Inbox</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">AI Classification</a></li>
                <li><a href="#roadmap" className="hover:text-primary transition-colors">Roadmap</a></li>
                <li><Link href="/signup" className="hover:text-primary transition-colors">Create Account</Link></li>
              </ul>
            </div>

            {/* Company column */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-foreground">Company</h4>
              <ul className="space-y-3 text-sm text-muted">
                <li><a href="#about" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            {/* Contact column */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-foreground">Get in Touch</h4>
              <ul className="space-y-3 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href="mailto:hello@msme360.in" className="hover:text-primary transition-colors">
                    hello@msme360.in
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a href="tel:+911234567890" className="hover:text-primary transition-colors">
                    +91 12345 67890
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <a href="https://wa.me/911234567890" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    Chat on WhatsApp
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Pune, Maharashtra, India</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-subtle">
              &copy; {new Date().getFullYear()} MSME360. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-xs text-subtle">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}