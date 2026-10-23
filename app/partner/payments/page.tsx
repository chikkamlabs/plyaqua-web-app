'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PartnerHeader from '@/components/partner/header';
import PartnerBottomNavigation from '@/components/partner/bottomnavigation';
import {
  getPartnerPaymentsSummary,
  getPartnerTransactions,
  getDefaultPaymentsDateRange,
  PartnerTransaction,
  PaymentsSummary,
} from '@/lib/paymentsStore';
import {
  CreditCard,
  ArrowUpDown,
  Search,
  Calendar,
  X,
  Receipt,
  RotateCcw,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Wallet,
  ArrowLeft,
} from 'lucide-react';

export default function PartnerPaymentsPage() {
  const defaultDates = useMemo(() => getDefaultPaymentsDateRange(), []);

  // Summary State
  const [summary, setSummary] = useState<PaymentsSummary>({
    lastWeekTransactionsCount: 0,
    totalCreditAmount: 0,
  });

  // Transactions State
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Filters State
  const [searchBillId, setSearchBillId] = useState('');
  const [fromDate, setFromDate] = useState(defaultDates.fromDate);
  const [toDate, setToDate] = useState(defaultDates.toDate);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;

    async function loadData() {
      const [sumRes, txsRes] = await Promise.all([
        getPartnerPaymentsSummary(),
        getPartnerTransactions({
          searchBillId,
          fromDate,
          toDate,
        }),
      ]);

      if (!active) return;

      if (sumRes.data) {
        setSummary(sumRes.data);
      }
      if (txsRes.data) {
        setTransactions(txsRes.data);
      }
      setLoading(false);
      setLoadingSummary(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [searchBillId, fromDate, toDate]);

  // Reset date filters to default last one week
  const handleResetFilters = () => {
    setSearchBillId('');
    setFromDate(defaultDates.fromDate);
    setToDate(defaultDates.toDate);
  };

  // Toggle notes expansion
  const toggleNotes = (id: string) => {
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
      {/* Header attached at top */}
      <PartnerHeader />

      {/* Main container */}
      <main className="flex-1 w-full max-w-lg sm:max-w-4xl mx-auto px-4 py-5 sm:py-8 pb-28 space-y-5">
        {/* Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/partner/inventory/dashboard"
            className="btn-base btn-outline text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
            aria-label="Back to inventory hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inventory Hub</span>
          </Link>

          <span
            className="text-xs px-2.5 py-1 rounded-[var(--radius-sm)] border font-semibold flex items-center gap-1"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-primary)',
            }}
          >
            <Wallet className="w-3.5 h-3.5" style={{ color: 'var(--color-secondary)' }} />
            <span>Payments Ledger</span>
          </span>
        </div>

        {/* Page Title */}
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Payments & Transactions
          </h1>
          <p
            className="text-xs sm:text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Financial transactions ledger, credit balance, and bill settlements
          </p>
        </div>

        {/* 1. Summary Cards Grid: Total Transactions (Last Week) & Total Credit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Total Transactions (no. of last week from partner transactions) */}
          <div
            className="card-base p-4 sm:p-5 rounded-[var(--radius-lg)] border flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div>
              <span
                className="text-xs font-medium block"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Total Transactions (Last Week)
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                {loadingSummary ? (
                  <Loader2
                    className="w-5 h-5 anim-spin"
                    style={{ color: 'var(--color-secondary)' }}
                  />
                ) : (
                  <span
                    className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {summary.lastWeekTransactionsCount}
                  </span>
                )}
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  past 7 days
                </span>
              </div>
            </div>

            <div
              className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
              }}
            >
              <ArrowUpDown className="w-6 h-6" />
            </div>
          </div>

          {/* Total Credit (partner_profile.credit_amount) */}
          <div
            className="card-base p-4 sm:p-5 rounded-[var(--radius-lg)] border flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div>
              <span
                className="text-xs font-medium block"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Total Credit
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                {loadingSummary ? (
                  <Loader2
                    className="w-5 h-5 anim-spin"
                    style={{ color: 'var(--color-secondary)' }}
                  />
                ) : (
                  <span
                    className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    ${summary.totalCreditAmount.toFixed(2)}
                  </span>
                )}
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-[var(--radius-xs)] border"
                  style={{
                    backgroundColor: 'var(--color-secondary-light)',
                    color: 'var(--color-secondary)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                >
                  partner_profile
                </span>
              </div>
            </div>

            <div
              className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--color-secondary-light)',
                color: 'var(--color-secondary)',
              }}
            >
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 2. Search & Filters Bar */}
        <div
          className="card-base p-4 rounded-[var(--radius-lg)] border space-y-3"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* Search bar (bill_id) */}
          <div className="relative">
            <Search
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              value={searchBillId}
              onChange={(e) => setSearchBillId(e.target.value)}
              placeholder="Search by bill ID (e.g. bill_84920)..."
              className="input-base text-xs sm:text-sm pl-9 pr-9 w-full"
              aria-label="Search by Bill ID"
            />
            {searchBillId && (
              <button
                type="button"
                onClick={() => setSearchBillId('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date Filters: Dates (from to) */}
          <div className="pt-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-secondary)' }} />
              <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Date Filter:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="input-base text-xs py-1 px-2 font-mono"
                  aria-label="From Date"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="input-base text-xs py-1 px-2 font-mono"
                  aria-label="To Date"
                />
              </div>

              {(fromDate !== defaultDates.fromDate || toDate !== defaultDates.toDate || searchBillId !== '') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn-base btn-ghost text-xs py-1 px-2 flex items-center gap-1"
                  aria-label="Reset date filters"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. List of partner_transactions: amount, type, bill_id, method, balance */}
        <div
          className="card-base p-4 sm:p-5 rounded-[var(--radius-lg)] border space-y-4"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div
            className="flex items-center justify-between pb-3 border-b"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <div>
              <h2
                className="text-base font-bold tracking-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Transactions Ledger
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Record of all financial additions and debits
              </p>
            </div>

            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-sm)] border"
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                color: 'var(--color-text-secondary)',
                borderColor: 'var(--color-border)',
              }}
            >
              {transactions.length} Records
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2
                className="w-7 h-7 anim-spin mx-auto mb-2"
                style={{ color: 'var(--color-secondary)' }}
              />
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Loading partner transactions...
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <div
              className="py-10 text-center rounded-[var(--radius-md)] border space-y-2"
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                borderColor: 'var(--color-border-subtle)',
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
                No partner transactions found
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Try adjusting your search query or date range filters
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mobile View: Cards */}
              <div className="block sm:hidden space-y-3">
                {transactions.map((tx) => {
                  const isAdd = tx.type === 'add';
                  const isExpanded = !!expandedNotes[tx.id];
                  const dateFormatted = tx.payment_date
                    ? new Date(tx.payment_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—';

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-[var(--radius-md)] border space-y-2.5 transition-all"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border-subtle)',
                      }}
                    >
                      {/* Top Row: Type & Amount */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
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
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </span>

                          <div>
                            <span
                              className="font-bold text-xs uppercase px-2 py-0.5 rounded-[var(--radius-xs)]"
                              style={{
                                backgroundColor: isAdd
                                  ? 'var(--color-success-light)'
                                  : 'var(--color-danger-light)',
                                color: isAdd
                                  ? 'var(--color-success-text)'
                                  : 'var(--color-danger-text)',
                              }}
                            >
                              {tx.type}
                            </span>
                            <span
                              className="text-[11px] block mt-0.5"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {dateFormatted}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className="font-mono font-bold text-base block"
                            style={{
                              color: isAdd ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                            }}
                          >
                            {isAdd ? '+' : '-'}${tx.amount.toFixed(2)}
                          </span>
                          <span
                            className="text-[11px] font-mono block"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Bal: ${tx.balance.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Middle Row: Bill ID & Payment Method */}
                      <div
                        className="grid grid-cols-2 gap-2 text-xs pt-2 border-t"
                        style={{ borderColor: 'var(--color-border-subtle)' }}
                      >
                        <div>
                          <span
                            className="text-[10px] block"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            Bill ID
                          </span>
                          <span
                            className="font-mono font-semibold"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            {tx.bill_number || tx.bill_id || '—'}
                          </span>
                        </div>

                        <div>
                          <span
                            className="text-[10px] block"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            Method
                          </span>
                          <span
                            className="font-medium uppercase tracking-wider text-[11px]"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {tx.method}
                          </span>
                        </div>
                      </div>

                      {/* Notes / Tap to Expand */}
                      {tx.notes && (
                        <div
                          onClick={() => toggleNotes(tx.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleNotes(tx.id);
                            }
                          }}
                          className="pt-2 border-t text-[11px] cursor-pointer flex items-start justify-between gap-2"
                          style={{ borderColor: 'var(--color-border-subtle)' }}
                          aria-label="Toggle notes visibility"
                        >
                          <p
                            className={isExpanded ? 'break-words' : 'truncate'}
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <span className="font-semibold text-slate-700">Note: </span>
                            {tx.notes}
                          </p>
                          <button
                            type="button"
                            className="shrink-0 text-slate-400 hover:text-slate-600 mt-0.5"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop / Tablet View: Table */}
              <div className="hidden sm:block table-container border rounded-[var(--radius-md)] overflow-x-auto">
                <table className="table-base">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Type</th>
                      <th className="table-header-cell">Bill ID</th>
                      <th className="table-header-cell">Method</th>
                      <th className="table-header-cell text-right">Amount ($)</th>
                      <th className="table-header-cell text-right">Balance ($)</th>
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const isAdd = tx.type === 'add';
                      const isExpanded = !!expandedNotes[tx.id];
                      const dateFormatted = tx.payment_date
                        ? new Date(tx.payment_date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—';

                      return (
                        <tr key={tx.id} className="table-row">
                          <td className="table-cell">
                            <span
                              className="font-bold text-xs uppercase px-2 py-0.5 rounded-[var(--radius-xs)] inline-flex items-center gap-1"
                              style={{
                                backgroundColor: isAdd
                                  ? 'var(--color-success-light)'
                                  : 'var(--color-danger-light)',
                                color: isAdd
                                  ? 'var(--color-success-text)'
                                  : 'var(--color-danger-text)',
                              }}
                            >
                              {isAdd ? (
                                <ArrowDownLeft className="w-3 h-3" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3" />
                              )}
                              <span>{tx.type}</span>
                            </span>
                          </td>

                          <td className="table-cell font-mono text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                            {tx.bill_number || tx.bill_id || '—'}
                          </td>

                          <td className="table-cell text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            {tx.method}
                          </td>

                          <td
                            className="table-cell font-mono font-bold text-right text-xs"
                            style={{
                              color: isAdd ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                            }}
                          >
                            {isAdd ? '+' : '-'}${tx.amount.toFixed(2)}
                          </td>

                          <td
                            className="table-cell font-mono font-bold text-right text-xs"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            ${tx.balance.toFixed(2)}
                          </td>

                          <td className="table-cell text-xs whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                            {dateFormatted}
                          </td>

                          <td className="table-cell text-xs max-w-xs">
                            {tx.notes ? (
                              <div
                                onClick={() => toggleNotes(tx.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggleNotes(tx.id);
                                  }
                                }}
                                className="cursor-pointer flex items-center justify-between gap-1 group"
                                aria-label="Toggle notes display"
                              >
                                <span
                                  className={isExpanded ? 'break-words' : 'truncate block max-w-[180px]'}
                                  style={{ color: 'var(--color-text-secondary)' }}
                                >
                                  {tx.notes}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3 shrink-0 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 shrink-0 text-slate-400 group-hover:text-slate-600" />
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom navigation attached at bottom */}
      <PartnerBottomNavigation />
    </div>
  );
}
