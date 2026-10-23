'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Receipt,
  UserCheck,
  Package,
  Megaphone,
  FolderTree,
  Coins,
  Gamepad2,
  History,
  CircleDollarSign,
  Sparkles,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const navigationItems = [
    { name: 'Home', href: '/admin/dashboard', icon: Home },
    { name: 'Partners', href: '/admin/partners', icon: Users },
    { name: 'Bills', href: '/admin/bills', icon: Receipt },
    { name: 'Customers', href: '/admin/customers', icon: UserCheck },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Points Session', href: '/admin/pointssession', icon: History },
    { name: 'Ads Content', href: '/admin/adv-content', icon: Megaphone },
    { name: 'Marketing campaigns', href: '/admin/campaigns', icon: Sparkles },
    { name: 'Cashback sessions', href: '/admin/cashbacksessions', icon: CircleDollarSign },
    { name: 'partner categories', href: '/admin/partnercategories', icon: FolderTree },
    { name: 'customer points', href: '/admin/customer-points', icon: Coins },
    { name: 'Game Play', href: '/admin/gameplay', icon: Gamepad2 },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden transition-opacity"
          style={{ backgroundColor: 'rgba(11, 37, 58, 0.45)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Mobile Header with Close button */}
        <div
          className="flex items-center justify-between p-4 border-b lg:hidden"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Admin Navigation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === '/admin/partnercategories' &&
                (pathname === '/admin/partnercategories' || pathname?.startsWith('/admin/partnercategories'))) ||
              (item.href === '/admin/partners' &&
                (pathname === '/admin/partners' || pathname?.startsWith('/admin/partners'))) ||
              (item.href === '/admin/customers' &&
                (pathname === '/admin/customers' || pathname?.startsWith('/admin/customers'))) ||
              (item.href === '/admin/products' &&
                (pathname === '/admin/products' || pathname?.startsWith('/admin/products'))) ||
              (item.href === '/admin/bills' &&
                (pathname === '/admin/bills' || pathname?.startsWith('/admin/bills'))) ||
              (item.href === '/admin/gameplay' &&
                (pathname === '/admin/gameplay' || pathname?.startsWith('/admin/gameplay'))) ||
              (item.href === '/admin/pointssession' &&
                (pathname === '/admin/pointssession' || pathname === '/admin/pointsSessions' || pathname?.startsWith('/admin/pointsSession'))) ||
              (item.href === '/admin/campaigns' &&
                (pathname === '/admin/campaigns' || pathname?.startsWith('/admin/campaigns'))) ||
              (item.href === '/admin/cashbacksessions' &&
                (pathname === '/admin/cashbacksessions' || pathname?.startsWith('/admin/cashbacksessions'))) ||
              (item.href === '/admin/adv-content' &&
                (pathname === '/admin/adv-content' || pathname?.startsWith('/admin/adv-content')));

            return (
              <a
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
                  isActive ? 'font-semibold' : ''
                }`}
                style={{
                  backgroundColor: isActive
                    ? 'var(--color-secondary-light)'
                    : 'transparent',
                  color: isActive
                    ? 'var(--color-secondary)'
                    : 'var(--color-text-secondary)',
                }}
              >
                <Icon
                  className="w-5 h-5 flex-shrink-0"
                  style={{
                    color: isActive
                      ? 'var(--color-secondary)'
                      : 'var(--color-text-muted)',
                  }}
                />
                <span className="capitalize">{item.name}</span>
              </a>
            );
          })}
        </div>
      </aside>
    </>
  );
}
