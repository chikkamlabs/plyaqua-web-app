'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getBillById,
  updateBill,
  Bill,
  BillItem,
  BillStatus,
} from '@/lib/billssStore';
import { getPartners, Partner } from '@/lib/partnersStore';
import { getProducts, Product } from '@/lib/productsStore';
import {
  ArrowLeft,
  Save,
  Loader2,
  ShieldAlert,
  Receipt,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
} from 'lucide-react';

function OpenBillContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const billIdParam = searchParams.get('id');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bill, setBill] = useState<Bill | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable bill header fields
  const [partnerId, setPartnerId] = useState<string>('');
  const [billDate, setBillDate] = useState<string>('');
  const [status, setStatus] = useState<BillStatus>('pending');
  const [balance, setBalance] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Editable bill items
  const [items, setItems] = useState<BillItem[]>([]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!billIdParam) {
        setLoading(false);
        setErrorMsg('No bill identifier provided in URL.');
        return;
      }

      const [billRes, partnersRes, productsRes] = await Promise.all([
        getBillById(billIdParam),
        getPartners(),
        getProducts(),
      ]);

      if (!active) return;

      if (partnersRes.data) setPartners(partnersRes.data);
      if (productsRes.data) setProducts(productsRes.data);

      if (billRes.data) {
        const b = billRes.data;
        setBill(b);
        setPartnerId(b.partner_id);
        setBillDate(b.bill_date || '');
        setStatus(b.status || 'pending');
        setBalance(b.balance || 0);
        setNotes(b.notes || '');
        setItems(b.items || []);
      } else {
        setErrorMsg(billRes.error?.message || 'Bill record not found.');
      }
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [billIdParam]);

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
        id: `new-${Date.now()}-${Math.random()}`,
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bill) return;

    if (!partnerId) {
      setErrorMsg('Please select a partner.');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Invoice must contain at least one line item.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { data: updated, error } = await updateBill(bill.id, {
      partner_id: partnerId,
      bill_date: billDate,
      status,
      balance: Number(balance) || 0,
      notes: notes.trim(),
      items: items.map((it) => ({
        id: it.id,
        product_id: it.product_id,
        product_name: it.product_name,
        product_size: it.product_size,
        sp: it.sp,
        qty: it.qty,
        row_total: it.row_total,
      })),
    });

    setSaving(false);

    if (error || !updated) {
      setErrorMsg(error?.message || 'Failed to update invoice.');
      return;
    }

    setBill(updated);
    setSuccessMsg('Invoice and items successfully updated.');
    setTimeout(() => setSuccessMsg(null), 4000);
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
          {/* Top navigation row */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/bills/dashboard')}
              className="btn-base btn-outline text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Bills</span>
            </button>

            {bill && (
              <span className="font-mono text-xs px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
                {bill.bill_id}
              </span>
            )}
          </div>

          {loading ? (
            <div className="card-base p-12 text-center">
              <Loader2 className="w-8 h-8 anim-spin mx-auto mb-3 text-[var(--color-secondary)]" />
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                Loading invoice details and line items...
              </p>
            </div>
          ) : !bill ? (
            <div className="card-base p-8 text-center space-y-4">
              <AlertCircle className="w-10 h-10 mx-auto text-[var(--color-danger)]" />
              <p className="text-base font-semibold text-[var(--color-text-primary)]">
                {errorMsg || 'Bill not found.'}
              </p>
              <button
                type="button"
                onClick={() => router.push('/admin/bills/dashboard')}
                className="btn-base btn-primary text-xs"
              >
                Return to Bills List
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Success / Error notification */}
              {successMsg && (
                <div
                  className="p-4 rounded-[var(--radius-md)] flex items-center gap-3 text-xs border"
                  style={{
                    backgroundColor: 'var(--color-success-light)',
                    color: 'var(--color-success-text)',
                    borderColor: 'var(--color-success-border)',
                  }}
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

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

              {/* Section 1: Header information (public.bills) */}
              <div className="card-base p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border-subtle)]">
                  <FileText className="w-5 h-5 text-[var(--color-primary)]" />
                  <h2 className="section-title text-base font-semibold">
                    Invoice Header Details (public.bills)
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Immutable bill_id */}
                  <div className="form-group">
                    <div className="flex items-center justify-between">
                      <label className="form-label">Bill ID (Immutable)</label>
                      <span className="small-text flex items-center gap-1 text-[var(--color-text-muted)]">
                        <ShieldAlert className="w-3.5 h-3.5" /> Read-only
                      </span>
                    </div>
                    <input
                      type="text"
                      value={bill.bill_id}
                      readOnly
                      disabled
                      className="input-base cursor-not-allowed font-mono text-xs"
                      style={{
                        backgroundColor: 'var(--color-surface-muted)',
                        color: 'var(--color-text-secondary)',
                      }}
                    />
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

                  {/* Status */}
                  <div className="form-group">
                    <label className="form-label">Status</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Partner selection */}
                  <div className="form-group">
                    <label className="form-label">Partner Organization</label>
                    <select
                      value={partnerId}
                      onChange={(e) => setPartnerId(e.target.value)}
                      className="select-base"
                    >
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.partner_id})
                        </option>
                      ))}
                    </select>
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
                      className="input-base"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="textarea-base"
                  />
                </div>
              </div>

              {/* Section 2: Bill Items (public.bill_items) */}
              <div className="card-base p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
                  <div>
                    <h2 className="section-title text-base font-semibold">
                      Line Items (public.bill_items)
                    </h2>
                    <p className="small-text text-[var(--color-text-muted)] mt-0.5">
                      All item rows and prices can be modified; total amount is automatically recalculated.
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
                      No line items
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

                            <td className="table-cell text-xs font-medium text-[var(--color-text-secondary)]">
                              {item.product_size || '—'}
                            </td>

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

                            <td className="table-cell">
                              <input
                                type="number"
                                min={1}
                                value={item.qty}
                                onChange={(e) => handleQtyChange(index, Math.max(1, Number(e.target.value)))}
                                className="input-base text-xs py-1 px-2"
                              />
                            </td>

                            <td className="table-cell font-mono font-bold text-xs text-[var(--color-primary)]">
                              ${item.row_total.toFixed(2)}
                            </td>

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

                {/* Calculated Total Footer */}
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
                  disabled={saving}
                  className="btn-base btn-primary"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 anim-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
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

export default function OpenBillPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
          <Loader2 className="w-8 h-8 anim-spin text-[var(--color-secondary)]" />
        </div>
      }
    >
      <OpenBillContent />
    </Suspense>
  );
}
