'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../utils/api';
import {
  MessageSquare,
  Mail,
  MessageCircle,
  Sparkles,
  Send,
  X,
  RefreshCw,
  Inbox as InboxIcon,
} from 'lucide-react';

function timeAgo(dateString) {
  if (!dateString) return '';
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function InboxPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [user, setUser] = useState(null);

  const loadMessages = useCallback(async (showSilentLoader = false) => {
    if (!showSilentLoader) setLoading(true);
    setError(null);
    try {
      const res = await api.getMessages();
      // Safely ensure data array extracts properly from payload envelope shapes
      const extractedData = res?.data || res || [];
      setMessages(Array.isArray(extractedData) ? extractedData : []);
    } catch (err) {
      console.error('[Inbox] Failed to load messages:', err.message);
      setError('Could not load your inbox. Is your Gmail connected and the watch subscription active?');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('msme360_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (_) {}
      loadMessages();
    } else {
      setError('Session expired. Please log out and sign back in to establish authentication.');
      setLoading(false);
    }
  }, [loadMessages]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages(true);
    setRefreshing(false);
  };

  const handleSendReply = async (e) => {
  e.preventDefault();
  if (!replyText.trim() || sendingReply) return;

  // Make sure you define this state at the top of your component if it isn't there:
  // const [sendingReply, setSendingReply] = useState(false);
  setSendingReply(true); 
  
  const currentToken = typeof window !== 'undefined' ? localStorage.getItem('msme360_token') : null;

  try {
    const payload = {
      recipientEmail: selectedMsg.sender, 
      subject: selectedMsg.subject ? `Re: ${selectedMsg.subject}` : 'Re: MSME Automation Hub Update',
      replyText: replyText,
      threadId: selectedMsg.threadId || null
    };

    console.log("[Inbox API Debug] Dispatching Reply Payload:", payload);

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
      
      // Call your feed reloads if they are passed down as props or defined in this file
      if (typeof loadLiveFeeds === 'function') await loadLiveFeeds();
      if (typeof loadMetricsToday === 'function') await loadMetricsToday();
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
      case 'whatsapp':
        return <MessageCircle className="h-3.5 w-3.5 text-emerald-500 fill-current" />;
      case 'instagram':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        );
      case 'facebook':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 fill-current">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>
        );
      default:
        return <Mail className="h-3.5 w-3.5 text-blue-400" />;
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

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-background to-background border border-primary/15 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <InboxIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Smart Inbox</h1>
            <p className="text-sm text-muted mt-0.5">
              Live messaging logs channel tracking user workspace: <span className="font-semibold text-primary">{user?.googleEmail || 'Active Tenant'}</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 bg-primary/10 text-primary rounded-xl border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh Feed
        </button>
      </div>

      {/* Body */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between bg-card/50">
          <div>
            <h2 className="text-lg font-bold">All Conversations</h2>
            <p className="text-xs text-subtle">Click any message to view details or reply</p>
          </div>
          <span className="text-xs font-semibold text-subtle">{messages.length} message{messages.length === 1 ? '' : 's'}</span>
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <p className="p-6 text-sm text-center text-muted">Loading your inbox...</p>
          ) : error ? (
            <div className="p-6 text-sm text-center text-red-500">{error}</div>
          ) : messages.length === 0 ? (
            <div className="p-10 text-center">
              <MessageSquare className="h-8 w-8 text-subtle mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">No sync entries found</p>
              <p className="text-xs text-subtle mt-1 max-w-sm mx-auto">
                Your database API connected successfully with a 200 payload response, but no record lines exist yet. Send a test email to your linked address to push data streams.
              </p>
            </div>
          ) : (
            messages.map((item) => {
              const currentId = item._id || item.id;
              return (
                <div
                  key={currentId}
                  onClick={() => setSelectedMsg(item)}
                  className={`p-6 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer border-l-4 ${
                    selectedMsg?._id === currentId ? 'bg-primary/5 border-l-primary' : 'hover:bg-input/30 border-l-transparent'
                  }`}
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold tracking-tight text-foreground">{item.sender}</span>
                      <span className="text-subtle">•</span>
                      <span className="text-xs text-subtle flex items-center gap-1">
                        {getPlatformIcon(item.platform)}
                        <span className="capitalize">{item.platform}</span>
                      </span>
                      <span className="text-subtle">•</span>
                      <span className="text-xs text-subtle">{timeAgo(item.receivedAt)}</span>
                    </div>
                    {item.subject && (
                      <p className="text-sm font-semibold text-foreground">{item.subject}</p>
                    )}
                    <p className="text-sm font-medium text-foreground">"{item.text}"</p>
                    {item.summary && (
                      <p className="text-xs text-muted">
                        <span className="font-semibold text-muted">AI Summary:</span> {item.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:self-start shrink-0">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${getCategoryStyles(item.category)}`}>
                      {item.category}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${getPriorityStyles(item.priority)}`}>
                      {item.priority} Priority
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Reply Sidebar Panel Overlay */}
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
                <span className="text-xs font-semibold text-subtle block mb-1">Message Body</span>
                <p className="text-sm font-medium text-foreground italic">"{selectedMsg.text}"</p>
              </div>

              {selectedMsg.summary && (
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                  <span className="text-xs font-bold text-primary block mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI Intent Summary
                  </span>
                  <p className="text-sm text-foreground">{selectedMsg.summary}</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSendReply} className="mt-6 border-t border-border pt-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-subtle uppercase block mb-1">Draft Outbound Reply</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Type a direct message response to ${selectedMsg.sender}...`}
                className="w-full h-28 p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none"
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
                className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/10 cursor-pointer"
              >
                Send Response <Send className="h-3 w-3" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}