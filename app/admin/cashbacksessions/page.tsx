'use client';

import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getCashbackSessions,
  updateCashbackSessionStatus,
  getTodayDateString,
  CashbackSessionItem,
} from '@/lib/cashbacksessionStore';
import {
  CircleDollarSign,
  Calendar,
  Search,
  X,
  Loader2,
  Save,
  CheckCircle2,
  Clock,
  User,
  Phone,
  QrCode,
  IndianRupee,
  Receipt,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'failed', label: 'Failed' },
];

export default function CashbackSessionsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filters: From Date to To Date (Default Today)
  const today = getTodayDateString();
  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);

  // Search: Customer Number
  const [customerNumber, setCustomerNumber] = useState<string>('');

  // Data state
  const [sessions, setSessions] = useState<CashbackSessionItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalSum, setTotalSum] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Status edit state per item: item.id -> selectedStatus
  const [editedStatuses, setEditedStatuses] = useState<Record<string, string>>({});
  // Saving status per item: item.id -> boolean
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  // Just saved indicators: item.id -> boolean
  const [savedSuccessMap, setSavedSuccessMap] = useState<Record<string, boolean>>({});

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load cashback sessions when filters change
  useEffect(() => {
    let isMounted = true;

    async function fetchSessions() {
      setLoading(true);
      const res = await getCashbackSessions({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        customerMobile: customerNumber || undefined,
      });
      if (!isMounted) return;
      if (res.data) {
        setSessions(res.data);
        setTotalCount(res.totalCount);
        setTotalSum(res.totalSum);
        const initialMap: Record<string, string> = {};
        res.data.forEach((s) => {
          initialMap[s.id] = s.status;
        });
        setEditedStatuses(initialMap);
      }
      setLoading(false);
    }

    fetchSessions();

    return () => {
      isMounted = false;
    };
  }, [fromDate, toDate, customerNumber]);

  const handleStatusChange = (id: string, newStatus: string) => {
    setEditedStatuses((prev) => ({
      ...prev,
      [id]: newStatus,
    }));
  };

  const handleSaveStatus = async (item: CashbackSessionItem) => {
    const newStatus = editedStatuses[item.id] || item.status;
    setSavingMap((prev) => ({ ...prev, [item.id]: true }));
    setFeedbackMsg(null);

    const res = await updateCashbackSessionStatus(item.id, newStatus);
    setSavingMap((prev) => ({ ...prev, [item.id]: false }));

    if (res.error || !res.success) {
      setFeedbackMsg({
        type: 'error',
        text: res.error?.message || `Failed to update status for ${item.customer_name}`,
      });
      return;
    }

    // Mark as saved
    setSavedSuccessMap((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setSavedSuccessMap((prev) => ({ ...prev, [item.id]: false }));
    }, 2500);

    // Update item in local list
    setSessions((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, status: newStatus } : s))
    );
  };

  const handleResetFilters = () => {
    setFromDate(today);
    setToDate(today);
    setCustomerNumber('');
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
          {/* Page Title Header */}
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
                Customer cashback rewards, UPI settlement payouts, and status tracking (public.customer_cashback).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-base btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Reset to Today</span>
              </button>
            </div>
          </div>

          {feedbackMsg && (
            <div
              className={`p-3.5 rounded-[var(--radius-md)] flex items-center gap-2.5 text-xs border ${
                feedbackMsg.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* 1. Summary Cards: Total cashbacks (Count as per Filtered Dates) & Total Sum (sum of cashback amount) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Cashbacks Count */}
            <div
              className="card-base p-5 rounded-[var(--radius-lg)] border shadow-xs flex items-center justify-between"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <span
                    className="text-xs font-medium uppercase tracking-wider block"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Total Cashbacks
                  </span>
                  <span
                    className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight block mt-0.5"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {loading ? '...' : totalCount}
                  </span>
                </div>
              </div>
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-[var(--radius-sm)] border"
                style={{
                  backgroundColor: 'var(--color-surface-muted)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Filtered Dates
              </span>
            </div>

            {/* Total Sum (sum of cashback amount) */}
            <div
              className="card-base p-5 rounded-[var(--radius-lg)] border shadow-xs flex items-center justify-between"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'var(--color-secondary-light)',
                    color: 'var(--color-secondary)',
                  }}
                >
                  <IndianRupee className="w-6 h-6" />
                </div>
                <div>
                  <span
                    className="text-xs font-medium uppercase tracking-wider block"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Total Sum
                  </span>
                  <span
                    className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight block mt-0.5"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    {loading ? '...' : `$${totalSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                </div>
              </div>
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-[var(--radius-sm)]"
                style={{
                  backgroundColor: 'var(--color-secondary-light)',
                  color: 'var(--color-secondary)',
                }}
              >
                Payout Sum
              </span>
            </div>
          </div>

          {/* 2. Filters (from date to date Default Today) & Search bar (customer number) */}
          <div
            className="card-base p-4 sm:p-5 rounded-[var(--radius-lg)] border space-y-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-end">
              {/* From Date */}
              <div className="md:col-span-3">
                <label
                  className="text-xs font-semibold flex items-center gap-1.5 mb-1.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  <span>From Date</span>
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="input-base text-xs sm:text-sm py-2"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    borderColor: 'var(--color-border)',
                  }}
                />
              </div>

              {/* To Date */}
              <div className="md:col-span-3">
                <label
                  className="text-xs font-semibold flex items-center gap-1.5 mb-1.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  <span>To Date</span>
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="input-base text-xs sm:text-sm py-2"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    borderColor: 'var(--color-border)',
                  }}
                />
              </div>

              {/* Search Bar (customer number) */}
              <div className="md:col-span-6">
                <label
                  className="text-xs font-semibold flex items-center gap-1.5 mb-1.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Phone className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  <span>Search by Customer Number</span>
                </label>
                <div className="relative">
                  <Search
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                  <input
                    type="text"
                    placeholder="Enter customer number (e.g. 555-345-6789)..."
                    value={customerNumber}
                    onChange={(e) => setCustomerNumber(e.target.value)}
                    className="input-base pl-9 pr-9 text-xs sm:text-sm py-2"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                    }}
                  />
                  {customerNumber && (
                    <button
                      type="button"
                      onClick={() => setCustomerNumber('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                      aria-label="Clear customer search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Display list of Sessions (amount, customer details, upi id, status(allow to change), plycode, save button) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Cashback Sessions ({sessions.length})
              </h2>
            </div>

            {loading ? (
              <div
                className="card-base p-12 text-center rounded-[var(--radius-lg)] border"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <Loader2
                  className="w-8 h-8 anim-spin mx-auto mb-2.5"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Loading cashback sessions...
                </p>
              </div>
            ) : sessions.length === 0 ? (
              <div
                className="card-base p-10 text-center rounded-[var(--radius-lg)] border border-dashed space-y-3"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <CircleDollarSign
                  className="w-10 h-10 mx-auto"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  No cashback sessions found
                </p>
                <p
                  className="text-xs max-w-sm mx-auto"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  No cashback redemption claims match the selected date range or customer number filter.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn-base btn-outline text-xs mt-1"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="card-base border rounded-[var(--radius-lg)] overflow-hidden">
                {/* Desktop/Tablet Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="table-base w-full">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Amount</th>
                        <th className="table-header-cell">Customer Details</th>
                        <th className="table-header-cell">UPI ID</th>
                        <th className="table-header-cell">Plycode</th>
                        <th className="table-header-cell">Status</th>
                        <th className="table-header-cell text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((item) => {
                        const currentStatus = editedStatuses[item.id] || item.status;
                        const isDirty = currentStatus !== item.status;
                        const isSaving = !!savingMap[item.id];
                        const isSaved = !!savedSuccessMap[item.id];

                        return (
                          <tr key={item.id} className="table-row">
                            {/* Amount */}
                            <td className="table-cell">
                              <div>
                                <span
                                  className="text-base font-extrabold font-mono"
                                  style={{ color: 'var(--color-secondary)' }}
                                >
                                  ${item.cashback_amnt.toFixed(2)}
                                </span>
                                <span
                                  className="text-[11px] block mt-0.5"
                                  style={{ color: 'var(--color-text-muted)' }}
                                >
                                  {item.created_at_ist}
                                </span>
                              </div>
                            </td>

                            {/* Customer details */}
                            <td className="table-cell">
                              <div>
                                <div className="flex items-center gap-1.5 font-semibold text-xs text-[var(--color-text-primary)]">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{item.customer_name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span className="font-mono">{item.customer_mobile}</span>
                                </div>
                              </div>
                            </td>

                            {/* UPI ID */}
                            <td className="table-cell">
                              <span
                                className="font-mono text-xs px-2 py-0.5 rounded-[var(--radius-sm)] border"
                                style={{
                                  backgroundColor: 'var(--color-surface-muted)',
                                  borderColor: 'var(--color-border)',
                                  color: 'var(--color-text-secondary)',
                                }}
                              >
                                {item.upi_id}
                              </span>
                            </td>

                            {/* Plycode */}
                            <td className="table-cell">
                              <div className="flex items-center gap-1.5">
                                <QrCode className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                <span
                                  className="font-mono font-bold text-xs px-2 py-0.5 rounded-[var(--radius-sm)]"
                                  style={{
                                    backgroundColor: 'var(--color-primary-light)',
                                    color: 'var(--color-primary)',
                                  }}
                                >
                                  {item.plycode}
                                </span>
                              </div>
                            </td>

                            {/* Status (Allow to change) */}
                            <td className="table-cell">
                              <select
                                value={currentStatus}
                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                className="input-base text-xs py-1.5 px-2.5 font-medium rounded-[var(--radius-md)]"
                                style={{
                                  backgroundColor: 'var(--color-surface)',
                                  borderColor: isDirty
                                    ? 'var(--color-secondary)'
                                    : 'var(--color-border)',
                                  color: 'var(--color-text-primary)',
                                }}
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Save Button */}
                            <td className="table-cell text-right">
                              <button
                                type="button"
                                onClick={() => handleSaveStatus(item)}
                                disabled={isSaving}
                                className={`btn-base text-xs py-1.5 px-3 flex items-center gap-1.5 ml-auto ${
                                  isDirty
                                    ? 'btn-primary shadow-xs'
                                    : isSaved
                                    ? 'bg-emerald-600 text-white'
                                    : 'btn-outline'
                                }`}
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 anim-spin" />
                                    <span>Saving...</span>
                                  </>
                                ) : isSaved ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Saved</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / Compact Cards List */}
                <div
                  className="lg:hidden divide-y"
                  style={{ borderColor: 'var(--color-border-subtle)' }}
                >
                  {sessions.map((item) => {
                    const currentStatus = editedStatuses[item.id] || item.status;
                    const isDirty = currentStatus !== item.status;
                    const isSaving = !!savingMap[item.id];
                    const isSaved = !!savedSuccessMap[item.id];

                    return (
                      <div
                        key={item.id}
                        className="p-4 space-y-3"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                      >
                        {/* Header: Amount & Plycode */}
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span
                              className="text-lg font-extrabold font-mono"
                              style={{ color: 'var(--color-secondary)' }}
                            >
                              ${item.cashback_amnt.toFixed(2)}
                            </span>
                            <span
                              className="text-[10px] block mt-0.5"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {item.created_at_ist}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-[var(--radius-sm)]"
                            style={{
                              backgroundColor: 'var(--color-primary-light)',
                              color: 'var(--color-primary)',
                            }}
                          >
                            <QrCode className="w-3 h-3" />
                            <span>{item.plycode}</span>
                          </div>
                        </div>

                        {/* Customer details & UPI ID */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.customer_name}</span>
                            </span>
                            <span className="font-mono text-[var(--color-text-secondary)] flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{item.customer_mobile}</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span style={{ color: 'var(--color-text-muted)' }}>UPI ID:</span>
                            <span
                              className="font-mono px-2 py-0.5 rounded-[var(--radius-sm)] border"
                              style={{
                                backgroundColor: 'var(--color-surface-muted)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-primary)',
                              }}
                            >
                              {item.upi_id}
                            </span>
                          </div>
                        </div>

                        {/* Status Change Selector & Save button */}
                        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                          <div className="flex-1">
                            <label className="text-[10px] font-semibold text-[var(--color-text-muted)] block mb-1">
                              Status:
                            </label>
                            <select
                              value={currentStatus}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className="input-base text-xs py-1.5 px-2.5 font-medium rounded-[var(--radius-md)] w-full"
                              style={{
                                backgroundColor: 'var(--color-surface)',
                                borderColor: isDirty
                                  ? 'var(--color-secondary)'
                                  : 'var(--color-border)',
                                color: 'var(--color-text-primary)',
                              }}
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="shrink-0 pt-4">
                            <button
                              type="button"
                              onClick={() => handleSaveStatus(item)}
                              disabled={isSaving}
                              className={`btn-base text-xs py-2 px-3.5 flex items-center gap-1.5 ${
                                isDirty
                                  ? 'btn-primary shadow-xs'
                                  : isSaved
                                  ? 'bg-emerald-600 text-white'
                                  : 'btn-outline'
                              }`}
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 anim-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : isSaved ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Saved</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Save</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
