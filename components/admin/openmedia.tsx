/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import {
  X,
  ExternalLink,
  Image as ImageIcon,
  Video,
  FileText,
} from 'lucide-react';
import { AdContent } from '@/lib/advcontentStore';

interface OpenMediaProps {
  ad: AdContent | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OpenMedia({
  ad,
  isOpen,
  onClose,
}: OpenMediaProps) {
  if (!isOpen || !ad) return null;

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
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
              }}
            >
              {ad.media_type === 'video' ? (
                <Video className="w-4 h-4" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h2
                className="font-bold text-base tracking-tight truncate"
                style={{ color: 'var(--color-primary)' }}
              >
                {ad.title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-[var(--radius-sm)]"
                  style={{
                    backgroundColor: 'var(--color-surface-muted)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {ad.media_type.toUpperCase()}
                </span>
                <span
                  className={`status-chip ₹{
                    ad.status === 'active' ? 'status-chip-active' : 'status-chip-danger'
                  } text-[10px] py-0.5 px-2`}
                >
                  {ad.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-md)] transition-colors hover:bg-slate-100 shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Content Display */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div
            className="rounded-[var(--radius-lg)] border overflow-hidden flex items-center justify-center bg-black/95 relative min-h-[260px] max-h-[460px]"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {ad.media_type === 'video' ? (
              <video
                src={ad.media_url}
                controls
                autoPlay
                className="w-full max-h-[460px] object-contain"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={ad.media_url}
                alt={ad.title}
                className="w-full max-h-[460px] object-contain"
              />
            )}
          </div>

          {/* Media URL info */}
          <div
            className="p-3.5 rounded-[var(--radius-md)] border space-y-1.5 text-xs"
            style={{
              backgroundColor: 'var(--color-surface-muted)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="font-semibold flex items-center gap-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Media Source URL</span>
              </span>
              <a
                href={ad.media_url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-medium flex items-center gap-1 text-[var(--color-secondary)] hover:underline"
              >
                <span>Open in new tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p
              className="font-mono text-[11px] break-all select-all px-2 py-1 rounded bg-white/70 border"
              style={{
                color: 'var(--color-text-primary)',
                borderColor: 'var(--color-border-subtle)',
              }}
            >
              {ad.media_url}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t flex items-center justify-end"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-base btn-outline text-xs py-2 px-5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
