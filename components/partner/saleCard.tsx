'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  getPartnerStock,
  recordPartnerSale,
  fetchProductDetailsMap,
  PartnerStockItem,
} from '@/lib/stockStore';
import {
  X,
  ShoppingCart,
  Package,
  Search,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  Minus,
  Plus,
} from 'lucide-react';

interface SaleCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess?: (newPoints?: number) => void;
}

export default function SaleCard({
  isOpen,
  onClose,
  onSaleSuccess,
}: SaleCardProps) {
  const [inventory, setInventory] = useState<PartnerStockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search product input
  const [productSearch, setProductSearch] = useState<string>('');

  // Selected product and quantity input
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [saleQty, setSaleQty] = useState<number | string>(1);
  const [saleNotes, setSaleNotes] = useState<string>('POS Counter sale');

  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    async function fetchInventory() {
      const [res, prodMap] = await Promise.all([
        getPartnerStock(),
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
        setInventory(enriched);
        if (enriched.length > 0) {
          setSelectedProductId(enriched[0].product_id);
        }
      }
      setLoading(false);
    }

    fetchInventory();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Default show 3 products from their inventory; if search query entered, filter inventory
  const displayedProducts = useMemo(() => {
    if (!productSearch.trim()) {
      return inventory.slice(0, 3);
    }
    const q = productSearch.trim().toLowerCase();
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.prod_id.toLowerCase().includes(q) ||
        item.size.toLowerCase().includes(q)
    );
  }, [inventory, productSearch]);

  if (!isOpen) return null;

  const currentItem = inventory.find(
    (item) => item.product_id === selectedProductId
  );

  const handleDecreaseQty = () => {
    const current = Number(saleQty) || 1;
    if (current > 1) {
      setSaleQty(current - 1);
    }
  };

  const handleIncreaseQty = () => {
    const current = Number(saleQty) || 0;
    const max = currentItem?.qty ?? 9999;
    if (current < max) {
      setSaleQty(current + 1);
    }
  };

  const handleEnterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setErrorMsg('Please select a product from your inventory.');
      return;
    }

    const qtyNumber = Number(saleQty);
    if (!qtyNumber || qtyNumber <= 0) {
      setErrorMsg('Please enter a valid quantity greater than 0.');
      return;
    }

    if (currentItem && qtyNumber > currentItem.qty) {
      setErrorMsg(
        `Insufficient inventory. Only ${currentItem.qty} units available in stock.`
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await recordPartnerSale({
      productId: selectedProductId,
      saleQty: qtyNumber,
      notes: saleNotes.trim() || undefined,
    });

    setSubmitting(false);

    if (res.error || !res.success) {
      setErrorMsg(res.error?.message || 'Failed to record sale.');
      return;
    }

    setSuccessMsg(
      `Sale recorded successfully! ${qtyNumber} bottle(s) sold. Stock decreased and points ledger updated.`
    );

    // Refresh inventory in modal
    const updatedStock = await getPartnerStock();
    if (updatedStock.data) {
      setInventory(updatedStock.data);
    }

    if (onSaleSuccess) {
      onSaleSuccess(res.newAvailablePoints);
    }

    setSaleQty(1);
    setSaleNotes('POS Counter sale');
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div
      className="dialog-overlay z-50 p-3 sm:p-6 anim-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg overflow-hidden border shadow-xl rounded-[var(--radius-xl)] anim-slide-up flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{
            borderColor: 'var(--color-border-subtle)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-[var(--radius-full)] flex items-center justify-center font-bold text-sm"
              style={{
                backgroundColor: 'var(--color-secondary-light)',
                color: 'var(--color-secondary)',
              }}
            >
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2
                className="font-bold text-base tracking-tight"
                style={{ color: 'var(--color-primary)' }}
              >
                Record Product Sale
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Deducts stock and records customer sale points
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-md)] transition-colors hover:bg-slate-100"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Close sale modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {successMsg && (
            <div
              className="p-3.5 rounded-[var(--radius-md)] flex items-center gap-2.5 text-xs border"
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
              className="p-3.5 rounded-[var(--radius-md)] flex items-center gap-2.5 text-xs border"
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
            <div className="p-8 text-center">
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
          ) : inventory.length === 0 ? (
            <div
              className="p-6 text-center border border-dashed rounded-[var(--radius-lg)] space-y-2"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <Package
                className="w-8 h-8 mx-auto"
                style={{ color: 'var(--color-text-muted)' }}
              />
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                No products in your inventory
              </p>
              <p
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Accept purchases in the Purchases section to stock up before recording sales.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEnterSale} className="space-y-4">
              {/* Product Selection: First allow to search and then Select the product default show 3 products from their inventory */}
              <div className="form-group space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs font-semibold block"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Select Product in Inventory
                  </label>
                  <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    {productSearch ? 'Search results' : 'Showing top 3 products'}
                  </span>
                </div>

                {/* Search Bar for Product Selection */}
                <div className="relative">
                  <Search
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                  <input
                    type="text"
                    placeholder="Search product by name, size or SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="input-base pl-9 pr-8 text-xs py-2 w-full"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                    }}
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                      aria-label="Clear product search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* List of Products (Default 3 or filtered by search) */}
                <div className="space-y-2 mt-2">
                  {displayedProducts.length === 0 ? (
                    <div className="p-4 text-center border border-dashed rounded-[var(--radius-md)] text-xs text-[var(--color-text-muted)]">
                      No matching products found. Try a different search.
                    </div>
                  ) : (
                    displayedProducts.map((item) => {
                      const isSelected = item.product_id === selectedProductId;
                      return (
                        <div
                          key={item.product_id}
                          onClick={() => setSelectedProductId(item.product_id)}
                          className={`p-3 rounded-[var(--radius-md)] border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected ? 'ring-2' : 'hover:bg-slate-50'
                          }`}
                          style={{
                            backgroundColor: isSelected
                              ? 'var(--color-secondary-light)'
                              : 'var(--color-surface)',
                            borderColor: isSelected
                              ? 'var(--color-secondary)'
                              : 'var(--color-border)',
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Package
                              className="w-4 h-4 shrink-0"
                              style={{
                                color: isSelected
                                  ? 'var(--color-secondary)'
                                  : 'var(--color-text-muted)',
                              }}
                            />
                            <div className="min-w-0">
                              <span
                                className="text-xs sm:text-sm font-semibold block truncate"
                                style={{ color: 'var(--color-text-primary)' }}
                              >
                                {item.name}
                              </span>
                              <span
                                className="text-[11px] block"
                                style={{ color: 'var(--color-text-muted)' }}
                              >
                                Size: <strong>{item.size}</strong> &bull; SKU: {item.prod_id}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-2">
                            <span
                              className="text-[10px] block"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              In Stock
                            </span>
                            <span
                              className="text-xs sm:text-sm font-mono font-bold"
                              style={{
                                color:
                                  item.qty > 0
                                    ? 'var(--color-primary)'
                                    : 'var(--color-danger)',
                              }}
                            >
                              {item.qty} units
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quantity Input with - 1 + buttons to increase and decrease without overcoming icon/placeholder */}
              <div className="form-group">
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Sale Quantity
                  </label>
                  {currentItem && (
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Max Available: <strong>{currentItem.qty}</strong>
                    </span>
                  )}
                </div>

                {/* - 1 + Stepper Controls */}
                <div className="flex items-center gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={handleDecreaseQty}
                    disabled={Number(saleQty) <= 1}
                    className="w-10 h-10 rounded-[var(--radius-md)] border flex items-center justify-center font-bold text-base transition-colors hover:bg-slate-100 disabled:opacity-40 shrink-0"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={currentItem?.qty || 9999}
                    value={saleQty}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setSaleQty('');
                        return;
                      }
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) {
                        setSaleQty(Math.max(1, Math.min(num, currentItem?.qty || 9999)));
                      }
                    }}
                    placeholder="1"
                    required
                    className="input-base text-center font-mono font-bold text-sm sm:text-base h-10 w-24 shrink-0"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleIncreaseQty}
                    disabled={currentItem ? Number(saleQty) >= currentItem.qty : false}
                    className="w-10 h-10 rounded-[var(--radius-md)] border flex items-center justify-center font-bold text-base transition-colors hover:bg-slate-100 disabled:opacity-40 shrink-0"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <span className="text-xs text-[var(--color-text-muted)] font-medium">
                    Bottle(s)
                  </span>
                </div>
              </div>

              {/* Notes input: Default 'POS Counter sale' */}
              <div className="form-group">
                <label
                  className="text-xs font-semibold flex items-center gap-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Notes</span>
                </label>
                <input
                  type="text"
                  placeholder="POS Counter sale"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  className="input-base text-xs sm:text-sm mt-1"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                />
              </div>

              {/* Action Button: Enter sale */}
              <div
                className="pt-3 border-t flex items-center justify-end gap-2.5"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-base btn-outline text-xs sm:text-sm py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !currentItem || currentItem.qty <= 0}
                  className="btn-base btn-primary text-xs sm:text-sm py-2 px-5 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 anim-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Enter sale</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
