'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootRouter() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('msme360_token');
    const user = localStorage.getItem('msme360_user');
    
    if (token && user) {
      router.replace('/dashboard');
    } else {
      router.replace('/landing');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <span className="text-sm font-semibold text-muted">Redirecting...</span>
    </div>
  );
}
