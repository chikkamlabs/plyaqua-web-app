'use client';

import React, { useState } from 'react';
import {
  X,
  Loader2,
  Sparkles,
  Ticket,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Hash,
} from 'lucide-react';
import { generateAndInsertPlaycodes } from '@/lib/playcodesStore';

interface CreateCodesProps {
  isOpen: boolean;
  onClose: () => void;
  onCodesCreated?: (count: number) => void;
}

export default function CreateCodes({
  isOpen,
  onClose,
  onCodesCreated,
}: CreateCodesProps) {
  const [fromRange, setFromRange] = useState<number | ''>('');
  const [toRange, setToRange] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const numFrom = typeof fromRange === 'number' ? fromRange : NaN;
  const numTo = typeof toRange === 'number' ? toRange : NaN;

  const isValidRange =
    !isNaN(numFrom) &&
    !isNaN(numTo) &&
    numFrom >= 0 &&
    numTo > numFrom;

  const totalCalculated = isValidRange ? numTo - numFrom + 1 : 0;

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (isNaN(numFrom) || isNaN(numTo)) {
      setError('Please enter both From and To range numbers.');
      return;
    }

    if (numFrom < 0) {
      setError('From number must be 0 or greater.');
      return;
    }

    if (numTo <= numFrom) {
      setError('To number must be strictly greater than From number.');
      return;
    }

    setIsSubmitting(true);

    try {
      // All generation logic is encapsulated in lib/playcodesStore.ts
      const res = await generateAndInsertPlaycodes(numFrom, numTo);

      if (res.error) {
        setError(res.error.message || 'Failed to generate playcodes.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(
        `Successfully generated and activated ${res.count} playcodes (ply-${numFrom} to ply-${numTo})!`
      );

      if (onCodesCreated) {
        onCodesCreated(res.count);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setFromRange('');
        setToRange('');
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error generating codes';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm anim-fade-in"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden anim-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 via-teal-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Create Playcodes
              </h3>
              <p className="text-xs text-slate-500">
                Generate and insert active playcodes into database
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Range Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                From Range (Number) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="e.g. 1001"
                  value={fromRange}
                  onChange={(e) =>
                    setFromRange(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 transition-all font-mono"
                  disabled={isSubmitting}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Generates <code className="text-sky-700 font-bold">ply-{fromRange || 'from'}</code>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                To Range (Number) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="e.g. 1050"
                  value={toRange}
                  onChange={(e) =>
                    setToRange(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 transition-all font-mono"
                  disabled={isSubmitting}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Must be strictly greater than From
              </p>
            </div>
          </div>

          {/* Range Calculation & Preview Preview Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Generation Status:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                Status: active
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
              <span className="text-slate-500">Total Codes to Generate:</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {isValidRange ? totalCalculated : 0}
              </span>
            </div>

            {isValidRange && (
              <div className="mt-2 pt-2 border-t border-slate-200/60">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                  <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 font-bold rounded">
                    ply-{numFrom}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-400">...</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 font-bold rounded">
                    ply-{numTo}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidRange}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-teal-600 hover:from-sky-600 hover:to-teal-700 rounded-xl shadow-md shadow-sky-500/25 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating {totalCalculated} Codes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Codes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
