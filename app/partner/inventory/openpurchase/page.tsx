'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PartnerHeader from '@/components/partner/header';
import PartnerBottomNavigation from '@/components/partner/bottomnavigation';
import {
  getPurchaseById,
  updatePurchaseStatusToAccepted,
  Purchase,
} from '@/lib/purchasesStore';
import { addPurchaseToPartnerInventory, fetchProductDetailsMap } from '@/lib/stockStore';
import { recordPurchaseAcceptanceTransaction } from '@/lib/paymentsStore';
import {
  ArrowLeft,
  Receipt,
  CheckCircle,
  Clock,
  Truck,
  Package,
  Calendar,
  AlertCircle,
  Loader2,
  FileText,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

function OpenPurchaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseId = searchParams.get('id');

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPurchase() {
      if (!purchaseId) {
        setLoading(false);
        setErrorMsg('No purchase identifier provided in URL query.');
        return;
      }

      setLoading(true);
      const [res, prodMap] = await Promise.all([
        getPurchaseById(purchaseId),
        fetchProductDetailsMap(),
      ]);
      if (!active) return;

      if (res.data) {
        const enrichedItems = (res.data.items || []).map((it) => {
          const p = prodMap.get(it.product_id);
          return {
            ...it,
            product_name: p?.name || it.product_name || 'PlyAqua Product',
            product_size: p?.size || it.product_size || 'Standard',
          };
        });
        setPurchase({
          ...res.data,
          items: enrichedItems,
        });
      } else {
        setErrorMsg(res.error?.message || 'Purchase record not found.');
      }
      setLoading(false);
    }

    loadPurchase();

    return () => {
      active = false;
    };
  }, [purchaseId]);

  // Handle changing status to accepted only
  const handleAcceptPurchase = async () => {
    if (!purchase) return;

    setUpdating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updatePurchaseStatusToAccepted(purchase.id);

    if (res.error || !res.data) {
      setUpdating(false);
      setErrorMsg(res.error?.message || 'Failed to accept purchase.');
      return;
    }

    // Add purchase line item quantities into partner_inventory
    if (res.data.items && res.data.items.length > 0) {
      const invRes = await addPurchaseToPartnerInventory(
        res.data.partner_id,
        res.data.items.map((it) => ({
          product_id: it.product_id,
          product_name: it.product_name,
          product_size: it.product_size,
          qty: Number(it.qty) || 0,
        }))
      );

      if (invRes.error) {
        setUpdating(false);
        setErrorMsg(`Purchase accepted, but inventory update failed: ${invRes.error.message}`);
        return;
      }
    }

    // Insert into partner_transactions:
    // partner_id (partner_profile.id), type(add), bill_id(bills.id), amount purchase price,
    // payment_method(bill), notes('Partner accepted the purchase'), balance(put exactly amount)
    // and also add to partner_profile.credit_amount += bill amount.
    const txRes = await recordPurchaseAcceptanceTransaction({
      partner_id: res.data.partner_id,
      bill_id: res.data.id,
      bill_number: res.data.bill_id,
      amount: res.data.amount,
      notes: 'Partner accepted the purchase',
    });

    if (txRes.error) {
      console.warn('Purchase accepted, but transaction logging had an issue:', txRes.error.message);
    }

    setUpdating(false);
    setPurchase(res.data);
    setSuccessMsg('Purchase order status successfully changed to Accepted, inventory updated, and credit added.');
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const statusChip = useMemo(() => {
    if (!purchase) return null;
    switch (purchase.status) {
      case 'accepted':
        return (
          <span className="status-chip status-chip-active flex items-center gap-1.5 py-1 px-3">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Accepted</span>
          </span>
        );
      case 'delivered':
        return (
          <span
            className="status-chip flex items-center gap-1.5 py-1 px-3"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
            }}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="status-chip status-chip-pending flex items-center gap-1.5 py-1 px-3">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
    }
  }, [purchase]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Header attached at top */}
      <PartnerHeader />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-lg sm:max-w-4xl mx-auto px-4 py-5 sm:py-8 pb-28 space-y-5">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push('/partner/inventory/purchases')}
            className="btn-base btn-outline text-xs py-1.5 px-3"
            aria-label="Back to purchases list"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Purchases</span>
          </button>

          {purchase && (
            <span
              className="font-mono text-xs px-2.5 py-1 rounded-[var(--radius-sm)] border font-semibold"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-primary)',
              }}
            >
              {purchase.bill_id}
            </span>
          )}
        </div>

        {/* Notifications */}
        {successMsg && (
          <div
            className="p-4 rounded-[var(--radius-md)] flex items-center gap-3 text-xs sm:text-sm border"
            style={{
              backgroundColor: 'var(--color-success-light)',
              color: 'var(--color-success-text)',
              borderColor: 'var(--color-success-border)',
            }}
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div
            className="p-4 rounded-[var(--radius-md)] flex items-center gap-3 text-xs sm:text-sm border"
            style={{
              backgroundColor: 'var(--color-danger-light)',
              color: 'var(--color-danger-text)',
              borderColor: 'var(--color-danger-border)',
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div
            className="card-base p-12 text-center rounded-[var(--radius-lg)] border"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <Loader2
              className="w-8 h-8 anim-spin mx-auto mb-3"
              style={{ color: 'var(--color-secondary)' }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Loading purchase invoice & line items...
            </p>
          </div>
        ) : !purchase ? (
          <div
            className="card-base p-8 text-center rounded-[var(--radius-lg)] border space-y-3"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <AlertCircle
              className="w-10 h-10 mx-auto"
              style={{ color: 'var(--color-danger)' }}
            />
            <h2
              className="text-base font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {errorMsg || 'Purchase Record Not Found'}
            </h2>
            <button
              type="button"
              onClick={() => router.push('/partner/inventory/purchases')}
              className="btn-base btn-primary text-xs"
            >
              Return to Purchases
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* 1. Header Information (public.bills) */}
            <div
              className="card-base p-5 sm:p-6 rounded-[var(--radius-lg)] border space-y-4"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div
                className="flex items-center justify-between pb-3 border-b flex-wrap gap-2"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                <div className="flex items-center gap-2">
                  <Receipt
                    className="w-5 h-5"
                    style={{ color: 'var(--color-primary)' }}
                  />
                  <h1
                    className="text-base sm:text-lg font-bold tracking-tight"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Purchase Order Details
                  </h1>
                </div>
                <div>{statusChip}</div>
              </div>

              {/* Bill Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                {/* Bill ID */}
                <div
                  className="p-3 rounded-[var(--radius-md)] border"
                  style={{
                    backgroundColor: 'var(--color-surface-hover)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                >
                  <span
                    className="text-[11px] block"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Purchase ID (Bill ID)
                  </span>
                  <span
                    className="font-mono font-bold text-sm block mt-0.5"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {purchase.bill_id}
                  </span>
                </div>

                {/* Bill Date */}
                <div
                  className="p-3 rounded-[var(--radius-md)] border"
                  style={{
                    backgroundColor: 'var(--color-surface-hover)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                >
                  <span
                    className="text-[11px] flex items-center gap-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Calendar className="w-3 h-3 text-[var(--color-secondary)]" />
                    <span>Bill Date</span>
                  </span>
                  <span
                    className="font-medium text-sm block mt-0.5"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {purchase.bill_date}
                  </span>
                </div>

                {/* Total Bill Amount */}
                <div
                  className="p-3 rounded-[var(--radius-md)] border"
                  style={{
                    backgroundColor: 'var(--color-surface-hover)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                >
                  <span
                    className="text-[11px] flex items-center gap-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <DollarSign className="w-3 h-3 text-[var(--color-primary)]" />
                    <span>Total Amount</span>
                  </span>
                  <span
                    className="font-mono font-bold text-sm sm:text-base block mt-0.5"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    ${purchase.amount.toFixed(2)}
                  </span>
                </div>

                {/* Outstanding Balance */}
                <div
                  className="p-3 rounded-[var(--radius-md)] border"
                  style={{
                    backgroundColor: 'var(--color-surface-hover)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                >
                  <span
                    className="text-[11px] block"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Outstanding Balance
                  </span>
                  <span
                    className="font-mono font-semibold text-sm block mt-0.5"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    ${purchase.balance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Notes if available */}
              {purchase.notes && (
                <div
                  className="p-3 rounded-[var(--radius-md)] border text-xs"
                  style={{
                    backgroundColor: 'var(--color-surface-hover)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                >
                  <span
                    className="font-semibold block mb-0.5"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Invoice Notes / Delivery Instructions:
                  </span>
                  <p style={{ color: 'var(--color-text-primary)' }}>
                    {purchase.notes}
                  </p>
                </div>
              )}
            </div>

            {/* 2. Bill Items List (public.bill_items) */}
            <div
              className="card-base p-5 sm:p-6 rounded-[var(--radius-lg)] border space-y-4"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div
                className="flex items-center justify-between pb-3 border-b"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                <div>
                  <h2
                    className="text-base font-bold tracking-tight"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Purchased Products (Line Items)
                  </h2>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Breakdown of items and quantities on this purchase
                  </p>
                </div>
                <div
                  className="text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-sm)]"
                  style={{
                    backgroundColor: 'var(--color-secondary-light)',
                    color: 'var(--color-secondary)',
                  }}
                >
                  {purchase.products_count} Product Types
                </div>
              </div>

              {purchase.items.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No line items found for this invoice.
                </div>
              ) : (
                <div className="table-container border rounded-[var(--radius-md)] overflow-x-auto">
                  <table className="table-base">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Product</th>
                        <th className="table-header-cell">Size</th>
                        <th className="table-header-cell text-right">Unit SP ($)</th>
                        <th className="table-header-cell text-right">Qty</th>
                        <th className="table-header-cell text-right">Row Total ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchase.items.map((item, idx) => (
                        <tr key={item.id || idx} className="table-row">
                          <td className="table-cell font-medium">
                            <div className="flex items-center gap-2">
                              <Package
                                className="w-3.5 h-3.5 shrink-0"
                                style={{ color: 'var(--color-secondary)' }}
                              />
                              <span>{item.product_name || 'PlyAqua Product'}</span>
                            </div>
                          </td>
                          <td className="table-cell text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {item.product_size || 'Standard'}
                          </td>
                          <td className="table-cell font-mono text-right text-xs">
                            ${item.sp.toFixed(2)}
                          </td>
                          <td className="table-cell font-bold text-right text-xs">
                            {item.qty}
                          </td>
                          <td
                            className="table-cell font-mono font-bold text-right text-xs"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            ${item.row_total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr
                        style={{
                          backgroundColor: 'var(--color-surface-hover)',
                          borderTop: '2px solid var(--color-border)',
                        }}
                      >
                        <td colSpan={3} className="table-cell font-bold text-xs">
                          Total Summary
                        </td>
                        <td className="table-cell font-bold text-right text-xs">
                          {purchase.items_count} items
                        </td>
                        <td
                          className="table-cell font-mono font-bold text-right text-sm"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          ${purchase.amount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* 3. Status Action Section: "allow to change the status to accepted only" */}
            <div
              className="card-base p-5 rounded-[var(--radius-lg)] border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3
                    className="text-sm font-bold tracking-tight"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Purchase Verification & Status
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {purchase.status === 'accepted'
                      ? 'This purchase has been accepted and finalized.'
                      : 'Verify delivery of items and mark this purchase as Accepted.'}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  {purchase.status === 'accepted' ? (
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-xs font-semibold border"
                      style={{
                        backgroundColor: 'var(--color-success-light)',
                        color: 'var(--color-success-text)',
                        borderColor: 'var(--color-success-border)',
                      }}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Status: Accepted (Finalized)</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={handleAcceptPurchase}
                      className="btn-base btn-primary text-xs sm:text-sm py-2 px-5 flex items-center justify-center gap-2 w-full sm:w-auto"
                      aria-label="Accept Purchase"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-4 h-4 anim-spin" />
                          <span>Accepting Purchase...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Accept Purchase</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom navigation attached at bottom */}
      <PartnerBottomNavigation />
    </div>
  );
}

export default function OpenPurchasePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-background)' }}
        >
          <Loader2
            className="w-8 h-8 anim-spin"
            style={{ color: 'var(--color-secondary)' }}
          />
        </div>
      }
    >
      <OpenPurchaseContent />
    </Suspense>
  );
}
