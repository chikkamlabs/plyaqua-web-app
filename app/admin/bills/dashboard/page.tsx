'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import { getBills, Bill } from '@/lib/billssStore';
import { getPartnerCategories, PartnerCategory } from '@/lib/partnercategories';
import {
  Receipt,
  Search,
  Plus,
  ExternalLink,
  Calendar,
  Filter,
  Loader2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function BillsDashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<PartnerCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Category filter state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Date filters: default today
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [enableDateFilter, setEnableDateFilter] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const [billsRes, catsRes] = await Promise.all([
        getBills(),
        getPartnerCategories(),
      ]);

      if (!active) return;

      if (billsRes.data) {
        setBills(billsRes.data);
      }
      if (catsRes.data) {
        setCategories(catsRes.data);
      }
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // Total bills today count
  const todayBillsCount = useMemo(() => {
    return bills.filter((b) => b.bill_date === todayStr).length;
  }, [bills, todayStr]);

  // Total invoice value
  const totalInvoicedToday = useMemo(() => {
    return bills
      .filter((b) => b.bill_date === todayStr)
      .reduce((sum, b) => sum + (b.amount || 0), 0);
  }, [bills, todayStr]);

  // Filtered bills based on search bar, partner_category, and dates
  const filteredBills = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return bills.filter((b) => {
      // 1. Search by bill_id or partner name
      const matchesSearch =
        !q ||
        b.bill_id.toLowerCase().includes(q) ||
        (b.partner_name && b.partner_name.toLowerCase().includes(q));

      // 2. Filter by partner category
      const matchesCategory =
        selectedCategoryFilter === 'all' ||
        b.partner_category_id === selectedCategoryFilter;

      // 3. Filter by dates (from to default today)
      let matchesDates = true;
      if (enableDateFilter && b.bill_date) {
        if (fromDate && b.bill_date < fromDate) {
          matchesDates = false;
        }
        if (toDate && b.bill_date > toDate) {
          matchesDates = false;
        }
      }

      return matchesSearch && matchesCategory && matchesDates;
    });
  }, [bills, searchQuery, selectedCategoryFilter, fromDate, toDate, enableDateFilter]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Page Heading & Add Bill Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Receipt
                  className="w-5 h-5"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Billing & Transactions
                </span>
              </div>
              <h1 className="page-title text-2xl font-bold">
                Partner Invoices & Bills
              </h1>
            </div>

            {/* Add Bill Button: links to app/admin/bills/addbill/page.tsx */}
            <button
              type="button"
              onClick={() => router.push('/admin/bills/addbill')}
              className="btn-base btn-primary shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Bill</span>
            </button>
          </div>

          {/* Stats: Total Bills (today count) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Total Bills (Today Count)</p>
                  <p className="stat-value mt-1">{todayBillsCount}</p>
                </div>
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
            </div>

            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Today Invoiced Amount</p>
                  <p
                    className="stat-value mt-1"
                    style={{ color: 'var(--color-success)' }}
                  >
                    ${totalInvoicedToday.toFixed(2)}
                  </p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-success-light)',
                    color: 'var(--color-success-text)',
                  }}
                >
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">All-Time Total Invoices</p>
                  <p
                    className="stat-value mt-1"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    {bills.length}
                  </p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-secondary-light)',
                    color: 'var(--color-secondary)',
                  }}
                >
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar & Filters Card */}
          <div className="card-base">
            <div
              className="p-4 sm:p-5 border-b space-y-4"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                {/* Search Bar (bill_id, name) */}
                <div className="relative flex-1 max-w-md">
                  <div
                    className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Bill ID (bill_id) or Partner Name..."
                    className="input-base"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>

                {/* Filters Row: partner_categories, dates (from to default today) */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Category Filter */}
                  <div className="flex items-center gap-1.5 min-w-[180px]">
                    <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="select-base text-xs py-1.5"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range Filter (From & To default today) */}
                  <div className="flex items-center gap-2 text-xs bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] p-1.5 rounded-[var(--radius-md)]">
                    <label className="flex items-center gap-1 cursor-pointer font-medium text-[var(--color-text-secondary)]">
                      <input
                        type="checkbox"
                        checked={enableDateFilter}
                        onChange={(e) => setEnableDateFilter(e.target.checked)}
                        className="rounded text-[var(--color-secondary)] focus:ring-0"
                      />
                      <span>Date Filter:</span>
                    </label>

                    <div className="flex items-center gap-1">
                      <span className="text-[var(--color-text-muted)]">From</span>
                      <input
                        type="date"
                        value={fromDate}
                        disabled={!enableDateFilter}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="input-base py-0.5 px-1.5 text-xs w-32 disabled:opacity-50"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[var(--color-text-muted)]">To</span>
                      <input
                        type="date"
                        value={toDate}
                        disabled={!enableDateFilter}
                        onChange={(e) => setToDate(e.target.value)}
                        className="input-base py-0.5 px-1.5 text-xs w-32 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs flex items-center justify-between text-[var(--color-text-muted)] pt-1">
                <span>
                  Showing {filteredBills.length} of {bills.length} invoices
                </span>
                {enableDateFilter && fromDate === todayStr && toDate === todayStr && (
                  <span className="text-[var(--color-secondary)] font-medium">
                    Filtered for Today ({todayStr})
                  </span>
                )}
              </div>
            </div>

            {/* List of Bills Table */}
            <div className="table-container border-0 rounded-none shadow-none">
              <table className="table-base">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Bill ID</th>
                    <th className="table-header-cell">Partner Details</th>
                    <th className="table-header-cell">Date</th>
                    <th className="table-header-cell">Items Overview (Size, SP, Qty)</th>
                    <th className="table-header-cell">Amount</th>
                    <th className="table-header-cell">Balance</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 anim-spin text-[var(--color-secondary)]" />
                          <span className="text-xs text-[var(--color-text-muted)]">
                            Loading partner bills and invoices...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Receipt className="w-8 h-8 text-[var(--color-border-strong)]" />
                          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                            No bills found
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {searchQuery || selectedCategoryFilter !== 'all' || enableDateFilter
                              ? 'Try adjusting your search criteria, category, or date range'
                              : 'Click "Add Bill" to create your first partner invoice'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBills.map((b) => (
                      <tr key={b.id} className="table-row">
                        {/* bill_id */}
                        <td className="table-cell font-mono font-medium text-xs">
                          <span
                            className="px-2 py-1 rounded-[var(--radius-sm)]"
                            style={{
                              backgroundColor: 'var(--color-surface-muted)',
                              color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-border-subtle)',
                            }}
                          >
                            {b.bill_id}
                          </span>
                        </td>

                        {/* Partner Details */}
                        <td className="table-cell">
                          <div>
                            <span className="font-semibold block text-[var(--color-text-primary)]">
                              {b.partner_name || 'Partner'}
                            </span>
                            <span className="text-xs text-[var(--color-text-muted)] block">
                              {b.partner_mobile} {b.partner_category_name && `• ${b.partner_category_name}`}
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="table-cell text-xs font-medium text-[var(--color-text-secondary)]">
                          {b.bill_date}
                        </td>

                        {/* Items overview: Size, SP, Qty */}
                        <td className="table-cell">
                          {b.items && b.items.length > 0 ? (
                            <div className="space-y-1">
                              {b.items.slice(0, 2).map((it, i) => (
                                <div key={i} className="text-xs flex items-center gap-1.5">
                                  <span className="font-medium text-[var(--color-text-primary)]">
                                    {it.product_name}
                                  </span>
                                  <span className="badge-base badge-secondary text-[10px] py-0 px-1.5">
                                    {it.product_size}
                                  </span>
                                  <span className="text-[var(--color-text-muted)]">
                                    × {it.qty} @ ${it.sp}
                                  </span>
                                </div>
                              ))}
                              {b.items.length > 2 && (
                                <span className="text-[10px] text-[var(--color-secondary)] font-medium">
                                  +{b.items.length - 2} more item(s)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--color-text-muted)]">—</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="table-cell font-mono font-bold text-xs text-[var(--color-primary)]">
                          ${b.amount.toFixed(2)}
                        </td>

                        {/* Balance */}
                        <td className="table-cell font-mono text-xs text-[var(--color-text-secondary)]">
                          ${b.balance.toFixed(2)}
                        </td>

                        {/* Status */}
                        <td className="table-cell">
                          {b.status === 'accepted' ? (
                            <span className="status-chip status-chip-active">
                              Accepted
                            </span>
                          ) : b.status === 'delivered' ? (
                            <span className="status-chip status-chip-pending">
                              Delivered
                            </span>
                          ) : (
                            <span className="status-chip status-chip-inactive">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Open Button - routes to app/admin/bills/openbill/page.tsx */}
                        <td className="table-cell text-right">
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/bills/openbill?id=${b.id}`)}
                            className="btn-base btn-outline text-xs py-1.5 px-3"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open</span>
                          </button>
                        </td>
                      </tr>
                    ))
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
