'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Check, Loader2, Ruler, AlertCircle } from 'lucide-react';
import { getSizes, createSize, updateSize, ProductSize } from '@/lib/productsStore';

interface SizesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSizesChanged?: (sizes: ProductSize[]) => void;
}

export default function SizesModal({
  isOpen,
  onClose,
  onSizesChanged,
}: SizesModalProps) {
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [newValue, setNewValue] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSizes() {
      const { data } = await getSizes();
      if (!active) return;
      if (data) {
        setSizes(data);
      }
      setLoading(false);
    }

    if (isOpen) {
      loadSizes();
    }

    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) {
      setError('Size value cannot be empty (e.g. 500ml, 1L).');
      return;
    }

    setCreating(true);
    setError(null);

    const { data, error: err } = await createSize(newValue.trim());

    setCreating(false);

    if (err || !data) {
      setError(err?.message || 'Failed to add packaging size.');
      return;
    }

    const updated = [...sizes, data];
    setSizes(updated);
    setNewValue('');
    if (onSizesChanged) onSizesChanged(updated);
  };

  const startEdit = (size: ProductSize) => {
    setEditingId(size.id);
    setEditValue(size.value);
    setError(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValue.trim()) {
      setError('Size value cannot be empty.');
      return;
    }

    setSavingId(id);
    setError(null);

    const { data, error: err } = await updateSize(id, editValue.trim());

    setSavingId(null);

    if (err || !data) {
      setError(err?.message || 'Failed to update packaging size.');
      return;
    }

    const updated = sizes.map((s) => (s.id === id ? data : s));
    setSizes(updated);
    setEditingId(null);
    if (onSizesChanged) onSizesChanged(updated);
  };

  return (
    <div className="dialog-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="dialog-content max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dialog-header flex-shrink-0">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-[var(--color-secondary)]" />
            <h3 className="section-title text-base font-semibold">
              Manage Sizes (public.sizes)
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

        {/* Content Body */}
        <div className="dialog-body flex-1 overflow-y-auto space-y-5">
          {error && (
            <div
              className="p-3 rounded-[var(--radius-md)] text-xs border flex items-center gap-2"
              style={{
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger-text)',
                borderColor: 'var(--color-danger-border)',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add Size Form */}
          <form onSubmit={handleAddSize} className="space-y-2">
            <label className="form-label">
              Add New Packaging Size
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g. 250ml, 750ml, 2L, 20L..."
                className="input-base"
              />
              <button
                type="submit"
                disabled={creating}
                className="btn-base btn-primary whitespace-nowrap"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 anim-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add Size</span>
                  </>
                )}
              </button>
            </div>
            <span className="form-helper">
              Inserts new packaging capacity definition into the public.sizes database table.
            </span>
          </form>

          {/* Existing Sizes List */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-border-subtle)]">
            <label className="form-label">
              Available Product Sizes ({sizes.length})
            </label>

            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 anim-spin mx-auto text-[var(--color-secondary)]" />
              </div>
            ) : sizes.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">
                No sizes found. Add your first packaging size above.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {sizes.map((size) => (
                  <div
                    key={size.id}
                    className="p-3 rounded-[var(--radius-md)] border flex items-center justify-between gap-3"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    {editingId === size.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="input-base py-1 px-2 text-xs"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(size.id)}
                          disabled={savingId === size.id}
                          className="btn-base btn-secondary py-1 px-2 text-xs"
                        >
                          {savingId === size.id ? (
                            <Loader2 className="w-3.5 h-3.5 anim-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="btn-base btn-outline py-1 px-2 text-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                            {size.value}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => startEdit(size)}
                          className="btn-icon w-7 h-7 text-xs"
                          title="Edit packaging size"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="dialog-footer flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-base btn-outline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
