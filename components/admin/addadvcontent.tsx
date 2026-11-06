/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Loader2,
  Upload,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  MediaType,
  uploadAdMedia,
  createAdContent,
  AdContent,
} from '@/lib/advcontentStore';

interface AddAdvContentProps {
  isOpen: boolean;
  onClose: () => void;
  onContentCreated: (content: AdContent) => void;
}

export default function AddAdvContent({
  isOpen,
  onClose,
  onContentCreated,
}: AddAdvContentProps) {
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleMediaTypeChange = (type: MediaType) => {
    setMediaType(type);
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (mediaType === 'image' && !selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }

    if (mediaType === 'video' && !selectedFile.type.startsWith('video/')) {
      setError('Please select a valid video file (MP4, WebM, etc.).');
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter an ad content title.');
      return;
    }

    if (!file) {
      setError(`Please upload a ${mediaType} file.`);
      return;
    }

    setUploading(true);

    try {
      // 1. Upload to dedicated Supabase storage bucket (adv_content_img or adv_content_vid)
      const uploadRes = await uploadAdMedia(file, mediaType);
      if (uploadRes.error || !uploadRes.url) {
        setError(uploadRes.error?.message || 'Failed to upload media file.');
        setUploading(false);
        return;
      }

      // 2. Save record into public.ad_content with status = 'active'
      const createRes = await createAdContent({
        title: trimmedTitle,
        media_type: mediaType,
        media_url: uploadRes.url,
        status: 'active',
      });

      setUploading(false);

      if (createRes.error || !createRes.data) {
        setError(createRes.error?.message || 'Failed to save ad content.');
        return;
      }

      onContentCreated(createRes.data);
      onClose();
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  return (
    <div
      className="dialog-overlay z-50 p-3 sm:p-6 anim-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg overflow-hidden border shadow-xl rounded-[var(--radius-xl)] anim-slide-up flex flex-col max-h-[92vh]"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
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
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2
                className="font-bold text-base tracking-tight"
                style={{ color: 'var(--color-primary)' }}
              >
                New Ad Content
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Upload marketing creatives to storage bucket &amp; register in ad_content
              </p>
            </div>
          </div>
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

        {/* Modal Form */}
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

          {/* Ad Title */}
          <div className="form-group">
            <label
              className="text-xs font-semibold block mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Ad Content Title *
            </label>
            <div className="relative">
              <FileText
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-muted)' }}
              />
              <input
                type="text"
                placeholder="e.g. Summer Pure Hydration Launch Banner"
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

          {/* Media Type Selection (image / video) */}
          <div className="form-group">
            <label
              className="text-xs font-semibold block mb-1.5"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Media Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleMediaTypeChange('image')}
                className={`p-3 rounded-[var(--radius-md)] border flex items-center gap-2.5 transition-all text-left ${
                  mediaType === 'image' ? 'ring-2' : 'hover:bg-slate-50'
                }`}
                style={{
                  backgroundColor:
                    mediaType === 'image'
                      ? 'var(--color-secondary-light)'
                      : 'var(--color-surface)',
                  borderColor:
                    mediaType === 'image'
                      ? 'var(--color-secondary)'
                      : 'var(--color-border)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      mediaType === 'image'
                        ? 'var(--color-secondary)'
                        : 'var(--color-surface-muted)',
                    color: mediaType === 'image' ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <span
                    className="text-xs font-bold block"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Image Asset
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    adv_content_img bucket
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleMediaTypeChange('video')}
                className={`p-3 rounded-[var(--radius-md)] border flex items-center gap-2.5 transition-all text-left ${
                  mediaType === 'video' ? 'ring-2' : 'hover:bg-slate-50'
                }`}
                style={{
                  backgroundColor:
                    mediaType === 'video'
                      ? 'var(--color-secondary-light)'
                      : 'var(--color-surface)',
                  borderColor:
                    mediaType === 'video'
                      ? 'var(--color-secondary)'
                      : 'var(--color-border)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      mediaType === 'video'
                        ? 'var(--color-secondary)'
                        : 'var(--color-surface-muted)',
                    color: mediaType === 'video' ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <span
                    className="text-xs font-bold block"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Video Asset
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    adv_content_vid bucket
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Media Upload Area */}
          <div className="form-group space-y-2">
            <div className="flex items-center justify-between">
              <label
                className="text-xs font-semibold block"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {mediaType === 'image'
                  ? 'Upload Image to adv_content_img'
                  : 'Upload Video to adv_content_vid'} *
              </label>
              <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                {mediaType === 'image' ? 'PNG, JPG, WebP' : 'MP4, WebM'}
              </span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-5 border-2 border-dashed rounded-[var(--radius-lg)] text-center cursor-pointer transition-colors hover:border-[var(--color-secondary)] hover:bg-slate-50"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="space-y-3">
                  {mediaType === 'image' ? (
                    <div className="relative max-h-48 overflow-hidden rounded-[var(--radius-md)] flex items-center justify-center bg-slate-900/5">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-48 object-contain rounded-[var(--radius-md)]"
                      />
                    </div>
                  ) : (
                    <div className="relative max-h-48 overflow-hidden rounded-[var(--radius-md)] bg-black">
                      <video
                        src={previewUrl}
                        controls
                        className="max-h-48 w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="truncate max-w-xs">{file?.name}</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Tap to replace file
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div
                    className="w-10 h-10 rounded-full mx-auto flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--color-surface-muted)',
                      color: 'var(--color-secondary)',
                    }}
                  >
                    <Upload className="w-5 h-5" />
                  </div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Click to browse {mediaType === 'image' ? 'image' : 'video'}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    Files will be uploaded directly to {mediaType === 'image' ? 'adv_content_img' : 'adv_content_vid'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status info: active by default */}
          <div
            className="p-3 rounded-[var(--radius-md)] border flex items-center justify-between text-xs"
            style={{
              backgroundColor: 'var(--color-surface-muted)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <span style={{ color: 'var(--color-text-secondary)' }}>Status:</span>
            <span
              className="status-chip status-chip-active text-[10px] py-0.5 px-2"
            >
              ACTIVE
            </span>
          </div>

          {/* Footer Actions */}
          <div
            className="pt-3 border-t flex items-center justify-end gap-2.5"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="btn-base btn-outline text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file || !title.trim()}
              className="btn-base btn-primary text-xs py-2 px-5 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 anim-spin" />
                  <span>Uploading &amp; Saving...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
