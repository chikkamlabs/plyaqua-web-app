/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import {
  X,
  Loader2,
  Edit3,
  Upload,
  Image as ImageIcon,
  Code2,
} from 'lucide-react';
import {
  updateSubscriptionPlan,
  uploadSubscriptionPlanImage,
  SubscriptionPlan,
  SubscriptionPlanStatus,
} from '@/lib/subscriptionplansStore';

interface OpenSubscriptionPlanProps {
  plan: SubscriptionPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onPlanUpdated: (updated: SubscriptionPlan) => void;
}

function OpenSubscriptionPlanForm({
  plan,
  onClose,
  onPlanUpdated,
}: {
  plan: SubscriptionPlan;
  onClose: () => void;
  onPlanUpdated: (updated: SubscriptionPlan) => void;
}) {
  const [name, setName] = useState<string>(plan.name || '');
  const [actualPrice, setActualPrice] = useState<number | ''>(plan.actual_price ?? 0);
  const [sellingPrice, setSellingPrice] = useState<number | ''>(plan.selling_price ?? 0);
  const [includesJson, setIncludesJson] = useState<string>(
    plan.includes !== undefined && plan.includes !== null
      ? typeof plan.includes === 'string'
        ? plan.includes
        : JSON.stringify(plan.includes, null, 2)
      : '[]'
  );
  const [imageUrl, setImageUrl] = useState<string>(plan.image_url || '');
  const [status, setStatus] = useState<SubscriptionPlanStatus>(plan.status || 'active');

  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    const { url, error: uploadErr } = await uploadSubscriptionPlanImage(file);
    setUploadingImage(false);

    if (uploadErr || !url) {
      setError(uploadErr?.message || 'Failed to upload image to subscription_plans_bucket');
      return;
    }

    setImageUrl(url);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Plan name cannot be empty.');
      return;
    }
    if (actualPrice === '' || Number(actualPrice) < 0) {
      setError('Please enter a valid Actual Price.');
      return;
    }
    if (sellingPrice === '' || Number(sellingPrice) < 0) {
      setError('Please enter a valid Selling Price.');
      return;
    }

    let parsedIncludes: unknown = [];
    if (includesJson.trim()) {
      try {
        parsedIncludes = JSON.parse(includesJson.trim());
      } catch {
        setError('Includes must be valid JSON.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await updateSubscriptionPlan(plan.id, {
      name: name.trim(),
      actual_price: Number(actualPrice),
      selling_price: Number(sellingPrice),
      includes: parsedIncludes,
      image_url: imageUrl.trim() || null,
      status,
    });

    setLoading(false);

    if (err || !data) {
      setError(err?.message || 'Failed to update subscription plan.');
      return;
    }

    onPlanUpdated(data);
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
              Subscription Plan Details
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

            {/* Plan ID & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Plan ID</label>
                <input
                  type="text"
                  value={plan.id}
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
                <label htmlFor="open_plan_status" className="form-label">
                  Status
                </label>
                <select
                  id="open_plan_status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SubscriptionPlanStatus)}
                  className="select-base"
                >
                  <option value="active">Active</option>
                  <option value="deactive">Deactive</option>
                </select>
              </div>
            </div>

            {/* Name */}
            <div className="form-group">
              <label htmlFor="open_plan_name" className="form-label">
                Plan Name <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                id="open_plan_name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-base"
              />
            </div>

            {/* Actual Price & Selling Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="open_plan_actual_price" className="form-label">
                  Actual Price <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  id="open_plan_actual_price"
                  type="number"
                  step="0.01"
                  min={0}
                  value={actualPrice}
                  onChange={(e) =>
                    setActualPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  required
                  className="input-base"
                />
              </div>

              <div className="form-group">
                <label htmlFor="open_plan_selling_price" className="form-label">
                  Selling Price <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  id="open_plan_selling_price"
                  type="number"
                  step="0.01"
                  min={0}
                  value={sellingPrice}
                  onChange={(e) =>
                    setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  required
                  className="input-base"
                />
              </div>
            </div>

            {/* Image Display & Upload (subscription_plans_bucket) */}
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                Plan Image (subscription_plans_bucket)
              </label>
              <div className="space-y-2">
                {imageUrl ? (
                  <div className="relative p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    <img
                      src={imageUrl}
                      alt={name || 'Subscription Plan'}
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        Current Image
                      </p>
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
                        <span>Uploading to subscription_plans_bucket...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Upload className="w-4 h-4 text-sky-600" />
                        <span>Upload plan image</span>
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

            {/* Includes (JSON) */}
            <div className="form-group">
              <label className="form-label flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  Includes (JSON)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">json format</span>
              </label>
              <textarea
                value={includesJson}
                onChange={(e) => setIncludesJson(e.target.value)}
                rows={4}
                className="textarea-base font-mono text-xs"
              />
            </div>

            {/* Timestamps */}
            {(plan.created_at || plan.updated_at) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)]">
                <div>
                  <span className="font-medium">Created: </span>
                  {plan.created_at ? new Date(plan.created_at).toLocaleString() : '—'}
                </div>
                <div>
                  <span className="font-medium">Updated: </span>
                  {plan.updated_at ? new Date(plan.updated_at).toLocaleString() : '—'}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
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
              disabled={loading || uploadingImage}
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

export default function OpenSubscriptionPlan({
  plan,
  isOpen,
  onClose,
  onPlanUpdated,
}: OpenSubscriptionPlanProps) {
  if (!isOpen || !plan) return null;

  return (
    <OpenSubscriptionPlanForm
      key={plan.id}
      plan={plan}
      onClose={onClose}
      onPlanUpdated={onPlanUpdated}
    />
  );
}
