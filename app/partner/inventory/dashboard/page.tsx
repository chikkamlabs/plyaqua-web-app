'use client';

import React from 'react';
import Link from 'next/link';
import PartnerHeader from '@/components/partner/header';
import PartnerBottomNavigation from '@/components/partner/bottomnavigation';
import {
  Boxes,
  Award,
  Receipt,
  CreditCard,
  ChevronRight,
} from 'lucide-react';

export default function PartnerInventoryDashboardPage() {
  const inventoryModules = [
    {
      title: 'Stock',
      description: 'Monitor partner product inventory and total bottle counts',
      icon: Boxes,
      href: '/partner/inventory/stock',
      isClickable: true,
      tag: 'Active',
      badgeColor: 'var(--color-primary-light)',
      iconColor: 'var(--color-primary)',
    },
    {
      title: 'Points',
      description: 'Partner points ledger and reward allocations',
      icon: Award,
      href: '/partner/points',
      isClickable: true,
      tag: 'Rewards',
      badgeColor: 'var(--color-secondary-light)',
      iconColor: 'var(--color-secondary)',
    },
    {
      title: 'Purchases',
      description: 'Review purchase orders, quantities & invoice statuses',
      icon: Receipt,
      href: '/partner/inventory/purchases',
      isClickable: true,
      tag: 'Active',
      badgeColor: 'var(--color-secondary-light)',
      iconColor: 'var(--color-secondary)',
    },
    {
      title: 'Payments',
      description: 'Payment settlements and financial transaction records',
      icon: CreditCard,
      href: '/partner/payments',
      isClickable: true,
      tag: 'Ledger',
      badgeColor: 'var(--color-primary-light)',
      iconColor: 'var(--color-primary)',
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Header attached at top */}
      <PartnerHeader />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-lg sm:max-w-3xl mx-auto px-4 py-6 sm:py-8 pb-28">
        <div className="mb-6">
          <h1
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Inventory Hub
          </h1>
          <p
            className="text-xs sm:text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Manage stock, points, purchases, and payments
          </p>
        </div>

        {/* 4 Items Grid: Stock Check, Points, Purchases, Payments */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {inventoryModules.map((item) => {
            const Icon = item.icon;

            const cardInner = (
              <div
                className={`card-base p-5 flex flex-col justify-between h-full transition-all rounded-[var(--radius-lg)] border ${
                  item.isClickable ? 'card-interactive' : 'opacity-90'
                }`}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className="w-11 h-11 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 shadow-xs"
                    style={{
                      backgroundColor: item.badgeColor,
                      color: item.iconColor,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] uppercase tracking-wider"
                    style={{
                      backgroundColor: item.badgeColor,
                      color: item.iconColor,
                    }}
                  >
                    {item.tag}
                  </span>
                </div>

                <div>
                  <h2
                    className="text-base sm:text-lg font-bold tracking-tight mb-1"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {item.title}
                  </h2>
                  <p
                    className="text-xs sm:text-sm leading-relaxed"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {item.description}
                  </p>
                </div>

                <div
                  className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold"
                  style={{
                    borderColor: 'var(--color-border-subtle)',
                    color: item.isClickable ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                  }}
                >
                  <span>{item.isClickable ? 'Open Module' : 'Inventory Feature'}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );

            if (item.isClickable) {
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="focus:outline-none block"
                  aria-label={`Open ${item.title}`}
                >
                  {cardInner}
                </Link>
              );
            }

            return (
              <div key={item.title} className="block">
                {cardInner}
              </div>
            );
          })}
        </div>
      </main>

      {/* Bottom navigation attached at bottom */}
      <PartnerBottomNavigation />
    </div>
  );
}
