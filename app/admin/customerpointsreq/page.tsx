'use client';

import React, { useState, useEffect, useTransition } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  CustomerPointReq,
  CuspntreqStatus,
  formatDateYMD,
  getCustomerPointReqs,
  updateCustomerPointReq,
} from '@/lib/pointsrequestions';
import {
  Coins,
  Search,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  User,
  Phone,
  FileText,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function CustomerPointsReqPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const todayStr = formatDateYMD(new Date());

  // Filter States (default dates to today)
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchMobile, setSearchMobile] = useState<string>('');

  // Data States
  const [requests, setRequests] = useState<CustomerPointReq[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  // Local editing states per request item ID
  const [editingStatus, setEditingStatus] = useState<Record<string, CuspntreqStatus>>({});
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch Requests Function
  const loadRequests = async (overrideFilters?: {
    from?: string;
    to?: string;
    status?: string;
    mobile?: string;
  }) => {
    setLoading(true);
    try {
      const activeFrom = overrideFilters?.from !== undefined ? overrideFilters.from : fromDate;
      const activeTo = overrideFilters?.to !== undefined ? overrideFilters.to : toDate;
      const activeStatus = overrideFilters?.status !== undefined ? overrideFilters.status : statusFilter;
      const activeMobile = overrideFilters?.mobile !== undefined ? overrideFilters.mobile : searchMobile;

      const { data, error } = await getCustomerPointReqs({
        fromDate: activeFrom || undefined,
        toDate: activeTo || undefined,
        status: activeStatus,
        mobile: activeMobile,
      });

      if (error) {
        setNotification({ type: 'error', message: error.message });
      } else {
        setRequests(data);
        const statusMap: Record<string, CuspntreqStatus> = {};
        const notesMap: Record<string, string> = {};
        data.forEach((item) => {
          statusMap[item.id] = item.status;
          notesMap[item.id] = item.notes || '';
        });
        setEditingStatus(statusMap);
        setEditingNotes(notesMap);
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to load customer points requests.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await loadRequests();
      }
    })();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      loadRequests();
    });
  };

  const handleResetFilters = () => {
    const today = formatDateYMD(new Date());
    setFromDate(today);
    setToDate(today);
    setStatusFilter('all');
    setSearchMobile('');
    loadRequests({ from: today, to: today, status: 'all', mobile: '' });
  };

  const toggleNotesExpanded = (id: string) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStatusChange = (id: string, newStatus: CuspntreqStatus) => {
    setEditingStatus((prev) => ({
      ...prev,
      [id]: newStatus,
    }));
  };

  const handleNotesChange = (id: string, text: string) => {
    setEditingNotes((prev) => ({
      ...prev,
      [id]: text,
    }));
  };

  const handleSaveRequest = async (req: CustomerPointReq) => {
    const targetStatus = editingStatus[req.id] || req.status;
    const targetNotes = editingNotes[req.id] !== undefined ? editingNotes[req.id] : (req.notes || '');

    setSavingId(req.id);
    setNotification(null);

    try {
      const { success, error } = await updateCustomerPointReq(req.id, {
        status: targetStatus,
        notes: targetNotes,
        points: req.points,
        customer_id: req.customer_id,
        previousStatus: req.status,
      });

      if (!success || error) {
        setNotification({
          type: 'error',
          message: error ? error.message : 'Failed to update request.',
        });
      } else {
        setRequests((prev) =>
          prev.map((item) =>
            item.id === req.id
              ? {
                  ...item,
                  status: targetStatus,
                  notes: targetNotes,
                  updated_at: new Date().toISOString(),
                }
              : item
          )
        );

        setSaveSuccessId(req.id);
        setNotification({
          type: 'success',
          message:
            targetStatus === 'completed' && req.status !== 'completed'
              ? `Request marked completed. Deducted ₹{req.points} points from customer ledger.`
              : 'Request status and notes updated successfully.',
        });

        setTimeout(() => {
          setSaveSuccessId(null);
        }, 2500);
      }
    } catch {
      setNotification({ type: 'error', message: 'An unexpected error occurred while saving.' });
    } finally {
      setSavingId(null);
    }
  };

  const getStatusBadge = (status: CuspntreqStatus) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'var(--color-success-light)',
          color: 'var(--color-success-text)',
          border: 'var(--color-success-border)',
          icon: CheckCircle2,
          label: 'Completed',
        };
      case 'processing':
        return {
          bg: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          border: 'var(--color-border-strong)',
          icon: Clock,
          label: 'Processing',
        };
      case 'pending':
        return {
          bg: 'var(--color-warning-light)',
          color: 'var(--color-warning-text)',
          border: 'var(--color-warning-border)',
          icon: AlertCircle,
          label: 'Pending',
        };
      case 'rejected':
        return {
          bg: 'var(--color-danger-light)',
          color: 'var(--color-danger-text)',
          border: 'var(--color-danger-border)',
          icon: XCircle,
          label: 'Rejected',
        };
      case 'cancelled':
        return {
          bg: 'var(--color-surface-muted)',
          color: 'var(--color-text-muted)',
          border: 'var(--color-border-subtle)',
          icon: XCircle,
          label: 'Cancelled',
        };
      default:
        return {
          bg: 'var(--color-surface-muted)',
          color: 'var(--color-text-secondary)',
          border: 'var(--color-border)',
          icon: AlertCircle,
          label: status,
        };
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Main Admin Header */}
      <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1">
        {/* Main Admin Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Page Heading & Total Requests Stat */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Coins
                  className="w-5 h-5"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Loyalty Points Redemption
                </span>
              </div>
              <h1 className="page-title text-2xl font-bold">
                Customer Points Reqs
              </h1>
              <p className="body-text text-xs mt-1">
                Review, process, and approve customer loyalty points redemption claims.
              </p>
            </div>

            {/* Total Requests Stat Card (Count as per filtered dates applied) */}
            <div
              className="card-base p-4 sm:p-5 flex items-center justify-between sm:justify-start gap-4 min-w-[240px] border border-[var(--color-border)] shadow-xs"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="space-y-0.5">
                <p className="label-text">Total Requests</p>
                <p className="stat-value text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-secondary)' }}>
                  {requests.length}
                </p>
                <p className="small-text text-[var(--color-text-muted)]">
                  Count for filtered dates applied
                </p>
              </div>
              <div
                className="w-11 h-11 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: 'var(--color-secondary-light)',
                  color: 'var(--color-secondary)',
                }}
              >
                <Coins className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Notification Alert */}
          {notification && (
            <div
              className="flex items-center justify-between p-3.5 rounded-[var(--radius-md)] text-xs sm:text-sm font-medium border"
              style={{
                backgroundColor:
                  notification.type === 'success'
                    ? 'var(--color-success-light)'
                    : 'var(--color-danger-light)',
                color:
                  notification.type === 'success'
                    ? 'var(--color-success-text)'
                    : 'var(--color-danger-text)',
                borderColor:
                  notification.type === 'success'
                    ? 'var(--color-success-border)'
                    : 'var(--color-danger-border)',
              }}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-xs opacity-75 hover:opacity-100 underline ml-3"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Filter Bar with Clean Explicit Border Lines */}
          <div
            className="card-base p-4 sm:p-5 border border-[var(--color-border)] shadow-xs space-y-4"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border-subtle)]">
              <Filter className="w-4 h-4 text-[var(--color-secondary)]" />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Filter &amp; Search Requests
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Search Bar with Clean Border Line */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Customer Mobile</span>
                </label>
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div
                    className="flex items-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-xs transition-colors focus-within:border-[var(--color-secondary)] focus-within:ring-1 focus-within:ring-[var(--color-secondary)]"
                    style={{ backgroundColor: 'var(--color-surface)' }}
                  >
                    <div className="pl-3 pr-1 text-slate-400 pointer-events-none">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search mobile number..."
                      value={searchMobile}
                      onChange={(e) => setSearchMobile(e.target.value)}
                      className="w-full text-xs py-2 pr-3 bg-transparent border-0 outline-none focus:ring-0"
                      style={{ color: 'var(--color-text-primary)' }}
                    />
                    {searchMobile && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchMobile('');
                          loadRequests({ mobile: '' });
                        }}
                        className="pr-2.5 text-xs text-slate-400 hover:text-slate-600"
                        title="Clear mobile search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Status Filter with Clean Border Line */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>Request Status</span>
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs outline-none transition-colors focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)] capitalize"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* From Date with Clean Border Line (Default Today) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>From Date</span>
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs outline-none transition-colors focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)]"
                />
              </div>

              {/* To Date with Clean Border Line (Default Today) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>To Date</span>
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs outline-none transition-colors focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)]"
                />
              </div>
            </div>

            {/* Filter Action Status and Reset Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-[var(--color-border-subtle)] text-xs">
              <span className="text-[var(--color-text-muted)]">
                Showing <strong className="text-[var(--color-text-primary)]">{requests.length}</strong> request(s) for date range {fromDate || 'any'} to {toDate || 'any'}
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-base btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 font-medium border border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Today</span>
              </button>
            </div>
          </div>

          {/* Table Container for Customer Points Requests */}
          <div className="card-base border border-[var(--color-border)] shadow-xs overflow-hidden">
            <div
              className="p-4 sm:p-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--color-secondary)]" />
                <h2 className="section-title text-base font-semibold">
                  Customer Points Requests Log
                </h2>
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">
                Total matching: {requests.length}
              </span>
            </div>

            {loading || isPending ? (
              <div className="p-12 text-center space-y-3">
                <Loader2 className="w-7 h-7 mx-auto animate-spin text-[var(--color-secondary)]" />
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                  Loading customer points requests...
                </p>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Coins className="w-10 h-10 mx-auto text-slate-300" />
                <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
                  No Requests Found
                </h3>
                <p className="text-xs sm:text-sm max-w-sm mx-auto text-[var(--color-text-muted)]">
                  There are no customer point redemption claims matching the selected dates or search criteria.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn-base btn-primary text-xs px-4 py-2 mt-2"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div>
                {/* Desktop and Tablet Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr
                        className="border-b border-[var(--color-border)]"
                        style={{ backgroundColor: 'var(--color-surface-muted)' }}
                      >
                        <th className="py-3 px-4 font-semibold text-[var(--color-text-secondary)]">
                          Points
                        </th>
                        <th className="py-3 px-4 font-semibold text-[var(--color-text-secondary)]">
                          Customer Details
                        </th>
                        <th className="py-3 px-4 font-semibold text-[var(--color-text-secondary)]">
                          Status
                        </th>
                        <th className="py-3 px-4 font-semibold text-[var(--color-text-secondary)]">
                          Notes
                        </th>
                        <th className="py-3 px-4 font-semibold text-right text-[var(--color-text-secondary)]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)]">
                      {requests.map((req) => {
                        const currentStatus = editingStatus[req.id] || req.status;
                        const badge = getStatusBadge(currentStatus);
                        const StatusIcon = badge.icon;
                        const isExpanded = !!expandedNotes[req.id];
                        const currentNotes = editingNotes[req.id] !== undefined ? editingNotes[req.id] : (req.notes || '');
                        const isSaving = savingId === req.id;
                        const isSaved = saveSuccessId === req.id;

                        return (
                          <tr
                            key={req.id}
                            className="transition-colors hover:bg-[var(--color-surface-hover)]"
                          >
                            {/* Points Column */}
                            <td className="py-3.5 px-4 align-top">
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-bold font-mono"
                                style={{
                                  backgroundColor: 'var(--color-secondary-light)',
                                  color: 'var(--color-secondary)',
                                  border: '1px solid var(--color-border-subtle)',
                                }}
                              >
                                <Coins className="w-3.5 h-3.5 flex-shrink-0" />
                                {req.points} pts
                              </span>
                              <div className="text-[11px] mt-1 text-[var(--color-text-muted)]">
                                {req.created_at ? req.created_at.replace('T', ' ').substring(0, 16) : 'Today'}
                              </div>
                            </td>

                            {/* Customer Details Column */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="space-y-1">
                                <div className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 text-[var(--color-text-primary)]">
                                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  <span>{req.customer_name || 'Customer'}</span>
                                </div>
                                <div className="text-xs flex items-center gap-1.5 text-[var(--color-text-secondary)] font-mono">
                                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  <span>{req.customer_mobile || '—'}</span>
                                </div>
                                <div className="text-[10px] font-mono text-[var(--color-text-muted)] truncate max-w-[170px]">
                                  ID: {req.customer_id}
                                </div>
                              </div>
                            </td>

                            {/* Status Selector Column (Allow to change here) */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="space-y-1.5">
                                <select
                                  value={currentStatus}
                                  onChange={(e) => handleStatusChange(req.id, e.target.value as CuspntreqStatus)}
                                  className="text-xs py-1.5 px-2.5 font-medium rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] w-full max-w-[150px] capitalize cursor-pointer shadow-xs outline-none focus:border-[var(--color-secondary)]"
                                  style={{
                                    backgroundColor: badge.bg,
                                    color: badge.color,
                                    borderColor: badge.border,
                                  }}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="completed">Completed</option>
                                  <option value="rejected">Rejected</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                <div className="flex items-center gap-1 text-[11px]" style={{ color: badge.color }}>
                                  <StatusIcon className="w-3 h-3 flex-shrink-0" />
                                  <span className="capitalize">{badge.label}</span>
                                </div>
                              </div>
                            </td>

                            {/* Notes Column (On tap open small section there only and allow to input) */}
                            <td className="py-3.5 px-4 align-top min-w-[240px]">
                              <div className="space-y-2">
                                <button
                                  type="button"
                                  onClick={() => toggleNotesExpanded(req.id)}
                                  className="text-xs flex items-center justify-between gap-2 p-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] w-full text-left bg-[var(--color-surface)] shadow-2xs"
                                  title="Click to view/edit notes"
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    <span className="truncate max-w-[190px] text-[var(--color-text-secondary)]">
                                      {currentNotes.trim() ? currentNotes : 'Add or edit notes...'}
                                    </span>
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  )}
                                </button>

                                {/* Inline Expandable Notes Editor */}
                                {isExpanded && (
                                  <div
                                    className="p-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] space-y-2"
                                    style={{ backgroundColor: 'var(--color-surface-muted)' }}
                                  >
                                    <textarea
                                      rows={2}
                                      placeholder="Type notes for this points request..."
                                      value={currentNotes}
                                      onChange={(e) => handleNotesChange(req.id, e.target.value)}
                                      className="w-full text-xs p-2 rounded-[var(--radius-xs)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none resize-none focus:border-[var(--color-secondary)] shadow-inner"
                                    />
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-[var(--color-text-muted)]">
                                        Tap Save to record
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => toggleNotesExpanded(req.id)}
                                        className="font-semibold text-[var(--color-secondary)] hover:underline"
                                      >
                                        Done
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Save Action Column */}
                            <td className="py-3.5 px-4 align-top text-right">
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleSaveRequest(req)}
                                className="btn-base btn-primary text-xs px-3.5 py-1.5 inline-flex items-center gap-1.5 font-medium transition-all"
                                style={{
                                  backgroundColor: isSaved ? 'var(--color-success)' : undefined,
                                  borderColor: isSaved ? 'var(--color-success)' : undefined,
                                }}
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Saving...</span>
                                  </>
                                ) : isSaved ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
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

                {/* Mobile Cards View (< 768px) */}
                <div className="md:hidden divide-y divide-[var(--color-border-subtle)]">
                  {requests.map((req) => {
                    const currentStatus = editingStatus[req.id] || req.status;
                    const badge = getStatusBadge(currentStatus);
                    const isExpanded = !!expandedNotes[req.id];
                    const currentNotes = editingNotes[req.id] !== undefined ? editingNotes[req.id] : (req.notes || '');
                    const isSaving = savingId === req.id;
                    const isSaved = saveSuccessId === req.id;

                    return (
                      <div key={req.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-bold font-mono"
                            style={{
                              backgroundColor: 'var(--color-secondary-light)',
                              color: 'var(--color-secondary)',
                              border: '1px solid var(--color-border-subtle)',
                            }}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            {req.points} pts
                          </span>
                          <span className="text-[11px] text-[var(--color-text-muted)]">
                            {req.created_at ? req.created_at.replace('T', ' ').substring(0, 10) : 'Today'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="text-sm font-semibold flex items-center gap-1.5 text-[var(--color-text-primary)]">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{req.customer_name || 'Customer'}</span>
                          </div>
                          <div className="text-xs flex items-center gap-1.5 text-[var(--color-text-secondary)] font-mono">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{req.customer_mobile || '—'}</span>
                          </div>
                          <div className="text-[10px] font-mono text-[var(--color-text-muted)] truncate">
                            ID: {req.customer_id}
                          </div>
                        </div>

                        {/* Status Select with Clean Border */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                            Status:
                          </label>
                          <select
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(req.id, e.target.value as CuspntreqStatus)}
                            className="w-full text-xs py-2 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] capitalize font-medium shadow-xs"
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.color,
                              borderColor: badge.border,
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        {/* Expandable Notes */}
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => toggleNotesExpanded(req.id)}
                            className="w-full text-xs flex items-center justify-between p-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xs text-[var(--color-text-secondary)]"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">
                                {currentNotes.trim() ? currentNotes : 'Tap to add/edit notes...'}
                              </span>
                            </div>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div
                              className="p-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] space-y-2"
                              style={{ backgroundColor: 'var(--color-surface-muted)' }}
                            >
                              <textarea
                                rows={2}
                                placeholder="Type notes for this points request..."
                                value={currentNotes}
                                onChange={(e) => handleNotesChange(req.id, e.target.value)}
                                className="w-full text-xs p-2 rounded-[var(--radius-xs)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none resize-none focus:border-[var(--color-secondary)] shadow-inner"
                              />
                              <div className="text-right">
                                <button
                                  type="button"
                                  onClick={() => toggleNotesExpanded(req.id)}
                                  className="text-xs font-semibold text-[var(--color-secondary)] hover:underline"
                                >
                                  Done Editing
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Save Button */}
                        <div className="pt-1">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSaveRequest(req)}
                            className="btn-base btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-1.5 font-medium"
                            style={{
                              backgroundColor: isSaved ? 'var(--color-success)' : undefined,
                              borderColor: isSaved ? 'var(--color-success)' : undefined,
                            }}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving Changes...</span>
                              </>
                            ) : isSaved ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Saved Successfully</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Request</span>
                              </>
                            )}
                          </button>
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
