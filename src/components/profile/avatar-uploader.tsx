'use client';

import { useRef, useState } from 'react';
import { Pencil, Loader2, Trash2, Camera, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteAvatar } from '@/actions/avatar';
import { useAuth } from '@/components/auth/session-provider';
import { toast } from 'sonner';

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_ATTR = ACCEPTED_TYPES.join(',');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvatarUploaderProps {
  /** Currently saved avatar URL (from the user record). */
  currentAvatar?: string | null;
  /** Fallback initials shown when there is no photo. */
  initials?: string;
  /** Visual size of the circle. Defaults to "md". */
  size?: 'md' | 'lg';
  /**
   * Called after a successful upload with the new CDN URL,
   * or with `null` after a successful delete.
   * The auth context is always updated regardless of whether this is provided.
   */
  onChanged?: (url: string | null) => void;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AvatarUploader({
  currentAvatar,
  initials,
  size = 'md',
  onChanged,
  className,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { setAvatarUrl } = useAuth();

  // Local object-URL preview while the upload is in-flight
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showActions, setShowActions] = useState(false);
  // Incremented after every successful upload so the browser re-fetches even
  // when the backend reuses the same filename (e.g. <userId>.jpg).
  const [cacheKey, setCacheKey] = useState(0);

  const busy = uploading || removing;

  // Dimensions & text size keyed by `size` prop
  const ring  = size === 'lg' ? 'w-24 h-24' : 'w-20 h-20';
  const text  = size === 'lg' ? 'text-2xl'  : 'text-xl';
  const iconW = size === 'lg' ? 'w-6 h-6'   : 'w-5 h-5';

  // Strip any existing cache-bust param before re-applying, so we never
  // accumulate ?v=xxx&v=yyy chains.
  const bust = (url: string) => `${url.split('?')[0]}?v=${cacheKey}`;
  const rawSrc = preview ?? currentAvatar ?? null;
  // Only add cache-busting once we've uploaded at least once (cacheKey > 0)
  const src = rawSrc && cacheKey > 0 ? bust(rawSrc) : rawSrc;

  // ── Upload handler ──────────────────────────────────────────────────────────

  const handleFile = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_MB} MB.`);
      return;
    }

    // Instant local preview so the UI feels snappy
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('file', file);

      // Use the Next.js route handler — server actions can't reliably forward Files
      const res = await fetch('/api/upload/avatar', { method: 'PATCH', body: fd });
      const data: { url?: string; message?: string } = await res.json().catch(() => ({}));

      URL.revokeObjectURL(objectUrl);
      setPreview(null);

      if (res.ok && data.url) {
        // Use a timestamp as the cache key — this value is shared with every
        // consumer (context, parent callback) so they all re-fetch the new file
        // even though the URL path is identical (backend reuses <userId>.jpg).
        const ts = Date.now();
        setCacheKey(ts);
        const bustedUrl = `${data.url.split('?')[0]}?v=${ts}`;
        // Update the global auth context so sidebar + any other consumer reflects
        // the new photo without a page reload
        setAvatarUrl(bustedUrl);
        toast.success('Photo updated!');
        onChanged?.(bustedUrl);
      } else {
        toast.error(data.message || 'Upload failed — please try again.');
      }
    } catch {
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
      toast.error('Upload failed — please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Remove handler ──────────────────────────────────────────────────────────

  const handleRemove = async () => {
    setRemoving(true);
    const res = await deleteAvatar();
    setRemoving(false);

    if (res.success) {
      setAvatarUrl(null);
      toast.success('Photo removed.');
      onChanged?.(null);
    } else {
      toast.error(res.message || 'Could not remove photo.');
    }
  };

  return (
    <div
      className={cn('relative inline-flex flex-col items-center gap-2', className)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* ── Avatar circle ── */}
      <div
        className={cn(
          'rounded-full overflow-hidden ring-2 ring-[#d8e0d8] flex-shrink-0',
          'bg-[#162318] flex items-center justify-center text-white font-bold',
          ring,
          text,
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Profile photo" className="w-full h-full object-cover" />
        ) : (
          initials
            ? <span>{initials}</span>
            : <User className={iconW} />
        )}
      </div>

      {/* ── Hover overlay: change photo button ── */}
      <button
        type="button"
        onClick={() => !busy && inputRef.current?.click()}
        disabled={busy}
        aria-label="Change profile photo"
        className={cn(
          'absolute inset-0 rounded-full',
          'bg-black/50 flex items-center justify-center',
          'transition-opacity duration-200',
          showActions && !busy ? 'opacity-100' : 'opacity-0',
          busy ? 'cursor-wait' : 'cursor-pointer',
        )}
      >
        {uploading
          ? <Loader2 className={cn(iconW, 'text-white animate-spin')} />
          : <Pencil className={cn(iconW, 'text-white')} />
        }
      </button>

      {/* ── Remove link (only when there is a photo) ── */}
      {src && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={busy}
          aria-label="Remove photo"
          className={cn(
            'absolute -bottom-1 -right-1',
            'w-6 h-6 rounded-full',
            'bg-white border border-[#d8e0d8] shadow-sm',
            'flex items-center justify-center',
            'text-red-400 hover:text-red-600 hover:bg-red-50',
            'transition-all duration-200',
            showActions ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
            busy ? 'cursor-wait' : 'cursor-pointer',
          )}
        >
          {removing
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <Trash2 className="w-3 h-3" />
          }
        </button>
      )}

      {/* ── "Add photo" nudge when empty and not hovering ── */}
      {!src && !uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            'absolute -bottom-1 -right-1',
            'w-6 h-6 rounded-full',
            'bg-[#3a7d44] border-2 border-white shadow-sm',
            'flex items-center justify-center',
            'text-white',
            'transition-colors',
            'hover:bg-[#2d5a31]',
          )}
          aria-label="Add profile photo"
        >
          <Camera className="w-3 h-3" />
        </button>
      )}

      {/* ── Hidden file input ── */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_ATTR}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Reset so the same file can be re-selected
          e.target.value = '';
        }}
      />
    </div>
  );
}
