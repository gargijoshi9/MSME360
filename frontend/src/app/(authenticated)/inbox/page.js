'use client';

import { useState } from 'react';
import { 
  Inbox as InboxIcon, 
  Search, 
  MessageCircle, 
  Mail, 
  Send, 
  User, 
  Sparkles, 
  CornerDownLeft, 
  Filter, 
  Check, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function InboxPage() {
  const [filterChannel, setFilterChannel] = useState('all'); // 'all', 'whatsapp', 'gmail'
  const [filterCategory, setFilterCategory] = useState('all'); // 'all', 'Lead', 'Inquiry', 'Complaint', 'Support'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Master chat threads state
  const [threads, setThreads] = useState([
    {
      id: 1,
      name: 'Karan Johar',
      contact: '+91 98765 43210',
      platform: 'whatsapp',
      summary: 'Wants quote for 200 custom brass valves.',
      category: 'Lead',
      priority: 'high',
      time: '3m ago',
      unread: true,
      aiDraft: 'Hi Karan, thank you for reaching out to MSME360. We can manufacture and ship 200 units of custom brass valves to your facility. Our current lead time is 7 working days, and we will email a detailed PDF quotation to your contact. Please confirm if you require standard or express shipping.',
      messages: [
        { id: 101, sender: 'customer', text: 'Hello, are you the manager of MSME360 Manufacturing?', time: '10:14 AM' },
        { id: 102, sender: 'agent', text: 'Yes, welcome! How can I help you today?', time: '10:15 AM' },
        { id: 103, sender: 'customer', text: 'Need quote for 200 units of custom brass valves. Standard packing.', time: '10:16 AM' },
      ]
    },
    {
      id: 2,
      name: 'Tata Automotive Purchasing',
      contact: 'purchasing@tataautomotive.com',
      platform: 'gmail',
      summary: 'Requesting technical sheets for custom clearance of shipment #5591A.',
      category: 'Inquiry',
      priority: 'high',
      time: '24m ago',
      unread: true,
      aiDraft: 'Dear Purchasing Team, regarding shipment #5591A, we have uploaded the requested technical sheets to our shared drive. You can download the certificates directly or find them attached to our follow-up email. Let us know if customs requires additional certification.',
      messages: [
        { id: 201, sender: 'customer', text: 'We require technical sheets for shipment #5591A before clearing customs today. The cargo is stuck at Port B.', time: '09:50 AM' },
      ]
    },
    {
      id: 3,
      name: 'Ramesh Exports',
      contact: '+91 88877 66554',
      platform: 'whatsapp',
      summary: 'Catalog received confirmation.',
      category: 'Support',
      priority: 'low',
      time: '1h ago',
      unread: false,
      aiDraft: 'Glad you received the catalog, Ramesh. Let us know if you need any fabric samples sent over.',
      messages: [
        { id: 301, sender: 'agent', text: 'Sent you the new summer catalog. Let us know if you have any questions.', time: 'Yesterday' },
        { id: 302, sender: 'customer', text: 'Thank you for the catalog. I will review and let you know.', time: 'Yesterday' },
      ]
    },
    {
      id: 4,
      name: 'Sharma Textiles Billing',
      contact: 'billing@sharmatextiles.co',
      platform: 'gmail',
      summary: 'Complaining about double shipping fee charge on invoice #2024-889.',
      category: 'Complaint',
      priority: 'medium',
      time: '3h ago',
      unread: false,
      aiDraft: 'Dear Sharma Textiles, we apologize for the oversight on invoice #2024-889. We have verified the shipping fees and noticed a system glitch. A credit note for the double charge has been processed and will reflect in your ledger shortly.',
      messages: [
        { id: 401, sender: 'customer', text: 'Invoice #2024-889 has double charge on shipping fees. Please rectify.', time: '07:12 AM' },
      ]
    },
    {
      id: 5,
      name: 'Rajesh Kumar (Surat Textiles)',
      contact: '+91 99001 12233',
      platform: 'whatsapp',
      summary: 'Sunday operating hours query.',
      category: 'Inquiry',
      priority: 'low',
      time: '5h ago',
      unread: false,
      aiDraft: 'Hi Rajesh, our Surat warehouse is closed on Sundays. However, we open early on Monday mornings at 8:00 AM. Let us know if we should pre-pack your order.',
      messages: [
        { id: 501, sender: 'customer', text: 'Are you open on Sundays? Need to pick up stock.', time: '05:08 AM' },
      ]
    }
  ]);

  const [activeThreadId, setActiveThreadId] = useState(1);
  const [replyText, setReplyText] = useState('');

  // Selected active thread
  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    // Add message to active thread
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setThreads((prevThreads) => 
      prevThreads.map((thread) => {
        if (thread.id === activeThreadId) {
          return {
            ...thread,
            unread: false,
            messages: [
              ...thread.messages,
              {
                id: Date.now(),
                sender: 'agent',
                text: replyText.trim(),
                time: timeString
              }
            ]
          };
        }
        return thread;
      })
    );

    setReplyText('');
  };

  const useAiDraft = () => {
    if (activeThread?.aiDraft) {
      setReplyText(activeThread.aiDraft);
    }
  };

  const selectThread = (id) => {
    setActiveThreadId(id);
    // Mark as read
    setThreads((prevThreads) => 
      prevThreads.map((thread) => {
        if (thread.id === id) {
          return { ...thread, unread: false };
        }
        return thread;
      })
    );
  };

  // Filters logic
  const filteredThreads = threads.filter((t) => {
    const matchesChannel = 
      filterChannel === 'all' || 
      t.platform === filterChannel;

    const matchesCategory = 
      filterCategory === 'all' || 
      t.category === filterCategory;

    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contact.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesChannel && matchesCategory && matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row border border-border bg-card rounded-2xl overflow-hidden animate-fadeIn">
      {/* 1. Sidebar - Threads List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border flex flex-col h-1/2 md:h-full">
        {/* Search */}
        <div className="p-4 border-b border-border flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-input outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Channels/Categories Filter Toolbar */}
        <div className="p-3 bg-input/40 border-b border-border flex flex-col gap-2 shrink-0">
          {/* Channel Filters */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterChannel('all')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${
                filterChannel === 'all' 
                  ? 'bg-primary text-white border-primary' 
                  : 'bg-card text-slate-500 border-border hover:bg-input'
              }`}
            >
              All Channels
            </button>
            <button
              onClick={() => setFilterChannel('whatsapp')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 ${
                filterChannel === 'whatsapp' 
                  ? 'bg-emerald-500 text-white border-emerald-500' 
                  : 'bg-card text-slate-500 border-border hover:bg-input'
              }`}
            >
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </button>
            <button
              onClick={() => setFilterChannel('gmail')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 ${
                filterChannel === 'gmail' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-card text-slate-500 border-border hover:bg-input'
              }`}
            >
              <Mail className="h-3 w-3" /> Gmail
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-1">
            {['all', 'Lead', 'Inquiry', 'Complaint', 'Support'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-0.5 text-[9px] font-semibold rounded-md border ${
                  filterCategory === cat
                    ? 'bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-800'
                    : 'bg-card text-slate-500 border-border hover:bg-input'
                }`}
              >
                {cat === 'all' ? 'All Intents' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Threads list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <InboxIcon className="h-8 w-8 opacity-50" />
              <span className="text-xs font-semibold">No messages found</span>
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => selectThread(thread.id)}
                className={`w-full text-left p-4 hover:bg-input/20 transition-all flex flex-col gap-1.5 ${
                  thread.id === activeThreadId ? 'bg-input/40 border-l-4 border-primary' : ''
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`text-xs font-bold truncate ${thread.unread ? 'text-primary' : ''}`}>
                    {thread.name}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">{thread.time}</span>
                </div>
                
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate w-full">
                  {thread.summary}
                </div>

                <div className="flex items-center justify-between w-full mt-1.5">
                  <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-400">
                    {thread.platform === 'whatsapp' ? (
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-500 fill-current" />
                    ) : (
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    <span>{thread.platform === 'whatsapp' ? 'WhatsApp' : 'Gmail'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      thread.category === 'Lead' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                      thread.category === 'Inquiry' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                      thread.category === 'Complaint' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {thread.category}
                    </span>
                    {thread.priority === 'high' && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase bg-red-100 dark:bg-red-950/20 text-red-500 border border-red-200 dark:border-red-900/20">
                        High
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 2. Main Chat Panel */}
      <div className="flex-1 flex flex-col h-1/2 md:h-full bg-input/10">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {activeThread.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-xs font-bold">{activeThread.name}</h3>
              <p className="text-[10px] text-slate-400 font-medium">{activeThread.contact}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-border">
              Intent: {activeThread.category}
            </span>
          </div>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeThread.messages.map((msg) => {
            const isAgent = msg.sender === 'agent';
            return (
              <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'} animate-scaleIn`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                  isAgent 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-card border border-border text-foreground rounded-tl-none'
                }`}>
                  <p className="text-xs leading-relaxed font-medium">{msg.text}</p>
                  <span className={`block text-[9px] mt-1 text-right ${isAgent ? 'text-white/70' : 'text-slate-400'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-border bg-card">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              placeholder={`Reply to ${activeThread.name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-input outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs transition-all"
            />
            <button
              type="submit"
              className="px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all shadow hover:shadow-primary/20 flex items-center justify-center shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. AI Copilot Panel (Right Sidebar) */}
      <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-card p-6 flex flex-col gap-6 shrink-0 h-fit md:h-full overflow-y-auto">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <Sparkles className="h-5 w-5 fill-current" />
          <span>AI Copilot Analysis</span>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Intent Tagging</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 uppercase">
                {activeThread.category}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 uppercase">
                {activeThread.priority} Priority
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Executive Summary</h4>
            <div className="p-3 bg-input border border-border rounded-xl text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {activeThread.summary}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Suggested Smart Reply</h4>
              <button 
                onClick={useAiDraft}
                className="text-[10px] text-primary hover:underline font-bold flex items-center gap-0.5"
              >
                <CornerDownLeft className="h-3 w-3" /> Use Draft
              </button>
            </div>
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs leading-relaxed font-medium italic relative group">
              "{activeThread.aiDraft}"
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
          <Check className="h-4 w-4 text-emerald-500" />
          <span>Real-time analysis powered by Gemini</span>
        </div>
      </div>
    </div>
  );
}
