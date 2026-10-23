'use client';

import React, { useState } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import { Megaphone, Plus } from 'lucide-react';

export default function AdvContentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Megaphone className="w-5 h-5 text-[var(--color-secondary)]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Marketing &amp; Media
                </span>
              </div>
              <h1 className="page-title text-2xl font-bold">
                Ads Content
              </h1>
              <p className="body-text text-xs mt-1">
                Manage promotional media assets, advertising banners, and campaign creatives (ad_content).
              </p>
            </div>
            <button type="button" className="btn-base btn-primary text-xs shadow-xs">
              <Plus className="w-4 h-4" />
              <span>New Ad Content</span>
            </button>
          </div>

          <div className="card-base p-12 text-center">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-[var(--color-border-strong)]" />
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              Advertising Media Library
            </p>
            <p className="small-text text-[var(--color-text-muted)] mt-1 max-w-md mx-auto">
              Promotional ad content registered in public.ad_content. Configure media assets to associate with promotional campaigns.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
