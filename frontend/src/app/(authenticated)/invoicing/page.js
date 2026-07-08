'use client';

import { useState } from 'react';
import { 
  ReceiptText, 
  Rocket, 
  Lock, 
  Send, 
  Check, 
  Download, 
  FileText, 
  Plus, 
  Sparkles 
} from 'lucide-react';

export default function InvoicingPage() {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmitted(true);
    setFeedback('');
    setTimeout(() => {
      setSubmitted(false);
    }, 4000);
  };

  // Mock invoice data for the background preview ledger
  const mockInvoices = [
    { id: 'INV-2026-004', date: 'Jul 08, 2026', client: 'Karan Johar (Brass Corp)', gstin: '27AAAAA1111A1Z1', amount: 45001, tax: 8100, total: 53100, status: 'Pending' },
    { id: 'INV-2026-003', date: 'Jul 04, 2026', client: 'Ramesh Fabrics', gstin: '24BBBBB2222B2Z2', amount: 120000, tax: 21600, total: 141600, status: 'Paid' },
    { id: 'INV-2026-002', date: 'Jun 28, 2026', client: 'Sharma Textiles', gstin: '22CCCCC3333C3Z3', amount: 89000, tax: 16020, total: 105020, status: 'Paid' },
    { id: 'INV-2026-001', date: 'Jun 15, 2026', client: 'Acme Automotives', gstin: '27DDDDD4444D4Z4', amount: 350010, tax: 63000, total: 413000, status: 'Paid' },
  ];

  return (
    <div className="relative min-h-[calc(100vh-200px)] animate-fadeIn">
      {/* 1. Background Content (Blurred Dummy UI) */}
      <div className="select-none pointer-events-none filter blur-[5px] transition-all duration-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">GST Invoicing Ledger</h1>
            <p className="text-sm text-slate-500 mt-1">Generate and manage invoices directly from customer conversations.</p>
          </div>
          <button className="px-4 py-2.5 bg-primary text-white rounded-xl font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Invoice
          </button>
        </div>

        {/* Dummy Metrics */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Billed</span>
            <h3 className="text-2xl font-extrabold mt-1">₹7,12,720</h3>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outstanding Tax (CGST/SGST)</span>
            <h3 className="text-2xl font-extrabold text-amber-500 mt-1">₹8,100</h3>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Paid Invoices</span>
            <h3 className="text-2xl font-extrabold text-emerald-500 mt-1">3</h3>
          </div>
        </div>

        {/* Dummy Invoice Table */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-card/50">
            <h2 className="text-lg font-bold">Generated Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-input text-slate-400 font-bold border-b border-border uppercase">
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">GSTIN</th>
                  <th className="p-4 text-right">Tax (18%)</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-input/20">
                    <td className="p-4 font-bold text-slate-700">{inv.id}</td>
                    <td className="p-4 text-slate-500">{inv.date}</td>
                    <td className="p-4 font-semibold">{inv.client}</td>
                    <td className="p-4 font-mono text-slate-500">{inv.gstin}</td>
                    <td className="p-4 text-right font-medium text-slate-500">₹{inv.tax.toLocaleString()}</td>
                    <td className="p-4 text-right font-bold">₹{inv.total.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-500 border border-emerald-200' : 'bg-amber-50 text-amber-500 border border-amber-200'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="p-1.5 hover:bg-input border border-border rounded-lg text-slate-400">
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Absolute Centered Interactive Overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-lg bg-card/90 dark:bg-card/95 backdrop-blur-lg border border-primary/20 shadow-2xl rounded-3xl p-8 text-center relative overflow-hidden animate-scaleIn">
          {/* Subtle Ambient Accent Glow */}
          <div className="absolute -top-24 -left-24 h-48 w-48 bg-primary/10 rounded-full blur-2xl" />
          
          <div className="p-4 bg-primary/10 text-primary rounded-full w-fit mx-auto mb-6 border border-primary/20 shadow-inner">
            <Rocket className="h-8 w-8 animate-bounce text-primary" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-primary text-xs font-bold mb-4">
            <Lock className="h-3 w-3" /> Waitlist Activated
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            GST Invoicing is unlocking soon!
          </h2>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 max-w-md mx-auto">
            We are currently beta-testing our smart invoice generator. Once live, MSME360 will automatically generate drafts when customers request quotes on WhatsApp or Gmail.
          </p>

          {/* Waitlist stats */}
          <div className="grid grid-cols-2 gap-4 py-4 px-6 bg-input border border-border rounded-2xl mb-8 max-w-sm mx-auto">
            <div className="text-center border-r border-border">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Position</span>
              <span className="text-xl font-extrabold text-primary">#384</span>
            </div>
            <div className="text-center">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Release</span>
              <span className="text-xl font-extrabold text-accent">Phase 2</span>
            </div>
          </div>

          {/* Feedback interaction form */}
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                What invoice features do you want most?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., E-way bill, custom logo, tax reports..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={submitted}
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-input outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs transition-all disabled:opacity-50"
                  required
                />
                <button
                  type="submit"
                  disabled={submitted}
                  className="px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 hover:shadow-lg hover:shadow-primary/20"
                >
                  <Send className="h-3.5 w-3.5" /> Submit
                </button>
              </div>
            </div>
          </form>

          {/* Toast Notification inside the modal */}
          {submitted && (
            <div className="mt-4 flex items-center justify-center gap-2 p-3 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-900/30 animate-pulse">
              <Check className="h-4 w-4 shrink-0" />
              <span>Feedback received! Position locked. Thank you!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
