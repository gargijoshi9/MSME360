'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  ShieldCheck
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('msme360_user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (_) {}
    }
  }, []);

  // Mock decision events/activity feed
  const mockClassifications = [
    {
      id: 1,
      sender: '+91 98765 43210',
      platform: 'whatsapp',
      text: 'Need quote for 200 units of custom brass valves. Standard packing.',
      summary: 'Quote inquiry for 200 brass valves',
      category: 'Lead',
      priority: 'high',
      time: '3 mins ago',
    },
    {
      id: 2,
      sender: 'purchasing@tataautomotive.com',
      platform: 'gmail',
      text: 'We require technical sheets for shipment #5591A before clearing customs today.',
      summary: 'Tech sheets request for shipment #5591A',
      category: 'Inquiry',
      priority: 'high',
      time: '24 mins ago',
    },
    {
      id: 3,
      sender: '+91 88877 66554',
      platform: 'whatsapp',
      text: 'Thank you for the catalog. I will review and let you know.',
      summary: 'Catalog received confirmation',
      category: 'Support',
      priority: 'low',
      time: '1 hour ago',
    },
    {
      id: 4,
      sender: 'billing@sharmatextiles.co',
      platform: 'gmail',
      text: 'Invoice #2024-889 has double charge on shipping fees. Please rectify.',
      summary: 'Incorrect double charge on invoice #2024-889',
      category: 'Complaint',
      priority: 'medium',
      time: '3 hours ago',
    },
    {
      id: 5,
      sender: '+91 99001 12233',
      platform: 'whatsapp',
      text: 'Are you open on Sundays? Need to pick up stock.',
      summary: 'Sunday operating hours query',
      category: 'Inquiry',
      priority: 'low',
      time: '5 hours ago',
    },
  ];

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'Lead':
        return 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
      case 'Inquiry':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30';
      case 'Complaint':
        return 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/30';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-border';
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30';
      case 'medium':
        return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30';
      default:
        return 'text-slate-400 bg-slate-50 dark:bg-slate-800 border-border';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-background to-background border border-primary/15 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, <span className="text-primary">{user?.ownerName || 'Business Owner'}</span>!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's what happened with your business chats and emails today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 w-fit">
          <ShieldCheck className="h-4 w-4" /> Secure Sandbox Session
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between hover:border-primary/25 transition-all duration-150">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Messages</span>
            <h3 className="text-3xl font-extrabold mt-1">8</h3>
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
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Urgent Signals</span>
            <h3 className="text-3xl font-extrabold text-red-500 mt-1">3</h3>
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mt-1">
              Requires immediate action
            </span>
          </div>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between hover:border-emerald-500/25 transition-all duration-150">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Classified Today</span>
            <h3 className="text-3xl font-extrabold mt-1">27</h3>
            <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1 mt-1">
              +14% since yesterday
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between hover:border-slate-400/25 transition-all duration-150">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">GST Invoice Queue</span>
            <h3 className="text-3xl font-extrabold text-slate-400 mt-1">Locked</h3>
            <span className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 mt-1">
              <Link href="/invoicing" className="flex items-center gap-1">Unlocks in Phase 2 <ExternalLink className="h-2.5 w-2.5" /></Link>
            </span>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Activity Feed & Promotion */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Classification Activity */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between bg-card/50">
            <div>
              <h2 className="text-lg font-bold">Recent Message Classifications</h2>
              <p className="text-xs text-slate-400">Live AI intent sorting and analysis logs</p>
            </div>
            <Link 
              href="/inbox" 
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 border border-primary/20 hover:border-primary px-3 py-1.5 rounded-lg transition-all"
            >
              Open Smart Inbox <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {mockClassifications.map((item) => (
              <div key={item.id} className="p-6 hover:bg-input/30 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-300">
                      {item.sender}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      {item.platform === 'whatsapp' ? (
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-500 fill-current" />
                      ) : (
                        <Mail className="h-3.5 w-3.5 text-blue-500" />
                      )}
                      {item.platform === 'whatsapp' ? 'WhatsApp' : 'Gmail'}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs text-slate-400">{item.time}</span>
                  </div>
                  
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    "{item.text}"
                  </p>
                  
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">AI Summary:</span> {item.summary}
                  </p>
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
            ))}
          </div>
        </div>

        {/* Right Column: Dynamic Feature Roadmap Promotions */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 h-24 w-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all duration-300" />
            <span className="inline-flex text-[10px] font-bold text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded mb-4">
              Coming in Phase 2
            </span>
            <h3 className="text-lg font-bold mb-2">GST Invoicing Integration</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Convert WhatsApp pricing queries into GST-compliant ledger invoices immediately. Eliminate duplicate manual billing entries.
            </p>
            <Link 
              href="/invoicing" 
              className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 w-fit group"
            >
              Preview Waitlist Page <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 h-24 w-24 bg-accent/10 rounded-full blur-xl group-hover:bg-accent/20 transition-all duration-300" />
            <span className="inline-flex text-[10px] font-bold text-accent uppercase bg-accent/10 border border-accent/20 px-2 py-0.5 rounded mb-4">
              Coming in Phase 3
            </span>
            <h3 className="text-lg font-bold mb-2">National B2B Suppliers</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Search vetted wholesale suppliers of textile, machinery parts, metal ores, and organic raw products near you.
            </p>
            <Link 
              href="/vendors" 
              className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1 w-fit group"
            >
              Browse Vendor Mockups <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
