'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import AddSubscriptionPlan from '@/components/admin/addsubscripitonplans';
import OpenSubscriptionPlan from '@/components/admin/opensubscriptionplan';
import {
  getSubscriptionPlans,
  SubscriptionPlan,
} from '@/lib/subscriptionplansStore';
import {
  CreditCard,
  Search,
  Plus,
  ExternalLink,
  Loader2,
} from 'lucide-react';

export default function SubscriptionPlansDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const { data } = await getSubscriptionPlans();
      if (!active) return;
      if (data) {
        setPlans(data);
      }
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // Search bar filtering by name
  const filteredPlans = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return plans;

    return plans.filter((p) => p.name.toLowerCase().includes(q));
  }, [plans, searchQuery]);

  const handlePlanCreated = (newPlan: SubscriptionPlan) => {
    setPlans((prev) => [newPlan, ...prev]);
    setIsAddOpen(false);
  };

  const handlePlanUpdated = (updatedPlan: SubscriptionPlan) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );
    setIsOpenModalOpen(false);
    setSelectedPlan(null);
  };

  const handleOpenPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
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
                <CreditCard
                  className="w-5 h-5"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Subscriptions
                </span>
              </div>
              <h1 className="page-title text-2xl font-bold">
                Subscription Plans
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="btn-base btn-primary shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subscription Plan</span>
            </button>
          </div>

          {/* Total Plans (Count) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">Total Plans</p>
                  <p className="stat-value mt-1">{plans.length}</p>
                </div>
                <div
                  className="p-3 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar & Subscription Plans Table */}
          <div className="card-base">
            <div
              className="p-4 sm:p-5 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              {/* Search bar (name) */}
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
                  placeholder="Search by plan name..."
                  className="input-base"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>

              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Showing {filteredPlans.length} of {plans.length} plans
              </div>
            </div>

            {/* List of Subscription Plans */}
            <div className="table-container border-0 rounded-none shadow-none">
              <table className="table-base">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">S.No</th>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Price</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2
                            className="w-6 h-6 anim-spin"
                            style={{ color: 'var(--color-secondary)' }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            Loading subscription plans...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPlans.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CreditCard
                            className="w-8 h-8"
                            style={{ color: 'var(--color-border-strong)' }}
                          />
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            No subscription plans found
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {searchQuery
                              ? 'Try adjusting your search query'
                              : 'Click "Add Subscription Plan" to create your first plan'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPlans.map((plan, index) => (
                      <tr key={plan.id} className="table-row">
                        <td className="table-cell font-mono text-xs text-[var(--color-text-secondary)]">
                          {index + 1}
                        </td>

                        <td className="table-cell font-semibold">
                          <span style={{ color: 'var(--color-text-primary)' }}>
                            {plan.name}
                          </span>
                        </td>

                        <td className="table-cell text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--color-primary)]">
                              ₹{plan.selling_price.toFixed(2)}
                            </span>
                            {plan.actual_price > plan.selling_price && (
                              <span className="line-through text-[var(--color-text-muted)]">
                                ₹{plan.actual_price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="table-cell">
                          {plan.status === 'active' ? (
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
                            onClick={() => handleOpenPlan(plan)}
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

      {/* Add Subscription Plan Modal */}
      {isAddOpen && (
        <AddSubscriptionPlan
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onPlanCreated={handlePlanCreated}
        />
      )}

      {/* Open Subscription Plan Modal */}
      <OpenSubscriptionPlan
        isOpen={isOpenModalOpen}
        plan={selectedPlan}
        onClose={() => {
          setIsOpenModalOpen(false);
          setSelectedPlan(null);
        }}
        onPlanUpdated={handlePlanUpdated}
      />
    </div>
  );
}
