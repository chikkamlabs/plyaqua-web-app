'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Loader2,
  Sparkles,
  MapPin,
  Calendar,
  Eye,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import {
  Campaign,
  getActiveAdContents,
  createCampaign,
} from '@/lib/campaignsStore';
import { AdContent } from '@/lib/advcontentStore';

interface LaunchCampaignProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignLaunched: (campaign: Campaign) => void;
}

export default function LaunchCampaign({
  isOpen,
  onClose,
  onCampaignLaunched,
}: LaunchCampaignProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedContentId, setSelectedContentId] = useState<string>('');
  const [contentSearch, setContentSearch] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxViews, setMaxViews] = useState<number | ''>(1000);

  const [locationEnabled, setLocationEnabled] = useState<boolean>(false);
  const [locationName, setLocationName] = useState<string>('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [radiusMtrs, setRadiusMtrs] = useState<number | ''>(5000);

  // Status default false ('deactive')
  const [statusActive, setStatusActive] = useState<boolean>(false);

  const [activeContents, setActiveContents] = useState<AdContent[]>([]);
  const [loadingContents, setLoadingContents] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load active ad contents when modal opens
  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    async function loadActiveContents() {
      setLoadingContents(true);
      const res = await getActiveAdContents();
      if (!isMounted) return;
      if (res.data) {
        setActiveContents(res.data);
        if (res.data.length > 0) {
          setSelectedContentId(res.data[0].id);
        }
      }
      setLoadingContents(false);
    }

    loadActiveContents();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Filter active ad contents by search query
  const filteredContents = useMemo(() => {
    if (!contentSearch.trim()) return activeContents;
    const q = contentSearch.trim().toLowerCase();
    return activeContents.filter((ad) => ad.title.toLowerCase().includes(q));
  }, [activeContents, contentSearch]);

  const selectedContent = activeContents.find((ad) => ad.id === selectedContentId);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please provide a campaign title.');
      return;
    }

    if (!selectedContentId) {
      setError('Please select an active ad content creative.');
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      setError('Start date cannot be after end date.');
      return;
    }

    setSubmitting(true);

    const res = await createCampaign({
      title: trimmedTitle,
      description: description.trim() || null,
      content_id: selectedContentId,
      content_title: selectedContent?.title,
      content_media_type: selectedContent?.media_type,
      content_media_url: selectedContent?.media_url,
      start_date: startDate || null,
      end_date: endDate || null,
      max_views: maxViews === '' ? null : Number(maxViews),
      location_name: locationName.trim() || null,
      latitude: latitude === '' ? null : Number(latitude),
      longitude: longitude === '' ? null : Number(longitude),
      radius_mtrs: radiusMtrs === '' ? null : Number(radiusMtrs),
      location_enabled: locationEnabled,
      status: statusActive ? 'active' : 'deactive', // default false ('deactive')
    });

    setSubmitting(false);

    if (res.error || !res.data) {
      setError(res.error?.message || 'Failed to launch campaign.');
      return;
    }

    onCampaignLaunched(res.data);
    onClose();
  };

  return (
    <div
      className="dialog-overlay z-50 p-3 sm:p-6 anim-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl overflow-hidden border shadow-xl rounded-[var(--radius-xl)] anim-slide-up flex flex-col max-h-[92vh]"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{
            borderColor: 'var(--color-border-subtle)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-[var(--radius-full)] flex items-center justify-center font-bold text-sm"
              style={{
                backgroundColor: 'var(--color-secondary-light)',
                color: 'var(--color-secondary)',
              }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2
                className="font-bold text-base tracking-tight"
                style={{ color: 'var(--color-primary)' }}
              >
                Launch New Campaign
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Configure marketing parameters, target audience, schedule, and ad content
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-md)] transition-colors hover:bg-slate-100"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Close launch modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div
              className="p-3.5 rounded-[var(--radius-md)] flex items-center gap-2 text-xs border"
              style={{
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger-text)',
                borderColor: 'var(--color-danger-border)',
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Title */}
          <div className="form-group">
            <label
              className="text-xs font-semibold block mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Campaign Title *
            </label>
            <div className="relative">
              <Sparkles
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-muted)' }}
              />
              <input
                type="text"
                placeholder="e.g. Summer Mineral Splash Campaign"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="input-base pl-9 text-xs sm:text-sm py-2"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                }}
              />
            </div>
          </div>

          {/* 2. Description */}
          <div className="form-group">
            <label
              className="text-xs font-semibold block mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Provide context and target goals for this marketing run..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-base text-xs sm:text-sm py-2"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
              }}
            />
          </div>

          {/* 3. Display Active Contents Title: Search and select from ad_content table */}
          <div className="form-group space-y-2">
            <div className="flex items-center justify-between">
              <label
                className="text-xs font-semibold block"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Select Active Ad Content *
              </label>
              <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                {activeContents.length} active creative(s) available
              </span>
            </div>

            {/* Search active contents */}
            <div className="relative">
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search active contents title..."
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                className="input-base pl-9 pr-8 text-xs py-2 w-full"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                }}
              />
              {contentSearch && (
                <button
                  type="button"
                  onClick={() => setContentSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  aria-label="Clear content search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Contents List */}
            {loadingContents ? (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 anim-spin mx-auto text-[var(--color-secondary)] mb-1" />
                <span className="text-xs text-[var(--color-text-muted)]">
                  Loading active ad creatives...
                </span>
              </div>
            ) : filteredContents.length === 0 ? (
              <div className="p-4 text-center border border-dashed rounded-[var(--radius-md)] text-xs text-[var(--color-text-muted)]">
                No active ad contents matched. Ensure active contents exist in Ads Content library.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded-[var(--radius-md)] p-2">
                {filteredContents.map((ad) => {
                  const isSelected = ad.id === selectedContentId;
                  return (
                    <div
                      key={ad.id}
                      onClick={() => setSelectedContentId(ad.id)}
                      className={`p-2.5 rounded-[var(--radius-md)] border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected ? 'ring-2' : 'hover:bg-slate-50'
                      }`}
                      style={{
                        backgroundColor: isSelected
                          ? 'var(--color-secondary-light)'
                          : 'var(--color-surface)',
                        borderColor: isSelected
                          ? 'var(--color-secondary)'
                          : 'var(--color-border)',
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor:
                              ad.media_type === 'video' ? '#eff6ff' : '#ecfdf5',
                            color:
                              ad.media_type === 'video' ? '#2563eb' : '#059669',
                          }}
                        >
                          {ad.media_type === 'video' ? (
                            <Video className="w-3.5 h-3.5" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span
                            className="text-xs font-semibold block truncate"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {ad.title}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-muted)] block uppercase font-mono">
                            {ad.media_type} &bull; ACTIVE
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle2
                          className="w-4 h-4 shrink-0 text-[var(--color-secondary)] ml-2"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Schedule Dates (start_date, end_date) and max_views */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                className="text-xs font-semibold flex items-center gap-1 mb-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Calendar className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-base text-xs py-2 w-full"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                }}
              />
            </div>

            <div>
              <label
                className="text-xs font-semibold flex items-center gap-1 mb-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Calendar className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                <span>End Date</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-base text-xs py-2 w-full"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                }}
              />
            </div>

            <div>
              <label
                className="text-xs font-semibold flex items-center gap-1 mb-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Eye className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                <span>Max Views</span>
              </label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 5000"
                value={maxViews}
                onChange={(e) => {
                  const val = e.target.value;
                  setMaxViews(val === '' ? '' : Number(val));
                }}
                className="input-base text-xs py-2 w-full"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                }}
              />
            </div>
          </div>

          {/* 5. Geolocation Targeting: location_name, location_enabled, latitude, longitude, radius_mtrs */}
          <div
            className="p-3.5 rounded-[var(--radius-lg)] border space-y-3"
            style={{
              backgroundColor: 'var(--color-surface-muted)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <div>
              <label className="text-xs font-semibold block text-[var(--color-text-secondary)] mb-1">
                Location Name
              </label>
              <input
                type="text"
                placeholder="e.g. Hyderabad Central Kiosk / Bengaluru Tech Park"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="input-base text-xs py-2 w-full"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={locationEnabled}
                  onChange={(e) => setLocationEnabled(e.target.checked)}
                  className="rounded text-[var(--color-secondary)] focus:ring-[var(--color-secondary)] w-4 h-4"
                />
                <span className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  <span>Enable Geolocation Radius Targeting</span>
                </span>
              </label>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                {locationEnabled ? 'Active Filter' : 'Off (Global)'}
              </span>
            </div>

            {locationEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="text-[11px] font-semibold block text-[var(--color-text-secondary)] mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 17.3850"
                    value={latitude}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLatitude(v === '' ? '' : Number(v));
                    }}
                    className="input-base text-xs py-1.5 w-full"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                    }}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold block text-[var(--color-text-secondary)] mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 78.4867"
                    value={longitude}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLongitude(v === '' ? '' : Number(v));
                    }}
                    className="input-base text-xs py-1.5 w-full"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                    }}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold block text-[var(--color-text-secondary)] mb-1">
                    Radius (Meters)
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    placeholder="e.g. 5000"
                    value={radiusMtrs}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRadiusMtrs(v === '' ? '' : Number(v));
                    }}
                    className="input-base text-xs py-1.5 w-full"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 6. Status: default false ('deactive') */}
          <div
            className="p-3 rounded-[var(--radius-md)] border flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div>
              <span className="text-xs font-semibold block text-[var(--color-text-primary)]">
                Campaign Status
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                Default is inactive (false) until activated
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={statusActive}
                onChange={(e) => setStatusActive(e.target.checked)}
                className="rounded text-[var(--color-secondary)] focus:ring-[var(--color-secondary)] w-4 h-4"
              />
              <span
                className={`status-chip text-[10px] py-0.5 px-2 ${
                  statusActive ? 'status-chip-active' : 'status-chip-danger'
                }`}
              >
                {statusActive ? 'ACTIVE' : 'DEACTIVE (DEFAULT)'}
              </span>
            </label>
          </div>

          {/* Footer Save button */}
          <div
            className="pt-3 border-t flex items-center justify-end gap-2.5"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-base btn-outline text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !selectedContentId}
              className="btn-base btn-primary text-xs py-2 px-5 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 anim-spin" />
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Launch Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
