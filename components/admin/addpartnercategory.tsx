'use client';

import React, { useState } from 'react';
import { X, Loader2, PlusCircle } from 'lucide-react';
import {
  createPartnerCategory,
  calculateNextCategoryId,
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculated p_cat_id formula: p_cat_101 + length of partner categories
  const autoCategoryId = calculateNextCategoryId(currentCount);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await createPartnerCategory({
      p_cat_id: autoCategoryId,
      name: name.trim(),
      status,
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

            {/* Status Input (default active) */}
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
