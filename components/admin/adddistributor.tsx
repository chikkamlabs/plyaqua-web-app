'use client';

import React, { useState } from 'react';
import { X, Loader2, UserPlus } from 'lucide-react';
import {
  createDistributor,
  Distributor,
  DistributorStatus,
} from '@/lib/distributorsStore';

interface AddDistributorProps {
  isOpen: boolean;
  onClose: () => void;
  onDistributorCreated: (distributor: Distributor) => void;
}

export default function AddDistributor({
  isOpen,
  onClose,
  onDistributorCreated,
}: AddDistributorProps) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [points, setPoints] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<DistributorStatus>('active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Distributor name is required.');
      return;
    }
    if (!mobile.trim()) {
      setError('Mobile number is required.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await createDistributor({
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
      setError(err?.message || 'Failed to save distributor.');
      return;
    }

    onDistributorCreated(data);
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
            <UserPlus className="w-5 h-5 text-[var(--color-secondary)]" />
            <h3 className="section-title text-base font-semibold">
              Add Distributor
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

        {/* Form */}
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

            {/* Name & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="dist_name" className="form-label">
                  Name <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  id="dist_name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Oceanic Distributors"
                  required
                  className="input-base"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="dist_mobile" className="form-label">
                  Mobile <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  id="dist_mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  required
                  className="input-base"
                />
              </div>
            </div>

            {/* City, Points & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-group">
                <label htmlFor="dist_city" className="form-label">
                  City
                </label>
                <input
                  id="dist_city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Riverdale"
                  className="input-base"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dist_points" className="form-label">
                  Points
                </label>
                <input
                  id="dist_points"
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  placeholder="0"
                  className="input-base"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dist_status" className="form-label">
                  Status
                </label>
                <select
                  id="dist_status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DistributorStatus)}
                  className="select-base"
                >
                  <option value="active">Active</option>
                  <option value="deactive">Deactive</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label htmlFor="dist_address" className="form-label">
                Address
              </label>
              <textarea
                id="dist_address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, area, landmark..."
                className="textarea-base"
              />
            </div>

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="dist_notes" className="form-label">
                Notes
              </label>
              <textarea
                id="dist_notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this distributor..."
                className="textarea-base"
              />
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
              disabled={loading}
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
