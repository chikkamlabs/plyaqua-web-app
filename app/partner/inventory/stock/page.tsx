'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PartnerHeader from '@/components/partner/header';
import PartnerBottomNavigation from '@/components/partner/bottomnavigation';
import {
  getPartnerStock,
  fetchProductDetailsMap,
  PartnerStockItem,
  StockSummary,
} from '@/lib/stockStore';
import {
  ArrowLeft,
  Boxes,
  Package,
  Search,
  X,
  Loader2,
  Droplets,
  Layers,
} from 'lucide-react';

export default function PartnerStockPage() {
  const router = useRouter();

  const [searchProdId, setSearchProdId] = useState<string>('');
  const [allItems, setAllItems] = useState<PartnerStockItem[]>([]);
  const [summary, setSummary] = useState<StockSummary>({
    totalProducts: 0,
    totalBottles: 0,
  });
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Load all partner stock inventory and summary once on mount
  // Total products and Total bottles stay persistent and do NOT refresh on search input
  useEffect(() => {
    let isMounted = true;

    async function loadInitialStock() {
      setInitialLoading(true);
      const [res, prodMap] = await Promise.all([
        getPartnerStock(), // fetch all without search query
        fetchProductDetailsMap(),
      ]);
      if (!isMounted) return;
      if (res.data) {
        const enriched = res.data.map((item) => {
          const p = prodMap.get(item.product_id);
          return {
            ...item,
            name: p?.name || item.name,
            size: p?.size || item.size,
            prod_id: p?.prod_id || item.prod_id,
          };
        });
        setAllItems(enriched);
        setSummary(res.summary);
      }
      setInitialLoading(false);
    }

    loadInitialStock();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter items based on search input without touching or refreshing the summary cards
  const filteredStockItems = useMemo(() => {
    if (!searchProdId.trim()) return allItems;
    const q = searchProdId.trim().toLowerCase();
    return allItems.filter(
      (item) =>
        item.prod_id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.size.toLowerCase().includes(q)
    );
  }, [allItems, searchProdId]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Header connected at top */}
      <PartnerHeader />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg sm:max-w-4xl mx-auto px-4 py-5 sm:py-8 pb-28 space-y-5">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push('/partner/inventory/dashboard')}
            className="btn-base btn-outline text-xs py-1.5 px-3"
            aria-label="Back to inventory dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inventory</span>
          </button>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-sm)] border"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Partner Stock Inventory
          </span>
        </div>

        <div>
          <h1
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Stock Inventory
          </h1>
          <p
            className="text-xs sm:text-sm mt-0.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Current products and bottle quantities in your partner inventory
          </p>
        </div>

        {/* 1. Summary Cards: Total Products & Total Bottles (NOT refreshed on search input) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Total Products (count partner_inventory) */}
          <div
            className="card-base p-4 sm:p-5 rounded-[var(--radius-lg)] border shadow-xs flex items-center justify-between"
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
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <span
                  className="text-xs font-medium uppercase tracking-wider block"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Total Products
                </span>
                <span
                  className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight block mt-0.5"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {initialLoading ? '...' : summary.totalProducts}
                </span>
              </div>
            </div>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)]"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
              }}
            >
              Unique SKUs
            </span>
          </div>

          {/* Total Bottles (count sum of partner_inventory) */}
          <div
            className="card-base p-4 sm:p-5 rounded-[var(--radius-lg)] border shadow-xs flex items-center justify-between"
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
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <span
                  className="text-xs font-medium uppercase tracking-wider block"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Total Bottles
                </span>
                <span
                  className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight block mt-0.5"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  {initialLoading ? '...' : summary.totalBottles.toLocaleString()}
                </span>
              </div>
            </div>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)]"
              style={{
                backgroundColor: 'var(--color-secondary-light)',
                color: 'var(--color-secondary)',
              }}
            >
              In Stock
            </span>
          </div>
        </div>

        {/* 2. Search bar(prod_id) with proper left padding to avoid overlapping icon & placeholder */}
        <div
          className="card-base p-3.5 sm:p-4 rounded-[var(--radius-lg)] border"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="relative flex items-center">
            <Search
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search by Product ID (e.g. prod_101) or name..."
              value={searchProdId}
              onChange={(e) => setSearchProdId(e.target.value)}
              className="input-base pl-10 pr-9 text-xs sm:text-sm py-2.5 w-full"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
              }}
            />
            {searchProdId && (
              <button
                type="button"
                onClick={() => setSearchProdId('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3. List of Stock (prod_id, name, size, qty) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Stock Items ({filteredStockItems.length})
            </h2>
          </div>

          {initialLoading ? (
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
                Loading inventory stock...
              </p>
            </div>
          ) : filteredStockItems.length === 0 ? (
            <div
              className="card-base p-8 text-center rounded-[var(--radius-lg)] border border-dashed space-y-2"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <Package
                className="w-10 h-10 mx-auto"
                style={{ color: 'var(--color-text-muted)' }}
              />
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                No stock items found
              </p>
              <p
                className="text-xs max-w-xs mx-auto"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {searchProdId
                  ? 'No products matched your search. Try a different product ID or name.'
                  : 'You currently have no products allocated in your partner inventory.'}
              </p>
              {searchProdId && (
                <button
                  type="button"
                  onClick={() => setSearchProdId('')}
                  className="btn-base btn-outline text-xs mt-2"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="card-base border rounded-[var(--radius-lg)] overflow-hidden">
              {/* Responsive Table for Tablet/Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="table-base w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Product ID (prod_id)</th>
                      <th className="table-header-cell">Product Name</th>
                      <th className="table-header-cell">Size</th>
                      <th className="table-header-cell text-right">Available Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockItems.map((item) => (
                      <tr key={item.id} className="table-row">
                        <td className="table-cell">
                          <span
                            className="font-mono text-xs font-bold px-2 py-0.5 rounded-[var(--radius-sm)]"
                            style={{
                              backgroundColor: 'var(--color-surface-muted)',
                              color: 'var(--color-primary)',
                            }}
                          >
                            {item.prod_id}
                          </span>
                        </td>
                        <td className="table-cell font-medium">
                          <div className="flex items-center gap-2">
                            <Package
                              className="w-4 h-4 shrink-0"
                              style={{ color: 'var(--color-secondary)' }}
                            />
                            <span style={{ color: 'var(--color-text-primary)' }}>
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {item.size}
                        </td>
                        <td className="table-cell text-right">
                          <span
                            className="font-mono font-extrabold text-sm"
                            style={{
                              color: item.qty > 0 ? 'var(--color-primary)' : 'var(--color-danger)',
                            }}
                          >
                            {item.qty.toLocaleString()} units
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile-Friendly Cards List */}
              <div className="sm:hidden divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
                {filteredStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 space-y-2.5"
                    style={{ backgroundColor: 'var(--color-surface)' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="font-mono text-xs font-bold px-2 py-0.5 rounded-[var(--radius-sm)]"
                        style={{
                          backgroundColor: 'var(--color-surface-muted)',
                          color: 'var(--color-primary)',
                        }}
                      >
                        {item.prod_id}
                      </span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-[var(--radius-sm)]"
                        style={{
                          backgroundColor: 'var(--color-secondary-light)',
                          color: 'var(--color-secondary)',
                        }}
                      >
                        {item.size}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--color-secondary)' }}
                      />
                      <span
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {item.name}
                      </span>
                    </div>

                    <div
                      className="flex items-center justify-between pt-2 border-t text-xs"
                      style={{ borderColor: 'var(--color-border-subtle)' }}
                    >
                      <span
                        className="flex items-center gap-1"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Layers className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        <span>In Stock:</span>
                      </span>
                      <span
                        className="font-mono font-extrabold text-sm"
                        style={{
                          color: item.qty > 0 ? 'var(--color-primary)' : 'var(--color-danger)',
                        }}
                      >
                        {item.qty.toLocaleString()} bottles
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom navigation connected at bottom */}
      <PartnerBottomNavigation />
    </div>
  );
}
