'use client';

import React, { useState } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import { CircleDollarSign, History } from 'lucide-react';

export default function CashbackSessionsPage() {
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
                <CircleDollarSign className="w-5 h-5 text-[var(--color-secondary)]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Financial Rewards
                </span>
              </div>
              <h1 className="page-title text-2xl font-bold">
                Cashback Sessions
              </h1>
              <p className="body-text text-xs mt-1">
                Customer gameplay cashback claims, redemption payouts, and UPI settlement logs (customer_cashback).
              </p>
            </div>
          </div>

          <div className="card-base p-12 text-center">
            <History className="w-12 h-12 mx-auto mb-3 text-[var(--color-border-strong)]" />
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              Cashback Activity Logs
            </p>
            <p className="small-text text-[var(--color-text-muted)] mt-1 max-w-md mx-auto">
              Logs of customer cashback redemptions from public.customer_cashback and game sessions.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
