'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getPointsSessions,
  PointSessionItem,
  getTodayDateString,
} from '@/lib/sessionStore';
import {
  History,
  Search,
  Calendar,
  Coins,
  User,
  Loader2,
  Phone,
  Clock,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

const ITEMS_PER_PAGE = 50;

function PointsSessionsContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<PointSessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Default dates strictly to today
  const todayStr = getTodayDateString();
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [mobileSearch, setMobileSearch] = useState<string>('');

  // Pagination state (per page 50 show)
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Handlers that update filter and reset pagination to page 1
  const handleFromDateChange = (val: string) => {
    setFromDate(val);
    setCurrentPage(1);
    setLoading(true);
  };

  const handleToDateChange = (val: string) => {
    setToDate(val);
    setCurrentPage(1);
    setLoading(true);
  };

  const handleMobileChange = (val: string) => {
    setMobileSearch(val);
    setCurrentPage(1);
    setLoading(true);
  };

  // Fetch sessions based on filtered dates & search
  useEffect(() => {
    let isMounted = true;

    async function fetchSessions() {
      const res = await getPointsSessions({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        mobile: mobileSearch || undefined,
      });
      if (!isMounted) return;
      if (res.data) {
        setSessions(res.data);
      }
      setLoading(false);
    }

    fetchSessions();

    return () => {
      isMounted = false;
    };
  }, [fromDate, toDate, mobileSearch]);

  const handleResetFilters = () => {
    setFromDate(todayStr);
    setToDate(todayStr);
    setMobileSearch('');
    setCurrentPage(1);
  };

  const totalPointsDistributed = useMemo(() => {
    return sessions.reduce((sum, s) => sum + (Number(s.points) || 0), 0);
  }, [sessions]);

  // Pagination calculation for filtered dates only
  const totalItems = sessions.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  // Only load items for the active page (above 50 loaded when tap for next page)
  const displayedSessions = useMemo(() => {
    return sessions.slice(startIndex, endIndex);
  }, [sessions, startIndex, endIndex]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <History
                  className="w-5 h-5"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Gameplay Activity Logs
                </span>
              </div>
              <h1 className="page-title text-2xl font-bold">
                Points Sessions
              </h1>
              <p className="body-text text-xs mt-1">
                Track customer interactive gameplay sessions, timestamps in IST, and points earned.
              </p>
            </div>
          </div>

          {/* Stat Cards: Removed Total Sessions today count as requested */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Filtered Sessions Count */}
            <div className="card-base p-5 border border-[var(--color-border)] shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Matching Sessions (Filtered)</p>
                  <p className="stat-value mt-1" style={{ color: 'var(--color-primary)' }}>
                    {sessions.length}
                  </p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <History className="w-6 h-6" />
                </div>
              </div>
              <p className="small-text mt-2 text-[var(--color-text-muted)]">
                Sessions matching date range {fromDate || 'any'} to {toDate || 'any'}
              </p>
            </div>

            {/* Total Points in Filtered Sessions */}
            <div className="card-base p-5 border border-[var(--color-border)] shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Total Points Awarded</p>
                  <p className="stat-value mt-1" style={{ color: 'var(--color-warning-text)' }}>
                    {totalPointsDistributed.toLocaleString()} pts
                  </p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-warning-light)',
                    color: 'var(--color-warning)',
                  }}
                >
                  <Coins className="w-6 h-6" />
                </div>
              </div>
              <p className="small-text mt-2 text-[var(--color-text-muted)]">
                Aggregated from customer_points table for active filter
              </p>
            </div>
          </div>

          {/* Filter Bar with Clean Explicit Border Lines */}
          <div className="card-base p-4 sm:p-5 border border-[var(--color-border)] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border-subtle)]">
              <Filter className="w-4 h-4 text-[var(--color-secondary)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Filter Points Sessions (Default Today)
              </h2>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search bar: Customer Mobile with clean border */}
              <div className="relative flex-1 max-w-md">
                <label className="text-xs font-semibold mb-1 block text-[var(--color-text-secondary)]">
                  Customer Mobile
                </label>
                <div
                  className="flex items-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-xs transition-colors focus-within:border-[var(--color-secondary)] focus-within:ring-1 focus-within:ring-[var(--color-secondary)]"
                >
                  <div className="pl-3 pr-1 text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={mobileSearch}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    placeholder="Search by customer mobile number..."
                    className="w-full text-xs py-2 pr-3 bg-transparent border-0 outline-none focus:ring-0"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                  {mobileSearch && (
                    <button
                      type="button"
                      onClick={() => handleMobileChange('')}
                      className="pr-2.5 text-xs text-slate-400 hover:text-slate-600"
                      title="Clear mobile search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Filter by Dates: From and To (Default Today, reactive on change) */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>From Date</span>
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => handleFromDateChange(e.target.value)}
                    className="text-xs py-2 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs outline-none transition-colors focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>To Date</span>
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => handleToDateChange(e.target.value)}
                    className="text-xs py-2 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs outline-none transition-colors focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn-base btn-outline text-xs py-2 px-3 flex items-center gap-1.5 font-medium border border-[var(--color-border)] hover:border-[var(--color-border-strong)] h-[36px]"
                  title="Reset dates to today"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Today</span>
                </button>
              </div>
            </div>
          </div>

          {/* Display all sessions Table with Pagination (50 per page) */}
          <div className="card-base border border-[var(--color-border)] shadow-xs overflow-hidden">
            <div
              className="p-4 sm:p-5 border-b border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--color-secondary)]" />
                <h2 className="section-title text-base font-semibold">
                  Session Log Details (sessions &amp; customer_points)
                </h2>
              </div>
              <div className="text-xs text-[var(--color-text-muted)] font-medium">
                {totalItems > 0 ? (
                  <span>
                    Showing <strong className="text-[var(--color-text-primary)] font-mono">{startIndex + 1}</strong> to{' '}
                    <strong className="text-[var(--color-text-primary)] font-mono">{endIndex}</strong> of{' '}
                    <strong className="text-[var(--color-text-primary)] font-mono">{totalItems}</strong> sessions
                  </span>
                ) : (
                  <span>0 sessions</span>
                )}
              </div>
            </div>

            <div className="table-container border-0 rounded-none shadow-none">
              <table className="table-base">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Session ID</th>
                    <th className="table-header-cell">Session Date &amp; Time (IST)</th>
                    <th className="table-header-cell">Customer Details (sessions.customer_id)</th>
                    <th className="table-header-cell">Mobile</th>
                    <th className="table-header-cell text-right">Points Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-secondary)]" />
                          <span className="text-xs text-[var(--color-text-muted)]">
                            Loading points sessions from database...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : totalItems === 0 ? (
                    <tr>
                      <td colSpan={5} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <History className="w-8 h-8 text-[var(--color-border-strong)]" />
                          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                            No gameplay sessions found
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {fromDate || toDate || mobileSearch
                              ? 'Try adjusting your date range or mobile search filter'
                              : 'Customer gameplay interaction sessions will be logged here automatically'}
                          </p>
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="btn-base btn-primary text-xs px-4 py-2 mt-2"
                          >
                            Reset Dates to Today
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedSessions.map((item) => (
                      <tr key={item.id} className="table-row hover:bg-[var(--color-surface-hover)] transition-colors">
                        {/* Session ID */}
                        <td className="table-cell font-mono text-xs font-semibold">
                          <span
                            className="px-2 py-1 rounded-[var(--radius-sm)]"
                            style={{
                              backgroundColor: 'var(--color-surface-muted)',
                              color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-border-subtle)',
                            }}
                          >
                            {item.session_id}
                          </span>
                        </td>

                        {/* Session Date & Time (IST) */}
                        <td className="table-cell text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.created_at_ist}</span>
                          </div>
                        </td>

                        {/* Customer Details */}
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                              style={{
                                backgroundColor: 'var(--color-primary-light)',
                                color: 'var(--color-primary)',
                              }}
                            >
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-semibold block text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                {item.customer_name}
                              </span>
                              <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                                ID: {item.customer_id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Mobile */}
                        <td className="table-cell text-xs font-mono">
                          <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.customer_mobile}</span>
                          </div>
                        </td>

                        {/* Points (customer_points table where session_id is sessions.id) */}
                        <td className="table-cell text-right">
                          <span className="badge-base badge-secondary text-xs font-mono font-bold">
                            +{item.points} pts
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Pagination Controls (Per page 50 show, loads above 50 on next) */}
            <div
              className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                borderColor: 'var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {/* Pagination Info */}
              <div className="flex items-center gap-2">
                <span>
                  Page <strong className="font-mono text-[var(--color-primary)]">{currentPage}</strong> of{' '}
                  <strong className="font-mono text-[var(--color-primary)]">{totalPages}</strong>
                </span>
                <span className="text-[var(--color-border-strong)]">•</span>
                <span>
                  Showing <strong className="font-mono">{displayedSessions.length}</strong> of{' '}
                  <strong className="font-mono">{totalItems}</strong> in filtered date range (50 per page)
                </span>
              </div>

              {/* Pagination Next / Previous Buttons */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className="btn-base btn-outline text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  {/* Page indicator pills */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 text-xs font-mono rounded-[var(--radius-sm)] flex items-center justify-center transition-colors ₹{
                          currentPage === pageNum
                            ? 'font-bold bg-[var(--color-secondary)] text-white'
                            : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className="btn-base btn-outline text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PointsSessionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-secondary)]" />
        </div>
      }
    >
      <PointsSessionsContent />
    </Suspense>
  );
}
