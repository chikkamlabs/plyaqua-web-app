'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import { getCustomerById, updateCustomer, Customer } from '@/lib/customersStore';
import {
  ArrowLeft,
  Save,
  Loader2,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Coins,
  Key,
} from 'lucide-react';

function OpenCustomerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('id');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states - all editable
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [keyVal, setKeyVal] = useState<string>('');
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [totalCashback, setTotalCashback] = useState<number>(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!customerId) {
        setLoading(false);
        setErrorMsg('No customer identifier provided in URL.');
        return;
      }

      const { data, error } = await getCustomerById(customerId);

      if (!active) return;

      if (data) {
        setCustomer(data);
        setName(data.name);
        setMobile(data.mobile);
        setAvailablePoints(data.available_points || 0);
        setKeyVal(data.key || '');
        setTotalPoints(data.total_points || 0);
        setTotalCashback(data.total_cashback || 0);
      } else {
        setErrorMsg(error?.message || 'Customer record not found.');
      }
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [customerId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    if (!name.trim()) {
      setErrorMsg('Customer name is required.');
      return;
    }
    if (!mobile.trim()) {
      setErrorMsg('Mobile number is required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { data: updated, error } = await updateCustomer(customer.id, {
      name: name.trim(),
      mobile: mobile.trim(),
      available_points: Number(availablePoints) || 0,
      key: keyVal.trim() ? keyVal.trim() : null,
      total_points: Number(totalPoints) || 0,
      total_cashback: Number(totalCashback) || 0,
    });

    setSaving(false);

    if (error || !updated) {
      setErrorMsg(error?.message || 'Failed to update customer details.');
      return;
    }

    setCustomer(updated);
    setSuccessMsg('Customer details successfully saved.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl w-full mx-auto">
          {/* Back button and page heading */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/customers/dashboard')}
              className="btn-base btn-outline text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Customers</span>
            </button>
            {customer && (
              <span className="font-mono text-xs px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
                ID: {customer.id.slice(0, 8)}...
              </span>
            )}
          </div>

          {loading ? (
            <div className="card-base p-12 text-center">
              <Loader2
                className="w-8 h-8 anim-spin mx-auto mb-3"
                style={{ color: 'var(--color-secondary)' }}
              />
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                Loading customer profile...
              </p>
            </div>
          ) : !customer ? (
            <div className="card-base p-8 text-center space-y-4">
              <AlertCircle
                className="w-10 h-10 mx-auto"
                style={{ color: 'var(--color-danger)' }}
              />
              <p className="text-base font-semibold text-[var(--color-text-primary)]">
                {errorMsg || 'Customer not found.'}
              </p>
              <button
                type="button"
                onClick={() => router.push('/admin/customers/dashboard')}
                className="btn-base btn-primary text-xs"
              >
                Return to Customers List
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Notifications */}
              {successMsg && (
                <div
                  className="p-4 rounded-[var(--radius-md)] flex items-center gap-3 text-xs border"
                  style={{
                    backgroundColor: 'var(--color-success-light)',
                    color: 'var(--color-success-text)',
                    borderColor: 'var(--color-success-border)',
                  }}
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div
                  className="p-4 rounded-[var(--radius-md)] flex items-center gap-3 text-xs border"
                  style={{
                    backgroundColor: 'var(--color-danger-light)',
                    color: 'var(--color-danger-text)',
                    borderColor: 'var(--color-danger-border)',
                  }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Card: Customer Details (public.customers) */}
              <div className="card-base p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border-subtle)]">
                  <UserCheck className="w-5 h-5 text-[var(--color-secondary)]" />
                  <h2 className="section-title text-base font-semibold">
                    Customer Account Information (public.customers)
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="form-group">
                    <label className="form-label">
                      Customer Name <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      required
                      className="input-base"
                    />
                  </div>

                  {/* Mobile */}
                  <div className="form-group">
                    <label className="form-label">
                      Mobile Number <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      required
                      className="input-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Key */}
                  <div className="form-group">
                    <label className="form-label flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      <span>Customer Unique Key</span>
                    </label>
                    <input
                      type="text"
                      value={keyVal}
                      onChange={(e) => setKeyVal(e.target.value)}
                      placeholder="Unique key or identifier..."
                      className="input-base font-mono text-xs"
                    />
                  </div>

                  {/* Available Points */}
                  <div className="form-group">
                    <label className="form-label flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                      <span>Available Points</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={availablePoints}
                      onChange={(e) => setAvailablePoints(Number(e.target.value))}
                      className="input-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Total Points */}
                  <div className="form-group">
                    <label className="form-label">Total Points (Accumulated)</label>
                    <input
                      type="number"
                      min={0}
                      value={totalPoints}
                      onChange={(e) => setTotalPoints(Number(e.target.value))}
                      className="input-base"
                    />
                  </div>

                  {/* Total Cashback */}
                  <div className="form-group">
                    <label className="form-label">Total Cashback ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={totalCashback}
                      onChange={(e) => setTotalCashback(Number(e.target.value))}
                      className="input-base"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/admin/customers/dashboard')}
                  className="btn-base btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-base btn-primary"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 anim-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}

export default function OpenCustomerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
          <Loader2 className="w-8 h-8 anim-spin text-[var(--color-secondary)]" />
        </div>
      }
    >
      <OpenCustomerContent />
    </Suspense>
  );
}
