/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Edit3, ShieldAlert, Upload, Image as ImageIcon, Tag as TagIcon, FileText } from 'lucide-react';
import {
  updateProduct,
  uploadProductImage,
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

  // New fields: image_url, description, tag
  const [imageUrl, setImageUrl] = useState<string>(product.image_url || '');
  const [description, setDescription] = useState<string>(product.description || '');
  const [tag, setTag] = useState<string>(product.tag || '');
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

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

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    const { url, error: uploadErr } = await uploadProductImage(file);
    setUploadingImage(false);

    if (uploadErr || !url) {
      setError(uploadErr?.message || 'Failed to upload product image to product_images');
      return;
    }

    setImageUrl(url);
  };

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
      image_url: imageUrl.trim() || null,
      description: description.trim() || null,
      tag: tag.trim() || null,
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
                  Maximum Retail Price (₹) (MRP) <span className="text-[var(--color-danger)]">*</span>
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
                  Selling Price (₹) (SP) <span className="text-[var(--color-danger)]">*</span>
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

            {/* Row 5: Tag & Image Display/Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  Product Tag
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g. Bestseller, Premium, Eco, New"
                  className="input-base"
                />
                <span className="form-helper">Promotional or categorization tag</span>
              </div>

              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  Product Image (product_images)
                </label>
                <div className="space-y-2">
                  {/* Current Image Display */}
                  {imageUrl ? (
                    <div className="relative p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                      <img
                        src={imageUrl}
                        alt={name || 'Product'}
                        className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">Current Image</p>
                        <p className="text-[10px] text-slate-400 truncate">{imageUrl}</p>
                        <label className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 font-medium cursor-pointer mt-1">
                          <Upload className="w-3 h-3" />
                          <span>Change Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            disabled={uploadingImage || loading}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors border-slate-200">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        disabled={uploadingImage || loading}
                        className="hidden"
                      />
                      {uploadingImage ? (
                        <div className="flex items-center gap-2 text-xs text-sky-600 font-medium">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading to product_images...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Upload className="w-4 h-4 text-sky-600" />
                          <span>Upload product image</span>
                        </div>
                      )}
                    </label>
                  )}
                  {uploadingImage && imageUrl && (
                    <div className="flex items-center gap-1.5 text-[11px] text-sky-600">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading new image...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 6: Description */}
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                Product Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Product description and details..."
                className="textarea-base"
              />
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
