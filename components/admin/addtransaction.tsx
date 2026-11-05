'use client';

import React, { useState } from 'react';
import {
  X,
  Loader2,
  Receipt,
  AlertCircle,
  Calendar,
  Wallet,
  ArrowDownLeft,
} from 'lucide-react';
import { Partner } from '@/lib/partnersStore';
import {
  addPartnerPaymentTransaction,
  PartnerTransaction,
  PaymentMethod,
} from '@/lib/paymentsStore';

interface AddTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner;
  onTransactionCreated: (transaction: PartnerTransaction, updatedCredit: number) => void;
}

export default function AddTransaction({
  isOpen,
  onClose,
  partner,
  onTransactionCreated,
}: AddTransactionProps) {
  // Current partner credit balance
  const currentBalance = Number(partner.credit_amount ?? 0);

  // Form states
  const [type] = useState<'sub'>('sub'); // auto select the sub (fix)
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('cash'); // ask cash, upi, other
  const [notes, setNotes] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate resulting balance: balance = partner.balance - amount
  const numericAmount = parseFloat(amount) || 0;
  const calculatedBalance = Math.round((currentBalance - numericAmount) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || numericAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }

    if (!paymentDate) {
      setError('Please select a payment date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, newCredit, error: txError } = await addPartnerPaymentTransaction({
        partner_id: partner.id,
        amount: numericAmount,
        method,
        notes: notes.trim(),
        balance: calculatedBalance,
        payment_date: paymentDate,
      });

      setLoading(false);

      if (txError || !data) {
        setError(txError?.message || 'Failed to record partner transaction.');
        return;
      }

      onTransactionCreated(data, newCredit);
      onClose();
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  return (
    <div className="dialog-overlay anim-fade-in p-2 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="dialog-content max-w-lg w-full max-h-[90vh] flex flex-col my-auto anim-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed at top */}
        <div className="dialog-header flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
              }}
            >
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="card-title text-sm sm:text-base font-bold truncate">Add Transaction</h3>
              <p className="small-text text-[var(--color-text-muted)] truncate">
                Record partner credit settlement (public.partner_transactions)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon flex-shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="dialog-body space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 px-4 py-3 sm:px-6 sm:py-4">
            {error && (
              <div
                className="p-3 rounded-[var(--radius-md)] flex items-center gap-2 text-xs border"
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

            {/* Partner Info (Fixed / This Partner) */}
            <div className="form-group">
              <label className="form-label">Partner (partner_id)</label>
              <div
                className="input-base flex items-center justify-between cursor-not-allowed text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-surface-muted)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <span>
                  {partner.name}{' '}
                  <span className="font-mono text-[var(--color-text-muted)]">
                    ({partner.partner_id})
                  </span>
                </span>
                <span className="badge-base badge-primary text-[10px] font-mono">
                  Active Partner
                </span>
              </div>
            </div>

            {/* Type & Current Balance in row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Type = auto select the sub(fix) */}
              <div className="form-group">
                <label className="form-label">Transaction Type (type)</label>
                <div
                  className="input-base flex items-center justify-between cursor-not-allowed text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--color-surface-muted)',
                    color: 'var(--color-success-text)',
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-[var(--color-success-text)]" />
                    <span>sub (SUB - Credit Deduction)</span>
                  </div>
                  <span
                    className="badge-base text-[10px]"
                    style={{
                      backgroundColor: 'var(--color-success-light)',
                      color: 'var(--color-success-text)',
                      border: '1px solid var(--color-success-border)',
                    }}
                  >
                    Fixed
                  </span>
                </div>
                <span className="form-helper">
                  Auto-selected as &apos;sub&apos; for payment credit reduction
                </span>
              </div>

              {/* Current Credit Balance */}
              <div className="form-group">
                <label className="form-label flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" />
                  <span>Current Credit</span>
                </label>
                <div
                  className="input-base flex items-center justify-between cursor-not-allowed font-mono text-xs font-bold"
                  style={{
                    backgroundColor: 'var(--color-surface-muted)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <span>${currentBalance.toFixed(2)}</span>
                </div>
                <span className="form-helper">Existing partner ledger credit</span>
              </div>
            </div>

            {/* Amount & Method in row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Amount */}
              <div className="form-group">
                <label className="form-label">
                  Amount ($) <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="input-base font-mono text-xs"
                  autoFocus
                />
              </div>

              {/* Method (ask cash, upi, other) */}
              <div className="form-group">
                <label className="form-label">
                  Payment Method (method) <span className="text-[var(--color-danger)]">*</span>
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="select-base text-xs uppercase"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Balance = partner.balance - amount & Payment Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Resulting Balance */}
              <div className="form-group">
                <label className="form-label">
                  Resulting Balance (balance = partner.balance - amount)
                </label>
                <div
                  className="input-base flex items-center justify-between cursor-not-allowed font-mono text-xs font-bold"
                  style={{
                    backgroundColor: 'var(--color-surface-muted)',
                    color: calculatedBalance < 0 ? 'var(--color-danger-text)' : 'var(--color-primary)',
                  }}
                >
                  <span>${calculatedBalance.toFixed(2)}</span>
                  <span className="text-[10px] font-normal text-[var(--color-text-muted)]">
                    ${currentBalance.toFixed(2)} - ${numericAmount.toFixed(2)}
                  </span>
                </div>
                <span className="form-helper">
                  Updated credit balance saved to partner profile
                </span>
              </div>

              {/* Payment Date */}
              <div className="form-group">
                <label className="form-label flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Payment Date (payment_date)</span>{' '}
                  <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="input-base text-xs"
                />
              </div>
            </div>

            {/* Notes (allow to write) */}
            <div className="form-group">
              <label className="form-label">Notes / Remarks</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter transaction notes, receipt no, or UPI reference..."
                className="textarea-base text-xs"
              />
            </div>
          </div>

          {/* Footer - Always visible and sticky */}
          <div
            className="dialog-footer flex-shrink-0 sticky bottom-0 z-10 px-4 py-3 sm:px-6 sm:py-3.5 border-t flex items-center justify-end gap-2.5"
            style={{
              backgroundColor: 'var(--color-surface-hover)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-base btn-outline text-xs py-1.5 px-3.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || numericAmount <= 0}
              className="btn-base btn-primary text-xs py-1.5 px-4 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 anim-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Transaction</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
