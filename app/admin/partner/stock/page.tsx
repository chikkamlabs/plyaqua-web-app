'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import { getPartnerById, Partner } from '@/lib/partnersStore';
import { getPartnerStockByPartnerId, PartnerStockItem } from '@/lib/stockStore';
import {
  ArrowLeft,
  Package,
  Receipt,
  Plus,
  Loader2,
  Store,
  Boxes,
  Search,
  AlertCircle,
} from 'lucide-react';

function PartnerStockContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerId = searchParams?.get('partnerId') || searchParams?.get('partner_id') || searchParams?.get('id') || '';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [stockItems, setStockItems] = useState<PartnerStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
        const [partnerRes, stockRes] = await Promise.all([
          getPartnerById(partnerId),
          getPartnerStockByPartnerId(partnerId),
        ]);

        if (!active) return;

        if (partnerRes.data) {
          setPartner(partnerRes.data);
        } else if (partnerRes.error) {
          setErrorMsg(partnerRes.error.message);
        }

        if (stockRes.data) {
          setStockItems(stockRes.data);
        }
      } catch (err) {
        if (active) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load partner stock inventory');
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
  }, [partnerId]);

  const filteredItems = stockItems.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.prod_id.toLowerCase().includes(q) ||
      item.size.toLowerCase().includes(q)
    );
  });

  const totalQuantity = stockItems.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top navigation & action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/admin/partners/dashboard')}
                className="btn-base btn-outline text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Partners</span>
              </button>
            </div>

            {partner && (
              <div className="flex items-center gap-3">
                {/* Add bill button: opens app/admin/bills/addbill/page.tsx with this partner */}
                <button
                  type="button"
                  onClick={() => router.push(`/admin/bills/addbill?partner_id=${partner.id}`)}
                  className="btn-base btn-primary text-xs shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Bill</span>
                </button>
              </div>
            )}
          </div>

          {/* Partner Header Info Card */}
          <div className="card-base p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="page-title text-xl font-bold">
                      {partner ? partner.name : 'Partner Stock Inventory'}
                    </h1>
                    {partner && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
                        {partner.partner_id}
                      </span>
                    )}
                  </div>
                  <p className="body-text text-xs mt-1">
                    {partner?.partner_category_name || 'Standard Partner'} • {partner?.mobile || 'No mobile'} • {partner?.email || 'No email'}
                  </p>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-6 border-[var(--color-border-subtle)]">
                <div>
                  <p className="small-text">Total Product SKUs</p>
                  <p className="stat-value text-lg mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                    {stockItems.length}
                  </p>
                </div>
                <div>
                  <p className="small-text">Total Units in Stock</p>
                  <p className="stat-value text-lg mt-0.5" style={{ color: 'var(--color-secondary)' }}>
                    {totalQuantity.toLocaleString()}
                  </p>
                </div>
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

          {/* Product stock table */}
          <div className="card-base">
            <div
              className="p-4 sm:p-5 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-[var(--color-secondary)]" />
                <h2 className="section-title text-base font-semibold">
                  Available Stock Inventory (partner_inventory)
                </h2>
              </div>

              {/* Search in stock */}
              <div className="relative w-full sm:w-72">
                <div
                  className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search product or size..."
                  className="input-base text-xs"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            <div className="table-container border-0 rounded-none shadow-none">
              <table className="table-base">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Product ID</th>
                    <th className="table-header-cell">Product Name</th>
                    <th className="table-header-cell">Size</th>
                    <th className="table-header-cell text-right">Available Quantity</th>
                    <th className="table-header-cell text-center">Stock Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 anim-spin text-[var(--color-secondary)]" />
                          <span className="text-xs text-[var(--color-text-muted)]">
                            Fetching partner inventory from partner_inventory...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package className="w-8 h-8 text-[var(--color-border-strong)]" />
                          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                            No products found in partner inventory
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {partner
                              ? 'Click "Add Bill" to dispatch new inventory stock to this partner.'
                              : 'Select a valid partner to review their product stock.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id || item.product_id} className="table-row">
                        {/* prod_id */}
                        <td className="table-cell font-mono font-medium text-xs">
                          <span
                            className="px-2 py-1 rounded-[var(--radius-sm)]"
                            style={{
                              backgroundColor: 'var(--color-surface-muted)',
                              color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-border-subtle)',
                            }}
                          >
                            {item.prod_id}
                          </span>
                        </td>

                        {/* Product Name */}
                        <td className="table-cell">
                          <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {item.name}
                          </span>
                        </td>

                        {/* Size */}
                        <td className="table-cell">
                          <span className="badge-base badge-primary text-xs">
                            {item.size}
                          </span>
                        </td>

                        {/* Available Quantity */}
                        <td className="table-cell text-right font-mono font-bold text-sm">
                          <span style={{ color: 'var(--color-primary)' }}>
                            {Number(item.qty).toLocaleString()}
                          </span>
                        </td>

                        {/* Stock Status */}
                        <td className="table-cell text-center">
                          {item.qty > 50 ? (
                            <span className="status-chip status-chip-active">
                              In Stock
                            </span>
                          ) : item.qty > 0 ? (
                            <span className="status-chip status-chip-pending">
                              Low Stock
                            </span>
                          ) : (
                            <span className="status-chip status-chip-danger">
                              Out of Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div
              className="p-4 border-t flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                borderColor: 'var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span>
                Showing {filteredItems.length} product SKU(s)
              </span>
              <span className="font-medium">
                Total Available Units:{' '}
                <strong className="font-mono text-[var(--color-primary)]">
                  {filteredItems.reduce((acc, it) => acc + (Number(it.qty) || 0), 0).toLocaleString()}
                </strong>
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminPartnerStockPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
          <Loader2 className="w-8 h-8 anim-spin text-[var(--color-secondary)]" />
        </div>
      }
    >
      <PartnerStockContent />
    </Suspense>
  );
}
