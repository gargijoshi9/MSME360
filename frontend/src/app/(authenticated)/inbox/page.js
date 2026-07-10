'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/utils/api';
import {
  Send, Paperclip, Bot, User, FileText, CheckCircle2,
  AlertTriangle, Download, X, Loader2, Sparkles,
  Receipt, TrendingUp, ChevronRight, RefreshCw,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

const WELCOME_MSG = {
  id:   'welcome',
  role: 'assistant',
  type: 'chat',
  text: `👋 **Namaste! I'm MSME Saathi** — your AI business assistant.

I can help you with:
- 🧾 **Create invoices** — *"Bill Ravi ₹5,000 for consulting"*
- 🔍 **Find past invoices** — *"Show me Sharma's invoice from last month"*
- 📊 **Finance queries** — *"What's my pending amount this quarter?"*
- 💡 **Business advice** — *"Tell me about MUDRA loan eligibility"*
- 📷 **Scan invoices** — upload any bill image to extract details

Aap kya jaanna chahte hain? What would you like to do?`,
};

// ── Markdown-lite renderer ─────────────────────────────────────────────────
function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-input px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\n/g, '<br/>');
}

// ── Message bubble ─────────────────────────────────────────────────────────

function MessageBubble({ msg, onConfirmInvoice, onSaveOcr }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 items-end">
        <div className="max-w-[80%] bg-primary text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed">
          {msg.file && (
            <div className="flex items-center gap-1.5 text-white/80 text-xs mb-1.5">
              <Paperclip className="h-3 w-3" /> {msg.file}
            </div>
          )}
          {msg.text}
        </div>
        <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-end">
      <div className="h-7 w-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
        <Bot className="h-4 w-4 text-accent" />
      </div>
      <div className="max-w-[85%] space-y-2">

        {/* Regular chat */}
        {(msg.type === 'chat' || !msg.type) && (
          <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text || '') }} />
          </div>
        )}

        {/* Invoice preview card */}
        {msg.type === 'invoice_preview' && msg.invoicePreview && (
          <InvoicePreviewCard
            preview={msg.invoicePreview}
            draftData={msg.draftData}
            onConfirm={onConfirmInvoice}
            responseText={msg.text}
          />
        )}

        {/* OCR result card */}
        {msg.type === 'ocr_result' && msg.structured && (
          <OcrResultCard
            structured={msg.structured}
            rawText={msg.rawText}
            suggestion={msg.suggestion}
            onSave={onSaveOcr}
          />
        )}

        {/* Error */}
        {msg.type === 'error' && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-2xl px-4 py-2.5 border border-red-200 dark:border-red-800/30">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Invoice preview card ───────────────────────────────────────────────────

function InvoicePreviewCard({ preview, draftData, onConfirm, responseText }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed]   = useState(false);
  const [pdfUrl, setPdfUrl]         = useState(null);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await api.confirmInvoice({ draftData });
      setConfirmed(true);
      setPdfUrl(res.pdfUrl);
      onConfirm && onConfirm(res.invoice);
    } catch (err) {
      alert(err.message || 'Failed to create invoice.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm max-w-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 border-b border-border">
        <Receipt className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-primary">Invoice Draft</span>
        <span className="ml-auto text-xs text-muted font-mono">{preview.invoiceNumber}</span>
      </div>

      {responseText && (
        <p className="px-4 pt-3 text-sm text-muted"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(responseText) }} />
      )}

      {/* Details */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Client</span>
          <span className="font-semibold">{preview.clientName}</span>
        </div>
        {preview.lineItems?.slice(0, 3).map((item, i) => (
          <div key={i} className="flex justify-between text-xs text-muted">
            <span className="truncate max-w-[160px]">{item.description}</span>
            <span>₹{item.total?.toFixed(2)}</span>
          </div>
        ))}
        {preview.lineItems?.length > 3 && (
          <p className="text-xs text-subtle">+{preview.lineItems.length - 3} more items</p>
        )}

        <div className="border-t border-border pt-2 space-y-1">
          <div className="flex justify-between text-xs text-muted">
            <span>Subtotal</span><span>₹{preview.subtotal?.toFixed(2)}</span>
          </div>
          {!preview.exemptGst && (preview.totalGST || 0) > 0 && (
            <div className="flex justify-between text-xs text-muted">
              <span>GST</span><span>₹{preview.totalGST?.toFixed(2)}</span>
            </div>
          )}
          {preview.discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-600 font-semibold">
              <span>Discount</span><span>-₹{preview.discount?.toFixed(2)}</span>
            </div>
          )}
          {preview.extraCharges > 0 && (
            <div className="flex justify-between text-xs text-amber-600 font-semibold">
              <span>Extra Charges</span><span>+₹{preview.extraCharges?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-foreground">
            <span>Total</span><span>₹{preview.grandTotal?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4">
        {confirmed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Invoice created!
            </div>
            {pdfUrl && (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}${pdfUrl}?token=${typeof window !== 'undefined' ? localStorage.getItem('msme360_token') : ''}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline font-semibold"
              >
                <Download className="h-4 w-4" /> Download PDF
              </a>
            )}
          </div>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:bg-muted text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {confirming ? 'Generating PDF...' : 'Confirm & Generate PDF'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── OCR result card ────────────────────────────────────────────────────────

function OcrResultCard({ structured, rawText, suggestion, onSave }) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveScannedInvoice({ structured, rawText });
      setSaved(true);
      onSave && onSave();
    } catch (err) {
      alert(err.message || 'Failed to save invoice.');
    } finally {
      setSaving(false);
    }
  };

  if (structured?.parseError) {
    return (
      <div className="bg-card border border-border rounded-2xl px-4 py-3 text-sm text-muted">
        OCR completed but could not extract structured data. Raw text available for review.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm max-w-sm">
      <div className="flex items-center gap-2 px-4 py-3 bg-accent/5 border-b border-border">
        <FileText className="h-4 w-4 text-accent" />
        <span className="text-sm font-bold text-accent">Scanned Invoice</span>
      </div>

      <div className="px-4 py-3 space-y-1.5 text-xs">
        {structured.vendorName   && <div className="flex justify-between"><span className="text-muted">Vendor</span><span className="font-semibold">{structured.vendorName}</span></div>}
        {structured.invoiceNumber && <div className="flex justify-between"><span className="text-muted">Invoice #</span><span className="font-mono">{structured.invoiceNumber}</span></div>}
        {structured.invoiceDate  && <div className="flex justify-between"><span className="text-muted">Date</span><span>{new Date(structured.invoiceDate).toLocaleDateString('en-IN')}</span></div>}
        {structured.grandTotal   && <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-1.5 mt-1.5"><span>Total</span><span>₹{structured.grandTotal}</span></div>}
      </div>

      {suggestion && <p className="px-4 pb-2 text-xs text-muted">{suggestion}</p>}

      <div className="px-4 pb-4">
        {saved ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
            <CheckCircle2 className="h-4 w-4" /> Saved to your records!
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:bg-muted text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save to Records'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [messages,  setMessages]  = useState([WELCOME_MSG]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const fileRef     = useRef(null);

  // Build Gemini-format history from messages (last 10 turns)
  const buildHistory = useCallback(() => {
    return messages
      .filter(m => m.id !== 'welcome' && (m.role === 'user' || m.role === 'assistant') && m.type !== 'invoice_preview' && m.type !== 'ocr_result')
      .slice(-10)
      .map(m => ({
        role:  m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text || '' }],
      }));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (msg) =>
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]);

  const sendText = async (text) => {
    if (!text.trim() || loading) return;
    setInput('');

    addMessage({ role: 'user', type: 'text', text });
    setLoading(true);

    try {
      const res = await api.chat({ message: text, history: buildHistory() });

      addMessage({
        role:           'assistant',
        type:           res.type || 'chat',
        text:           res.response || res.message || '',
        invoicePreview: res.invoicePreview,
        draftData:      res.draftData,
      });
    } catch (err) {
      addMessage({ role: 'assistant', type: 'error', text: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const sendFile = async (file) => {
    if (!file || loading) return;
    setLoading(true);

    addMessage({ role: 'user', type: 'text', text: `📎 ${file.name}`, file: file.name });

    try {
      const res = await api.chatWithFile({ file, history: buildHistory() });
      addMessage({
        role:       'assistant',
        type:       res.type || 'chat',
        text:       res.message || res.response || '',
        structured: res.structured,
        rawText:    res.rawText,
        suggestion: res.suggestion,
      });
    } catch (err) {
      addMessage({ role: 'assistant', type: 'error', text: err.message || 'Failed to process file.' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText(input);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) sendFile(file);
  };

  const QUICK_PROMPTS = [
    { label: '🧾 Create Invoice', text: 'Create an invoice for a client' },
    { label: '💰 Pending Amount', text: 'What is my total pending amount?' },
    { label: '📋 MUDRA Loan', text: 'Explain MUDRA loan eligibility and process' },
    { label: '📊 GST Due', text: 'How much GST do I owe this month?' },
  ];

  return (
    <div
      className="h-[calc(100vh-130px)] flex flex-col bg-background relative"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-2xl backdrop-blur-sm">
          <div className="text-center">
            <Paperclip className="h-12 w-12 text-primary mx-auto mb-3" />
            <p className="text-primary font-semibold text-lg">Drop invoice to scan with OCR</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center border border-border">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-base text-foreground">MSME Saathi</h1>
          <p className="text-xs text-muted">AI Business Assistant • RAG-powered</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs text-muted font-medium">Online</span>
        </div>
      </div>

      {/* Quick prompts (only when just welcome message) */}
      {messages.length === 1 && (
        <div className="px-5 pt-4 grid grid-cols-2 gap-2">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.label}
              onClick={() => sendText(qp.text)}
              className="flex items-center gap-2 px-3 py-2.5 bg-card border border-border rounded-xl text-sm text-muted hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
            >
              <span className="flex-1">{qp.label}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            onConfirmInvoice={() => {}}
            onSaveOcr={() => {}}
          />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2 items-end">
            <div className="h-7 w-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-accent" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5 items-center">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <div
                    key={i}
                    className="h-2 w-2 bg-muted rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-5 py-4 border-t border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          {/* File upload */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) sendFile(e.target.files[0]); e.target.value = ''; }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            title="Upload invoice to scan"
            className="p-2.5 text-subtle hover:text-primary hover:bg-primary/10 rounded-xl border border-border transition-all disabled:opacity-50 shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message or drop an invoice image here…"
              rows={1}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm resize-none disabled:opacity-60 max-h-32 overflow-y-auto"
              style={{ minHeight: '42px' }}
            />
          </div>

          {/* Send */}
          <button
            onClick={() => sendText(input)}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-primary hover:bg-primary-hover disabled:bg-muted text-white rounded-xl transition-all shrink-0 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
        <p className="text-[10px] text-subtle text-center mt-2">
          Press Enter to send • Shift+Enter for new line • Drop files to scan with OCR
        </p>
      </div>
    </div>
  );
}
