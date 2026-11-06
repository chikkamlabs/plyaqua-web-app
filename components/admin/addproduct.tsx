/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, PackagePlus, Upload, Image as ImageIcon, Tag as TagIcon, FileText } from 'lucide-react';
import {
  createProduct,
  calculateNextProductId,
  getSizes,
  uploadProductImage,
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

  // New fields: image_url, description, tag
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [tag, setTag] = useState<string>('');

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

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
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

    let finalImageUrl = imageUrl.trim();

    // If an image file is selected but hasn't finished uploading
    if (imageFile && !finalImageUrl) {
      setUploadingImage(true);
      const { url, error: uploadErr } = await uploadProductImage(imageFile);
      setUploadingImage(false);
      if (uploadErr || !url) {
        setLoading(false);
        setError(uploadErr?.message || 'Failed to upload product image');
        return;
      }
      finalImageUrl = url;
    }

    const { data, error: err } = await createProduct({
      prod_id: autoProdId,
      name: name.trim(),
      size: sizeId || null,
      mrp: Number(mrp),
      sp: Number(sp),
      qty: Number(qty) || 0,
      status,
      image_url: finalImageUrl || null,
      description: description.trim() || null,
      tag: tag.trim() || null,
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

            {/* Row 5: Tag & Image Upload */}
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
                <span className="form-helper">Optional promotional or marketing tag</span>
              </div>

              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  Product Image (product_images)
                </label>
                <div className="space-y-2">
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
                        <span>Choose product image file</span>
                      </div>
                    )}
                  </label>
                  {imageUrl && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <img
                        src={imageUrl}
                        alt="Product Preview"
                        className="w-10 h-10 object-cover rounded-md border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-emerald-700 truncate">
                          Uploaded to product_images
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{imageUrl}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setImageFile(null);
                        }}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
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
                placeholder="Detailed description of the product, purification process, or ingredients..."
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
