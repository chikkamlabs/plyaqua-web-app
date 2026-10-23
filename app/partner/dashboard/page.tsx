'use client';

import React, { useEffect, useState } from 'react';
import PartnerHeader from '@/components/partner/header';
import PartnerBottomNavigation from '@/components/partner/bottomnavigation';
import SaleCard from '@/components/partner/saleCard';
import { getCurrentPartnerProfileDetails, PartnerProfileDetails } from '@/lib/partnersStore';
import { getPartnerTodayBottleSales } from '@/lib/sessionStore';
import {
  Package,
  ShoppingCart,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function PartnerDashboardPage() {
  const [partner, setPartner] = useState<PartnerProfileDetails | null>(null);
  const [todayBottleSales, setTodayBottleSales] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaleOpen, setIsSaleOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      const partnerRes = await getCurrentPartnerProfileDetails();
      if (!isMounted) return;
      if (partnerRes.data) {
        setPartner(partnerRes.data);
        const salesCount = await getPartnerTodayBottleSales(partnerRes.data.id);
        if (!isMounted) return;
        setTodayBottleSales(salesCount);
      } else {
        const salesCount = await getPartnerTodayBottleSales();
        if (!isMounted) return;
        setTodayBottleSales(salesCount);
      }
      setLoading(false);
    }

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaleSuccess = async () => {
    // Refresh today's bottle sales count
    if (partner?.id) {
      const salesCount = await getPartnerTodayBottleSales(partner.id);
      setTodayBottleSales(salesCount);
    } else {
      const salesCount = await getPartnerTodayBottleSales();
      setTodayBottleSales(salesCount);
    }
  };

  const partnerDisplayName = partner?.name || 'Partner';

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Header */}
      <PartnerHeader />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg sm:max-w-2xl mx-auto px-4 py-6 sm:py-8 pb-28 space-y-6">
        {/* Welcome Greeting: Hello {partner name} */}
        <div className="card-base p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Partner Portal
            </span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-5 h-5 anim-spin text-[var(--color-secondary)]" />
              <span className="text-sm text-[var(--color-text-muted)]">Loading partner profile...</span>
            </div>
          ) : (
            <div>
              <h1 className="page-title text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Hello, {partnerDisplayName}
              </h1>
              {partner?.partner_id && (
                <span className="inline-block mt-2 font-mono text-xs px-2.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
                  {partner.partner_id}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Total Bottles sale (today count) */}
        <div className="card-base p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="label-text text-sm font-semibold">
                Total Bottles Sale (Today)
              </span>
              <div
                className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                }}
              >
                <Package className="w-6 h-6" />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="w-5 h-5 anim-spin text-[var(--color-secondary)]" />
                <span className="text-xs text-[var(--color-text-muted)]">Loading bottle sales...</span>
              </div>
            ) : (
              <div>
                <p className="stat-value text-4xl font-bold font-mono" style={{ color: 'var(--color-primary)' }}>
                  {todayBottleSales.toLocaleString()}
                </p>
                <p className="small-text mt-1 text-[var(--color-text-muted)]">
                  Total bottle units sold and recorded today
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t flex items-center justify-between border-[var(--color-border-subtle)]">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Units logged from partner point transactions
            </span>
            <button
              type="button"
              onClick={() => setIsSaleOpen(true)}
              className="btn-base btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-xs"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Record Sale</span>
            </button>
          </div>
        </div>

        {/* Sale Card Modal */}
        <SaleCard
          isOpen={isSaleOpen}
          onClose={() => setIsSaleOpen(false)}
          onSaleSuccess={handleSaleSuccess}
        />
      </main>

      {/* Bottom navigation */}
      <PartnerBottomNavigation />
    </div>
  );
}
