'use client';

import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import LaunchCampaign from '@/components/admin/launchcampaign';
import OpenCampaign from '@/components/admin/opencampaign';
import {
  getCampaigns,
  Campaign,
} from '@/lib/campaignsStore';
import {
  Sparkles,
  Plus,
  Search,
  X,
  Loader2,
  Filter,
  Eye,
  Calendar,
  FileText,
} from 'lucide-react';

export default function CampaignsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data state
  const [campaignsList, setCampaignsList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState<boolean>(false);
  const [selectedCampaignForDetails, setSelectedCampaignForDetails] = useState<Campaign | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCampaigns() {
      setLoading(true);
      const res = await getCampaigns({
        status: statusFilter,
        search: searchQuery,
      });
      if (!isMounted) return;
      if (res.data) {
        setCampaignsList(res.data);
      }
      setLoading(false);
    }

    fetchCampaigns();

    return () => {
      isMounted = false;
    };
  }, [statusFilter, searchQuery]);

  const handleCampaignLaunched = (newCamp: Campaign) => {
    setCampaignsList((prev) => [newCamp, ...prev]);
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
          {/* Top Bar: Title & Launch Campaign Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-[var(--color-secondary)]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Promotions Engine
                </span>
              </div>
              <h1 className="page-title text-2xl font-bold">
                Marketing Campaigns
              </h1>
              <p className="body-text text-xs mt-1">
                Launch, monitor impressions, and target audiences with ad content (public.campaigns).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsLaunchModalOpen(true)}
              className="btn-base btn-primary text-xs py-2 px-4 shadow-xs flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Campaign</span>
            </button>
          </div>

          {/* Search bar (title, content title) & Filters (status) */}
          <div
            className="card-base p-4 sm:p-5 rounded-[var(--radius-lg)] border space-y-3"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Search bar: title, content title */}
              <div className="sm:col-span-8">
                <div className="relative">
                  <Search
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                  <input
                    type="text"
                    placeholder="Search campaigns by title or content title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-base pl-9 pr-9 text-xs sm:text-sm py-2 w-full"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filters: status */}
              <div className="sm:col-span-4 flex items-center gap-2">
                <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <Filter className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  <span>Status:</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-base text-xs sm:text-sm py-2 px-3 w-full"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="deactive">Deactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Display list of campaigns (Only Title, Status, start and end dates, content_title, Open) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Campaigns ({campaignsList.length})
              </h2>
            </div>

            {loading ? (
              <div
                className="card-base p-12 text-center rounded-[var(--radius-lg)] border"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <Loader2
                  className="w-8 h-8 anim-spin mx-auto mb-2.5"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Loading marketing campaigns...
                </p>
              </div>
            ) : campaignsList.length === 0 ? (
              <div
                className="card-base p-10 text-center rounded-[var(--radius-lg)] border border-dashed space-y-3"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <Sparkles
                  className="w-10 h-10 mx-auto"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  No campaigns found
                </p>
                <p
                  className="text-xs max-w-sm mx-auto"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {searchQuery || statusFilter !== 'all'
                    ? 'No campaigns match your search query or status filter. Try resetting filters.'
                    : 'Get started by launching your first promotional marketing campaign.'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {(searchQuery || statusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                      }}
                      className="btn-base btn-outline text-xs py-1.5 px-3"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsLaunchModalOpen(true)}
                    className="btn-base btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Launch Campaign</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="card-base border rounded-[var(--radius-lg)] overflow-hidden">
                {/* Desktop/Tablet Table View (Only Title, Status, start and end dates, content_title, Open) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="table-base w-full">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Title</th>
                        <th className="table-header-cell">Status</th>
                        <th className="table-header-cell">Start &amp; End Dates</th>
                        <th className="table-header-cell">Content Title</th>
                        <th className="table-header-cell text-right">Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignsList.map((camp) => (
                        <tr key={camp.id} className="table-row">
                          {/* Title */}
                          <td className="table-cell">
                            <span className="font-semibold text-xs sm:text-sm text-[var(--color-text-primary)]">
                              {camp.title}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="table-cell">
                            <span
                              className={`status-chip ₹{
                                camp.status === 'active'
                                  ? 'status-chip-active'
                                  : 'status-chip-danger'
                              } text-[10px] py-0.5 px-2`}
                            >
                              {camp.status.toUpperCase()}
                            </span>
                          </td>

                          {/* Start and End Dates */}
                          <td className="table-cell">
                            <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-secondary)]">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{camp.start_date || 'Start'}</span>
                              <span className="text-[var(--color-text-muted)]">to</span>
                              <span>{camp.end_date || 'No End'}</span>
                            </div>
                          </td>

                          {/* content_title */}
                          <td className="table-cell">
                            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-primary)] font-medium truncate max-w-xs">
                              <FileText className="w-3.5 h-3.5 text-[var(--color-secondary)] shrink-0" />
                              <span className="truncate">{camp.content_title || '—'}</span>
                            </div>
                          </td>

                          {/* Open (Allow to view All details related and campaign and content) */}
                          <td className="table-cell text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedCampaignForDetails(camp)}
                              className="btn-base btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 ml-auto hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Open</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View (Only Title, Status, start and end dates, content_title, Open) */}
                <div
                  className="lg:hidden divide-y"
                  style={{ borderColor: 'var(--color-border-subtle)' }}
                >
                  {campaignsList.map((camp) => (
                    <div
                      key={camp.id}
                      className="p-4 space-y-2.5"
                      style={{ backgroundColor: 'var(--color-surface)' }}
                    >
                      {/* Title & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm text-[var(--color-text-primary)] leading-snug">
                          {camp.title}
                        </span>
                        <span
                          className={`status-chip shrink-0 ₹{
                            camp.status === 'active'
                              ? 'status-chip-active'
                              : 'status-chip-danger'
                          } text-[10px] py-0.5 px-2`}
                        >
                          {camp.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Start and End Dates */}
                      <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-secondary)]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{camp.start_date || 'Start'}</span>
                        <span className="text-[var(--color-text-muted)]">to</span>
                        <span>{camp.end_date || 'No End'}</span>
                      </div>

                      {/* Content Title & Open Button */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-primary)] font-medium truncate max-w-[200px]">
                          <FileText className="w-3.5 h-3.5 text-[var(--color-secondary)] shrink-0" />
                          <span className="truncate">{camp.content_title || '—'}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedCampaignForDetails(camp)}
                          className="btn-base btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Launch Campaign Modal */}
      <LaunchCampaign
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        onCampaignLaunched={handleCampaignLaunched}
      />

      {/* Open Campaign Details Modal */}
      <OpenCampaign
        campaign={selectedCampaignForDetails}
        isOpen={!!selectedCampaignForDetails}
        onClose={() => setSelectedCampaignForDetails(null)}
        onCampaignUpdated={(updated) => {
          setCampaignsList((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
          setSelectedCampaignForDetails(updated);
        }}
      />
    </div>
  );
}
