'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Store, User } from 'lucide-react';

export default function PartnerBottomNavigation() {
  const pathname = usePathname();

  const isHomeActive = pathname === '/partner/dashboard' || pathname === '/partner';
  const isInventoryActive = pathname.startsWith('/partner/inventory');
  const isProfileActive = pathname.startsWith('/partner/profile');

  const navItems = [
    {
      label: 'Home',
      href: '/partner/dashboard',
      icon: Home,
      isActive: isHomeActive,
    },
    {
      label: 'Inventory',
      href: '/partner/inventory',
      icon: Store,
      isActive: isInventoryActive,
    },
    {
      label: 'Profile',
      href: '/partner/profile',
      icon: User,
      isActive: isProfileActive,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t transition-colors"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 -2px 10px rgba(11, 37, 58, 0.05)',
      }}
      aria-label="Partner navigation"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-[var(--radius-md)] transition-all group focus:outline-none"
              style={{
                color: active ? 'var(--color-secondary)' : 'var(--color-text-muted)',
              }}
            >
              <div
                className="p-1 rounded-[var(--radius-full)] transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: active ? 'var(--color-secondary-light)' : 'transparent',
                }}
              >
                <Icon
                  className="w-5 h-5 transition-colors"
                  style={{
                    color: active ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                  }}
                />
              </div>
              <span
                className="text-[11px] font-medium tracking-tight mt-0.5"
                style={{
                  fontWeight: active ? 600 : 500,
                  color: active ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
