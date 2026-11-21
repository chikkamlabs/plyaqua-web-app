'use client';

import React, { useState } from 'react';
import { X, Loader2, Edit3 } from 'lucide-react';
import {
  updateDistributor,
  Distributor,
  DistributorStatus,
} from '@/lib/distributorsStore';

interface OpenDistributorProps {
  distributor: Distributor | null;
  isOpen: boolean;
  onClose: () => void;
  onDistributorUpdated: (updated: Distributor) => void;
}

function OpenDistributorForm({
  distributor,
  onClose,
  onDistributorUpdated,
}: {
  distributor: Distributor;
  onClose: () => void;
  onDistributorUpdated: (updated: Distributor) => void;
}) {
  const [name, setName] = useState(distributor.name || '');
  const [mobile, setMobile] = useState(distributor.mobile || '');
  const [city, setCity] = useState(distributor.city || '');
  const [address, setAddress] = useState(distributor.address || '');
  const [points, setPoints] = useState<number>(distributor.points ?? 0);
  const [notes, setNotes] = useState(distributor.notes || '');
  const [status, setStatus] = useState<DistributorStatus>(distributor.status || 'active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Distributor name cannot be empty.');
      return;
    }
    if (!mobile.trim()) {
      setError('Mobile number cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await updateDistributor(distributor.id, {
      name: name.trim(),
      mobile: mobile.trim(),
      city: city.trim(),
      address: address.trim(),
      points: Number(points) || 0,
      notes: notes.trim(),
      status,
    });

    setLoading(false);

    if (err || !data) {
      setError(err?.message || 'Failed to update distributor details.');
      return;
    }

    onDistributorUpdated(data);
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
              Distributor Details
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

            {/* ID & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Distributor ID</label>
                <input
                  type="text"
                  value={distributor.id}
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
                <label htmlFor="open_dist_status" className="form-label">
                  Status
                </label>
                <select
                  id="open_dist_status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DistributorStatus)}
                  className="select-base"
                >
                  <option value="active">Active</option>
                  <option value="deactive">Deactive</option>
                </select>
              </div>
            </div>

            {/* Name & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="open_dist_name" className="form-label">
                  Name <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  id="open_dist_name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input-base"
                />
              </div>

              <div className="form-group">
                <label htmlFor="open_dist_mobile" className="form-label">
                  Mobile <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  id="open_dist_mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  className="input-base"
                />
              </div>
            </div>

            {/* City & Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="open_dist_city" className="form-label">
                  City
                </label>
                <input
                  id="open_dist_city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="input-base"
                />
              </div>

              <div className="form-group">
                <label htmlFor="open_dist_points" className="form-label">
                  Points
                </label>
                <input
                  id="open_dist_points"
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="input-base"
                />
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label htmlFor="open_dist_address" className="form-label">
                Address
              </label>
              <textarea
                id="open_dist_address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, area, landmark..."
                className="textarea-base"
              />
            </div>

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="open_dist_notes" className="form-label">
                Notes
              </label>
              <textarea
                id="open_dist_notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                className="textarea-base"
              />
            </div>

            {/* Timestamps */}
            {(distributor.created_at || distributor.updated_at) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)]">
                <div>
                  <span className="font-medium">Created: </span>
                  {distributor.created_at ? new Date(distributor.created_at).toLocaleString() : '—'}
                </div>
                <div>
                  <span className="font-medium">Updated: </span>
                  {distributor.updated_at ? new Date(distributor.updated_at).toLocaleString() : '—'}
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

export default function OpenDistributor({
  distributor,
  isOpen,
  onClose,
  onDistributorUpdated,
}: OpenDistributorProps) {
  if (!isOpen || !distributor) return null;

  return (
    <OpenDistributorForm
      key={distributor.id}
      distributor={distributor}
      onClose={onClose}
      onDistributorUpdated={onDistributorUpdated}
    />
  );
}
