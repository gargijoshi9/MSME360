'use client';

import { useState } from 'react';
import { 
  Store, 
  Search, 
  MapPin, 
  Star, 
  PhoneCall, 
  FileSpreadsheet, 
  PlusCircle, 
  Lock, 
  Check, 
  X, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function VendorsPage() {
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (actionName) => {
    setToastMessage(`The "${actionName}" action is currently in development for Phase 3 B2B integration.`);
    setShowToast(true);
    
    // Auto hide after 4 seconds
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const mockVendors = [
    {
      id: 1,
      name: 'Acme Textiles & Rayon',
      category: 'Textiles',
      location: 'Surat, Gujarat',
      rating: 4.8,
      reviews: 142,
      desc: 'Premium cotton rolls, linen fabric, and synthetic dyes supplying domestic and export hubs.',
      verified: true,
      minOrder: '₹50,000',
    },
    {
      id: 2,
      name: 'Precision Alloys & Brass',
      category: 'Manufacturing',
      location: 'Jamnagar, Gujarat',
      rating: 4.9,
      reviews: 98,
      desc: 'Manufacturer of custom threaded screws, brass adapters, valves, and copper castings.',
      verified: true,
      minOrder: '₹75,000',
    },
    {
      id: 3,
      name: 'Chennai Foundry Castings',
      category: 'Metal Works',
      location: 'Chennai, Tamil Nadu',
      rating: 4.6,
      reviews: 64,
      desc: 'High-temperature iron casting, structural molds, CNC milling, and sheet metal parts.',
      verified: false,
      minOrder: '₹1,50,000',
    },
    {
      id: 4,
      name: 'Himalayan Organic Packing',
      category: 'Packaging',
      location: 'Solan, Himachal Pradesh',
      rating: 4.7,
      reviews: 110,
      desc: 'Eco-friendly double-walled corrugated boxes, kraft paper rolls, and biodegradable padding.',
      verified: true,
      minOrder: '₹20,000',
    },
    {
      id: 5,
      name: 'Silicon Valley Mold Plastics',
      category: 'Plastics',
      location: 'Bengaluru, Karnataka',
      rating: 4.5,
      reviews: 55,
      desc: 'Custom injection molds, PET plastic bottles, custom caps, and industrial rubber gaskets.',
      verified: false,
      minOrder: '₹35,000',
    }
  ];

  // Filtering
  const filteredVendors = mockVendors.filter((v) => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase()) ||
    v.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Store className="h-7 w-7 text-primary" /> Vendor Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Connect directly with verified raw material suppliers and wholesalers across India.
          </p>
        </div>
        <button 
          onClick={() => triggerToast('Add Custom Vendor')}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow hover:shadow-primary/20 transition-all w-fit"
        >
          <PlusCircle className="h-4 w-4" /> Add Vendor
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-card border border-border p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by name, category, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-border bg-input outline-none focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => triggerToast('Open Filter Modal')}
            className="w-full sm:w-auto px-4 py-2.5 bg-card hover:bg-input border border-border rounded-xl font-semibold text-xs transition-all"
          >
            Filter Industry
          </button>
          <button 
            onClick={() => triggerToast('Open Sort Menu')}
            className="w-full sm:w-auto px-4 py-2.5 bg-card hover:bg-input border border-border rounded-xl font-semibold text-xs transition-all"
          >
            Sort by Rating
          </button>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => (
          <div key={vendor.id} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            <div className="p-6 flex-1 space-y-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {vendor.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {vendor.name}
                  </h3>
                </div>
                {vendor.verified && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold">
                    <Check className="h-2.5 w-2.5" /> Verified
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {vendor.desc}
              </p>

              <div className="space-y-1 pt-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{vendor.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-current" />
                  <span>
                    <strong className="text-slate-700 dark:text-slate-300">{vendor.rating}</strong> ({vendor.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-input/20 flex items-center justify-between text-xs gap-3">
              <div>
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Min Order</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{vendor.minOrder}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => triggerToast(`Contact ${vendor.name}`)}
                  className="px-3 py-2 bg-card hover:bg-input border border-border rounded-lg font-semibold flex items-center gap-1 text-xs transition-all"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-slate-500" /> Contact
                </button>
                <button
                  onClick={() => triggerToast(`Request RFQ to ${vendor.name}`)}
                  className="px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold flex items-center gap-1 text-xs transition-all"
                >
                  RFQ <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Interactive Toast */}
      {showToast && (
        <div className="fixed bottom-24 right-6 left-6 md:left-auto md:w-96 z-50 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex items-start gap-3 animate-slideIn">
          <div className="p-1.5 bg-primary/25 border border-primary/45 rounded-lg text-primary mt-0.5">
            <Lock className="h-4.5 w-4.5 fill-current text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold flex items-center gap-1">
              Phase 3 Feature <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded font-normal">Coming Soon</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              {toastMessage}
            </p>
          </div>
          <button 
            onClick={() => setShowToast(false)}
            className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
