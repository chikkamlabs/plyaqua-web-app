'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import { getCustomers, Customer } from '@/lib/customersStore';
import {
  UserCheck,
  Search,
  ExternalLink,
  Coins,
  DollarSign,
  Loader2,
  Users,
} from 'lucide-react';

export default function CustomersDashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCustomers() {
      const { data } = await getCustomers();
      if (!active) return;
      if (data) {
        setCustomers(data);
      }
      setLoading(false);
    }

    loadCustomers();

    return () => {
      active = false;
    };
  }, []);

  // Filtered list based on Search bar (customer mobile, name)
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;

    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <UserCheck
                  className="w-5 h-5"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Customer Directory
                </span>
              </div>
              <h1 className="page-title text-2xl font-bold">
                Customers
              </h1>
            </div>
          </div>

          {/* Stats: Total Customers (count) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Total Customers</p>
                  <p className="stat-value mt-1">{customers.length}</p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Total Available Points</p>
                  <p
                    className="stat-value mt-1 text-lg font-bold"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    {customers.reduce((sum, c) => sum + (c.available_points || 0), 0).toLocaleString()} pts
                  </p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-secondary-light)',
                    color: 'var(--color-secondary)',
                  }}
                >
                  <Coins className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Total Cashback Distributed</p>
                  <p
                    className="stat-value mt-1 text-lg font-bold"
                    style={{ color: 'var(--color-success)' }}
                  >
                    ${customers.reduce((sum, c) => sum + (c.total_cashback || 0), 0).toFixed(2)}
                  </p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-success-light)',
                    color: 'var(--color-success-text)',
                  }}
                >
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar & Table Card */}
          <div className="card-base">
            {/* Search Bar (customer mobile, name) */}
            <div
              className="p-4 sm:p-5 border-b flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              <div className="relative w-full sm:max-w-md">
                <div
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by customer mobile or name..."
                  className="input-base"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>

              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Showing {filteredCustomers.length} of {customers.length} customers
              </div>
            </div>

            {/* List of Customers (Name, mobile, available_points, open button) */}
            <div className="table-container border-0 rounded-none shadow-none">
              <table className="table-base">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Mobile</th>
                    <th className="table-header-cell">Available Points</th>
                    <th className="table-header-cell text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2
                            className="w-6 h-6 anim-spin"
                            style={{ color: 'var(--color-secondary)' }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            Loading customers...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <UserCheck
                            className="w-8 h-8"
                            style={{ color: 'var(--color-border-strong)' }}
                          />
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            No customers found
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {searchQuery
                              ? 'Try adjusting your search query'
                              : 'Registered customer accounts will appear here'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="table-row">
                        {/* Name */}
                        <td className="table-cell font-medium">
                          <span style={{ color: 'var(--color-text-primary)' }}>
                            {cust.name}
                          </span>
                        </td>

                        {/* Mobile */}
                        <td className="table-cell font-mono text-xs">
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            {cust.mobile}
                          </span>
                        </td>

                        {/* Available Points */}
                        <td className="table-cell font-medium">
                          <span
                            className="px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-semibold"
                            style={{
                              backgroundColor: 'var(--color-secondary-light)',
                              color: 'var(--color-secondary)',
                            }}
                          >
                            {cust.available_points.toLocaleString()} pts
                          </span>
                        </td>

                        {/* Open Button - calls app/admin/opencustomer/page.tsx */}
                        <td className="table-cell text-right">
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/customers/opencustomer?id=${cust.id}`)}
                            className="btn-base btn-outline text-xs py-1.5 px-3"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
