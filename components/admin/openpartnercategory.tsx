'use client';

import React, { useState } from 'react';
import { X, Loader2, Edit3, ShieldAlert } from 'lucide-react';
import {
  updatePartnerCategory,
  CategoryStatus,
  PartnerCategory,
} from '@/lib/partnercategories';

interface OpenPartnerCategoryProps {
  category: PartnerCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onCategoryUpdated: (updated: PartnerCategory) => void;
}

export default function OpenPartnerCategory({
  category,
  isOpen,
  onClose,
  onCategoryUpdated,
}: OpenPartnerCategoryProps) {
  const [name, setName] = useState(category?.name || '');
  const [status, setStatus] = useState<CategoryStatus>(category?.status || 'active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !category) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await updatePartnerCategory(category.id, {
      name: name.trim(),
      status,
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
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dialog-header">
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

        {/* Form Body */}
        <form onSubmit={handleUpdate}>
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

            {/* Display p_cat_id (Not editable) */}
            <div className="form-group">
              <div className="flex items-center justify-between">
                <label htmlFor="open_p_cat_id" className="form-label">
                  Category ID (Fixed Identifier)
                </label>
                <span className="small-text flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
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
              <span className="form-helper">
                The identifier is immutable and cannot be changed.
              </span>
            </div>

            {/* Name Input (Editable) */}
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

            {/* Status Input (Editable) */}
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

          {/* Footer Actions */}
          <div className="dialog-footer">
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
