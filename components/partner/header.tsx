'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth';

export default function PartnerHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <header
      className="sticky top-0 z-30 h-16 border-b px-4 sm:px-6 flex items-center justify-between transition-colors"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* On left: Logo + PlyAqua */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 relative rounded-[var(--radius-md)] overflow-hidden border shadow-sm flex items-center justify-center shrink-0"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <Image
            src="/plyaqua_logo.png"
            alt="PlyAqua Logo"
            width={36}
            height={36}
            priority
            referrerPolicy="no-referrer"
            className="object-contain"
          />
        </div>
        <span
          className="text-lg sm:text-xl font-bold tracking-tight"
          style={{ color: 'var(--color-primary)' }}
        >
          PlyAqua
        </span>
      </div>

      {/* On right: Logout button */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleLogout}
          className="btn-base btn-outline text-xs sm:text-sm py-1.5 px-3"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
