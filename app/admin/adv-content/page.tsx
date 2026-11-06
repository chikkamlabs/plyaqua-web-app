'use client';

import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import AddAdvContent from '@/components/admin/addadvcontent';
import OpenMedia from '@/components/admin/openmedia';
import {
  getAdContents,
  AdContent,
} from '@/lib/advcontentStore';
import {
  Megaphone,
  Plus,
  Search,
  X,
  Loader2,
  Filter,
  Eye,
  Image as ImageIcon,
  Video,
} from 'lucide-react';

export default function AdvContentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTitle, setSearchTitle] = useState<string>('');

  // Data state
  const [adList, setAdList] = useState<AdContent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedAdForMedia, setSelectedAdForMedia] = useState<AdContent | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAds() {
      setLoading(true);
      const res = await getAdContents({
        status: statusFilter,
        title: searchTitle,
      });
      if (!isMounted) return;
      if (res.data) {
        setAdList(res.data);
      }
      setLoading(false);
    }

    fetchAds();

    return () => {
      isMounted = false;
    };
  }, [statusFilter, searchTitle]);

  const handleContentCreated = (newAd: AdContent) => {
    setAdList((prev) => [newAd, ...prev]);
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
          {/* Top Bar: Title & New Ad Content Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Megaphone className="w-5 h-5 text-[var(--color-secondary)]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Marketing &amp; Media
                </span>
              </div>
              <h1 className="page-title text-2xl font-bold">
                Ads Content
              </h1>
              <p className="body-text text-xs mt-1">
                Promotional advertising creatives and media assets stored in public.ad_content.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="btn-base btn-primary text-xs py-2 px-4 shadow-xs flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>New Ad Content</span>
            </button>
          </div>

          {/* Filters (status) & Search Bar (title) */}
          <div
            className="card-base p-4 sm:p-5 rounded-[var(--radius-lg)] border space-y-3"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Search bar (title) */}
              <div className="sm:col-span-8">
                <div className="relative">
                  <Search
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                  <input
                    type="text"
                    placeholder="Search ad content by title..."
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    className="input-base pl-9 pr-9 text-xs sm:text-sm py-2 w-full"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                    }}
                  />
                  {searchTitle && (
                    <button
                      type="button"
                      onClick={() => setSearchTitle('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                      aria-label="Clear title search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filters (status) */}
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

          {/* Display list of ad_content (Only Title, Status, media_type, Open) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Ad Content List ({adList.length})
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
                  Loading advertising content...
                </p>
              </div>
            ) : adList.length === 0 ? (
              <div
                className="card-base p-10 text-center rounded-[var(--radius-lg)] border border-dashed space-y-3"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <Megaphone
                  className="w-10 h-10 mx-auto"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  No ad content found
                </p>
                <p
                  className="text-xs max-w-sm mx-auto"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {searchTitle || statusFilter !== 'all'
                    ? 'No records match your search or status filter. Try resetting filters.'
                    : 'Get started by creating your first promotional ad content.'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {(searchTitle || statusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTitle('');
                        setStatusFilter('all');
                      }}
                      className="btn-base btn-outline text-xs py-1.5 px-3"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn-base btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Ad Content</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="card-base border rounded-[var(--radius-lg)] overflow-hidden">
                {/* Desktop/Tablet Table View (Only Title, Status, media_type, Open) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="table-base w-full">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Title</th>
                        <th className="table-header-cell">Status</th>
                        <th className="table-header-cell">Media Type</th>
                        <th className="table-header-cell text-right">Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adList.map((ad) => (
                        <tr key={ad.id} className="table-row">
                          {/* Title */}
                          <td className="table-cell">
                            <div className="font-semibold text-xs sm:text-sm text-[var(--color-text-primary)]">
                              {ad.title}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="table-cell">
                            <span
                              className={`status-chip ₹{
                                ad.status === 'active'
                                  ? 'status-chip-active'
                                  : 'status-chip-danger'
                              } text-[10px] py-0.5 px-2`}
                            >
                              {ad.status.toUpperCase()}
                            </span>
                          </td>

                          {/* media_type */}
                          <td className="table-cell">
                            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] border"
                              style={{
                                backgroundColor: 'var(--color-surface-muted)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              {ad.media_type === 'video' ? (
                                <Video className="w-3.5 h-3.5 text-blue-500" />
                              ) : (
                                <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                              <span>{ad.media_type.toUpperCase()}</span>
                            </div>
                          </td>

                          {/* Open (On tap Components/admin/openmedia.tsx : Show the media) */}
                          <td className="table-cell text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedAdForMedia(ad)}
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

                {/* Mobile Cards List (Only Title, Status, media_type, Open) */}
                <div
                  className="sm:hidden divide-y"
                  style={{ borderColor: 'var(--color-border-subtle)' }}
                >
                  {adList.map((ad) => (
                    <div
                      key={ad.id}
                      className="p-4 space-y-3"
                      style={{ backgroundColor: 'var(--color-surface)' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-sm text-[var(--color-text-primary)] leading-snug">
                          {ad.title}
                        </div>
                        <span
                          className={`status-chip shrink-0 ₹{
                            ad.status === 'active'
                              ? 'status-chip-active'
                              : 'status-chip-danger'
                          } text-[10px] py-0.5 px-2`}
                        >
                          {ad.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] border"
                          style={{
                            backgroundColor: 'var(--color-surface-muted)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          {ad.media_type === 'video' ? (
                            <Video className="w-3 h-3 text-blue-500" />
                          ) : (
                            <ImageIcon className="w-3 h-3 text-emerald-500" />
                          )}
                          <span>{ad.media_type.toUpperCase()}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedAdForMedia(ad)}
                          className="btn-base btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
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

      {/* Add Ad Content Modal */}
      <AddAdvContent
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onContentCreated={handleContentCreated}
      />

      {/* Open Media Modal */}
      <OpenMedia
        ad={selectedAdForMedia}
        isOpen={!!selectedAdForMedia}
        onClose={() => setSelectedAdForMedia(null)}
      />
    </div>
  );
}
