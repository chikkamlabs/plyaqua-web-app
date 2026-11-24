'use client';

import React, { useState } from 'react';
import { X, Coins, Loader2, AlertCircle, Save } from 'lucide-react';
import { createPartnerPointReq, PartnerPointReq } from '@/lib/partnerpointsStore';

interface PartnerPointsReqModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePoints: number;
  onRequestCreated: (req: PartnerPointReq) => void;
}

export default function PartnerPointsReqModal({
  isOpen,
  onClose,
  availablePoints,
  onRequestCreated,
}: PartnerPointsReqModalProps) {
  const [points, setPoints] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parsedPoints = Number(points);
  const isExceeding = Number.isFinite(parsedPoints) && parsedPoints > availablePoints;
  const isInvalidAmount =
    !points.trim() ||
    !Number.isFinite(parsedPoints) ||
    !Number.isInteger(parsedPoints) ||
    parsedPoints <= 0;

  const resetAndClose = () => {
    setPoints('');
    setNotes('');
    setError(null);
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (availablePoints <= 0) {
      setError('You do not have any available points to redeem.');
      return;
    }

    if (isInvalidAmount) {
      setError('Please enter a valid whole number of points greater than 0.');
      return;
    }

    if (parsedPoints > availablePoints) {
      setError(
        `Points to redeem cannot exceed your available points (${availablePoints.toLocaleString()} pts).`
      );
      return;
    }

    setSubmitting(true);
    const res = await createPartnerPointReq({
      points: parsedPoints,
      notes,
    });
    setSubmitting(false);

    if (res.error || !res.data) {
      setError(res.error?.message || 'Failed to save redemption request.');
      return;
    }

    onRequestCreated(res.data);
    resetAndClose();
  };

  return (
    <div
      className="dialog-overlay z-50 p-3 sm:p-6 anim-fade-in"
      onClick={resetAndClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md overflow-hidden border shadow-xl rounded-[var(--radius-xl)] anim-slide-up flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{
            borderColor: 'var(--color-border-subtle)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-[var(--radius-full)] flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-secondary-light)',
                color: 'var(--color-secondary)',
              }}
            >
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h2
                className="font-bold text-base tracking-tight"
                style={{ color: 'var(--color-primary)' }}
              >
                Redeem Points
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Submit a points redemption request
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            className="p-1.5 rounded-[var(--radius-md)] transition-colors hover:bg-slate-100"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Close redeem points modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div
              className="p-3 rounded-[var(--radius-md)] flex items-center gap-2 text-xs border"
              style={{
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger-text)',
                borderColor: 'var(--color-danger-border)',
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Available Points Summary */}
          <div
            className="p-3 rounded-[var(--radius-md)] border flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-surface-muted)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Available Points
            </span>
            <span
              className="text-sm font-mono font-bold"
              style={{ color: 'var(--color-secondary)' }}
            >
              {availablePoints.toLocaleString()} pts
            </span>
          </div>

          {/* Points Input */}
          <div className="form-group">
            <label
              htmlFor="redeem-points-input"
              className="text-xs font-semibold block mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Points to Redeem *
            </label>
            <input
              id="redeem-points-input"
              type="number"
              min={1}
              max={availablePoints > 0 ? availablePoints : undefined}
              step={1}
              placeholder={
                availablePoints > 0
                  ? `Enter points (max ${availablePoints.toLocaleString()})`
                  : 'No available points'
              }
              value={points}
              onChange={(e) => {
                setError(null);
                setPoints(e.target.value);
              }}
              disabled={availablePoints <= 0 || submitting}
              required
              className="input-base text-xs sm:text-sm py-2 px-3"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: isExceeding ? 'var(--color-danger)' : 'var(--color-border)',
              }}
            />
            {isExceeding && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-danger)' }}>
                Cannot exceed available points ({availablePoints.toLocaleString()} pts).
              </p>
            )}
          </div>

          {/* Optional Notes */}
          <div className="form-group">
            <label
              htmlFor="redeem-notes-input"
              className="text-xs font-semibold block mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Notes
            </label>
            <textarea
              id="redeem-notes-input"
              rows={3}
              placeholder="Optional redemption notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              className="textarea-base text-xs sm:text-sm py-2 px-3 min-h-[4.5rem]"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
              }}
            />
          </div>

          {/* Footer */}
          <div
            className="pt-3 border-t flex items-center justify-end gap-2.5"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <button
              type="button"
              onClick={resetAndClose}
              disabled={submitting}
              className="btn-base btn-outline text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                availablePoints <= 0 ||
                isInvalidAmount ||
                isExceeding
              }
              className="btn-base btn-primary text-xs py-2 px-5 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 anim-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
