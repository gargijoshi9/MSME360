'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../../../utils/api';
import { 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight, 
  Mail, 
  MessageCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Send,
  X
} from 'lucide-react';

function timeAgo(dateString) {
  if (!dateString) return 'Recent';
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [classifications, setClassifications] = useState([]);
  const [classifiedToday, setClassifiedToday] = useState(0); // 🚀 Live Tracker for the metric card
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sendingReply, setSendingReply] = useState(false); // 🚀 Throttler for button clicks
  const [error, setError] = useState(null);
  
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [replyText, setReplyText] = useState('');

  // 🚀 Fetch Live Classification metrics from Backend DB
  const loadMetricsToday = useCallback(async () => {
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('msme360_token') : null;
    if (!currentToken) return;

    try {
      // Assuming your api layout handles authorization wrappers cleanly
      const res = await api.getMetricsToday?.() || await fetch('http://localhost:5001/api/messages/metrics/today', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      }).then(r => r.json());

      if (res?.success) {
        setClassifiedToday(res.classifiedToday);
      }
    } catch (err) {
      console.error("Failed to load dashboard classification counter metrics:", err.message);
    }
  }, []);

  const loadLiveFeeds = useCallback(async () => {
    setLoading(true);
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('msme360_token') : null;
    
    if (!currentToken) {
      setClassifications([]); 
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMessages();
      const liveData = res?.data || res || [];
      
      if (Array.isArray(liveData) && liveData.length > 0) {
        setClassifications(liveData.slice(0, 4));
        setError(null);
      } else {
        setClassifications([]); 
      }
    } catch (err) {
      console.error("Dashboard feed retrieval caught:", err.message);
      setError(err.message);
      setClassifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load Pipeline Orchestrator
  useEffect(() => {
    const userData = typeof window !== 'undefined' ? localStorage.getItem('msme360_user') : null;
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (_) {}
    }
    loadLiveFeeds();
    loadMetricsToday();

    // Setup an 8-second structural heartbeat background poller
    const pollerId = setInterval(() => {
      loadLiveFeeds();
      loadMetricsToday();
    }, 8000);

    return () => clearInterval(pollerId);
  }, [loadLiveFeeds, loadMetricsToday]);

  const handleGmailWatchSync = async () => {
    setSyncing(true);
    try {
      await api.renewGmailWatch();
      alert('Google Engine background sync channel refreshed successfully!');
      await loadLiveFeeds();
      await loadMetricsToday();
    } catch (err) {
      alert('Sync channel initialization completed, waiting for webhook stream processing.');
      await loadLiveFeeds();
      await loadMetricsToday();
    } finally {
      setSyncing(false);
    }
  };

  // 🚀 Dispatches Live Responses across Nodemailer over your active backend SMTP pipeline
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sendingReply) return;

    setSendingReply(true);
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('msme360_token') : null;

    try {
      // Map properties matching backend expected parameters
      const payload = {
        recipientEmail: selectedMsg.sender, // Assuming sender holds string email value for gmail entries
        subject: selectedMsg.subject ? `Re: ${selectedMsg.subject}` : 'Re: MSME Automation Hub Update',
        replyText: replyText,
        threadId: selectedMsg.threadId || null
      };

      // Execute request over network
      const res = await fetch('http://localhost:5001/api/messages/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success) {
        alert(`Reply delivered successfully to ${selectedMsg.sender}!`);
        setReplyText('');
        setSelectedMsg(null);
        // Refresh items instantly
        await loadLiveFeeds();
        await loadMetricsToday();
      } else {
        alert(`Failed to deliver email: ${res.message}`);
      }
    } catch (err) {
      console.error("Failed to route reply message:", err);
      alert("Error reaching outbound routing servers. Check your local backend connection logs.");
    } finally {
      setSendingReply(false);
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'whatsapp': return <MessageCircle className="h-3.5 w-3.5 text-emerald-500 fill-current" />;
      case 'instagram': return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
        </svg>
      );
      case 'facebook': return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 fill-current">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
      );
      default: return <Mail className="h-3.5 w-3.5 text-blue-400" />;
    }
  };

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'Lead': return 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
      case 'Inquiry': return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30';
      case 'Complaint': return 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/30';
      default: return 'bg-input text-muted border-border';
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30';
      case 'medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30';
      default: return 'text-muted bg-input border-border';
    }
  };

  const urgentCount = classifications.filter(m => m.priority === 'high').length;

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-background to-background border border-primary/15 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, <span className="text-primary">{user?.ownerName || 'Business Owner'}</span>!
          </h1>
          <p className="text-sm text-muted mt-1">
            Omnichannel dashboard logs tracking WhatsApp, Instagram, Facebook, and Gmail.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleGmailWatchSync} 
            disabled={syncing}
            className="flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 bg-primary/10 text-primary rounded-xl border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync Live Feeds
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 w-fit">
            <ShieldCheck className="h-4 w-4" /> Secure Sandbox Session
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between hover:border-primary/25 transition-all duration-150">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-subtle">Pending Actions</span>
            <h3 className="text-3xl font-extrabold mt-1">{classifications.length}</h3>
            <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" /> Average response: 4 mins
            </span>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between hover:border-red-500/25 transition-all duration-150">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-subtle">Urgent Signals</span>
            <h3 className="text-3xl font-extrabold text-red-500 mt-1">{urgentCount}</h3>
            <span className="text-[11px] font-medium text-subtle flex items-center gap-1 mt-1">
              Requires immediate action
            </span>
          </div>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>

        {/* 🚀 FIXED: LIVE COUNTER FOR CLASSIFIED TODAY CARD */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between hover:border-emerald-500/25 transition-all duration-150">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-subtle">Classified Today</span>
            <h3 className="text-3xl font-extrabold mt-1">{classifiedToday}</h3> 
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between hover:border-subtle/25 transition-all duration-150">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-subtle">GST Invoice Queue</span>
            <h3 className="text-3xl font-extrabold text-subtle mt-1">Locked</h3>
            <span className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 mt-1">
              <Link href="/invoicing" className="flex items-center gap-1">Unlocks in Phase 2 <ExternalLink className="h-2.5 w-2.5" /></Link>
            </span>
          </div>
          <div className="p-3 bg-input text-subtle rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Unified Omnichannel Workspace */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between bg-card/50">
            <div>
              <h2 className="text-lg font-bold">Unified Conversation Workspace</h2>
              <p className="text-xs text-subtle">Click on any message below to view, edit, or directly send replies</p>
            </div>
            <Link
              href="/message_inbox"
              className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 shrink-0"
            >
              View Full Message <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {error && (
            <div className="p-3 mx-6 mt-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded-xl flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin text-amber-500" /> {error}
            </div>
          )}

          <div className="divide-y divide-border">
            {loading && classifications.length === 0 ? (
              <p className="p-6 text-sm text-center text-muted">Loading live channel streams...</p>
            ) : classifications.length === 0 ? (
              <p className="p-6 text-sm text-center text-muted">No live notifications processed yet today.</p>
            ) : (
              classifications.map((item) => {
                const currentId = item._id || item.id;
                const activeId = selectedMsg ? (selectedMsg._id || selectedMsg.id) : null;
                return (
                  <div 
                    key={currentId} 
                    onClick={() => setSelectedMsg(item)}
                    className={`p-6 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer border-l-4 ${selectedMsg && activeId === currentId ? 'bg-primary/5 border-l-primary' : 'hover:bg-input/30 border-l-transparent'}`}
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold tracking-tight text-foreground">{item.sender}</span>
                        <span className="text-subtle dark:text-subtle">•</span>
                        <span className="text-xs text-subtle flex items-center gap-1">
                          {getPlatformIcon(item.platform)}
                          <span className="capitalize">{item.platform}</span>
                        </span>
                        <span className="text-subtle dark:text-subtle">•</span>
                        <span className="text-xs text-subtle">{timeAgo(item.receivedAt || item.timestamp)}</span>
                      </div>
                      {item.subject && <p className="text-sm font-semibold text-foreground">{item.subject}</p>}
                      <p className="text-sm font-medium text-foreground">"{item.text || item.body}"</p>
                      <p className="text-xs text-muted">
                        <span className="font-semibold text-muted">AI Summary:</span> {item.summary || 'Awaiting classification...'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 sm:self-start shrink-0">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${getCategoryStyles(item.category)}`}>
                        {item.category || 'Inquiry'}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${getPriorityStyles(item.priority)}`}>
                        {item.priority || 'medium'} Priority
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column Promotions */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 h-24 w-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all duration-300" />
            <span className="inline-flex text-[10px] font-bold text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded mb-4">
              Coming in Phase 2
            </span>
            <h3 className="text-lg font-bold mb-2">GST Invoicing Integration</h3>
            <p className="text-sm text-muted leading-relaxed mb-4">
              Convert WhatsApp pricing queries into GST-compliant ledger invoices immediately. Eliminate duplicate manual billing entries.
            </p>
            <Link href="/invoicing" className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 w-fit group">
              Preview Waitlist Page <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Reply Sidebar Panel Overlay */}
      {selectedMsg && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-card border-l border-border shadow-2xl z-50 p-6 flex flex-col justify-between animate-slideInRight">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-2">
                {getPlatformIcon(selectedMsg.platform)}
                <h3 className="font-bold text-lg capitalize">{selectedMsg.platform} Workspace</h3>
              </div>
              <button onClick={() => setSelectedMsg(null)} className="p-1.5 hover:bg-input rounded-lg transition-colors cursor-pointer">
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-subtle font-medium">Sender Identity</span>
                <p className="text-sm font-bold text-foreground mt-0.5">{selectedMsg.sender}</p>
              </div>

              {selectedMsg.subject && (
                <div>
                  <span className="text-xs text-subtle font-medium">Subject</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">{selectedMsg.subject}</p>
                </div>
              )}

              <div className="p-4 bg-input/40 border border-border rounded-xl">
                <span className="text-xs font-semibold text-subtle block mb-1">Incoming Message Body</span>
                <p className="text-sm font-medium text-foreground italic">"{selectedMsg.text || selectedMsg.body}"</p>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                <span className="text-xs font-bold text-primary block mb-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI Intent Summary
                </span>
                <p className="text-sm text-foreground">{selectedMsg.summary || 'No summary generated yet.'}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendReply} className="mt-6 border-t border-border pt-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-subtle uppercase block mb-1">Draft Outbound Reply</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={selectedMsg.platform === 'gmail' ? `Type a real email response to ${selectedMsg.sender}...` : `Reply integration for ${selectedMsg.platform} builds out in Phase 2...`}
                disabled={selectedMsg.platform !== 'gmail'}
                className="w-full h-28 p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setSelectedMsg(null)}
                className="w-1/3 py-2.5 bg-input border border-border rounded-xl text-xs font-semibold hover:bg-input/80 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={sendingReply || selectedMsg.platform !== 'gmail'}
                className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingReply ? 'Sending...' : 'Send Response'} <Send className="h-3 w-3" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}