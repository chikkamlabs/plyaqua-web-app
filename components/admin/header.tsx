'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <header
      className="sticky top-0 z-30 h-16 border-b px-4 sm:px-6 flex items-center justify-between"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Left side: 3 lines for sidebar control (mobile/tablet) + Logo + PlyAqua */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="lg:hidden p-2 rounded-[var(--radius-md)] transition-colors focus:outline-none"
          style={{
            color: 'var(--color-text-secondary)',
          }}
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 relative rounded-[var(--radius-md)] overflow-hidden border shadow-sm flex items-center justify-center"
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
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--color-primary)' }}
          >
            PlyAqua
          </span>
        </div>
      </div>

      {/* Right side: Logout button */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleLogout}
          className="btn-base btn-outline text-xs sm:text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
