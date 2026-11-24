'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getAdminPartnerPointsData,
  formatDateYMD,
  AdminPartnerPointsSummary,
  PartnerPointRecord,
} from '@/lib/partnerpointsStore';
import {
  ArrowLeft,
  Store,
  Coins,
  Award,
  Loader2,
  AlertCircle,
  Calendar,
  PlusCircle,
  MinusCircle,
  Receipt,
  Filter,
  RotateCcw,
} from 'lucide-react';

function getLastOneWeekRange() {
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    from: formatDateYMD(oneWeekAgo),
    to: formatDateYMD(today),
  };
}

function AdminPartnerPointsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerId =
    searchParams?.get('partnerId') ||
    searchParams?.get('partner_id') ||
    searchParams?.get('id') ||
    '';

  const defaultRange = getLastOneWeekRange();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fromDate, setFromDate] = useState<string>(defaultRange.from);
  const [toDate, setToDate] = useState<string>(defaultRange.to);
  const [partner, setPartner] = useState<AdminPartnerPointsSummary | null>(null);
  const [transactions, setTransactions] = useState<PartnerPointRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!partnerId) {
        setLoading(false);
        setErrorMsg('No partner specified. Please navigate from the Partners Directory.');
        return;
      }

      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await getAdminPartnerPointsData(partnerId, {
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        });
        if (!active) return;

        if (res.error) {
          setErrorMsg(res.error.message);
        }
        setPartner(res.partner);
        setTransactions(res.transactions);
      } catch (err) {
        if (active) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Failed to load partner points.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [partnerId, fromDate, toDate]);

  const handleResetDateFilter = () => {
    const range = getLastOneWeekRange();
    setFromDate(range.from);
    setToDate(range.to);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top navigation bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/partners/dashboard')}
              className="btn-base btn-outline text-xs self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Partners</span>
            </button>
          </div>

          {/* Partner Details & Points Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Partner Info Card */}
            <div className="card-base p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Store className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="page-title text-lg sm:text-xl font-bold truncate">
                      {partner ? partner.name : 'Partner Points'}
                    </h1>
                    {partner && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] flex-shrink-0">
                        {partner.partner_id}
                      </span>
                    )}
                  </div>
                  <p className="body-text text-xs mt-1 break-words">
                    {partner?.partner_category_name || 'Standard Partner'} •{' '}
                    {partner?.mobile || 'No mobile'}
                  </p>
                  <p className="small-text mt-1 text-[var(--color-text-muted)] break-words">
                    {partner?.email || 'No email'}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Points Card */}
            <div className="card-base p-4 sm:p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="label-text text-xs sm:text-sm">Total Points</span>
                <div
                  className="p-2 sm:p-2.5 rounded-[var(--radius-md)] flex-shrink-0"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <p
                  className="stat-value text-xl sm:text-2xl font-bold font-mono"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {loading
                    ? '...'
                    : (partner?.total_points ?? 0).toLocaleString()}{' '}
                  pts
                </p>
                <p className="small-text mt-0.5 text-[var(--color-text-muted)]">
                  Lifetime earned loyalty points
                </p>
              </div>
            </div>

            {/* Available Points Card */}
            <div className="card-base p-4 sm:p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="label-text text-xs sm:text-sm">
                  Available Points
                </span>
                <div
                  className="p-2 sm:p-2.5 rounded-[var(--radius-md)] flex-shrink-0"
                  style={{
                    backgroundColor: 'var(--color-secondary-light)',
                    color: 'var(--color-secondary)',
                  }}
                >
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <p
                  className="stat-value text-xl sm:text-2xl font-bold font-mono"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  {loading
                    ? '...'
                    : (partner?.available_points ?? 0).toLocaleString()}{' '}
                  pts
                </p>
                <p className="small-text mt-0.5 text-[var(--color-text-muted)]">
                  Current redeemable balance
                </p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div
              className="p-4 rounded-[var(--radius-md)] flex items-center gap-3 text-xs border"
              style={{
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger-text)',
                borderColor: 'var(--color-danger-border)',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Filters (From Date to To Date, default last one week) */}
          <div
            className="card-base p-4 sm:p-5 border border-[var(--color-border)] shadow-xs space-y-4"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--color-secondary)]" />
                <h2
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Date Filter
                </h2>
              </div>
              <button
                type="button"
                onClick={handleResetDateFilter}
                className="btn-base btn-outline text-xs py-1.5 px-3 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Last 7 Days</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold flex items-center gap-1.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>From Date</span>
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="input-base text-xs py-2 px-3"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold flex items-center gap-1.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>To Date</span>
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="input-base text-xs py-2 px-3"
                />
              </div>
            </div>
          </div>

          {/* Partner Points Ledger Table (Date, Type, points, avl_points, notes) */}
          <div className="card-base">
            <div
              className="p-4 sm:p-5 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[var(--color-secondary)]" />
                <h2 className="section-title text-base font-semibold">
                  Partner Points History
                </h2>
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">
                {transactions.length} record{transactions.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="table-container border-0 rounded-none shadow-none">
              <table className="table-base">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Date</th>
                    <th className="table-header-cell">Type</th>
                    <th className="table-header-cell text-right">Points</th>
                    <th className="table-header-cell text-right">Avl Points</th>
                    <th className="table-header-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 anim-spin text-[var(--color-secondary)]" />
                          <span className="text-xs text-[var(--color-text-muted)]">
                            Loading partner points ledger...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Receipt className="w-8 h-8 text-[var(--color-border-strong)]" />
                          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                            No points history found
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Points credits and redemptions for this partner will appear here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isAdd = tx.type === 'add';
                      return (
                        <tr key={tx.id} className="table-row">
                          {/* Date */}
                          <td className="table-cell text-xs whitespace-nowrap">
                            <div
                              className="flex items-center gap-1.5 font-medium"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {tx.created_at
                                  ? new Date(tx.created_at).toLocaleDateString(undefined, {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })
                                  : '—'}
                              </span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="table-cell">
                            <span
                              className={`status-chip ${
                                isAdd ? 'status-chip-active' : 'status-chip-danger'
                              } text-[10px]`}
                            >
                              {isAdd ? (
                                <PlusCircle className="w-3 h-3" />
                              ) : (
                                <MinusCircle className="w-3 h-3" />
                              )}
                              <span>{tx.type.toUpperCase()}</span>
                            </span>
                          </td>

                          {/* Points */}
                          <td className="table-cell text-right font-mono font-bold">
                            <span
                              style={{
                                color: isAdd
                                  ? 'var(--color-success)'
                                  : 'var(--color-danger)',
                              }}
                            >
                              {isAdd ? `+${tx.points.toLocaleString()}` : `-${tx.points.toLocaleString()}`}
                            </span>
                          </td>

                          {/* Avl Points */}
                          <td className="table-cell text-right font-mono font-semibold">
                            <span style={{ color: 'var(--color-text-primary)' }}>
                              {tx.avl_points.toLocaleString()}
                            </span>
                          </td>

                          {/* Notes */}
                          <td
                            className="table-cell text-xs max-w-md"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {tx.notes || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminPartnerPointsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
          <Loader2 className="w-8 h-8 anim-spin text-[var(--color-secondary)]" />
        </div>
      }
    >
      <AdminPartnerPointsContent />
    </Suspense>
  );
}
