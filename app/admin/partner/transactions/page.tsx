'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import { getPartnerById, Partner } from '@/lib/partnersStore';
import { getPartnerTransactions, PartnerTransaction } from '@/lib/paymentsStore';
import {
  ArrowLeft,
  Receipt,
  Store,
  CreditCard,
  Loader2,
  Search,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Wallet,
} from 'lucide-react';

function PartnerTransactionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerId = searchParams?.get('partnerId') || searchParams?.get('partner_id') || searchParams?.get('id') || '';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!partnerId) {
        setLoading(false);
        setErrorMsg('No partner specified. Please navigate from the Partners Directory.');
        return;
      }

      setLoading(true);
      setErrorMsg(null);

      try {
        const [partnerRes, txRes] = await Promise.all([
          getPartnerById(partnerId),
          getPartnerTransactions({ partnerId }),
        ]);

        if (!active) return;

        if (partnerRes.data) {
          setPartner(partnerRes.data);
        } else if (partnerRes.error) {
          setErrorMsg(partnerRes.error.message);
        }

        if (txRes.data) {
          setTransactions(txRes.data);
        }
      } catch (err) {
        if (active) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load partner transactions');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [partnerId]);

  const filteredTransactions = transactions.filter((tx) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (tx.bill_number && tx.bill_number.toLowerCase().includes(q)) ||
      (tx.bill_id && tx.bill_id.toLowerCase().includes(q)) ||
      (tx.notes && tx.notes.toLowerCase().includes(q)) ||
      (tx.method && tx.method.toLowerCase().includes(q)) ||
      (tx.type && tx.type.toLowerCase().includes(q))
    );
  });

  // Calculate current credit from partner or latest transaction balance
  const currentCredit = partner?.credit_amount !== undefined
    ? Number(partner.credit_amount)
    : transactions.length > 0
    ? Number(transactions[0].balance)
    : 0;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top navigation bar */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/partners/dashboard')}
              className="btn-base btn-outline text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Partners</span>
            </button>

            {partner && (
              <button
                type="button"
                onClick={() => router.push(`/admin/partner/stock?partnerId=${partner.id}`)}
                className="btn-base btn-secondary text-xs"
              >
                <span>View Stock Inventory</span>
              </button>
            )}
          </div>

          {/* Partner Header & Credit Balance Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Partner Details */}
            <div className="card-base p-6 md:col-span-2">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Store className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="page-title text-xl font-bold">
                      {partner ? partner.name : 'Partner Transactions Ledger'}
                    </h1>
                    {partner && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
                        {partner.partner_id}
                      </span>
                    )}
                  </div>
                  <p className="body-text text-xs mt-1">
                    {partner?.partner_category_name || 'Standard Partner'} • {partner?.mobile || 'No mobile'} • {partner?.email || 'No email'}
                  </p>
                  <p className="small-text mt-2 text-[var(--color-text-muted)]">
                    {partner?.address || 'No address registered'}
                  </p>
                </div>
              </div>
            </div>

            {/* Partner Current Credit: partner_profile.credit / credit_amount */}
            <div
              className="card-base p-6 flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border-strong)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="label-text">Current Credit (partner_profile.credit)</span>
                <div
                  className="p-2.5 rounded-[var(--radius-md)]"
                  style={{
                    backgroundColor: 'var(--color-secondary-light)',
                    color: 'var(--color-secondary)',
                  }}
                >
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="stat-value text-2xl font-bold font-mono" style={{ color: 'var(--color-primary)' }}>
                  ${currentCredit.toFixed(2)}
                </p>
                <p className="small-text mt-1 text-[var(--color-text-muted)]">
                  Outstanding account ledger balance
                </p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div
              className="p-4 rounded-[var(--radius-md)] flex items-center gap-3 text-xs border"
              style={{
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger-text)',
                borderColor: 'var(--color-danger-border)',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Transactions List Table Card */}
          <div className="card-base">
            <div
              className="p-4 sm:p-5 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[var(--color-secondary)]" />
                <h2 className="section-title text-base font-semibold">
                  Partner Transactions Ledger (partner_transactions)
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <div
                  className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by bill, note, or method..."
                  className="input-base text-xs"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            <div className="table-container border-0 rounded-none shadow-none">
              <table className="table-base">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Payment Date</th>
                    <th className="table-header-cell">Type</th>
                    <th className="table-header-cell">Bill ID</th>
                    <th className="table-header-cell">Method</th>
                    <th className="table-header-cell text-right">Amount</th>
                    <th className="table-header-cell text-right">Balance</th>
                    <th className="table-header-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 anim-spin text-[var(--color-secondary)]" />
                          <span className="text-xs text-[var(--color-text-muted)]">
                            Loading financial transactions from partner_transactions...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-cell text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CreditCard className="w-8 h-8 text-[var(--color-border-strong)]" />
                          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                            No financial transactions found
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Transactions will appear here when invoices are accepted or payments are settled.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isAdd = tx.type === 'add';
                      return (
                        <tr key={tx.id} className="table-row">
                          {/* Payment Date */}
                          <td className="table-cell text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {tx.payment_date
                                  ? new Date(tx.payment_date).toLocaleDateString(undefined, {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })
                                  : '—'}
                              </span>
                            </div>
                            <span className="text-[10px] text-[var(--color-text-muted)] block pl-5">
                              {tx.payment_date
                                ? new Date(tx.payment_date).toLocaleTimeString(undefined, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </td>

                          {/* Type */}
                          <td className="table-cell">
                            {isAdd ? (
                              <span
                                className="badge-base text-xs font-semibold"
                                style={{
                                  backgroundColor: 'var(--color-danger-light)',
                                  color: 'var(--color-danger-text)',
                                  border: '1px solid var(--color-danger-border)',
                                }}
                              >
                                <ArrowUpRight className="w-3 h-3" />
                                <span>ADD (Debit)</span>
                              </span>
                            ) : (
                              <span
                                className="badge-base text-xs font-semibold"
                                style={{
                                  backgroundColor: 'var(--color-success-light)',
                                  color: 'var(--color-success-text)',
                                  border: '1px solid var(--color-success-border)',
                                }}
                              >
                                <ArrowDownLeft className="w-3 h-3" />
                                <span>SUB (Credit)</span>
                              </span>
                            )}
                          </td>

                          {/* Bill ID */}
                          <td className="table-cell font-mono text-xs">
                            {tx.bill_number || tx.bill_id ? (
                              <span
                                className="px-2 py-0.5 rounded-[var(--radius-sm)]"
                                style={{
                                  backgroundColor: 'var(--color-surface-muted)',
                                  color: 'var(--color-text-primary)',
                                  border: '1px solid var(--color-border-subtle)',
                                }}
                              >
                                {tx.bill_number || tx.bill_id}
                              </span>
                            ) : (
                              <span className="text-[var(--color-text-muted)]">—</span>
                            )}
                          </td>

                          {/* Method */}
                          <td className="table-cell">
                            <span className="badge-base badge-primary text-xs uppercase font-mono">
                              {tx.method}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="table-cell text-right font-mono font-bold text-sm">
                            <span
                              style={{
                                color: isAdd ? 'var(--color-danger-text)' : 'var(--color-success-text)',
                              }}
                            >
                              {isAdd ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                            </span>
                          </td>

                          {/* Balance */}
                          <td className="table-cell text-right font-mono font-semibold text-sm">
                            <span style={{ color: 'var(--color-primary)' }}>
                              ${Number(tx.balance).toFixed(2)}
                            </span>
                          </td>

                          {/* Notes */}
                          <td className="table-cell text-xs max-w-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                            {tx.notes || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div
              className="p-4 border-t flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                borderColor: 'var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span>
                Showing {filteredTransactions.length} transaction record(s)
              </span>
              <span className="font-medium">
                Closing Ledger Balance:{' '}
                <strong className="font-mono text-[var(--color-primary)]">
                  ${currentCredit.toFixed(2)}
                </strong>
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminPartnerTransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
          <Loader2 className="w-8 h-8 anim-spin text-[var(--color-secondary)]" />
        </div>
      }
    >
      <PartnerTransactionsContent />
    </Suspense>
  );
}
