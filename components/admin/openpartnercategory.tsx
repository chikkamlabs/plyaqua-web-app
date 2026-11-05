/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import {
  X,
  Loader2,
  Edit3,
  ShieldAlert,
  Upload,
  Image as ImageIcon,
  Award,
  FileText,
  Code2,
} from 'lucide-react';
import {
  updatePartnerCategory,
  uploadPartnerCategoryImage,
  CategoryStatus,
  PartnerCategory,
} from '@/lib/partnercategories';

interface OpenPartnerCategoryProps {
  category: PartnerCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onCategoryUpdated: (updated: PartnerCategory) => void;
}

function OpenPartnerCategoryForm({
  category,
  onClose,
  onCategoryUpdated,
}: {
  category: PartnerCategory;
  onClose: () => void;
  onCategoryUpdated: (updated: PartnerCategory) => void;
}) {
  const [name, setName] = useState<string>(category.name || '');
  const [status, setStatus] = useState<CategoryStatus>(category.status || 'active');

  // New fields: image_url, descripiton, points(json), badge
  const [imageUrl, setImageUrl] = useState<string>(category.image_url || '');
  const [descripiton, setDescripiton] = useState<string>(
    category.descripiton || category.description || ''
  );
  const [badge, setBadge] = useState<string>(category.badge || '');
  const [pointsJson, setPointsJson] = useState<string>(
    category.points !== undefined && category.points !== null
      ? typeof category.points === 'string'
        ? category.points
        : JSON.stringify(category.points, null, 2)
      : JSON.stringify({ tier: 'tier_1', reward_pct: 5, multiplier: 1.2 }, null, 2)
  );

  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name cannot be empty.');
      return;
    }

    // Validate points JSON if entered
    let parsedPoints: any = null;
    if (pointsJson.trim()) {
      try {
        parsedPoints = JSON.parse(pointsJson.trim());
      } catch {
        setError('Points configuration must be a valid JSON value or object.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await updatePartnerCategory(category.id, {
      name: name.trim(),
      status,
      image_url: imageUrl.trim() || null,
      descripiton: descripiton.trim() || null,
      points: parsedPoints,
      badge: badge.trim() || null,
    });

    setLoading(false);

    if (err || !data) {
      setError(err?.message || 'Failed to update partner category');
      return;
    }

    onCategoryUpdated(data);
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
              Partner Category Details
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

            {/* Display p_cat_id (Not editable) & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <div className="flex items-center justify-between">
                  <label htmlFor="open_p_cat_id" className="form-label">
                    Category ID (Fixed Identifier)
                  </label>
                  <span
                    className="small-text flex items-center gap-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Read-only
                  </span>
                </div>
                <input
                  id="open_p_cat_id"
                  type="text"
                  value={category.p_cat_id}
                  readOnly
                  disabled
                  className="input-base cursor-not-allowed font-mono text-xs"
                  style={{
                    backgroundColor: 'var(--color-surface-muted)',
                    color: 'var(--color-text-secondary)',
                  }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="open_status" className="form-label">
                  Status
                </label>
                <select
                  id="open_status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CategoryStatus)}
                  className="select-base"
                >
                  <option value="active">Active</option>
                  <option value="deactive">Deactive</option>
                </select>
              </div>
            </div>

            {/* Name Input & Badge Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="open_name" className="form-label">
                  Category Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="open_name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Category Name"
                  required
                  className="input-base"
                />
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

            {/* Category Image Display & Upload (partner_catergory_images) */}
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                Category Image (partner_catergory_images)
              </label>
              <div className="space-y-2">
                {imageUrl ? (
                  <div className="relative p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    <img
                      src={imageUrl}
                      alt={name || 'Category'}
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
                        <span>Uploading to partner_catergory_images...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Upload className="w-4 h-4 text-sky-600" />
                        <span>Upload category image</span>
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

export default function OpenPartnerCategory({
  category,
  isOpen,
  onClose,
  onCategoryUpdated,
}: OpenPartnerCategoryProps) {
  if (!isOpen || !category) return null;

  return (
    <OpenPartnerCategoryForm
      key={category.id}
      category={category}
      onClose={onClose}
      onCategoryUpdated={onCategoryUpdated}
    />
  );
}
