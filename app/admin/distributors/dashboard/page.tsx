'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import AddDistributor from '@/components/admin/adddistributor';
import OpenDistributor from '@/components/admin/opendistributor';
import { getDistributors, Distributor } from '@/lib/distributorsStore';
import {
  Truck,
  Search,
  UserPlus,
  ExternalLink,
  Loader2,
} from 'lucide-react';

export default function DistributorsDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const { data } = await getDistributors();
      if (!active) return;
      if (data) {
        setDistributors(data);
      }
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // Search bar filtering by mobile and name
  const filteredDistributors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return distributors;

    return distributors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.mobile.toLowerCase().includes(q)
    );
  }, [distributors, searchQuery]);

  const handleDistributorCreated = (newDistributor: Distributor) => {
    setDistributors((prev) => [newDistributor, ...prev]);
    setIsAddOpen(false);
  };

  const handleDistributorUpdated = (updated: Distributor) => {
    setDistributors((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
    setIsOpenModalOpen(false);
    setSelectedDistributor(null);
  };

  const handleOpenDistributor = (dist: Distributor) => {
    setSelectedDistributor(dist);
    setIsOpenModalOpen(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Page Heading & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Truck
                  className="w-5 h-5"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Distribution Network
                </span>
              </div>
              <h1 className="page-title text-2xl font-bold">
                Distributors
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="btn-base btn-primary shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Distributor</span>
            </button>
          </div>

          {/* Total Distributors (Count) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Total Distributors</p>
                  <p className="stat-value mt-1">{distributors.length}</p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Truck className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar & Distributors Table */}
          <div className="card-base">
            <div
              className="p-4 sm:p-5 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              {/* Search bar (mobile and name) */}
              <div className="relative flex-1 max-w-md">
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
                  placeholder="Search by Name or Mobile..."
                  className="input-base"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>

              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Showing {filteredDistributors.length} of {distributors.length} distributors
              </div>
            </div>

            {/* List of Distributors */}
            <div className="table-container border-0 rounded-none shadow-none">
              <table className="table-base">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">S.No</th>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Mobile</th>
                    <th className="table-header-cell">City</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2
                            className="w-6 h-6 anim-spin"
                            style={{ color: 'var(--color-secondary)' }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            Loading distributors...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredDistributors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Truck
                            className="w-8 h-8"
                            style={{ color: 'var(--color-border-strong)' }}
                          />
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            No distributors found
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {searchQuery
                              ? 'Try adjusting your search query'
                              : 'Click "Add Distributor" to add your first distributor'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDistributors.map((dist, index) => (
                      <tr key={dist.id} className="table-row">
                        <td className="table-cell font-mono text-xs text-[var(--color-text-secondary)]">
                          {index + 1}
                        </td>

                        <td className="table-cell font-semibold">
                          <span style={{ color: 'var(--color-text-primary)' }}>
                            {dist.name}
                          </span>
                        </td>

                        <td
                          className="table-cell text-xs"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {dist.mobile || '—'}
                        </td>

                        <td
                          className="table-cell text-xs"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {dist.city || '—'}
                        </td>

                        <td className="table-cell">
                          {dist.status === 'active' ? (
                            <span className="status-chip status-chip-active">
                              Active
                            </span>
                          ) : (
                            <span className="status-chip status-chip-inactive">
                              Deactive
                            </span>
                          )}
                        </td>

                        <td className="table-cell text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenDistributor(dist)}
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

      {/* Add Distributor Modal */}
      {isAddOpen && (
        <AddDistributor
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onDistributorCreated={handleDistributorCreated}
        />
      )}

      {/* Open Distributor Modal */}
      <OpenDistributor
        isOpen={isOpenModalOpen}
        distributor={selectedDistributor}
        onClose={() => {
          setIsOpenModalOpen(false);
          setSelectedDistributor(null);
        }}
        onDistributorUpdated={handleDistributorUpdated}
      />
    </div>
  );
}
