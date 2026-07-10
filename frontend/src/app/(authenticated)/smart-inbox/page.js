'use client';

import { useState } from 'react';
import { 
  Inbox, 
  Search, 
  MessageSquare, 
  Mail, 
  Facebook, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  User,
  Filter,
  Check,
  Send,
  FileText,
  AlertCircle
} from 'lucide-react';

const mockMessages = [
  {
    id: 1,
    sender: 'Ravi Kumar (+91 98765 43210)',
    platform: 'whatsapp',
    subject: 'Inquiry for Brass Valves',
    text: 'Namaste! Need quote for 200 units of custom brass valves. Standard packing, delivery to Jaipur. Please send as soon as possible.',
    summary: 'Quote inquiry for 200 brass valves to Jaipur',
    category: 'Lead',
    priority: 'high',
    time: '3 mins ago',
    status: 'unread',
    extracted: {
      client: 'Ravi Kumar',
      quantity: '200',
      item: 'custom brass valves'
    }
  },
  {
    id: 2,
    sender: 'purchasing@tataautomotive.com',
    platform: 'gmail',
    subject: 'Required Technical Specification Sheets',
    text: 'Hello team, We require technical sheets for shipment #5591A before clearing customs today. We are on a tight schedule, please expedite this.',
    summary: 'Tech sheets request for shipment #5591A',
    category: 'Inquiry',
    priority: 'high',
    time: '24 mins ago',
    status: 'unread',
    extracted: {
      client: 'Tata Automotive',
      reference: 'shipment #5591A'
    }
  },
  {
    id: 3,
    sender: 'Amit Sharma (+91 88877 66554)',
    platform: 'whatsapp',
    subject: 'Catalog Acknowledgment',
    text: 'Thank you for sending the catalog. I will review it with my team and let you know if we want to place an order.',
    summary: 'Catalog received confirmation',
    category: 'Support',
    priority: 'low',
    time: '1 hour ago',
    status: 'read',
    extracted: {}
  },
  {
    id: 4,
    sender: 'Vikram Sethi (Facebook Messenger)',
    platform: 'facebook',
    subject: 'Pricing Query: Silk Sarees',
    text: 'Hi, I saw your post. What is the wholesale price for the embroidered silk sarees if I order more than 50 pieces? Do you ship to Mumbai?',
    summary: 'Wholesale price inquiry for silk sarees',
    category: 'Lead',
    priority: 'medium',
    time: '2 hours ago',
    status: 'unread',
    extracted: {
      client: 'Vikram Sethi',
      item: 'embroidered silk sarees',
      quantity: '50+'
    }
  },
  {
    id: 5,
    sender: 'billing@sharmatextiles.co',
    platform: 'gmail',
    subject: 'Discrepancy in Invoice #2026-889',
    text: 'Dear MSME team, Invoice #2026-889 has double charge on shipping fees. It shows ₹1,200 instead of ₹600. Please rectify and send the revised bill.',
    summary: 'Incorrect double charge on invoice #2026-889',
    category: 'Complaint',
    priority: 'medium',
    time: '3 hours ago',
    status: 'unread',
    extracted: {
      client: 'Sharma Textiles',
      invoiceNumber: '#2026-889',
      discrepancy: 'Shipping fees'
    }
  },
  {
    id: 6,
    sender: 'Pooja Hegde (+91 99001 12233)',
    platform: 'whatsapp',
    subject: 'Store Hours Query',
    text: 'Are you open on Sundays? Need to pick up stock directly from your MG Road shop.',
    summary: 'Sunday operating hours query',
    category: 'Inquiry',
    priority: 'low',
    time: '5 hours ago',
    status: 'read',
    extracted: {}
  },
  {
    id: 7,
    sender: 'Neha Gupta (Facebook Messenger)',
    platform: 'facebook',
    subject: 'Custom Order Delivery Status',
    text: 'Hey! Is my order for the designer boxes ready? You said it would take 3 days, it has been 4 days. Please share tracking info.',
    summary: 'Delivery status inquiry for custom order',
    category: 'Complaint',
    priority: 'high',
    time: '1 day ago',
    status: 'resolved',
    extracted: {
      client: 'Neha Gupta',
      item: 'designer boxes'
    }
  }
];

export default function SmartInboxPage() {
  const [messages, setMessages] = useState(mockMessages);
  const [selectedId, setSelectedId] = useState(mockMessages[0]?.id || null);
  const [activeTab, setActiveTab] = useState('all'); // all, whatsapp, facebook, gmail
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');

  const selectedMessage = messages.find(m => m.id === selectedId);

  const filteredMessages = messages.filter(m => {
    const matchesTab = activeTab === 'all' || m.platform === activeTab;
    const matchesSearch = 
      m.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />;
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-500 fill-blue-500/10" />;
      case 'gmail':
        return <Mail className="h-4 w-4 text-rose-500" />;
      default:
        return <Inbox className="h-4 w-4 text-primary" />;
    }
  };

  const getPlatformStyles = (platform) => {
    switch (platform) {
      case 'whatsapp':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30';
      case 'facebook':
        return 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
      case 'gmail':
        return 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30';
      default:
        return 'bg-input text-muted border-border';
    }
  };

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'Lead':
        return 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300';
      case 'Inquiry':
        return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300';
      case 'Complaint':
        return 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300';
      default:
        return 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-300';
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30';
      case 'medium':
        return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30';
      default:
        return 'text-muted bg-input border-border';
    }
  };

  const handleMarkResolved = (id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'resolved' } : m));
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedId) return;
    alert(`Reply sent to ${selectedMessage.sender} via ${selectedMessage.platform.toUpperCase()}!`);
    setReplyText('');
    setMessages(prev => prev.map(m => m.id === selectedId ? { ...m, status: 'resolved' } : m));
  };

  return (
    <div className="h-[calc(100vh-130px)] flex flex-col bg-background animate-fadeIn">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-border bg-card/85 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" /> Smart Inbox
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Consolidated timeline for WhatsApp Business, Facebook Messenger, and Gmail accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-input p-0.5 border border-border">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'all' ? 'bg-primary text-white shadow-sm' : 'text-subtle hover:text-foreground'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'whatsapp' ? 'bg-primary text-white shadow-sm' : 'text-subtle hover:text-foreground'}`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setActiveTab('facebook')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'facebook' ? 'bg-primary text-white shadow-sm' : 'text-subtle hover:text-foreground'}`}
            >
              Facebook
            </button>
            <button
              onClick={() => setActiveTab('gmail')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'gmail' ? 'bg-primary text-white shadow-sm' : 'text-subtle hover:text-foreground'}`}
            >
              Gmail
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Message List */}
        <div className="w-full md:w-96 border-r border-border bg-card/40 flex flex-col">
          {/* Search bar */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search sender, keyword or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedId(msg.id)}
                  className={`w-full text-left p-4 hover:bg-input/50 transition-all flex flex-col gap-2 relative ${selectedId === msg.id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold truncate max-w-[170px] text-foreground">
                      {msg.sender.split(' (')[0]}
                    </span>
                    <span className="text-[10px] text-muted whitespace-nowrap flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {msg.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${getPlatformStyles(msg.platform)}`}>
                      {getPlatformIcon(msg.platform)}
                      <span className="capitalize">{msg.platform}</span>
                    </span>
                    {msg.status === 'unread' && (
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                    {msg.status === 'resolved' && (
                      <span className="inline-flex items-center text-[10px] text-emerald-500 font-medium">
                        <Check className="h-3 w-3" /> Resolved
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-foreground line-clamp-1">
                    {msg.subject}
                  </p>
                  <p className="text-xs text-subtle line-clamp-2 leading-relaxed">
                    {msg.text}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getCategoryStyles(msg.category)}`}>
                      {msg.category}
                    </span>
                    {msg.priority === 'high' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300">
                        Urgent
                      </span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted gap-2 h-48">
                <Inbox className="h-8 w-8 text-subtle" />
                <span className="text-xs font-medium">No messages match your filters</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Message Detail */}
        <div className="flex-1 hidden md:flex flex-col bg-background overflow-hidden relative">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Detail Header */}
              <div className="p-5 border-b border-border bg-card/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{selectedMessage.sender}</h3>
                    <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                      Received via <span className="capitalize font-semibold text-foreground">{selectedMessage.platform}</span> • {selectedMessage.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedMessage.status !== 'resolved' && (
                    <button
                      onClick={() => handleMarkResolved(selectedMessage.id)}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Mark Resolved
                    </button>
                  )}
                </div>
              </div>

              {/* Message Content Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Subject & Body */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-subtle uppercase tracking-wider">Subject</span>
                    <h2 className="text-base font-extrabold text-foreground mt-0.5">{selectedMessage.subject}</h2>
                  </div>
                  <div className="border-t border-border pt-4">
                    <span className="text-[10px] font-bold text-subtle uppercase tracking-wider block mb-1">Message Body</span>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedMessage.text}</p>
                  </div>
                </div>

                {/* AI Classification Insights */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute right-0 top-0 bg-primary/10 text-primary px-3 py-1 text-[10px] font-bold rounded-bl-xl flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI Analysis
                  </div>

                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    Saathi Intelligence
                  </h3>

                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                    <div>
                      <span className="text-[10px] text-muted font-medium">Intent Classification</span>
                      <p className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-xs ${getCategoryStyles(selectedMessage.category)}`}>
                          {selectedMessage.category}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted font-medium">Priority Level</span>
                      <p className="text-sm font-bold mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-xs border ${getPriorityStyles(selectedMessage.priority)}`}>
                          {selectedMessage.priority.toUpperCase()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <span className="text-[10px] text-muted font-medium block">Executive Summary</span>
                    <p className="text-xs text-foreground mt-1 leading-relaxed italic bg-input/50 p-2.5 rounded-xl border border-border">
                      "{selectedMessage.summary}"
                    </p>
                  </div>

                  {Object.keys(selectedMessage.extracted).length > 0 && (
                    <div className="border-t border-border pt-4">
                      <span className="text-[10px] text-muted font-medium block mb-1.5">Extracted Entities</span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedMessage.extracted).map(([key, value]) => (
                          <div key={key} className="bg-input border border-border rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                            <span className="text-[10px] text-muted capitalize">{key}:</span>
                            <span className="text-[10px] font-bold text-foreground">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMessage.category === 'Lead' && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4.5 w-4.5 text-primary" />
                        <span className="text-xs text-foreground font-semibold">Generate a draft invoice for this inquiry?</span>
                      </div>
                      <button
                        onClick={() => alert('Invoice generator triggered with extracted entities!')}
                        className="px-3 py-1 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold rounded-lg transition-all"
                      >
                        Draft Invoice
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reply/Action input box at bottom */}
              <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <textarea
                    rows={1}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Type a response to reply via ${selectedMessage.platform.toUpperCase()}...`}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs resize-none"
                    style={{ minHeight: '38px' }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="p-2.5 bg-primary hover:bg-primary-hover disabled:bg-muted text-white rounded-xl transition-all disabled:opacity-55"
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted gap-3">
              <Inbox className="h-12 w-12 text-subtle" />
              <p className="text-sm font-semibold">Select a message to view details and reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
