'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getCurrentUserRole } from '@/lib/auth';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const user = await getCurrentUser();
      if (!user) {
        if (isMounted) {
          router.replace('/login');
        }
        return;
      }

      const role = await getCurrentUserRole();
      if (role !== 'admin') {
        if (isMounted) {
          // User is authenticated but does not have admin privileges
          if (role === 'partner') {
            router.replace('/partner/dashboard');
          } else {
            router.replace('/login');
          }
        }
        return;
      }

      if (isMounted) {
        setAuthorized(true);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (authorized === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        <p className="text-sm font-medium">Verifying administrator access...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-700 gap-3 p-4">
        <ShieldAlert className="w-10 h-10 text-red-500" />
        <h2 className="text-lg font-bold text-slate-900">Access Denied</h2>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          You must be signed in as an administrator to access this area.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
