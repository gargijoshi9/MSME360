'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Inbox, 
  ReceiptText, 
  Store, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  User, 
  Lock, 
  Zap, 
  Loader2 
} from 'lucide-react';

export default function AuthenticatedLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // 1. Auth check
    const token = localStorage.getItem('msme360_token');
    const userData = localStorage.getItem('msme360_user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (_) {
      router.push('/login');
      return;
    }

    // 2. Theme check
    if (document.documentElement.classList.contains('dark')) {
      setDarkMode(true);
    }
    
    setLoading(false);
  }, [router]);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('msme360_theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('msme360_theme', 'dark');
      setDarkMode(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('msme360_token');
    localStorage.removeItem('msme360_user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <span className="text-sm font-semibold text-muted">Checking credentials...</span>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard',       path: '/dashboard',  icon: Home,        locked: false },
    { name: 'Smart Inbox',     path: '/inbox',      icon: Inbox,       locked: false },
    { name: 'Finances',        path: '/finances',   icon: ReceiptText, locked: false },
    { name: 'Vendor Directory',path: '/vendors',    icon: Store,       locked: true, label: 'Soon' },
    { name: 'Settings',        path: '/settings',   icon: Settings,    locked: false },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-card/85 backdrop-blur-md transition-colors duration-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <span className="p-1.5 bg-primary text-white rounded-lg shadow-sm">
              <Zap className="h-5 w-5 fill-current" />
            </span>
            MSME360
          </Link>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-input border border-transparent hover:border-border transition-all duration-150"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-muted" />}
            </button>
            <Link 
              href="/settings"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-input border border-border hover:bg-input/80 hover:border-primary/30 transition-all duration-150 group"
              title="View Profile"
            >
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase group-hover:bg-primary group-hover:text-white transition-all duration-150">
                {user?.ownerName ? user.ownerName.charAt(0) : 'U'}
              </div>
              <span className="text-sm font-semibold text-muted max-w-[120px] truncate hidden sm:inline group-hover:text-foreground transition-all duration-150">
                {user?.ownerName || 'User'}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-subtle hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* Sidebar - Desktop */}
        <aside className="w-64 border-r border-border bg-card shrink-0 hidden md:flex flex-col py-6 px-4 transition-colors duration-200">
          <div className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/15'
                      : 'hover:bg-input hover:text-foreground text-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-subtle group-hover:text-primary transition-colors'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.locked && (
                    <div className="flex items-center gap-1">
                      <Lock className="h-3 w-3 text-subtle dark:text-subtle" />
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-input text-muted'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-border">
            <div className="px-3.5 py-3 rounded-xl bg-input border border-border text-center">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-subtle mb-0.5">Company</span>
              <span className="block text-xs font-bold text-foreground truncate">
                {user?.companyName || 'Not Set'}
              </span>
            </div>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card flex items-center justify-around py-3 md:hidden transition-colors duration-200">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-subtle'
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.locked && (
                  <span className="absolute -top-1 -right-1 bg-subtle text-white rounded-full p-0.5">
                    <Lock className="h-2 w-2" />
                  </span>
                )}
              </div>
              <span>{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
