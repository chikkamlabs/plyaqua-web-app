/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { X, Loader2, PlusCircle, Upload, Image as ImageIcon, Award, FileText, Code2, AlertCircle } from 'lucide-react';
import {
  createPartnerCategory,
  calculateNextCategoryId,
  uploadPartnerCategoryImage,
  CategoryStatus,
  PartnerCategory,
} from '@/lib/partnercategories';

interface AddPartnerCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  onCategoryCreated: (created: PartnerCategory) => void;
}

export default function AddPartnerCategory({
  isOpen,
  onClose,
  currentCount,
  onCategoryCreated,
}: AddPartnerCategoryProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<CategoryStatus>('active');

  // New fields: image_url, descripiton, points(json), badge
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [descripiton, setDescripiton] = useState<string>('');
  const [badge, setBadge] = useState<string>('');
  const [pointsJson, setPointsJson] = useState<string>(
    JSON.stringify({ tier: 'tier_1', reward_pct: 5, multiplier: 1.2 }, null, 2)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculated p_cat_id formula: p_cat_101 + length of partner categories
  const autoCategoryId = calculateNextCategoryId(currentCount);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setUploadingImage(true);
    setError(null);

    const { url, error: uploadErr } = await uploadPartnerCategoryImage(file);
    setUploadingImage(false);

    if (uploadErr || !url) {
      setError(uploadErr?.message || 'Failed to upload image to partner_catergory_images');
      return;
    }

    setImageUrl(url);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    // Validate points JSON if provided
    let parsedPoints: any = null;
    if (pointsJson.trim()) {
      try {
        parsedPoints = JSON.parse(pointsJson.trim());
      } catch {
        setError('Points must be a valid JSON object or value.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    let finalImageUrl = imageUrl.trim();

    if (imageFile && !finalImageUrl) {
      setUploadingImage(true);
      const { url, error: uploadErr } = await uploadPartnerCategoryImage(imageFile);
      setUploadingImage(false);
      if (uploadErr || !url) {
        setLoading(false);
        setError(uploadErr?.message || 'Failed to upload category image');
        return;
      }
      finalImageUrl = url;
    }

    const { data, error: err } = await createPartnerCategory({
      p_cat_id: autoCategoryId,
      name: name.trim(),
      status,
      image_url: finalImageUrl || null,
      descripiton: descripiton.trim() || null,
      points: parsedPoints,
      badge: badge.trim() || null,
    });

    setLoading(false);

    if (err || !data) {
      setError(err?.message || 'Failed to create partner category');
      return;
    }

    onCategoryCreated(data);
  };

  return (
    <div className="dialog-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dialog-header">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[var(--color-secondary)]" />
            <h3 className="section-title text-base font-semibold">
              Add Partner Category
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
        <form onSubmit={handleSubmit}>
          <div className="dialog-body space-y-4">
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

            {/* Auto Fill p_cat_id */}
            <div className="form-group">
              <label htmlFor="p_cat_id" className="form-label">
                Category ID (Auto-Generated)
              </label>
              <input
                id="p_cat_id"
                type="text"
                value={autoCategoryId}
                readOnly
                disabled
                className="input-base cursor-not-allowed font-mono text-xs"
                style={{
                  backgroundColor: 'var(--color-surface-muted)',
                  color: 'var(--color-text-secondary)',
                }}
              />
              <span className="form-helper">
                Formula: p_cat_101 + count ({currentCount})
              </span>
            </div>

            {/* Name Input */}
            <div className="form-group">
              <label htmlFor="category_name" className="form-label">
                Category Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="category_name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bulk Distributors, Retailers..."
                required
                className="input-base"
                autoFocus
              />
            </div>

            {/* Status Input (default active) & Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="category_status" className="form-label">
                  Status (Default: Active)
                </label>
                <select
                  id="category_status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CategoryStatus)}
                  className="select-base"
                >
                  <option value="active">Active</option>
                  <option value="deactive">Deactive</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  Category Badge
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. Gold Partner, VIP Tier"
                  className="input-base"
                />
              </div>
            </div>

            {/* Category Image Upload (partner_catergory_images) */}
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                Category Image (partner_catergory_images)
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
                      <span>Uploading to partner_catergory_images...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <Upload className="w-4 h-4 text-sky-600" />
                      <span>Choose image file</span>
                    </div>
                  )}
                </label>
                {imageUrl && (
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <img
                      src={imageUrl}
                      alt="Category Preview"
                      className="w-10 h-10 object-cover rounded-md border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-emerald-700 truncate">
                        Uploaded to partner_catergory_images
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

            {/* Description (descripiton) */}
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                Description
              </label>
              <textarea
                value={descripiton}
                onChange={(e) => setDescripiton(e.target.value)}
                rows={2}
                placeholder="Description of partner tier and benefits..."
                className="textarea-base"
              />
            </div>

            {/* Points (JSON) */}
            <div className="form-group">
              <label className="form-label flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  Points Configuration (JSON)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">json format</span>
              </label>
              <textarea
                value={pointsJson}
                onChange={(e) => setPointsJson(e.target.value)}
                rows={3}
                placeholder='{\n  "tier": "tier_1",\n  "reward_pct": 5\n}'
                className="textarea-base font-mono text-xs"
              />
              <span className="form-helper">
                Custom rules or tier reward multipliers in JSON format
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="dialog-footer">
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
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
