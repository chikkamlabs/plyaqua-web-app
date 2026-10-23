'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, PackagePlus } from 'lucide-react';
import {
  createProduct,
  calculateNextProductId,
  getSizes,
  Product,
  ProductSize,
} from '@/lib/productsStore';

interface AddProductProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  onProductCreated: (product: Product) => void;
}

export default function AddProduct({
  isOpen,
  onClose,
  currentCount,
  onProductCreated,
}: AddProductProps) {
  const [name, setName] = useState('');
  const [sizeId, setSizeId] = useState<string>('');
  const [mrp, setMrp] = useState<number | ''>('');
  const [sp, setSp] = useState<number | ''>('');
  const [qty, setQty] = useState<number>(0);
  const [status, setStatus] = useState<'active' | 'deactive'>('active');

  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-filled prod_id: prod_101 + length of products
  const autoProdId = calculateNextProductId(currentCount);

  useEffect(() => {
    let active = true;

    async function loadSizes() {
      const { data } = await getSizes();
      if (!active) return;
      if (data && data.length > 0) {
        setSizes(data);
        setSizeId(data[0].id);
      }
    }

    if (isOpen) {
      loadSizes();
    }

    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name is required.');
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

    const { data, error: err } = await createProduct({
      prod_id: autoProdId,
      name: name.trim(),
      size: sizeId || null,
      mrp: Number(mrp),
      sp: Number(sp),
      qty: Number(qty) || 0,
      status,
    });

    setLoading(false);

    if (err || !data) {
      setError(err?.message || 'Failed to create product.');
      return;
    }

    onProductCreated(data);
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
            <PackagePlus className="w-5 h-5 text-[var(--color-secondary)]" />
            <h3 className="section-title text-base font-semibold">
              Add Product
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
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

            {/* Row 1: Auto-generated Product ID & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Product ID (Auto-Generated)</label>
                <input
                  type="text"
                  value={autoProdId}
                  readOnly
                  disabled
                  className="input-base cursor-not-allowed font-mono text-xs"
                  style={{
                    backgroundColor: 'var(--color-surface-muted)',
                    color: 'var(--color-text-secondary)',
                  }}
                />
                <span className="form-helper">
                  Formula: prod_101 + count ({currentCount})
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Status (public.products)</label>
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
                placeholder="e.g. PlyAqua Sparkling Water 500ml"
                required
                className="input-base"
              />
            </div>

            {/* Row 3: Packaging Size & Stock Qty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Packaging Size (public.sizes)</label>
                <select
                  value={sizeId}
                  onChange={(e) => setSizeId(e.target.value)}
                  className="select-base"
                >
                  {sizes.length === 0 ? (
                    <option value="">No sizes available</option>
                  ) : (
                    sizes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.value}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Stock Quantity (qty)</label>
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
                  MRP ($) (Maximum Retail Price) <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
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
                  placeholder="0.00"
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-base btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 anim-spin" />
                  <span>Creating Product...</span>
                </>
              ) : (
                <span>Create Product</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
