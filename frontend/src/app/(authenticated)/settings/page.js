'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Mail, 
  MessageSquare, 
  Save, 
  Sliders, 
  Link as LinkIcon, 
  CheckCircle2, 
  X,
  Lock,
  Globe,
  DollarSign
} from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    email: '',
    businessType: 'Manufacturing',
    currency: 'INR',
    taxRate: '18'
  });

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('info'); // 'info', 'success'

  useEffect(() => {
    const userData = localStorage.getItem('msme360_user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setFormData((prev) => ({
          ...prev,
          companyName: parsed.companyName || '',
          ownerName: parsed.ownerName || '',
          email: parsed.email || '',
        }));
      } catch (_) {}
    }
  }, []);

  const triggerToast = (msg, type = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    // Simulate save
    triggerToast('Profile updates saved successfully in the sandbox environment.', 'success');
  };

  const handleConnectIntegration = (platform) => {
    if (platform === 'whatsapp') {
      triggerToast('WhatsApp Business webhook connection will unlock in Phase 2. Backend routes are prepared.', 'info');
    } else if (platform === 'gmail') {
      triggerToast('Gmail OAuth2 / PubSub integration will unlock in Phase 2. Backend services are prepared.', 'info');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn relative max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
          <Settings className="h-7 w-7 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted mt-1">
          Manage your business credentials, profile details, and external channel integrations.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Side: Navigation Quick Tabs */}
        <div className="md:col-span-1 space-y-2">
          <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-bold flex items-center gap-2">
            <User className="h-4 w-4" /> Account Profile
          </div>
          <div className="p-2.5 hover:bg-input rounded-xl text-xs font-semibold text-muted flex items-center gap-2 cursor-pointer transition-colors" onClick={() => triggerToast('Security settings unlock in Phase 2.')}>
            <Sliders className="h-4 w-4 text-subtle" /> Security & Billing
          </div>
          <div className="p-2.5 hover:bg-input rounded-xl text-xs font-semibold text-muted flex items-center gap-2 cursor-pointer transition-colors" onClick={() => triggerToast('Notification settings unlock in Phase 2.')}>
            <Sliders className="h-4 w-4 text-subtle" /> Notifications
          </div>
        </div>

        {/* Right Side: Content Panels */}
        <div className="md:col-span-2 space-y-8">
          {/* Profile Form */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-3 mb-5">
              Account Profile
            </h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Owner Name</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-input outline-none focus:border-primary transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-input outline-none focus:border-primary transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-input text-subtle outline-none cursor-not-allowed font-medium"
                  disabled
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Business Type</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-input outline-none focus:border-primary transition-all font-medium"
                  >
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Services">Services</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Currency</label>
                  <input
                    type="text"
                    value={formData.currency}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-input text-subtle outline-none cursor-not-allowed font-medium"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Default Tax (GST %)</label>
                  <input
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({...formData, taxRate: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-input outline-none focus:border-primary transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow hover:shadow-primary/20 transition-all ml-auto"
              >
                <Save className="h-4 w-4" /> Save Changes
              </button>
            </form>
          </div>

          {/* Integrations Card */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-3 mb-5">
              Integrations (Phase 2 Preview)
            </h3>
            
            <div className="space-y-4">
              {/* WhatsApp Connection Card */}
              <div className="p-4 border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
                    <MessageSquare className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      WhatsApp Business API 
                      <span className="text-[9px] bg-input text-muted px-1.5 py-0.5 rounded font-bold uppercase">Phase 2</span>
                    </h4>
                    <p className="text-[11px] text-muted leading-relaxed font-medium mt-0.5">
                      Sync and reply to customer inquiries instantly. Requires Phone Number ID setup.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleConnectIntegration('whatsapp')}
                  className="px-3.5 py-2 bg-card border border-border hover:bg-input rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 self-start sm:self-center shrink-0"
                >
                  <LinkIcon className="h-3.5 w-3.5 text-subtle" /> Connect Setup
                </button>
              </div>

              {/* Gmail Connection Card */}
              <div className="p-4 border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      Gmail Google Accounts 
                      <span className="text-[9px] bg-input text-muted px-1.5 py-0.5 rounded font-bold uppercase">Phase 2</span>
                    </h4>
                    <p className="text-[11px] text-muted leading-relaxed font-medium mt-0.5">
                      Sync customer mail histories and auto-triage emails using OAuth2 client flows.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleConnectIntegration('gmail')}
                  className="px-3.5 py-2 bg-card border border-border hover:bg-input rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 self-start sm:self-center shrink-0"
                >
                  <LinkIcon className="h-3.5 w-3.5 text-subtle" /> Connect OAuth
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Interactive Toast */}
      {showToast && (
        <div className={`fixed bottom-24 right-6 left-6 md:left-auto md:w-96 z-50 rounded-2xl p-4 shadow-2xl border flex items-start gap-3 animate-slideIn ${
          toastType === 'success' 
            ? 'bg-emerald-900 border-emerald-800 text-white' 
            : 'bg-card border-border text-foreground'
        }`}>
          <div className={`p-1.5 border rounded-lg shrink-0 mt-0.5 ${
            toastType === 'success' 
              ? 'bg-emerald-800/50 border-emerald-600 text-emerald-300' 
              : 'bg-primary/25 border-primary/45 text-primary'
          }`}>
            {toastType === 'success' ? (
              <CheckCircle2 className="h-4.5 w-4.5" />
            ) : (
              <Lock className="h-4.5 w-4.5 fill-current" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold">
              {toastType === 'success' ? 'Settings Saved' : 'Phase 2 Boilerplate'}
            </h4>
            <p className="text-[11px] text-muted leading-relaxed font-medium">
              {toastMessage}
            </p>
          </div>
          <button 
            onClick={() => setShowToast(false)}
            className="text-subtle hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
