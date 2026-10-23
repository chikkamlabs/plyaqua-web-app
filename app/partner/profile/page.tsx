'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PartnerHeader from '@/components/partner/header';
import PartnerBottomNavigation from '@/components/partner/bottomnavigation';
import ProfileCard from '@/components/partner/profileCard';
import {
  getCurrentPartnerProfileDetails,
  PartnerProfileDetails,
} from '@/lib/partnersStore';
import { signOut } from '@/lib/auth';
import {
  ChevronRight,
  User,
  Loader2,
  Megaphone,
  HelpCircle,
  LogOut,
} from 'lucide-react';

export default function PartnerProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PartnerProfileDetails | null>(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      setLoading(true);
      const res = await getCurrentPartnerProfileDetails();
      if (isMounted) {
        if (res.data) {
          setProfile(res.data);
        }
        setLoading(false);
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Header connected at top */}
      <PartnerHeader />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6 sm:py-8 pb-28">
        <div className="mb-4">
          <h1
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Account Profile
          </h1>
          <p
            className="text-xs sm:text-sm mt-0.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Tap on your profile card below to view complete account details
          </p>
        </div>

        {loading ? (
          <div
            className="rounded-[var(--radius-lg)] border p-6 flex flex-col items-center justify-center gap-2 mb-5"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: 'var(--color-secondary)' }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Loading profile details...
            </span>
          </div>
        ) : (
          /* Tap to open Profile Card */
          <button
            type="button"
            onClick={() => setIsCardOpen(true)}
            className="w-full text-left card-interactive p-4 sm:p-5 flex items-center justify-between gap-3 focus:outline-none mb-5"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}
            aria-label="Open partner profile details"
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div
                className="w-12 h-12 rounded-[var(--radius-full)] flex items-center justify-center font-bold text-base sm:text-lg shrink-0 shadow-sm"
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                }}
              >
                {profile?.name ? (
                  profile.name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0">
                {/* Partner Name */}
                <h2
                  className="text-base sm:text-lg font-bold tracking-tight truncate"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {profile?.name || 'Partner Name'}
                </h2>
                {/* Partner Email */}
                <p
                  className="text-xs sm:text-sm truncate mt-0.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {profile?.email || 'partner@plyaqua.com'}
                </p>
              </div>
            </div>

            <div
              className="flex items-center gap-1 shrink-0 transition-transform group-hover:translate-x-0.5"
              style={{ color: 'var(--color-secondary)' }}
            >
              <span className="text-xs font-semibold hidden sm:inline-block">
                View Details
              </span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        )}

        {/* Action List: Marketing(No action), Help(No action), Logout button */}
        <div
          className="rounded-[var(--radius-lg)] border overflow-hidden divide-y shadow-sm"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* Marketing (No action) */}
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 cursor-pointer focus:outline-none"
            style={{ color: 'var(--color-text-primary)' }}
            onClick={() => {
              // No action as requested
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-secondary-light)',
                  color: 'var(--color-secondary)',
                }}
              >
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold block">Marketing</span>
                <span
                  className="text-xs block"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Promotional campaigns & materials
                </span>
              </div>
            </div>
            <ChevronRight
              className="w-4 h-4"
              style={{ color: 'var(--color-text-muted)' }}
            />
          </button>

          {/* Help (No action) */}
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 cursor-pointer focus:outline-none"
            style={{ color: 'var(--color-text-primary)' }}
            onClick={() => {
              // No action as requested
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                }}
              >
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold block">Help</span>
                <span
                  className="text-xs block"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Partner support & FAQs
                </span>
              </div>
            </div>
            <ChevronRight
              className="w-4 h-4"
              style={{ color: 'var(--color-text-muted)' }}
            />
          </button>

          {/* Logout button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-red-50 cursor-pointer focus:outline-none"
            style={{ color: 'var(--color-danger)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-danger-light)',
                  color: 'var(--color-danger)',
                }}
              >
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold block">Logout</span>
                <span
                  className="text-xs block"
                  style={{ color: 'var(--color-danger-text)' }}
                >
                  Sign out of partner portal
                </span>
              </div>
            </div>
            <ChevronRight
              className="w-4 h-4"
              style={{ color: 'var(--color-danger)' }}
            />
          </button>
        </div>

        {/* Profile Card Dialog/Modal */}
        <ProfileCard
          isOpen={isCardOpen}
          onClose={() => setIsCardOpen(false)}
          profile={profile}
        />
      </main>

      {/* Bottom navigation connected at bottom */}
      <PartnerBottomNavigation />
    </div>
  );
}
