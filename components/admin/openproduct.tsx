'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Edit3, ShieldAlert } from 'lucide-react';
import {
  updateProduct,
  getSizes,
  Product,
  ProductSize,
} from '@/lib/productsStore';

interface OpenProductProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: (updated: Product) => void;
}

function OpenProductForm({
  product,
  onClose,
  onProductUpdated,
}: {
  product: Product;
  onClose: () => void;
  onProductUpdated: (updated: Product) => void;
}) {
  // Directly initialize with the product's current existing values
  const [name, setName] = useState<string>(product.name || '');
  const [sizeId, setSizeId] = useState<string>(product.size || '');
  const [mrp, setMrp] = useState<number | ''>(product.mrp ?? 0);
  const [sp, setSp] = useState<number | ''>(product.sp ?? 0);
  const [qty, setQty] = useState<number>(product.qty ?? 0);
  const [status, setStatus] = useState<'active' | 'deactive'>(product.status || 'active');

  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSizes() {
      const { data } = await getSizes();
      if (!active) return;
      if (data) {
        setSizes(data);
      }
    }

    loadSizes();

    return () => {
      active = false;
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name cannot be empty.');
      return;
    }
    if (mrp === '' || Number(mrp) < 0) {
      setError('Please provide a valid MRP.');
      return;
    }
    if (sp === '' || Number(sp) < 0) {
      setError('Please provide a valid Selling Price (SP).');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await updateProduct(product.id, {
      name: name.trim(),
      size: sizeId || null,
      mrp: Number(mrp),
      sp: Number(sp),
      qty: Number(qty) || 0,
      status,
    });

    setLoading(false);

    if (err || !data) {
      setError(err?.message || 'Failed to update product details.');
      return;
    }

    onProductUpdated(data);
  };

  return (
    <div className="dialog-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="dialog-content max-w-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dialog-header flex-shrink-0">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[var(--color-secondary)]" />
            <h3 className="section-title text-base font-semibold">
              Product Details (public.products)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleUpdate} className="flex flex-col flex-1 overflow-hidden">
          <div className="dialog-body flex-1 overflow-y-auto space-y-4">
            {error && (
              <div
                className="p-3 rounded-[var(--radius-md)] text-xs border"
                style={{
                  backgroundColor: 'var(--color-danger-light)',
                  color: 'var(--color-danger-text)',
                  borderColor: 'var(--color-danger-border)',
                }}
              >
                {error}
              </div>
            )}

            {/* Row 1: Immutable prod_id & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <div className="flex items-center justify-between">
                  <label className="form-label">Product ID (Immutable)</label>
                  <span className="small-text flex items-center gap-1 text-[var(--color-text-muted)]">
                    <ShieldAlert className="w-3.5 h-3.5" /> Read-only
                  </span>
                </div>
                <input
                  type="text"
                  value={product.prod_id}
                  readOnly
                  disabled
                  className="input-base cursor-not-allowed font-mono text-xs"
                  style={{
                    backgroundColor: 'var(--color-surface-muted)',
                    color: 'var(--color-text-secondary)',
                  }}
                />
                <span className="form-helper">
                  The product ID is unique and cannot be modified.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'deactive')}
                  className="select-base"
                >
                  <option value="active">Active</option>
                  <option value="deactive">Deactive</option>
                </select>
              </div>
            </div>

            {/* Row 2: Name */}
            <div className="form-group">
              <label className="form-label">
                Product Name <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-base"
              />
            </div>

            {/* Row 3: Packaging Size & Stock Qty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Packaging Size</label>
                <select
                  value={sizeId}
                  onChange={(e) => setSizeId(e.target.value)}
                  className="select-base"
                >
                  <option value="">No packaging size</option>
                  {sizes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Available Stock Quantity (qty)</label>
                <input
                  type="number"
                  min={0}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="input-base"
                />
              </div>
            </div>

            {/* Row 4: Pricing (MRP & SP) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">
                  Maximum Retail Price ($) (MRP) <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="input-base"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Selling Price ($) (SP) <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={sp}
                  onChange={(e) => setSp(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="input-base"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="dialog-footer flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-base btn-outline"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-base btn-secondary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 anim-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OpenProduct({
  product,
  isOpen,
  onClose,
  onProductUpdated,
}: OpenProductProps) {
  if (!isOpen || !product) return null;

  return (
    <OpenProductForm
      key={product.id}
      product={product}
      onClose={onClose}
      onProductUpdated={onProductUpdated}
    />
  );
}
