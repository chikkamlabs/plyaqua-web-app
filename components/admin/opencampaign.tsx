/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Eye,
  MapPin,
  ExternalLink,
  Image as ImageIcon,
  Video,
  FileText,
  Edit2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';
import {
  Campaign,
  updateCampaign,
  getActiveAdContents,
  CampaignStatus,
} from '@/lib/campaignsStore';
import { AdContent } from '@/lib/advcontentStore';

interface OpenCampaignProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onCampaignUpdated?: (updated: Campaign) => void;
}

export default function OpenCampaign({
  campaign,
  isOpen,
  onClose,
  onCampaignUpdated,
}: OpenCampaignProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Editable fields state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedContentId, setSelectedContentId] = useState<string>('');
  const [contentSearch, setContentSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxViews, setMaxViews] = useState<number | ''>(1000);
  const [locationName, setLocationName] = useState('');
  const [locationEnabled, setLocationEnabled] = useState<boolean>(false);
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [radiusMtrs, setRadiusMtrs] = useState<number | ''>(5000);
  const [status, setStatus] = useState<CampaignStatus>('deactive');

  const [activeContents, setActiveContents] = useState<AdContent[]>([]);
  const [loadingContents, setLoadingContents] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize edit form when starting editing
  const handleStartEdit = () => {
    if (!campaign) return;
    setTitle(campaign.title || '');
    setDescription(campaign.description || '');
    setSelectedContentId(campaign.content_id || '');
    setStartDate(campaign.start_date || '');
    setEndDate(campaign.end_date || '');
    setMaxViews(campaign.max_views ?? 1000);
    setLocationName(campaign.location_name || '');
    setLocationEnabled(Boolean(campaign.location_enabled));
    setLatitude(campaign.latitude ?? '');
    setLongitude(campaign.longitude ?? '');
    setRadiusMtrs(campaign.radius_mtrs ?? 5000);
    setStatus(campaign.status || 'deactive');
    setError(null);
    setSuccessMsg(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    setSuccessMsg(null);
  };

  // Load active ad contents for selection when editing
  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    async function loadContents() {
      setLoadingContents(true);
      const res = await getActiveAdContents();
      if (!isMounted) return;
      if (res.data) {
        setActiveContents(res.data);
      }
      setLoadingContents(false);
    }

    loadContents();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const filteredContents = useMemo(() => {
    if (!contentSearch.trim()) return activeContents;
    const q = contentSearch.trim().toLowerCase();
    return activeContents.filter((ad) => ad.title.toLowerCase().includes(q));
  }, [activeContents, contentSearch]);

  const selectedContent = activeContents.find((ad) => ad.id === selectedContentId);

  if (!isOpen || !campaign) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Campaign title is required.');
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      setError('Start date cannot be after end date.');
      return;
    }

    setSaving(true);

    const res = await updateCampaign(campaign.id, {
      title: trimmedTitle,
      description: description.trim() || null,
      content_id: selectedContentId || null,
      content_title: selectedContent ? selectedContent.title : campaign.content_title,
      content_media_type: selectedContent ? selectedContent.media_type : campaign.content_media_type,
      content_media_url: selectedContent ? selectedContent.media_url : campaign.content_media_url,
      start_date: startDate || null,
      end_date: endDate || null,
      max_views: maxViews === '' ? null : Number(maxViews),
      location_name: locationName.trim() || null,
      latitude: latitude === '' ? null : Number(latitude),
      longitude: longitude === '' ? null : Number(longitude),
      radius_mtrs: radiusMtrs === '' ? null : Number(radiusMtrs),
      location_enabled: locationEnabled,
      status,
    });

    setSaving(false);

    if (res.error || !res.data) {
      setError(res.error?.message || 'Failed to update campaign.');
      return;
    }

    setSuccessMsg('Campaign updated successfully!');
    if (onCampaignUpdated) {
      onCampaignUpdated(res.data);
    }
    setTimeout(() => {
      setIsEditing(false);
      setSuccessMsg(null);
    }, 1200);
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
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div
              className="w-8 h-8 rounded-[var(--radius-full)] flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--color-secondary-light)',
                color: 'var(--color-secondary)',
              }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2
                className="font-bold text-base tracking-tight truncate"
                style={{ color: 'var(--color-primary)' }}
              >
                {isEditing ? 'Edit Campaign' : campaign.title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`status-chip ₹{
                    (isEditing ? status : campaign.status) === 'active'
                      ? 'status-chip-active'
                      : 'status-chip-danger'
                  } text-[10px] py-0.5 px-2`}
                >
                  {(isEditing ? status : campaign.status).toUpperCase()}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  ID: {campaign.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="btn-base btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[var(--radius-md)] transition-colors hover:bg-slate-100"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div
            className="m-4 p-3 rounded-[var(--radius-md)] flex items-center gap-2 text-xs border bg-rose-50 border-rose-200 text-rose-700"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div
            className="m-4 p-3 rounded-[var(--radius-md)] flex items-center gap-2 text-xs border bg-emerald-50 border-emerald-200 text-emerald-700"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Mode 1: Edit Everything Mode */}
        {isEditing ? (
          <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* Title */}
            <div className="form-group">
              <label className="text-xs font-semibold block mb-1">
                Campaign Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="input-base text-xs sm:text-sm py-2 w-full"
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="text-xs font-semibold block mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-base text-xs sm:text-sm py-2 w-full"
              />
            </div>

            {/* Attached Ad Content selection */}
            <div className="form-group space-y-2">
              <label className="text-xs font-semibold block">
                Attached Ad Content Creative
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter active creatives by title..."
                  value={contentSearch}
                  onChange={(e) => setContentSearch(e.target.value)}
                  className="input-base pl-9 pr-3 text-xs py-1.5 w-full"
                />
              </div>

              {loadingContents ? (
                <div className="p-3 text-center text-xs text-slate-400">Loading active ad content...</div>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 border rounded-[var(--radius-md)] p-2 bg-slate-50/50">
                  {filteredContents.map((ad) => {
                    const isSelected = ad.id === selectedContentId;
                    return (
                      <div
                        key={ad.id}
                        onClick={() => setSelectedContentId(ad.id)}
                        className={`p-2 rounded border cursor-pointer flex items-center justify-between ₹{
                          isSelected ? 'bg-blue-50 border-blue-400 font-semibold' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {ad.media_type === 'video' ? (
                            <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                          <span className="truncate">{ad.title}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dates & Max Views */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold block mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-base text-xs py-1.5 w-full"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold block mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-base text-xs py-1.5 w-full"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold block mb-1">Max Views</label>
                <input
                  type="number"
                  min={1}
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value === '' ? '' : Number(e.target.value))}
                  className="input-base text-xs py-1.5 w-full"
                />
              </div>
            </div>

            {/* Geolocation Targeting & Location Name */}
            <div className="p-3.5 rounded-[var(--radius-lg)] border bg-slate-50 space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Location Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hyderabad Central Kiosk / Bengaluru Tech Park"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="input-base text-xs py-1.5 w-full bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={locationEnabled}
                    onChange={(e) => setLocationEnabled(e.target.checked)}
                    className="rounded text-[var(--color-secondary)] w-4 h-4"
                  />
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                    <span>Enable Coordinate Radius Targeting</span>
                  </span>
                </label>
              </div>

              {locationEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t">
                  <div>
                    <label className="text-[10px] font-semibold block text-slate-500 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                      className="input-base text-xs py-1 w-full bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold block text-slate-500 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                      className="input-base text-xs py-1 w-full bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold block text-slate-500 mb-1">Radius (Meters)</label>
                    <input
                      type="number"
                      step={100}
                      value={radiusMtrs}
                      onChange={(e) => setRadiusMtrs(e.target.value === '' ? '' : Number(e.target.value))}
                      className="input-base text-xs py-1 w-full bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Status Selector */}
            <div className="p-3 rounded-[var(--radius-md)] border flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold block">Campaign Status</span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Toggle whether campaign actively serves impressions
                </span>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                className="select-base text-xs py-1.5 px-3"
              >
                <option value="active">ACTIVE</option>
                <option value="deactive">DEACTIVE</option>
              </select>
            </div>

            {/* Save and Cancel buttons */}
            <div className="pt-3 border-t flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="btn-base btn-outline text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-base btn-primary text-xs py-2 px-5 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 anim-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Mode 2: View Details Mode */
          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* Description */}
            {campaign.description && (
              <div
                className="p-3.5 rounded-[var(--radius-md)] border space-y-1"
                style={{
                  backgroundColor: 'var(--color-surface-muted)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <span className="font-semibold block text-[var(--color-text-secondary)]">
                  Campaign Description:
                </span>
                <p className="text-[var(--color-text-primary)] leading-relaxed">
                  {campaign.description}
                </p>
              </div>
            )}

            {/* Attached Ad Content Showcase */}
            <div
              className="card-base p-4 rounded-[var(--radius-lg)] border space-y-3"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  <span>Attached Ad Content</span>
                </span>
                <div className="flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded border bg-slate-50">
                  {campaign.content_media_type === 'video' ? (
                    <Video className="w-3.5 h-3.5 text-blue-500" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  <span>{(campaign.content_media_type || 'MEDIA').toUpperCase()}</span>
                </div>
              </div>

              <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                {campaign.content_title || 'Untitled Creative'}
              </p>

              {/* Media Viewer */}
              {campaign.content_media_url && (
                <div className="rounded-[var(--radius-md)] border overflow-hidden bg-black/95 flex items-center justify-center max-h-64">
                  {campaign.content_media_type === 'video' ? (
                    <video
                      src={campaign.content_media_url}
                      controls
                      className="max-h-64 w-full object-contain"
                    >
                      Your browser does not support the video player.
                    </video>
                  ) : (
                    <img
                      src={campaign.content_media_url}
                      alt={campaign.content_title || 'Ad creative'}
                      className="max-h-64 w-full object-contain"
                    />
                  )}
                </div>
              )}

              {campaign.content_media_url && (
                <a
                  href={campaign.content_media_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-medium flex items-center gap-1 text-[var(--color-secondary)] hover:underline inline-flex"
                >
                  <span>Direct Media Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Schedule and Views Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                className="p-3 rounded-[var(--radius-md)] border"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  <span className="font-semibold">Start Date</span>
                </div>
                <span className="font-mono font-bold text-xs text-[var(--color-text-primary)]">
                  {campaign.start_date || 'Immediate'}
                </span>
              </div>

              <div
                className="p-3 rounded-[var(--radius-md)] border"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  <span className="font-semibold">End Date</span>
                </div>
                <span className="font-mono font-bold text-xs text-[var(--color-text-primary)]">
                  {campaign.end_date || 'No expiration'}
                </span>
              </div>

              <div
                className="p-3 rounded-[var(--radius-md)] border"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] mb-1">
                  <Eye className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  <span className="font-semibold">Impressions</span>
                </div>
                <span className="font-mono font-bold text-xs text-[var(--color-text-primary)]">
                  {campaign.views.toLocaleString()} / {campaign.max_views ? campaign.max_views.toLocaleString() : '∞'}
                </span>
              </div>
            </div>

            {/* Geolocation Targeting Details */}
            <div
              className="p-3.5 rounded-[var(--radius-md)] border space-y-2"
              style={{
                backgroundColor: 'var(--color-surface-muted)',
                borderColor: 'var(--color-border-subtle)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  <span>Location Targeting</span>
                </span>
                <span
                  className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ₹{
                    campaign.location_enabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {campaign.location_enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>

              {campaign.location_name && (
                <div className="text-[11px] pb-1">
                  <span className="text-[var(--color-text-muted)] font-semibold">Location Name: </span>
                  <span className="font-bold text-[var(--color-text-primary)]">{campaign.location_name}</span>
                </div>
              )}

              {campaign.location_enabled ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-[var(--color-text-muted)] block">Latitude:</span>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {campaign.latitude ?? '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)] block">Longitude:</span>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {campaign.longitude ?? '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)] block">Radius:</span>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {campaign.radius_mtrs ? `₹{campaign.radius_mtrs.toLocaleString()}m` : '—'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Campaign is delivered without coordinate radius restrictions.
                </p>
              )}
            </div>

            {/* Footer */}
            <div
              className="p-4 border-t flex items-center justify-between"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              <button
                type="button"
                onClick={handleStartEdit}
                className="btn-base btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Campaign</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-base btn-outline text-xs py-2 px-5"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
