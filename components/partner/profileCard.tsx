'use client';

import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  Hash,
  MapPin,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { PartnerProfileDetails } from '@/lib/partnersStore';

interface ProfileCardProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PartnerProfileDetails | null;
}

export default function ProfileCard({
  isOpen,
  onClose,
  profile,
}: ProfileCardProps) {
  if (!isOpen || !profile) return null;

  return (
    <div
      className="dialog-overlay z-50 p-3 sm:p-6 anim-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg overflow-hidden border shadow-xl rounded-[var(--radius-xl)] anim-slide-up flex flex-col max-h-[90vh]"
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
              className="w-8 h-8 rounded-[var(--radius-full)] flex items-center justify-center font-bold text-sm"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
              }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2
                className="font-bold text-base tracking-tight"
                style={{ color: 'var(--color-primary)' }}
              >
                Partner Profile
              </h2>
              <p
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Detailed Account Information
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-md)] transition-colors hover:bg-slate-100"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Close profile card"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Main User Details */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              User Details
            </h3>
            <div
              className="rounded-[var(--radius-lg)] border p-3.5 space-y-3"
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                borderColor: 'var(--color-border-subtle)',
              }}
            >
              {/* Name */}
              <div className="flex items-start gap-3">
                <User
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <div className="min-w-0 flex-1">
                  <span
                    className="text-xs block"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Full Name
                  </span>
                  <span
                    className="text-sm font-semibold truncate block"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {profile.name || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <div className="min-w-0 flex-1">
                  <span
                    className="text-xs block"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Email Address
                  </span>
                  <span
                    className="text-sm font-medium truncate block"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {profile.email || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Mobile */}
              <div className="flex items-start gap-3">
                <Phone
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <div className="min-w-0 flex-1">
                  <span
                    className="text-xs block"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Mobile Number
                  </span>
                  <span
                    className="text-sm font-medium block"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {profile.mobile || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-start gap-3">
                <Shield
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <div className="min-w-0 flex-1">
                  <span
                    className="text-xs block"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Account Role
                  </span>
                  <span
                    className="text-xs uppercase font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] inline-block mt-0.5"
                    style={{
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {profile.role || 'partner'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Partner Profile Details */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Partner Profile
            </h3>
            <div
              className="rounded-[var(--radius-lg)] border p-3.5 space-y-3"
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                borderColor: 'var(--color-border-subtle)',
              }}
            >
              {/* Partner ID */}
              <div className="flex items-start gap-3">
                <Hash
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: 'var(--color-primary)' }}
                />
                <div className="min-w-0 flex-1">
                  <span
                    className="text-xs block"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Partner ID
                  </span>
                  <span
                    className="text-sm font-mono font-semibold block"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {profile.partner_id || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: 'var(--color-primary)' }}
                />
                <div className="min-w-0 flex-1">
                  <span
                    className="text-xs block"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Business Address
                  </span>
                  <span
                    className="text-sm font-medium block leading-relaxed"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {profile.address || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Partner Category */}
              <div className="flex items-start gap-3">
                <Tag
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: 'var(--color-primary)' }}
                />
                <div className="min-w-0 flex-1">
                  <span
                    className="text-xs block"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Partner Category
                  </span>
                  <span
                    className="text-sm font-medium block"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {profile.partner_category_name || profile.partner_category || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: 'var(--color-success)' }}
                />
                <div className="min-w-0 flex-1">
                  <span
                    className="text-xs block"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Account Status
                  </span>
                  <span
                    className={`status-chip ${
                      profile.status === 'active'
                        ? 'status-chip-active'
                        : 'status-chip-inactive'
                    } mt-1`}
                  >
                    {profile.status || 'active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Close Button */}
        <div
          className="p-4 border-t shrink-0 flex items-center justify-end"
          style={{
            borderColor: 'var(--color-border-subtle)',
            backgroundColor: 'var(--color-surface-hover)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-base btn-outline text-xs sm:text-sm py-2 px-5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
