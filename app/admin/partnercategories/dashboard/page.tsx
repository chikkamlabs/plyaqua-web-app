'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import AddPartnerCategory from '@/components/admin/addpartnercategory';
import OpenPartnerCategory from '@/components/admin/openpartnercategory';
import {
  getPartnerCategories,
  PartnerCategory,
} from '@/lib/partnercategories';
import {
  Search,
  Plus,
  ExternalLink,
  Layers,
  FolderTree,
  Loader2,
} from 'lucide-react';

export default function PartnerCategoriesDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<PartnerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PartnerCategory | null>(null);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getPartnerCategories().then(({ data }) => {
      if (active) {
        setCategories(data);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Filtered list based on search bar (searches p_cat_id and name)
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;

    return categories.filter(
      (cat) =>
        cat.p_cat_id.toLowerCase().includes(query) ||
        cat.name.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const handleCategoryCreated = (newCat: PartnerCategory) => {
    setCategories((prev) => [...prev, newCat]);
    setIsAddOpen(false);
  };

  const handleCategoryUpdated = (updatedCat: PartnerCategory) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    );
    setIsOpenModalOpen(false);
    setSelectedCategory(null);
  };

  const handleOpenCategory = (cat: PartnerCategory) => {
    setSelectedCategory(cat);
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
          {/* Top Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FolderTree
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
                Partner Categories
              </h1>
            </div>

            {/* Add Partner Category Button */}
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="btn-base btn-primary shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Partner Category</span>
            </button>
          </div>

          {/* Stats: Total categories (count) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Total Categories</p>
                  <p className="stat-value mt-1">{categories.length}</p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Layers className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Active Categories</p>
                  <p
                    className="stat-value mt-1"
                    style={{ color: 'var(--color-success)' }}
                  >
                    {categories.filter((c) => c.status === 'active').length}
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
                  <p className="label-text">Deactive Categories</p>
                  <p
                    className="stat-value mt-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {categories.filter((c) => c.status === 'deactive').length}
                  </p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-surface-muted)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <span className="status-chip status-chip-inactive">Deactive</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar & Table Card */}
          <div className="card-base">
            {/* Search Bar (p_cat_id, name) */}
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
                  placeholder="Search by Category ID (p_cat_id) or Name..."
                  className="input-base"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>

              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Showing {filteredCategories.length} of {categories.length} categories
              </div>
            </div>

            {/* List of Partner Categories */}
            <div className="table-container border-0 rounded-none shadow-none">
              <table className="table-base">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Category ID</th>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Status</th>
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
                            Loading partner categories...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FolderTree
                            className="w-8 h-8"
                            style={{ color: 'var(--color-border-strong)' }}
                          />
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            No partner categories found
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {searchQuery
                              ? 'Try adjusting your search criteria'
                              : 'Click "Add Partner Category" to create your first category'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => (
                      <tr key={cat.id} className="table-row">
                        {/* p_cat_id */}
                        <td className="table-cell font-mono font-medium text-xs">
                          <span
                            className="px-2 py-1 rounded-[var(--radius-sm)]"
                            style={{
                              backgroundColor: 'var(--color-surface-muted)',
                              color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-border-subtle)',
                            }}
                          >
                            {cat.p_cat_id}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="table-cell font-medium">
                          <span style={{ color: 'var(--color-text-primary)' }}>
                            {cat.name}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="table-cell">
                          {cat.status === 'active' ? (
                            <span className="status-chip status-chip-active">
                              Active
                            </span>
                          ) : (
                            <span className="status-chip status-chip-inactive">
                              Deactive
                            </span>
                          )}
                        </td>

                        {/* Open Button */}
                        <td className="table-cell text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenCategory(cat)}
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

      {/* Add Partner Category Modal */}
      {isAddOpen && (
        <AddPartnerCategory
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          currentCount={categories.length}
          onCategoryCreated={handleCategoryCreated}
        />
      )}

      {/* Open Partner Category Modal */}
      {isOpenModalOpen && selectedCategory && (
        <OpenPartnerCategory
          isOpen={isOpenModalOpen}
          category={selectedCategory}
          onClose={() => {
            setIsOpenModalOpen(false);
            setSelectedCategory(null);
          }}
          onCategoryUpdated={handleCategoryUpdated}
        />
      )}
    </div>
  );
}
