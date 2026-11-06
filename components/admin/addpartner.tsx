'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Loader2,
  UserPlus,
  Eye,
  EyeOff,
  Search,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  createPartner,
  calculateNextPartnerId,
  Partner,
} from '@/lib/partnersStore';
import {
  getPartnerCategories,
  PartnerCategory,
} from '@/lib/partnercategories';

interface AddPartnerProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  onPartnerCreated: (partner: Partner) => void;
}

export default function AddPartner({
  isOpen,
  onClose,
  currentCount,
  onPartnerCreated,
}: AddPartnerProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [status, setStatus] = useState<'active' | 'deactive'>('active');

  // Category search & select state
  const [categories, setCategories] = useState<PartnerCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PartnerCategory | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-filled partner_id: partner_101 + length of partners
  const autoPartnerId = calculateNextPartnerId(currentCount);

  useEffect(() => {
    let active = true;
    getPartnerCategories().then(({ data }) => {
      if (active) {
        setCategories(data);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Filter categories based on search input
  const filteredCategories = useMemo(() => {
    const q = categorySearch.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.p_cat_id.toLowerCase().includes(q)
    );
  }, [categories, categorySearch]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Partner name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await createPartner({
      partner_id: autoPartnerId,
      name: name.trim(),
      email: email.trim(),
      password,
      mobile: mobile.trim(),
      partner_category: selectedCategory ? selectedCategory.id : null,
      partner_category_name: selectedCategory ? selectedCategory.name : 'None',
      available_points: Number(availablePoints) || 0,
      address: address.trim(),
      status,
    });

    setLoading(false);

    if (err || !data) {
      setError(err?.message || 'Failed to create partner account.');
      return;
    }

    onPartnerCreated(data);
  };

  return (
    <div className="dialog-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="dialog-content max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dialog-header flex-shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" style={{ color: 'var(--color-secondary)' }} />
            <h3 className="section-title text-base font-semibold">
              Add Partner
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

        {/* Scrollable Form Body */}
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

            {/* Row 1: Auto-filled Partner ID & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="partner_id" className="form-label">
                  Partner ID (Auto-Generated)
                </label>
                <input
                  id="partner_id"
                  type="text"
                  value={autoPartnerId}
                  readOnly
                  disabled
                  className="input-base cursor-not-allowed font-mono text-xs"
                  style={{
                    backgroundColor: 'var(--color-surface-muted)',
                    color: 'var(--color-text-secondary)',
                  }}
                />
                <span className="form-helper">
                  Formula: partner_101 + count ({currentCount})
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="status" className="form-label">
                  Status (Default: Active)
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'deactive')}
                  className="select-base"
                >
                  <option value="active">Active</option>
                  <option value="deactive">Deactive</option>
                </select>
              </div>
            </div>

            {/* Row 2: Name & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="partner_name" className="form-label">
                  Partner Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="partner_name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Water Solutions"
                  required
                  className="input-base"
                />
              </div>

              <div className="form-group">
                <label htmlFor="partner_mobile" className="form-label">
                  Mobile Number
                </label>
                <input
                  id="partner_mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="input-base"
                />
              </div>
            </div>

            {/* Row 3: Email & Password (for auth.users & public.users) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="partner_email" className="form-label">
                  Email Address <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="partner_email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@example.com"
                  required
                  className="input-base"
                />
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between">
                  <label htmlFor="partner_password" className="form-label">
                    Password <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="small-text font-medium flex items-center gap-1 cursor-pointer"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Hide' : 'View'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="partner_password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    className="input-base pr-10"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Partner Category (Search & Select) */}
            <div className="form-group relative">
              <label htmlFor="partner_category_select" className="form-label">
                Partner Category (Search & Select)
              </label>

              {/* Selection display / trigger */}
              <div
                id="partner_category_select"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="input-base cursor-pointer flex items-center justify-between"
                tabIndex={0}
              >
                <span
                  style={{
                    color: selectedCategory
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-muted)',
                  }}
                >
                  {selectedCategory
                    ? `${selectedCategory.name} (${selectedCategory.p_cat_id})`
                    : 'Select a partner category...'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>

              {/* Searchable Dropdown Popup */}
              {isCategoryDropdownOpen && (
                <div
                  className="absolute z-20 mt-1 w-full border rounded-[var(--radius-md)] shadow-lg"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  {/* Category Search Input */}
                  <div
                    className="p-2 border-b flex items-center gap-2"
                    style={{ borderColor: 'var(--color-border-subtle)' }}
                  >
                    <Search className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Type to filter categories..."
                      className="w-full text-xs outline-none bg-transparent"
                      autoFocus
                    />
                  </div>

                  {/* Category Options List */}
                  <div className="max-h-40 overflow-y-auto p-1 space-y-0.5">
                    {filteredCategories.length === 0 ? (
                      <div
                        className="p-2 text-xs text-center"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        No matching categories
                      </div>
                    ) : (
                      filteredCategories.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCategory(c);
                            setIsCategoryDropdownOpen(false);
                            setCategorySearch('');
                          }}
                          className="flex items-center justify-between p-2 rounded text-xs cursor-pointer hover:bg-[var(--color-surface-hover)]"
                          style={{
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          <div>
                            <span className="font-medium">{c.name}</span>
                            <span
                              className="ml-2 font-mono text-[10px]"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {c.p_cat_id}
                            </span>
                          </div>
                          {selectedCategory?.id === c.id && (
                            <Check className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Row 5: Available Points */}
            <div className="form-group">
              <label htmlFor="available_points" className="form-label">
                Initial Available Points
              </label>
              <input
                id="available_points"
                type="number"
                min={0}
                value={availablePoints}
                onChange={(e) => setAvailablePoints(Number(e.target.value))}
                placeholder="0"
                className="input-base"
              />
            </div>

            {/* Row 6: Address */}
            <div className="form-group">
              <label htmlFor="partner_address" className="form-label">
                Physical / Billing Address
              </label>
              <textarea
                id="partner_address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, City, Region..."
                className="textarea-base"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
                  <span>Creating Partner...</span>
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
