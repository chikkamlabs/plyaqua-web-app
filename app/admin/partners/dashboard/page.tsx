'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import AddPartner from '@/components/admin/addpartner';
import { getPartners, Partner } from '@/lib/partnersStore';
import { getPartnerCategories, PartnerCategory } from '@/lib/partnercategories';
import {
  Users,
  Search,
  UserPlus,
  ExternalLink,
  Store,
  Loader2,
  Coins,
  Filter,
  ChevronDown,
  Check,
  Package,
  Receipt,
} from 'lucide-react';

export default function PartnersDashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [categories, setCategories] = useState<PartnerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Category filter state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filterCategorySearch, setFilterCategorySearch] = useState('');

  // Add Partner Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      const [partnersRes, categoriesRes] = await Promise.all([
        getPartners(),
        getPartnerCategories(),
      ]);

      if (!active) return;

      if (partnersRes.data) {
        setPartners(partnersRes.data);
      }
      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      setLoading(false);
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  // Filtered categories for the filter dropdown
  const filteredCategoryOptions = useMemo(() => {
    const q = filterCategorySearch.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.p_cat_id.toLowerCase().includes(q)
    );
  }, [categories, filterCategorySearch]);

  // Filtered partners based on search bar (partner_id, name) and category filter
  const filteredPartners = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return partners.filter((p) => {
      const matchesSearch =
        !q ||
        p.partner_id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategoryFilter === 'all' ||
        p.partner_category === selectedCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [partners, searchQuery, selectedCategoryFilter]);

  const handlePartnerCreated = (newPartner: Partner) => {
    setPartners((prev) => [...prev, newPartner]);
    setIsAddOpen(false);
  };

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategoryFilter);

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
                <Users
                  className="w-5 h-5"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Partner Management
                </span>
              </div>
              <h1 className="page-title text-2xl font-bold">
                Partners Directory
              </h1>
            </div>

            {/* Add Partner Button */}
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="btn-base btn-primary shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Partner</span>
            </button>
          </div>

          {/* Stats: Total Partners (count) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Total Partners</p>
                  <p className="stat-value mt-1">{partners.length}</p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Store className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Active Partners</p>
                  <p
                    className="stat-value mt-1"
                    style={{ color: 'var(--color-success)' }}
                  >
                    {partners.filter((p) => p.status === 'active').length}
                  </p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-success-light)',
                    color: 'var(--color-success-text)',
                  }}
                >
                  <span className="status-chip status-chip-active">Active</span>
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
                    {partners.reduce((sum, p) => sum + (p.available_points || 0), 0).toLocaleString()} pts
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
          </div>

          {/* Search Bar, Category Filter & Table Card */}
          <div className="card-base">
            <div
              className="p-4 sm:p-5 border-b flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              {/* Search bar and Category filter in row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
                {/* Search Bar (partner_id, name) */}
                <div className="relative flex-1">
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
                    placeholder="Search by Partner ID (partner_id) or Name..."
                    className="input-base"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>

                {/* Filter by Partner categories (Search and select) */}
                <div className="relative w-full sm:w-64">
                  <div
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="input-base cursor-pointer flex items-center justify-between text-xs"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        {selectedCategoryFilter === 'all'
                          ? 'All Partner Categories'
                          : selectedCategoryObj
                          ? `${selectedCategoryObj.name}`
                          : 'Filtered Category'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </div>

                  {isFilterDropdownOpen && (
                    <div
                      className="absolute z-30 mt-1 w-full sm:w-72 border rounded-[var(--radius-md)] shadow-lg"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      {/* Search within Category Filter */}
                      <div
                        className="p-2 border-b flex items-center gap-2"
                        style={{ borderColor: 'var(--color-border-subtle)' }}
                      >
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={filterCategorySearch}
                          onChange={(e) => setFilterCategorySearch(e.target.value)}
                          placeholder="Search categories..."
                          className="w-full text-xs outline-none bg-transparent"
                          autoFocus
                        />
                      </div>

                      {/* Options */}
                      <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                        <div
                          onClick={() => {
                            setSelectedCategoryFilter('all');
                            setIsFilterDropdownOpen(false);
                            setFilterCategorySearch('');
                          }}
                          className="flex items-center justify-between p-2 rounded text-xs cursor-pointer hover:bg-[var(--color-surface-hover)]"
                          style={{
                            color: selectedCategoryFilter === 'all'
                              ? 'var(--color-secondary)'
                              : 'var(--color-text-primary)',
                            fontWeight: selectedCategoryFilter === 'all' ? 600 : 400,
                          }}
                        >
                          <span>All Partner Categories</span>
                          {selectedCategoryFilter === 'all' && (
                            <Check className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                          )}
                        </div>

                        {filteredCategoryOptions.map((cat) => (
                          <div
                            key={cat.id}
                            onClick={() => {
                              setSelectedCategoryFilter(cat.id);
                              setIsFilterDropdownOpen(false);
                              setFilterCategorySearch('');
                            }}
                            className="flex items-center justify-between p-2 rounded text-xs cursor-pointer hover:bg-[var(--color-surface-hover)]"
                            style={{
                              color: selectedCategoryFilter === cat.id
                                ? 'var(--color-secondary)'
                                : 'var(--color-text-primary)',
                              fontWeight: selectedCategoryFilter === cat.id ? 600 : 400,
                            }}
                          >
                            <div className="truncate pr-2">
                              <span>{cat.name}</span>
                              <span
                                className="ml-1.5 font-mono text-[10px]"
                                style={{ color: 'var(--color-text-muted)' }}
                              >
                                {cat.p_cat_id}
                              </span>
                            </div>
                            {selectedCategoryFilter === cat.id && (
                              <Check className="w-3.5 h-3.5 text-[var(--color-secondary)] flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Showing {filteredPartners.length} of {partners.length} partners
              </div>
            </div>

            {/* List of Partners Table */}
            <div className="table-container border-0 rounded-none shadow-none">
              <table className="table-base">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Partner ID</th>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Mobile</th>
                    <th className="table-header-cell">Partner Category</th>
                    <th className="table-header-cell">Available Points</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2
                            className="w-6 h-6 anim-spin"
                            style={{ color: 'var(--color-secondary)' }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            Loading partners directory...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users
                            className="w-8 h-8"
                            style={{ color: 'var(--color-border-strong)' }}
                          />
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            No partners found
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {searchQuery || selectedCategoryFilter !== 'all'
                              ? 'Try adjusting your search criteria or category filter'
                              : 'Click "Add Partner" to onboard your first business partner'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map((partner) => (
                      <tr key={partner.id} className="table-row">
                        {/* partner_id */}
                        <td className="table-cell font-mono font-medium text-xs">
                          <span
                            className="px-2 py-1 rounded-[var(--radius-sm)]"
                            style={{
                              backgroundColor: 'var(--color-surface-muted)',
                              color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-border-subtle)',
                            }}
                          >
                            {partner.partner_id}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="table-cell">
                          <div>
                            <span
                              className="font-semibold block"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {partner.name}
                            </span>
                            <span
                              className="text-xs block"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {partner.email}
                            </span>
                          </div>
                        </td>

                        {/* Mobile */}
                        <td
                          className="table-cell text-xs"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {partner.mobile || '—'}
                        </td>

                        {/* Partner Category */}
                        <td className="table-cell">
                          <span className="badge-base badge-secondary text-xs">
                            {partner.partner_category_name || 'General'}
                          </span>
                        </td>

                        {/* Available Points */}
                        <td className="table-cell font-medium">
                          <span style={{ color: 'var(--color-text-primary)' }}>
                            {partner.available_points.toLocaleString()}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="table-cell">
                          {partner.status === 'active' ? (
                            <span className="status-chip status-chip-active">
                              Active
                            </span>
                          ) : (
                            <span className="status-chip status-chip-inactive">
                              Deactive
                            </span>
                          )}
                        </td>

                        {/* Actions column: Stock, Transactions, Open */}
                        <td className="table-cell text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap sm:flex-nowrap">
                            {/* Stock button */}
                            <button
                              type="button"
                              onClick={() => router.push(`/admin/partner/stock?partnerId=${partner.id}`)}
                              className="btn-base btn-outline text-xs py-1 px-2.5"
                              title="View partner stock inventory"
                            >
                              <Package className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                              <span>Stock</span>
                            </button>

                            {/* Transactions button */}
                            <button
                              type="button"
                              onClick={() => router.push(`/admin/partner/transactions?partnerId=${partner.id}`)}
                              className="btn-base btn-outline text-xs py-1 px-2.5"
                              title="View partner transactions and credit ledger"
                            >
                              <Receipt className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                              <span>Transactions</span>
                            </button>

                            {/* Open button */}
                            <button
                              type="button"
                              onClick={() => router.push(`/admin/partners/openpartner?id=${partner.id}`)}
                              className="btn-base btn-outline text-xs py-1 px-2.5"
                              title="Open partner profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                              <span>Open</span>
                            </button>
                          </div>
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

      {/* Add Partner Modal */}
      {isAddOpen && (
        <AddPartner
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          currentCount={partners.length}
          onPartnerCreated={handlePartnerCreated}
        />
      )}
    </div>
  );
}
