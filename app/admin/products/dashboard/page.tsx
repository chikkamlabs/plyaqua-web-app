'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import SizesModal from '@/components/admin/sizes';
import AddProduct from '@/components/admin/addproduct';
import OpenProduct from '@/components/admin/openproduct';
import {
  getProducts,
  getSizes,
  Product,
  ProductSize,
} from '@/lib/productsStore';
import {
  Package,
  Search,
  Plus,
  ExternalLink,
  Ruler,
  Layers,
  Filter,
  Loader2,
  ChevronDown,
} from 'lucide-react';

export default function ProductsDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('all');

  // Modals state
  const [isSizesOpen, setIsSizesOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOpenProductOpen, setIsOpenProductOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const [productsRes, sizesRes] = await Promise.all([
        getProducts(),
        getSizes(),
      ]);

      if (!active) return;

      if (productsRes.data) {
        setProducts(productsRes.data);
      }
      if (sizesRes.data) {
        setSizes(sizesRes.data);
      }
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // Filtered products based on search bar (prod_id, name) and size filter
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.prod_id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q);

      const matchesSize =
        selectedSizeFilter === 'all' || p.size === selectedSizeFilter;

      return matchesSearch && matchesSize;
    });
  }, [products, searchQuery, selectedSizeFilter]);

  const handleProductCreated = (newProd: Product) => {
    setProducts((prev) => [...prev, newProd]);
    setIsAddProductOpen(false);
  };

  const handleProductUpdated = (updatedProd: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
    );
    setIsOpenProductOpen(false);
    setSelectedProduct(null);
  };

  const handleSizesChanged = (updatedSizes: ProductSize[]) => {
    setSizes(updatedSizes);
    // Reload products to refresh size_value display
    getProducts().then(({ data }) => {
      if (data) setProducts(data);
    });
  };

  const handleOpenProduct = (p: Product) => {
    setSelectedProduct(p);
    setIsOpenProductOpen(true);
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
          {/* Top Page Heading & Global Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Package
                  className="w-5 h-5"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Inventory Catalog
                </span>
              </div>
              <h1 className="page-title text-2xl font-bold">
                Products
              </h1>
            </div>

            {/* Action Buttons: Sizes Modal & Add Product */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setIsSizesOpen(true)}
                className="btn-base btn-outline shadow-xs text-xs sm:text-sm"
              >
                <Ruler className="w-4 h-4 text-[var(--color-secondary)]" />
                <span>Sizes ({sizes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="btn-base btn-primary shadow-xs text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Stats Cards: Total Products (count) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Total Products</p>
                  <p className="stat-value mt-1">{products.length}</p>
                </div>
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
            </div>

            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Active In Catalog</p>
                  <p
                    className="stat-value mt-1"
                    style={{ color: 'var(--color-success)' }}
                  >
                    {products.filter((p) => p.status === 'active').length}
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
                  <p className="label-text">Packaging Sizes</p>
                  <p
                    className="stat-value mt-1"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    {sizes.length}
                  </p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-secondary-light)',
                    color: 'var(--color-secondary)',
                  }}
                >
                  <Layers className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar & Size Filters & Table Card */}
          <div className="card-base">
            <div
              className="p-4 sm:p-5 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
                {/* Search Bar (prod_id, name) */}
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
                    placeholder="Search by Product ID (prod_id) or Name..."
                    className="input-base"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>

                {/* Filters (Sizes) */}
                <div className="relative w-full sm:w-48">
                  <div className="relative flex items-center">
                    <div
                      className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <Filter className="w-3.5 h-3.5" />
                    </div>
                    <select
                      value={selectedSizeFilter}
                      onChange={(e) => setSelectedSizeFilter(e.target.value)}
                      className="select-base text-xs"
                      style={{ paddingLeft: '2rem' }}
                    >
                      <option value="all">All Sizes</option>
                      {sizes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Showing {filteredProducts.length} of {products.length} products
              </div>
            </div>

            {/* List of Products (prod_id, Name, Size, mrp, sp, qty, open button) */}
            <div className="table-container border-0 rounded-none shadow-none">
              <table className="table-base">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Product ID</th>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Size</th>
                    <th className="table-header-cell">MRP</th>
                    <th className="table-header-cell">SP</th>
                    <th className="table-header-cell">Qty</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2
                            className="w-6 h-6 anim-spin"
                            style={{ color: 'var(--color-secondary)' }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            Loading products catalog...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package
                            className="w-8 h-8"
                            style={{ color: 'var(--color-border-strong)' }}
                          />
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            No products found
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {searchQuery || selectedSizeFilter !== 'all'
                              ? 'Try adjusting your search query or size filter'
                              : 'Click "Add Product" to add your first beverage item'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => (
                      <tr key={prod.id} className="table-row">
                        {/* prod_id */}
                        <td className="table-cell font-mono font-medium text-xs">
                          <span
                            className="px-2 py-1 rounded-[var(--radius-sm)]"
                            style={{
                              backgroundColor: 'var(--color-surface-muted)',
                              color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-border-subtle)',
                            }}
                          >
                            {prod.prod_id}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="table-cell font-medium">
                          <span style={{ color: 'var(--color-text-primary)' }}>
                            {prod.name}
                          </span>
                        </td>

                        {/* Size */}
                        <td className="table-cell">
                          <span className="badge-base badge-secondary text-xs">
                            {prod.size_value || '—'}
                          </span>
                        </td>

                        {/* mrp */}
                        <td className="table-cell text-xs font-mono text-[var(--color-text-secondary)]">
                          ${prod.mrp.toFixed(2)}
                        </td>

                        {/* sp */}
                        <td className="table-cell text-xs font-mono font-semibold text-[var(--color-primary)]">
                          ${prod.sp.toFixed(2)}
                        </td>

                        {/* qty */}
                        <td className="table-cell font-medium text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-[var(--radius-sm)] ${
                              prod.qty > 0
                                ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                                : 'bg-[var(--color-danger-light)] text-[var(--color-danger-text)]'
                            }`}
                          >
                            {prod.qty.toLocaleString()} in stock
                          </span>
                        </td>

                        {/* Status */}
                        <td className="table-cell">
                          {prod.status === 'active' ? (
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
                            onClick={() => handleOpenProduct(prod)}
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

      {/* Sizes Management Modal */}
      <SizesModal
        isOpen={isSizesOpen}
        onClose={() => setIsSizesOpen(false)}
        onSizesChanged={handleSizesChanged}
      />

      {/* Add Product Modal */}
      <AddProduct
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        currentCount={products.length}
        onProductCreated={handleProductCreated}
      />

      {/* Open Product Details Modal */}
      <OpenProduct
        isOpen={isOpenProductOpen}
        product={selectedProduct}
        onClose={() => {
          setIsOpenProductOpen(false);
          setSelectedProduct(null);
        }}
        onProductUpdated={handleProductUpdated}
      />
    </div>
  );
}
