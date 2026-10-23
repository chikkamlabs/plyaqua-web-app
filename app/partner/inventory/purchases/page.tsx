'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PartnerHeader from '@/components/partner/header';
import PartnerBottomNavigation from '@/components/partner/bottomnavigation';
import {
  getPartnerPurchases,
  getThisWeekPurchasesCount,
  getDefaultOneWeekRange,
  Purchase,
} from '@/lib/purchasesStore';
import {
  ArrowLeft,
  Search,
  Calendar,
  Receipt,
  Package,
  Layers,
  ChevronRight,
  Loader2,
  TrendingUp,
  X,
  Filter,
} from 'lucide-react';

export default function PartnerPurchasesPage() {
  const router = useRouter();

  // Date filters (defaults to last one week: 7 days ago to today)
  const defaultRange = useMemo(() => getDefaultOneWeekRange(), []);
  const [fromDate, setFromDate] = useState<string>(defaultRange.fromDate);
  const [toDate, setToDate] = useState<string>(defaultRange.toDate);

  // Search by bill_id
  const [searchBillId, setSearchBillId] = useState<string>('');

  // Purchases data state
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [thisWeekCount, setThisWeekCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const allRes = await getPartnerPurchases();
      if (!isMounted) return;
      if (allRes.data) {
        setAllPurchases(allRes.data);
        setThisWeekCount(getThisWeekPurchasesCount(allRes.data));
      }

      const filteredRes = await getPartnerPurchases({
        searchBillId: searchBillId.trim(),
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });

      if (!isMounted) return;
      if (filteredRes.data) {
        setFilteredPurchases(filteredRes.data);
      }
      setLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [searchBillId, fromDate, toDate]);

  const handleResetFilters = () => {
    setSearchBillId('');
    setFromDate(defaultRange.fromDate);
    setToDate(defaultRange.toDate);
  };

  const getStatusChip = (status: Purchase['status']) => {
    switch (status) {
      case 'accepted':
        return <span className="status-chip status-chip-active">Accepted</span>;
      case 'delivered':
        return (
          <span
            className="status-chip"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
            }}
          >
            Delivered
          </span>
        );
      case 'pending':
      default:
        return <span className="status-chip status-chip-pending">Pending</span>;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Header attached at top */}
      <PartnerHeader />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg sm:max-w-4xl mx-auto px-4 py-5 sm:py-8 pb-28 space-y-5">
        {/* Navigation & Title */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push('/partner/inventory/dashboard')}
            className="btn-base btn-outline text-xs py-1.5 px-3"
            aria-label="Back to inventory hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inventory</span>
          </button>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-sm)]"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            Partner Invoices & Orders
          </span>
        </div>

        <div>
          <h1
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Purchases
          </h1>
          <p
            className="text-xs sm:text-sm mt-0.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Track purchase orders, verify received deliveries and accept bills
          </p>
        </div>

        {/* 1. Stat Card: Total Purchases (count This week) */}
        <div
          className="card-base p-4 sm:p-5 flex items-center justify-between rounded-[var(--radius-lg)] border"
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
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Total Purchases (This week)
              </p>
              <p
                className="text-2xl font-extrabold tracking-tight mt-0.5"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {thisWeekCount} <span className="text-xs font-normal text-[var(--color-text-muted)]">orders</span>
              </p>
            </div>
          </div>
          <div
            className="text-right text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <span className="block font-medium">All Time</span>
            <span className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>
              {allPurchases.length}
            </span>
          </div>
        </div>

        {/* 2. Search bar(bill_id) & 3. Filters(from to dates default last one week) */}
        <div
          className="card-base p-4 rounded-[var(--radius-lg)] border space-y-3"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* Search bar(bill_id) */}
          <div className="relative">
            <Search
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search by Bill ID (e.g. bill_84920)..."
              value={searchBillId}
              onChange={(e) => setSearchBillId(e.target.value)}
              className="input-base pl-9 pr-8 text-xs sm:text-sm"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
              }}
            />
            {searchBillId && (
              <button
                type="button"
                onClick={() => setSearchBillId('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Filters: From to dates default last one week */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            <div className="form-group">
              <label
                className="text-[11px] font-semibold flex items-center gap-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Calendar className="w-3 h-3 text-[var(--color-secondary)]" />
                <span>From Date</span>
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input-base text-xs py-1.5"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                }}
              />
            </div>

            <div className="form-group">
              <label
                className="text-[11px] font-semibold flex items-center gap-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Calendar className="w-3 h-3 text-[var(--color-secondary)]" />
                <span>To Date</span>
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input-base text-xs py-1.5"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                }}
              />
            </div>

            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-base btn-outline w-full text-xs py-2"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Reset (Last 1 Week)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. List of Purchases */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Purchases List ({filteredPurchases.length})
            </h2>
          </div>

          {loading ? (
            <div
              className="card-base p-10 text-center rounded-[var(--radius-lg)] border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <Loader2
                className="w-7 h-7 anim-spin mx-auto mb-2"
                style={{ color: 'var(--color-secondary)' }}
              />
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Loading purchases...
              </p>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div
              className="card-base p-8 text-center rounded-[var(--radius-lg)] border border-dashed space-y-2"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <Receipt
                className="w-10 h-10 mx-auto"
                style={{ color: 'var(--color-text-muted)' }}
              />
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                No purchases found
              </p>
              <p
                className="text-xs max-w-xs mx-auto"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Try clearing your search query or broadening the date range filters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-base btn-outline text-xs mt-2"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPurchases.map((purchase) => {
                return (
                  <div
                    key={purchase.id}
                    className="card-base p-4 sm:p-5 rounded-[var(--radius-lg)] border transition-all hover:shadow-md"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    {/* Top Row: Purchase_id(bill_id) + Status + Date */}
                    <div className="flex items-center justify-between gap-2 border-b pb-3 mb-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
                      <div className="flex items-center gap-2">
                        <Receipt
                          className="w-4 h-4 shrink-0"
                          style={{ color: 'var(--color-primary)' }}
                        />
                        <span
                          className="font-mono text-sm font-bold tracking-tight"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          {purchase.bill_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {purchase.bill_date}
                        </span>
                        {getStatusChip(purchase.status)}
                      </div>
                    </div>

                    {/* Middle Details Grid: Amount, Products (length of bill_items), items (sum of qty) */}
                    <div className="grid grid-cols-3 gap-2 py-1 mb-3 text-center sm:text-left">
                      {/* Amount */}
                      <div
                        className="p-2.5 rounded-[var(--radius-md)]"
                        style={{ backgroundColor: 'var(--color-surface-hover)' }}
                      >
                        <span
                          className="text-[11px] block"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          Amount
                        </span>
                        <span
                          className="text-sm sm:text-base font-extrabold font-mono"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          ${purchase.amount.toFixed(2)}
                        </span>
                      </div>

                      {/* Products (length of bill_items) */}
                      <div
                        className="p-2.5 rounded-[var(--radius-md)]"
                        style={{ backgroundColor: 'var(--color-surface-hover)' }}
                      >
                        <span
                          className="text-[11px] flex items-center justify-center sm:justify-start gap-1"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <Package className="w-3 h-3 text-[var(--color-secondary)]" />
                          <span>Products</span>
                        </span>
                        <span
                          className="text-sm sm:text-base font-bold"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {purchase.products_count}
                        </span>
                      </div>

                      {/* items (sum of qty on bill_items) */}
                      <div
                        className="p-2.5 rounded-[var(--radius-md)]"
                        style={{ backgroundColor: 'var(--color-surface-hover)' }}
                      >
                        <span
                          className="text-[11px] flex items-center justify-center sm:justify-start gap-1"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <Layers className="w-3 h-3 text-[var(--color-primary)]" />
                          <span>Items (Qty)</span>
                        </span>
                        <span
                          className="text-sm sm:text-base font-bold"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {purchase.items_count}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: open(button) */}
                    <div className="flex items-center justify-end pt-2 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/partner/inventory/openpurchase?id=${purchase.id}`)
                        }
                        className="btn-base btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 w-full sm:w-auto justify-center"
                        aria-label={`Open purchase ${purchase.bill_id}`}
                      >
                        <span>Open Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom navigation attached at bottom */}
      <PartnerBottomNavigation />
    </div>
  );
}
