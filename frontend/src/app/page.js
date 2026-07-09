'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
  MessageCircle 
} from 'lucide-react';

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Initial check
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
          
          <nav className="flex items-center gap-6">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-input border border-transparent hover:border-border transition-all duration-150"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-muted" />}
            </button>
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Login
            </Link>
            <Link 
              href="/signup" 
              className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow transition-all duration-150 transform hover:-translate-y-[1px]"
            >
              Start for Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20 pb-16 text-center border-b border-border">
          {/* Background gradient */}
          <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in srgb, var(--primary) 12%, transparent), transparent)' }} />

          <div className="container mx-auto px-6 relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 bg-primary/5 text-primary text-xs font-semibold mb-6">
              <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
              Phase 1 Active: Secured OTP Auth Implemented
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-foreground">
              Bring Order to Your <span className="text-primary">Business Chaos</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
              Consolidate your WhatsApp chats and Gmail messages into a single, AI-powered Smart Inbox. Organize customer requests, track transactions, and run your business in one simple place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
          </div>
        </section>

        {/* Core Product Features (Working) */}
        <section className="border-t border-border bg-card/30 py-20 transition-colors duration-200">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Core Active Features</h2>
              <p className="text-muted">
                Empower your business communications with unified channel feeds and smart filters.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md">
                <div className="p-3 bg-primary/10 text-primary rounded-xl w-fit mb-6">
                  <Inbox className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">Unified Smart Inbox</h3>
                <p className="text-muted leading-relaxed">
                  Route customer queries from WhatsApp Business and Gmail into a single timeline. No more hopping between platforms or losing conversations in spam folders.
                </p>
              </div>

              <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md">
                <div className="p-3 bg-accent/10 text-accent rounded-xl w-fit mb-6">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-accent transition-colors">AI Lead & Query Classification</h3>
                <p className="text-muted leading-relaxed">
                  Automatically sort incoming customer request logs based on intent (Inquiry, Complaint, Lead, Support) and prioritize critical action items.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Coming Soon in Next Phases</h2>
              <p className="text-muted">
                A preview of major product extensions unlocking in our roadmap. Join the waitlist inside!
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
                  Automate billing and ledger maintenance directly from customer messaging threads. Draft and send GST-compliant invoices in two clicks.
                </p>
                <div className="text-xs text-primary font-semibold flex items-center gap-1.5">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-primary" /> Waitlist Open
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
                  Connect with verified raw material suppliers and distributors across India. Search by location, product catalog, and rating.
                </p>
                <div className="text-xs text-primary font-semibold flex items-center gap-1.5">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-primary" /> Preview Available
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 transition-colors duration-200">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-lg text-foreground">
            <span className="p-1 bg-primary text-white rounded-md">
              <Zap className="h-4 w-4" />
            </span>
            MSME360
          </div>
          <div className="flex items-center gap-6 text-sm text-muted">
            <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-primary transition-colors">Create Account</Link>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
          <div className="text-xs text-subtle">
            &copy; {new Date().getFullYear()} MSME360. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
