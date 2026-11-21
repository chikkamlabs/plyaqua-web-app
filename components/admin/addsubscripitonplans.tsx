/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import {
  X,
  Loader2,
  PlusCircle,
  Upload,
  Image as ImageIcon,
  Code2,
} from 'lucide-react';
import {
  createSubscriptionPlan,
  uploadSubscriptionPlanImage,
  SubscriptionPlan,
  SubscriptionPlanStatus,
} from '@/lib/subscriptionplansStore';

interface AddSubscriptionPlanProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: (plan: SubscriptionPlan) => void;
}

export default function AddSubscriptionPlan({
  isOpen,
  onClose,
  onPlanCreated,
}: AddSubscriptionPlanProps) {
  const [name, setName] = useState('');
  const [actualPrice, setActualPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [includesJson, setIncludesJson] = useState<string>(
    JSON.stringify(['Feature 1', 'Feature 2'], null, 2)
  );
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [status, setStatus] = useState<SubscriptionPlanStatus>('active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Plan name is required.');
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
        setError('Includes must be valid JSON (e.g., ["Item 1", "Item 2"] or {"key": "value"}).');
        return;
      }
    }

    setLoading(true);
    setError(null);

    let finalImageUrl = imageUrl.trim();
    if (imageFile && !finalImageUrl) {
      setUploadingImage(true);
      const { url, error: uploadErr } = await uploadSubscriptionPlanImage(imageFile);
      setUploadingImage(false);
      if (uploadErr || !url) {
        setLoading(false);
        setError(uploadErr?.message || 'Failed to upload image to subscription_plans_bucket');
        return;
      }
      finalImageUrl = url;
    }

    const { data, error: err } = await createSubscriptionPlan({
      name: name.trim(),
      actual_price: Number(actualPrice),
      selling_price: Number(sellingPrice),
      includes: parsedIncludes,
      image_url: finalImageUrl || null,
      status,
    });

    setLoading(false);

    if (err || !data) {
      setError(err?.message || 'Failed to create subscription plan.');
      return;
    }

    onPlanCreated(data);
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
            <PlusCircle className="w-5 h-5 text-[var(--color-secondary)]" />
            <h3 className="section-title text-base font-semibold">
              Add Subscription Plan
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

            {/* Name & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="plan_name" className="form-label">
                  Plan Name <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  id="plan_name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Monthly Hydration Plan"
                  required
                  className="input-base"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="plan_status" className="form-label">
                  Status
                </label>
                <select
                  id="plan_status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SubscriptionPlanStatus)}
                  className="select-base"
                >
                  <option value="active">Active</option>
                  <option value="deactive">Deactive</option>
                </select>
              </div>
            </div>

            {/* Actual Price & Selling Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="plan_actual_price" className="form-label">
                  Actual Price <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  id="plan_actual_price"
                  type="number"
                  step="0.01"
                  min={0}
                  value={actualPrice}
                  onChange={(e) =>
                    setActualPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="0.00"
                  required
                  className="input-base"
                />
              </div>

              <div className="form-group">
                <label htmlFor="plan_selling_price" className="form-label">
                  Selling Price <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  id="plan_selling_price"
                  type="number"
                  step="0.01"
                  min={0}
                  value={sellingPrice}
                  onChange={(e) =>
                    setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="0.00"
                  required
                  className="input-base"
                />
              </div>
            </div>

            {/* Image Upload (subscription_plans_bucket) */}
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                Plan Image (subscription_plans_bucket)
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
                      <span>Uploading to subscription_plans_bucket...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <Upload className="w-4 h-4 text-sky-600" />
                      <span>Choose plan image file</span>
                    </div>
                  )}
                </label>
                {imageUrl && (
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <img
                      src={imageUrl}
                      alt="Plan Preview"
                      className="w-10 h-10 object-cover rounded-md border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-emerald-700 truncate">
                        Uploaded to subscription_plans_bucket
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
                placeholder={'[\n  "15 x 20L Water Jars",\n  "Free Delivery"\n]'}
                className="textarea-base font-mono text-xs"
              />
              <span className="form-helper">
                Included features or items in valid JSON format
              </span>
            </div>
          </div>

          {/* Footer */}
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
              disabled={loading || uploadingImage}
              className="btn-base btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 anim-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
