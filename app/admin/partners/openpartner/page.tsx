'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import { getPartnerById, updatePartner, Partner } from '@/lib/partnersStore';
import { getPartnerCategories, PartnerCategory } from '@/lib/partnercategories';
import {
  ArrowLeft,
  Save,
  Loader2,
  ShieldAlert,
  User,
  Building,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

function OpenPartnerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerId = searchParams.get('id');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [categories, setCategories] = useState<PartnerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'active' | 'deactive'>('active');

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!partnerId) {
        setLoading(false);
        setErrorMsg('No partner identifier specified in URL.');
        return;
      }

      const [partnerRes, catRes] = await Promise.all([
        getPartnerById(partnerId),
        getPartnerCategories(),
      ]);

      if (!active) return;

      if (catRes.data) {
        setCategories(catRes.data);
      }

      if (partnerRes.data) {
        const p = partnerRes.data;
        setPartner(p);
        setName(p.name);
        setEmail(p.email || '');
        setMobile(p.mobile || '');
        setSelectedCategoryId(p.partner_category || '');
        setAvailablePoints(p.available_points || 0);
        setAddress(p.address || '');
        setStatus(p.status || 'active');
      } else {
        setErrorMsg(partnerRes.error?.message || 'Partner record not found.');
      }
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [partnerId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;

    if (!name.trim()) {
      setErrorMsg('Partner name is required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const categoryObj = categories.find((c) => c.id === selectedCategoryId);

    const { data: updated, error } = await updatePartner(partner.id, {
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      partner_category: selectedCategoryId || null,
      partner_category_name: categoryObj ? categoryObj.name : 'General',
      available_points: Number(availablePoints) || 0,
      address: address.trim(),
      status,
    });

    setSaving(false);

    if (error || !updated) {
      setErrorMsg(error?.message || 'Failed to update partner details.');
      return;
    }

    setPartner(updated);
    setSuccessMsg('Partner details successfully updated.');
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
          {/* Back button and page heading */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/partners/dashboard')}
              className="btn-base btn-outline text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Partners</span>
            </button>
            {partner && (
              <span className="font-mono text-xs px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
                {partner.partner_id}
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
                Loading partner profile...
              </p>
            </div>
          ) : !partner ? (
            <div className="card-base p-8 text-center space-y-4">
              <AlertCircle
                className="w-10 h-10 mx-auto"
                style={{ color: 'var(--color-danger)' }}
              />
              <p className="text-base font-semibold text-[var(--color-text-primary)]">
                {errorMsg || 'Partner not found.'}
              </p>
              <button
                type="button"
                onClick={() => router.push('/admin/partners/dashboard')}
                className="btn-base btn-primary text-xs"
              >
                Return to Partners List
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

              {/* Section 1: Partner Profile Details (public.partner_profile) */}
              <div className="card-base p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border-subtle)]">
                  <Building className="w-5 h-5 text-[var(--color-secondary)]" />
                  <h2 className="section-title text-base font-semibold">
                    Partner Entity & Profile (public.partner_profile)
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Immutable partner_id */}
                  <div className="form-group">
                    <div className="flex items-center justify-between">
                      <label className="form-label">Partner ID (Immutable)</label>
                      <span className="small-text flex items-center gap-1 text-[var(--color-text-muted)]">
                        <ShieldAlert className="w-3.5 h-3.5" /> Cannot be edited
                      </span>
                    </div>
                    <input
                      type="text"
                      value={partner.partner_id}
                      readOnly
                      disabled
                      className="input-base cursor-not-allowed font-mono text-xs"
                      style={{
                        backgroundColor: 'var(--color-surface-muted)',
                        color: 'var(--color-text-secondary)',
                      }}
                    />
                  </div>

                  {/* Status */}
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'active' | 'deactive')}
                      className="select-base"
                    >
                      <option value="active">Active</option>
                      <option value="deactive">Deactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div className="form-group">
                    <label className="form-label">Partner Category</label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="select-base"
                    >
                      <option value="">No Category Assigned</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.p_cat_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Available Points */}
                  <div className="form-group">
                    <label className="form-label">Available Points</label>
                    <input
                      type="number"
                      min={0}
                      value={availablePoints}
                      onChange={(e) => setAvailablePoints(Number(e.target.value))}
                      className="input-base"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="form-group">
                  <label className="form-label">Physical / Billing Address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="textarea-base"
                    placeholder="Enter complete address..."
                  />
                </div>
              </div>

              {/* Section 2: User Account Details (public.users) */}
              <div className="card-base p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border-subtle)]">
                  <User className="w-5 h-5 text-[var(--color-primary)]" />
                  <h2 className="section-title text-base font-semibold">
                    User Contact & Identity (public.users)
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">
                      Partner Name <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="input-base"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-base"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="input-base"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/admin/partners/dashboard')}
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

export default function OpenPartnerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
          <Loader2 className="w-8 h-8 anim-spin text-[var(--color-secondary)]" />
        </div>
      }
    >
      <OpenPartnerContent />
    </Suspense>
  );
}
