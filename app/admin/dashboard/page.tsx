'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import { getTodayBillsCount, getTodaySessionsCount } from '@/lib/sessionStore';
import {
  Receipt,
  History,
  LayoutDashboard,
  Loader2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [todayBills, setTodayBills] = useState<number>(0);
  const [todaySessions, setTodaySessions] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      const [billsCount, sessionsCount] = await Promise.all([
        getTodayBillsCount(),
        getTodaySessionsCount(),
      ]);

      if (!active) return;
      setTodayBills(billsCount);
      setTodaySessions(sessionsCount);
      setLoading(false);
    }

    loadStats();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LayoutDashboard
                  className="w-5 h-5"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Overview &amp; Metrics
                </span>
              </div>
              <h1 className="page-title text-2xl font-bold">
                Admin Dashboard
              </h1>
              <p className="body-text text-xs mt-1">
                Real-time activity and daily performance counters for bills and customer sessions.
              </p>
            </div>
          </div>

          {/* Core Daily Counters: Total Bills (today count) and Total Sessions (today) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* 1. Total Bills (today count) */}
            <div className="card-base p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="label-text text-sm font-semibold">
                    Total Bills (Today)
                  </span>
                  <div
                    className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    <Receipt className="w-6 h-6" />
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-5 h-5 anim-spin text-[var(--color-secondary)]" />
                    <span className="text-xs text-[var(--color-text-muted)]">Loading bills...</span>
                  </div>
                ) : (
                  <div>
                    <p className="stat-value text-3xl font-bold font-mono" style={{ color: 'var(--color-primary)' }}>
                      {todayBills}
                    </p>
                    <p className="small-text mt-1 text-[var(--color-text-muted)]">
                      Invoices generated or issued today
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t flex items-center justify-between border-[var(--color-border-subtle)]">
                <Link
                  href="/admin/bills/dashboard"
                  className="text-xs font-semibold flex items-center gap-1.5 transition-colors hover:underline"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  <span>View all partner bills</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="badge-base badge-primary text-[11px] font-mono">
                  Today
                </span>
              </div>
            </div>

            {/* 2. Total Sessions (today) */}
            <div className="card-base p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="label-text text-sm font-semibold">
                    Total Sessions (Today)
                  </span>
                  <div
                    className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--color-secondary-light)',
                      color: 'var(--color-secondary)',
                    }}
                  >
                    <History className="w-6 h-6" />
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-5 h-5 anim-spin text-[var(--color-secondary)]" />
                    <span className="text-xs text-[var(--color-text-muted)]">Loading sessions...</span>
                  </div>
                ) : (
                  <div>
                    <p className="stat-value text-3xl font-bold font-mono" style={{ color: 'var(--color-secondary)' }}>
                      {todaySessions}
                    </p>
                    <p className="small-text mt-1 text-[var(--color-text-muted)]">
                      Customer gameplay sessions logged today
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t flex items-center justify-between border-[var(--color-border-subtle)]">
                <Link
                  href="/admin/pointssession"
                  className="text-xs font-semibold flex items-center gap-1.5 transition-colors hover:underline"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  <span>View points sessions log</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="badge-base badge-secondary text-[11px] font-mono">
                  Today
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
