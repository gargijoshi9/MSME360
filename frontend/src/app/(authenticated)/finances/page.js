'use client';

import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import {
  TrendingUp, TrendingDown, Receipt, Clock, AlertCircle,
  CheckCircle2, BarChart3, Loader2, RefreshCw, IndianRupee,
  FileText, ChevronRight, Download, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);
const fmtDec = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const STATUS_STYLES = {
  paid:            'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  sent:            'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  overdue:         'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  partially_paid:  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  draft:           'bg-muted/10 text-muted',
  cancelled:       'bg-muted/5 text-subtle line-through',
};

// ── Overview card ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground font-heading">₹{fmt(value)}</span>
        </div>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0
            ? <ArrowUpRight className="h-3 w-3" />
            : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

// ── Mini bar chart ────────────────────────────────────────────────────────────

function BarChart({ data, valueKey, label, color = 'var(--primary)' }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</h4>
      <div className="flex items-end gap-1.5 h-24">
        {data.map((d, i) => (
          <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group relative">
            <div
              className="w-full rounded-t-md transition-all duration-500 hover:opacity-80"
              style={{
                height:     `${Math.max(((d[valueKey] || 0) / max) * 100, 2)}%`,
                background: color,
                opacity:    0.7 + (i / data.length) * 0.3,
              }}
            />
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              ₹{fmt(d[valueKey])}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-subtle truncate">{d.label?.slice(-5)}</div>
        ))}
      </div>
    </div>
  );
}

// ── Aging buckets ─────────────────────────────────────────────────────────────

function AgingBar({ label, amount, total, color }) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-foreground">₹{fmt(amount)}</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Invoice row ───────────────────────────────────────────────────────────────

function InvoiceRow({ invoice, onStatusChange }) {
  const [updating, setUpdating] = useState(false);

  const markPaid = async () => {
    setUpdating(true);
    try {
      await api.updateInvoiceStatus(invoice.id, { status: 'paid' });
      onStatusChange();
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-border last:border-0 hover:bg-input/50 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold font-mono text-primary">{invoice.invoiceNumber}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${STATUS_STYLES[invoice.status] || ''}`}>
            {invoice.status?.replace('_', ' ')}
          </span>
        </div>
        <p className="text-xs text-muted mt-0.5 truncate">{invoice.billTo?.name || 'N/A'}</p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold">₹{fmtDec(invoice.grandTotal)}</p>
        {invoice.amountDue > 0 && invoice.status !== 'paid' && (
          <p className="text-[10px] text-red-500 font-medium">Due: ₹{fmtDec(invoice.amountDue)}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {invoice.pdfUrl && (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}${invoice.pdfUrl}?token=${typeof window !== 'undefined' ? localStorage.getItem('msme360_token') : ''}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-subtle hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
            title="Download PDF"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        )}
        {['sent', 'overdue', 'partially_paid'].includes(invoice.status) && (
          <button
            onClick={markPaid}
            disabled={updating}
            className="text-[10px] font-semibold px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all disabled:opacity-50"
          >
            {updating ? '...' : 'Mark Paid'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function FinancesPage() {
  const [overview,  setOverview]  = useState(null);
  const [gst,       setGst]       = useState([]);
  const [cashFlow,  setCashFlow]  = useState([]);
  const [aging,     setAging]     = useState(null);
  const [invoices,  setInvoices]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const [ov, g, cf, ag, inv] = await Promise.all([
        api.getFinanceOverview(),
        api.getGstSummary(),
        api.getCashFlow(),
        api.getAging(),
        api.getInvoices({ limit: 50 }),
      ]);
      setOverview(ov.overview);
      setGst(g.gstSummary || []);
      setCashFlow(cf.cashFlow || []);
      setAging(ag.aging);
      setInvoices(inv.invoices || []);
    } catch (e) {
      console.error('Finance load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredInvoices = filter === 'all'
    ? invoices
    : invoices.filter(i => i.status === filter);

  const agingTotal = aging
    ? Object.values(aging).reduce((s, v) => s + v, 0)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finances</h1>
          <p className="text-sm text-muted mt-0.5">GST ledger, invoice tracking & cash flow</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground border border-border rounded-xl hover:bg-input transition-all"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Overview cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Billed"
            value={overview.allTime.totalBilled}
            sub={`${overview.allTime.invoiceCount} invoices`}
            icon={Receipt}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            label="Collected"
            value={overview.allTime.totalPaid}
            sub="Payments received"
            icon={CheckCircle2}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
          />
          <StatCard
            label="Pending"
            value={overview.allTime.totalDue}
            sub={`${overview.overdueCount} overdue`}
            icon={Clock}
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-600"
          />
          <StatCard
            label="GST Collected"
            value={overview.allTime.totalGST}
            sub="Output tax (CGST+SGST)"
            icon={IndianRupee}
            color="bg-violet-100 dark:bg-violet-900/30 text-violet-600"
          />
        </div>
      )}

      {/* This Month highlight */}
      {overview?.thisMonth && (
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/15 rounded-2xl p-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm text-foreground">This Month</span>
          </div>
          <div className="flex gap-6 text-sm flex-wrap">
            <div><span className="text-muted">Billed </span><span className="font-bold">₹{fmt(overview.thisMonth.billed)}</span></div>
            <div><span className="text-muted">Collected </span><span className="font-bold text-emerald-600">₹{fmt(overview.thisMonth.paid)}</span></div>
            <div><span className="text-muted">GST </span><span className="font-bold text-violet-600">₹{fmt(overview.thisMonth.gst)}</span></div>
            <div><span className="text-muted">Discounts </span><span className="font-bold text-rose-500">₹{fmt(overview.thisMonth.discount || 0)}</span></div>
            <div><span className="text-muted">Invoices </span><span className="font-bold">{overview.thisMonth.count}</span></div>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cash flow chart */}
        <div className="md:col-span-2 bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Cash Flow (6 months)
          </h3>
          <div className="space-y-4">
            <BarChart data={cashFlow} valueKey="invoiced" label="Invoiced" color="var(--primary)" />
            <BarChart data={cashFlow} valueKey="collected" label="Collected" color="var(--accent)" />
          </div>
        </div>

        {/* Aging */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" /> Receivable Aging
          </h3>
          {aging && agingTotal > 0 ? (
            <div className="space-y-3">
              <AgingBar label="Current"  amount={aging.current}  total={agingTotal} color="#22c55e" />
              <AgingBar label="1–30 days" amount={aging['1-30']} total={agingTotal} color="#f59e0b" />
              <AgingBar label="31–60 days" amount={aging['31-60']} total={agingTotal} color="#f97316" />
              <AgingBar label="90+ days"  amount={aging['90+']}   total={agingTotal} color="#ef4444" />
              <div className="pt-2 border-t border-border flex justify-between text-sm font-bold">
                <span className="text-muted">Total Due</span>
                <span>₹{fmt(agingTotal)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-6">No pending receivables 🎉</p>
          )}
        </div>
      </div>

      {/* GST Summary */}
      {gst.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-violet-500" /> GST Summary (6 months)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted border-b border-border">
                  <th className="text-left pb-2 font-semibold uppercase tracking-wider">Month</th>
                  <th className="text-right pb-2 font-semibold uppercase tracking-wider">Billed</th>
                  <th className="text-right pb-2 font-semibold uppercase tracking-wider">Subtotal</th>
                  <th className="text-right pb-2 font-semibold uppercase tracking-wider">CGST</th>
                  <th className="text-right pb-2 font-semibold uppercase tracking-wider">SGST</th>
                  <th className="text-right pb-2 font-semibold uppercase tracking-wider">Total GST</th>
                </tr>
              </thead>
              <tbody>
                {gst.map((row) => (
                  <tr key={row.label} className="border-b border-border/50 hover:bg-input/30 transition-colors">
                    <td className="py-2 font-mono font-semibold text-foreground">{row.label}</td>
                    <td className="py-2 text-right">₹{fmt(row.totalBilled)}</td>
                    <td className="py-2 text-right">₹{fmt(row.subtotal)}</td>
                    <td className="py-2 text-right text-violet-600">₹{fmt(row.cgst)}</td>
                    <td className="py-2 text-right text-violet-600">₹{fmt(row.sgst)}</td>
                    <td className="py-2 text-right font-bold text-foreground">₹{fmt(row.totalGST)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-wrap">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> All Invoices
          </h3>
          <div className="ml-auto flex gap-2 flex-wrap">
            {['all', 'sent', 'paid', 'overdue', 'partially_paid', 'draft'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider transition-all ${
                  filter === s
                    ? 'bg-primary text-white'
                    : 'bg-input text-muted hover:bg-border'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No invoices yet.</p>
            <p className="text-xs mt-1">Go to Smart Inbox and ask me to create one!</p>
          </div>
        ) : (
          filteredInvoices.map(inv => (
            <InvoiceRow key={inv.id} invoice={inv} onStatusChange={load} />
          ))
        )}
      </div>
    </div>
  );
}
