'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PartnerHeader from '@/components/partner/header';
import PartnerBottomNavigation from '@/components/partner/bottomnavigation';
import {
  getPartnerPointsSummary,
  getPartnerPointTransactions,
  getDefaultPointsDateRange,
  PartnerPointsSummary,
  PartnerPointTransaction,
} from '@/lib/pointsStore';
import {
  ArrowLeft,
  Coins,
  Award,
  Calendar,
  Filter,
  PlusCircle,
  MinusCircle,
  Loader2,
  Receipt,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function PartnerPointsPage() {
  const router = useRouter();

  // Summary state
  const [summary, setSummary] = useState<PartnerPointsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);

  // Date filters (defaults to last one week)
  const defaultRange = useMemo(() => getDefaultPointsDateRange(), []);
  const [fromDate, setFromDate] = useState<string>(defaultRange.fromDate);
  const [toDate, setToDate] = useState<string>(defaultRange.toDate);

  // Transactions state
  const [transactions, setTransactions] = useState<PartnerPointTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Expanded note tracking by transaction id
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Load points summary once
  useEffect(() => {
    let isMounted = true;
    async function loadSummary() {
      const res = await getPartnerPointsSummary();
      if (!isMounted) return;
      if (res.data) {
        setSummary(res.data);
      }
      setSummaryLoading(false);
    }
    loadSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load points transactions when date filters change
  useEffect(() => {
    let isMounted = true;
    async function loadTransactions() {
      setLoading(true);
      const res = await getPartnerPointTransactions({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      if (!isMounted) return;
      if (res.data) {
        setTransactions(res.data);
      }
      setLoading(false);
    }
    loadTransactions();
    return () => {
      isMounted = false;
    };
  }, [fromDate, toDate]);

  const handleResetFilters = () => {
    setFromDate(defaultRange.fromDate);
    setToDate(defaultRange.toDate);
  };

  const toggleNote = (id: string) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Header connected at top */}
      <PartnerHeader />

      {/* Main Content Area - Reduced empty spacing on mobile */}
      <main className="flex-1 w-full max-w-lg sm:max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-6 pb-20 sm:pb-28 space-y-3 sm:space-y-5">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => router.push('/partner/dashboard')}
            className="btn-base btn-outline text-xs py-1 px-2.5"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] border"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Points Ledger
          </span>
        </div>

        <div>
          <h1
            className="text-lg sm:text-2xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Partner Loyalty Points
          </h1>
          <p
            className="text-xs mt-0.5 line-clamp-1 sm:line-clamp-none"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            View available balance, total points, and transaction logs
          </p>
        </div>

        {/* 1. Summary Cards: 2-column compact grid on mobile to save empty vertical space */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {/* Available Points */}
          <div
            className="card-base p-3 sm:p-5 rounded-[var(--radius-lg)] border shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3.5">
              <div
                className="w-9 h-9 sm:w-12 sm:h-12 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'var(--color-warning-light)',
                  color: 'var(--color-warning)',
                }}
              >
                <Coins className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span
                  className="text-[10px] sm:text-xs font-medium uppercase tracking-wider block truncate"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Available Points
                </span>
                <span
                  className="text-xl sm:text-3xl font-extrabold font-mono tracking-tight block mt-0.5"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {summaryLoading
                    ? '...'
                    : (summary?.available_points ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
            <span
              className="text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded-[var(--radius-sm)] self-start sm:self-center"
              style={{
                backgroundColor: 'var(--color-success-light)',
                color: 'var(--color-success-text)',
              }}
            >
              Spendable
            </span>
          </div>

          {/* Total Points */}
          <div
            className="card-base p-3 sm:p-5 rounded-[var(--radius-lg)] border shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3.5">
              <div
                className="w-9 h-9 sm:w-12 sm:h-12 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'var(--color-secondary-light)',
                  color: 'var(--color-secondary)',
                }}
              >
                <Award className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span
                  className="text-[10px] sm:text-xs font-medium uppercase tracking-wider block truncate"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Total Points
                </span>
                <span
                  className="text-xl sm:text-3xl font-extrabold font-mono tracking-tight block mt-0.5"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {summaryLoading
                    ? '...'
                    : (summary?.total_points ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
            <span
              className="text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded-[var(--radius-sm)] self-start sm:self-center"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
              }}
            >
              Lifetime
            </span>
          </div>
        </div>

        {/* 2. Filters(From to dates default last one week) - compact mobile grid */}
        <div
          className="card-base p-3 sm:p-4 rounded-[var(--radius-lg)] border space-y-2 sm:space-y-3"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" style={{ color: 'var(--color-secondary)' }} />
            <h2
              className="text-[11px] sm:text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Filter Transactions
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="form-group">
              <label
                className="text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 mb-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Calendar className="w-3 h-3 text-[var(--color-secondary)]" />
                <span>From Date</span>
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input-base text-xs py-1 px-2 w-full"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                }}
              />
            </div>

            <div className="form-group">
              <label
                className="text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 mb-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Calendar className="w-3 h-3 text-[var(--color-secondary)]" />
                <span>To Date</span>
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input-base text-xs py-1 px-2 w-full"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                }}
              />
            </div>

            <div className="col-span-2 sm:col-span-1 flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-base btn-outline w-full text-xs py-1.5 sm:py-2"
              >
                Reset (Last 1 Week)
              </button>
            </div>
          </div>
        </div>

        {/* 3. List of points transactions(from partner_points) */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2
              className="text-xs sm:text-sm font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Points History ({transactions.length})
            </h2>
          </div>

          {loading ? (
            <div
              className="card-base p-8 text-center rounded-[var(--radius-lg)] border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <Loader2
                className="w-6 h-6 anim-spin mx-auto mb-2"
                style={{ color: 'var(--color-secondary)' }}
              />
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Loading points ledger...
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <div
              className="card-base p-6 sm:p-8 text-center rounded-[var(--radius-lg)] border border-dashed space-y-1.5"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <Receipt
                className="w-8 h-8 mx-auto"
                style={{ color: 'var(--color-text-muted)' }}
              />
              <p
                className="text-xs sm:text-sm font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                No points transactions in selected date range
              </p>
              <p
                className="text-[11px] max-w-xs mx-auto"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Adjust the date filters above to view earlier transactions.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-base btn-outline text-xs mt-1 py-1 px-3"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {transactions.map((tx) => {
                const isAdd = tx.type === 'add';
                const isExpanded = !!expandedNotes[tx.id];

                return (
                  <div
                    key={tx.id}
                    className="card-base p-3 sm:p-4 rounded-[var(--radius-lg)] border transition-all hover:shadow-xs"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    {/* Header Row: Type Icon + Points amount + Date */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius-full)] flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: isAdd
                              ? 'var(--color-success-light)'
                              : 'var(--color-danger-light)',
                            color: isAdd
                              ? 'var(--color-success)'
                              : 'var(--color-danger)',
                          }}
                        >
                          {isAdd ? (
                            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          ) : (
                            <MinusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          )}
                        </div>

                        <div>
                          {/* Type Badge: add or delete */}
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`status-chip ${
                                isAdd ? 'status-chip-active' : 'status-chip-danger'
                              } text-[9px] sm:text-[10px] py-0.5 px-1.5`}
                            >
                              {tx.type.toUpperCase()}
                            </span>
                            <span
                              className="text-[11px] sm:text-xs"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {tx.created_at}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Points Added / Deleted */}
                      <div className="text-right">
                        <span
                          className="text-sm sm:text-lg font-mono font-extrabold"
                          style={{
                            color: isAdd
                              ? 'var(--color-success)'
                              : 'var(--color-danger)',
                          }}
                        >
                          {isAdd ? `+${tx.points}` : `-${tx.points}`} pts
                        </span>
                      </div>
                    </div>

                    {/* Available Points Balance Row */}
                    <div className="flex items-center justify-between py-1.5 text-[11px] sm:text-xs">
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        Balance (avl_points):
                      </span>
                      <span
                        className="font-mono font-bold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {tx.avl_points.toLocaleString()} pts
                      </span>
                    </div>

                    {/* Notes: display very small and on tap display fully */}
                    {tx.notes && (
                      <div
                        onClick={() => toggleNote(tx.id)}
                        className="mt-1.5 p-2 rounded-[var(--radius-md)] border cursor-pointer transition-colors hover:bg-slate-50 focus:outline-none"
                        style={{
                          backgroundColor: 'var(--color-surface-hover)',
                          borderColor: 'var(--color-border-subtle)',
                        }}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        aria-label="Tap to toggle full notes"
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider block"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            Transaction Notes
                          </span>
                          <span
                            className="text-[9px] sm:text-[10px] font-medium flex items-center gap-0.5"
                            style={{ color: 'var(--color-secondary)' }}
                          >
                            {isExpanded ? (
                              <>
                                <span>Show less</span>
                                <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              </>
                            ) : (
                              <>
                                <span>Expand</span>
                                <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              </>
                            )}
                          </span>
                        </div>

                        {/* Note text: very small font, truncated unless expanded on tap */}
                        <p
                          className={`text-[10px] sm:text-[11px] leading-relaxed transition-all ${
                            isExpanded ? 'block' : 'line-clamp-1'
                          }`}
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {tx.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom navigation connected at bottom */}
      <PartnerBottomNavigation />
    </div>
  );
}
