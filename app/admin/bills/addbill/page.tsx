'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  createBill,
  generateRandomBillId,
  BillStatus,
} from '@/lib/billssStore';
import { getPartners, Partner } from '@/lib/partnersStore';
import { getProducts, Product } from '@/lib/productsStore';
import {
  ArrowLeft,
  Receipt,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  Search,
  Check,
  ChevronDown,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface LocalItem {
  product_id: string;
  product_name: string;
  product_size: string;
  sp: number;
  qty: number;
  row_total: number;
}

function AddBillContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-filled bill_id: bill_random(5 number)
  const [billId] = useState<string>(() => generateRandomBillId());

  // Partners & Products data
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Bill header fields
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(() => {
    return searchParams?.get('partner_id') || searchParams?.get('partnerId') || searchParams?.get('id') || '';
  });
  const [partnerSearch, setPartnerSearch] = useState('');
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);

  const [billDate, setBillDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<BillStatus>('pending');
  const [balance, setBalance] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Bill items state
  const [items, setItems] = useState<LocalItem[]>([]);

  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const [partnersRes, productsRes] = await Promise.all([
        getPartners(),
        getProducts(),
      ]);

      if (!active) return;

      if (partnersRes.data) {
        setPartners(partnersRes.data);
        const queryPartner = searchParams?.get('partner_id') || searchParams?.get('partnerId') || searchParams?.get('id');
        if (queryPartner) {
          const matched = partnersRes.data.find(
            (p) => p.id === queryPartner || p.partner_id === queryPartner
          );
          if (matched) {
            setSelectedPartnerId(matched.id);
          }
        }
      }
      if (productsRes.data) {
        setProducts(productsRes.data);
      }
      setLoadingInitial(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [searchParams]);

  // Filtered partners for search & select dropdown
  const filteredPartners = useMemo(() => {
    const q = partnerSearch.toLowerCase().trim();
    if (!q) return partners;
    return partners.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.partner_id.toLowerCase().includes(q) ||
        p.mobile.toLowerCase().includes(q)
    );
  }, [partners, partnerSearch]);

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId);

  // Total amount calculated from bill_items.row_total sum
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.row_total) || 0), 0);
  }, [items]);

  const handleAddItem = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    const defaultSp = firstProd.sp || 0;
    const defaultQty = 1;

    setItems((prev) => [
      ...prev,
      {
        product_id: firstProd.id,
        product_name: firstProd.name,
        product_size: firstProd.size_value || 'Standard',
        sp: defaultSp,
        qty: defaultQty,
        row_total: defaultSp * defaultQty,
      },
    ]);
  };

  const handleProductChange = (index: number, newProductId: string) => {
    const prod = products.find((p) => p.id === newProductId);
    if (!prod) return;

    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const sp = prod.sp || 0;
        return {
          ...item,
          product_id: prod.id,
          product_name: prod.name,
          product_size: prod.size_value || 'Standard',
          sp,
          row_total: sp * item.qty,
        };
      })
    );
  };

  const handleSpChange = (index: number, newSp: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          sp: newSp,
          row_total: Number((newSp * item.qty).toFixed(2)),
        };
      })
    );
  };

  const handleQtyChange = (index: number, newQty: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          qty: newQty,
          row_total: Number((item.sp * newQty).toFixed(2)),
        };
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      setErrorMsg('Please select a partner for this bill.');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Please add at least one line item to the bill.');
      return;
    }

    setCreating(true);
    setErrorMsg(null);

    const { data, error } = await createBill({
      bill_id: billId,
      partner_id: selectedPartnerId,
      bill_date: billDate,
      status,
      balance: Number(balance) || 0,
      notes: notes.trim(),
      items: items.map((it) => ({
        product_id: it.product_id,
        product_name: it.product_name,
        product_size: it.product_size,
        sp: it.sp,
        qty: it.qty,
        row_total: it.row_total,
      })),
    });

    setCreating(false);

    if (error || !data) {
      setErrorMsg(error?.message || 'Failed to create bill.');
      return;
    }

    router.push('/admin/bills/dashboard');
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
          {/* Header navigation bar */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/bills/dashboard')}
              className="btn-base btn-outline text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Bills</span>
            </button>

            <span className="font-mono text-xs px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
              {billId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[var(--color-secondary)]" />
            <h1 className="page-title text-2xl font-bold">
              Generate Partner Invoice (Bills & Bill Items)
            </h1>
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

          {loadingInitial ? (
            <div className="card-base p-12 text-center">
              <Loader2 className="w-8 h-8 anim-spin mx-auto mb-3 text-[var(--color-secondary)]" />
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                Loading partners and inventory products...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Bill Header Information */}
              <div className="card-base p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border-subtle)]">
                  <FileText className="w-5 h-5 text-[var(--color-primary)]" />
                  <h2 className="section-title text-base font-semibold">
                    Invoice Details (public.bills)
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Auto-filled Bill ID */}
                  <div className="form-group">
                    <label className="form-label">Bill ID (Auto-Generated)</label>
                    <input
                      type="text"
                      value={billId}
                      readOnly
                      disabled
                      className="input-base cursor-not-allowed font-mono text-xs"
                      style={{
                        backgroundColor: 'var(--color-surface-muted)',
                        color: 'var(--color-text-secondary)',
                      }}
                    />
                    <span className="form-helper">
                      Formula: bill_random(5 number)
                    </span>
                  </div>

                  {/* Bill Date */}
                  <div className="form-group">
                    <label className="form-label flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Bill Date (bill_date)</span>
                    </label>
                    <input
                      type="date"
                      value={billDate}
                      onChange={(e) => setBillDate(e.target.value)}
                      required
                      className="input-base text-xs"
                    />
                  </div>

                  {/* Bill Status */}
                  <div className="form-group">
                    <label className="form-label">Bill Status (status)</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as BillStatus)}
                      className="select-base"
                    >
                      <option value="pending">Pending</option>
                      <option value="delivered">Delivered</option>
                      <option value="accepted">Accepted</option>
                    </select>
                  </div>
                </div>

                {/* Partner Search & Select */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group relative">
                    <label className="form-label">
                      Partner (Search & Select) <span className="text-[var(--color-danger)]">*</span>
                    </label>

                    <div
                      onClick={() => setIsPartnerDropdownOpen(!isPartnerDropdownOpen)}
                      className="input-base cursor-pointer flex items-center justify-between"
                      tabIndex={0}
                    >
                      <span
                        style={{
                          color: selectedPartner
                            ? 'var(--color-text-primary)'
                            : 'var(--color-text-muted)',
                        }}
                      >
                        {selectedPartner
                          ? `${selectedPartner.name} (${selectedPartner.partner_id})`
                          : 'Select billing partner...'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>

                    {isPartnerDropdownOpen && (
                      <div
                        className="absolute z-30 mt-1 w-full border rounded-[var(--radius-md)] shadow-lg"
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          borderColor: 'var(--color-border)',
                        }}
                      >
                        <div
                          className="p-2 border-b flex items-center gap-2"
                          style={{ borderColor: 'var(--color-border-subtle)' }}
                        >
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={partnerSearch}
                            onChange={(e) => setPartnerSearch(e.target.value)}
                            placeholder="Search partners by name or ID..."
                            className="w-full text-xs outline-none bg-transparent"
                            autoFocus
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                          {filteredPartners.length === 0 ? (
                            <div className="p-2 text-xs text-center text-[var(--color-text-muted)]">
                              No matching partners found
                            </div>
                          ) : (
                            filteredPartners.map((p) => (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setSelectedPartnerId(p.id);
                                  setIsPartnerDropdownOpen(false);
                                  setPartnerSearch('');
                                }}
                                className="flex items-center justify-between p-2 rounded text-xs cursor-pointer hover:bg-[var(--color-surface-hover)]"
                                style={{ color: 'var(--color-text-primary)' }}
                              >
                                <div>
                                  <span className="font-semibold">{p.name}</span>
                                  <span className="ml-2 font-mono text-[10px] text-[var(--color-text-muted)]">
                                    {p.partner_id}
                                  </span>
                                </div>
                                {selectedPartnerId === p.id && (
                                  <Check className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Balance */}
                  <div className="form-group">
                    <label className="form-label">Outstanding Balance ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={balance}
                      onChange={(e) => setBalance(Number(e.target.value))}
                      placeholder="0.00"
                      className="input-base"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">Notes & Instructions</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter dispatch notes, delivery terms, or PO details..."
                    className="textarea-base"
                  />
                </div>
              </div>

              {/* Section 2: Bill Line Items (public.bill_items) */}
              <div className="card-base p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
                  <div>
                    <h2 className="section-title text-base font-semibold">
                      Bill Items (public.bill_items)
                    </h2>
                    <p className="small-text text-[var(--color-text-muted)] mt-0.5">
                      Total invoice amount calculates automatically from the sum of row totals.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="btn-base btn-secondary text-xs py-1.5 px-3"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="p-8 text-center border border-dashed rounded-[var(--radius-lg)] border-[var(--color-border)]">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-[var(--color-border-strong)]" />
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                      No line items added yet
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      Click &ldquo;Add Item&rdquo; above to choose a product and calculate costs.
                    </p>
                  </div>
                ) : (
                  <div className="table-container border rounded-[var(--radius-md)]">
                    <table className="table-base">
                      <thead className="table-header">
                        <tr>
                          <th className="table-header-cell">Product</th>
                          <th className="table-header-cell">Size</th>
                          <th className="table-header-cell w-32">Unit SP ($)</th>
                          <th className="table-header-cell w-28">Qty</th>
                          <th className="table-header-cell w-32">Row Total ($)</th>
                          <th className="table-header-cell w-12 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index} className="table-row">
                            {/* Product selection */}
                            <td className="table-cell">
                              <select
                                value={item.product_id}
                                onChange={(e) => handleProductChange(index, e.target.value)}
                                className="select-base text-xs py-1"
                              >
                                {products.map((pr) => (
                                  <option key={pr.id} value={pr.id}>
                                    {pr.name} ({pr.prod_id})
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Size */}
                            <td className="table-cell text-xs font-medium text-[var(--color-text-secondary)]">
                              {item.product_size}
                            </td>

                            {/* Unit SP */}
                            <td className="table-cell">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                value={item.sp}
                                onChange={(e) => handleSpChange(index, Number(e.target.value))}
                                className="input-base text-xs py-1 px-2"
                              />
                            </td>

                            {/* Qty */}
                            <td className="table-cell">
                              <input
                                type="number"
                                min={1}
                                value={item.qty}
                                onChange={(e) => handleQtyChange(index, Math.max(1, Number(e.target.value)))}
                                className="input-base text-xs py-1 px-2"
                              />
                            </td>

                            {/* Row Total */}
                            <td className="table-cell font-mono font-bold text-xs text-[var(--color-primary)]">
                              ${item.row_total.toFixed(2)}
                            </td>

                            {/* Remove */}
                            <td className="table-cell text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="btn-icon w-7 h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Total Summary Footer */}
                <div
                  className="p-4 rounded-[var(--radius-lg)] flex items-center justify-between mt-4"
                  style={{ backgroundColor: 'var(--color-surface-muted)' }}
                >
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Calculated Total Invoice Amount:
                  </span>
                  <span className="text-xl font-bold font-mono text-[var(--color-primary)]">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/admin/bills/dashboard')}
                  className="btn-base btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-base btn-primary"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 anim-spin" />
                      <span>Saving Invoice...</span>
                    </>
                  ) : (
                    <span>Create Bill</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AddBillPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
          <Loader2 className="w-8 h-8 anim-spin text-[var(--color-secondary)]" />
        </div>
      }
    >
      <AddBillContent />
    </Suspense>
  );
}
