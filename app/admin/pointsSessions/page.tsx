'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getPointsSessions,
  PointSessionItem,
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
} from 'lucide-react';

function PointsSessionsContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<PointSessionItem[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [mobileSearch, setMobileSearch] = useState('');

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
        setTotalToday(res.totalToday);
      }
      setLoading(false);
    }

    fetchSessions();

    return () => {
      isMounted = false;
    };
  }, [fromDate, toDate, mobileSearch]);

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setMobileSearch('');
  };

  const totalPointsDistributed = useMemo(() => {
    return sessions.reduce((sum, s) => sum + (Number(s.points) || 0), 0);
  }, [sessions]);

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

          {/* Stat Cards: Total Sessions today count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Total Sessions Today */}
            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Total Sessions (Today)</p>
                  <p className="stat-value mt-1" style={{ color: 'var(--color-secondary)' }}>
                    {totalToday}
                  </p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-secondary-light)',
                    color: 'var(--color-secondary)',
                  }}
                >
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <p className="small-text mt-2 text-[var(--color-text-muted)]">
                Recorded today in Indian Standard Time (IST)
              </p>
            </div>

            {/* Filtered Sessions Count */}
            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Matching Sessions</p>
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
                Sessions matching current date &amp; mobile filters
              </p>
            </div>

            {/* Total Points in Sessions */}
            <div className="card-base p-5">
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
                Aggregated from customer_points table
              </p>
            </div>
          </div>

          {/* Filter Bar Card: Filter by dates (from to) and Search bar (customer mobile) */}
          <div className="card-base p-5 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search bar: Customer Mobile */}
              <div className="relative flex-1 max-w-md">
                <div
                  className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={mobileSearch}
                  onChange={(e) => setMobileSearch(e.target.value)}
                  placeholder="Search by customer mobile number..."
                  className="input-base text-xs"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>

              {/* Filter by Dates: From and To */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="small-text font-medium whitespace-nowrap">From:</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="input-base text-xs py-1.5 px-2.5"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="small-text font-medium whitespace-nowrap">To:</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="input-base text-xs py-1.5 px-2.5"
                    />
                  </div>
                </div>

                {(fromDate || toDate || mobileSearch) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn-base btn-outline text-xs py-1.5 px-3"
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Display all sessions Table */}
          <div className="card-base">
            <div
              className="p-4 sm:p-5 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--color-secondary)]" />
                <h2 className="section-title text-base font-semibold">
                  Session Log Details (sessions &amp; customer_points)
                </h2>
              </div>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Showing {sessions.length} session(s)
              </span>
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
                          <Loader2 className="w-6 h-6 anim-spin text-[var(--color-secondary)]" />
                          <span className="text-xs text-[var(--color-text-muted)]">
                            Loading points sessions from database...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : sessions.length === 0 ? (
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
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sessions.map((item) => (
                      <tr key={item.id} className="table-row">
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

            {/* Table Footer */}
            <div
              className="p-4 border-t flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                borderColor: 'var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span>
                Total Sessions Count Today:{' '}
                <strong className="font-mono text-[var(--color-primary)]">{totalToday}</strong>
              </span>
              <span>
                Total Points in View:{' '}
                <strong className="font-mono text-[var(--color-secondary)]">
                  {totalPointsDistributed.toLocaleString()} pts
                </strong>
              </span>
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
          <Loader2 className="w-8 h-8 anim-spin text-[var(--color-secondary)]" />
        </div>
      }
    >
      <PointsSessionsContent />
    </Suspense>
  );
}
