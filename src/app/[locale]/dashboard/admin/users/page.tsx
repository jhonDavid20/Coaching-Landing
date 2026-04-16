'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/session-provider';
import {
  getAdminUsers,
  lockUser,
  unlockUser,
  removeUserAvatar,
  AdminUser,
} from '@/actions/admin';
import { toast } from 'sonner';
import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  Lock,
  Unlock,
  ImageOff,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── Role badge ────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, string> = {
  admin:  'bg-[#162318]/10 text-[#162318] border-[#162318]/20',
  coach:  'bg-[#ddf0df] text-[#2d5a31] border-[#3a7d44]/30',
  client: 'bg-sky-50 text-sky-700 border-sky-200',
};

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_STYLES[role] ?? 'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border capitalize', cls)}>
      {role}
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ isActive, t }: { isActive: boolean; t: (k: string) => string }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border bg-[#ddf0df] text-[#2d5a31] border-[#3a7d44]/30">
      <span className="w-1.5 h-1.5 rounded-full bg-[#3a7d44]" />
      {t('statusActive')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border bg-red-50 text-red-600 border-red-200">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      {t('statusLocked')}
    </span>
  );
}

// ── Avatar cell ───────────────────────────────────────────────────────────

function UserAvatar({ user }: { user: AdminUser }) {
  return (
    <div className="w-9 h-9 rounded-full bg-[#3a7d44] flex-shrink-0 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
      {user.avatar
        ? <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
        : getInitials(user.firstName, user.lastName)
      }
    </div>
  );
}

// ── Row action menu ───────────────────────────────────────────────────────

interface ActionMenuProps {
  user: AdminUser;
  onLock: (id: string) => void;
  onUnlock: (id: string) => void;
  onRemoveAvatar: (id: string) => void;
  busy: boolean;
  t: (k: string) => string;
}

function ActionMenu({ user, onLock, onUnlock, onRemoveAvatar, busy, t }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      // Measure space below the button — flip upward if less than 120px
      const rect = btnRef.current.getBoundingClientRect();
      setOpenUp(window.innerHeight - rect.bottom < 120);
    }
    setOpen(v => !v);
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        disabled={busy}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#617061] hover:bg-[#f0faf0] hover:text-[#162318] transition-colors disabled:opacity-40"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className={cn(
          'absolute right-0 z-50 w-48 bg-white rounded-xl border border-[#d8e0d8] shadow-lg py-1 text-sm',
          openUp ? 'bottom-9' : 'top-9',
        )}>
          {user.isActive ? (
            <button
              onClick={() => { setOpen(false); onLock(user.id); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              {t('actionLock')}
            </button>
          ) : (
            <button
              onClick={() => { setOpen(false); onUnlock(user.id); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[#3a7d44] hover:bg-[#f0faf0] transition-colors"
            >
              <Unlock className="w-3.5 h-3.5" />
              {t('actionUnlock')}
            </button>
          )}

          {user.avatar && (
            <>
              <div className="my-1 border-t border-[#f0f4f0]" />
              <button
                onClick={() => { setOpen(false); onRemoveAvatar(user.id); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <ImageOff className="w-3.5 h-3.5" />
                {t('actionRemoveAvatar')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-2 mt-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-[#f0faf0]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-[#f0faf0] rounded w-36" />
            <div className="h-3 bg-[#f0faf0] rounded w-48" />
          </div>
          <div className="h-5 w-14 bg-[#f0faf0] rounded-full" />
          <div className="h-5 w-16 bg-[#f0faf0] rounded-full" />
          <div className="h-3.5 w-24 bg-[#f0faf0] rounded hidden sm:block" />
          <div className="w-8 h-8 bg-[#f0faf0] rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────

interface ConfirmModalProps {
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ message, confirmLabel, confirmClass, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#d8e0d8] shadow-xl p-6 max-w-sm w-full mx-4">
        <p className="text-sm text-[#0f1f10] font-medium mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} className="border-[#d8e0d8] text-[#617061] hover:bg-[#f6f8f5]">
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors', confirmClass)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

type PendingAction =
  | { type: 'lock'; user: AdminUser }
  | { type: 'unlock'; user: AdminUser }
  | { type: 'removeAvatar'; user: AdminUser };

export default function AdminUsersPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('adminUsers');

  const [users, setUsers]             = useState<AdminUser[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [fetching, setFetching]       = useState(true);

  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'locked' | ''>('');

  const [busyIds, setBusyIds]         = useState<Set<string>>(new Set());
  const [pending, setPending]         = useState<PendingAction | null>(null);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guard
  useEffect(() => {
    if (!authLoading && authUser?.role !== 'admin') {
      router.replace(`/${locale}/dashboard/profile`);
    }
  }, [authLoading, authUser, router, locale]);

  const load = useCallback(async (pg = page) => {
    setFetching(true);
    const res = await getAdminUsers({ page: pg, search, role: roleFilter, status: statusFilter });
    if (res.success) {
      setUsers(res.users);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } else {
      toast.error(res.error ?? t('loadError'));
    }
    setFetching(false);
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    if (!authLoading && authUser?.role === 'admin') load(1);
  }, [authLoading, authUser, search, roleFilter, statusFilter]);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setPage(1), 300);
  };

  const goToPage = (pg: number) => {
    setPage(pg);
    load(pg);
  };

  // ── Actions ──────────────────────────────────────────────────────────────

  const setBusy = (id: string, busy: boolean) =>
    setBusyIds(prev => { const n = new Set(prev); busy ? n.add(id) : n.delete(id); return n; });

  const handleLockConfirm = async () => {
    if (!pending || pending.type !== 'lock') return;
    const { user: u } = pending;
    setPending(null);
    setBusy(u.id, true);
    const res = await lockUser(u.id);
    if (res.success) {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: false } : x));
      toast.success(t('lockSuccess', { name: `${u.firstName} ${u.lastName}` }));
    } else {
      toast.error(res.message ?? t('actionError'));
    }
    setBusy(u.id, false);
  };

  const handleUnlockConfirm = async () => {
    if (!pending || pending.type !== 'unlock') return;
    const { user: u } = pending;
    setPending(null);
    setBusy(u.id, true);
    const res = await unlockUser(u.id);
    if (res.success) {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: true } : x));
      toast.success(t('unlockSuccess', { name: `${u.firstName} ${u.lastName}` }));
    } else {
      toast.error(res.message ?? t('actionError'));
    }
    setBusy(u.id, false);
  };

  const handleRemoveAvatarConfirm = async () => {
    if (!pending || pending.type !== 'removeAvatar') return;
    const { user: u } = pending;
    setPending(null);
    setBusy(u.id, true);
    const res = await removeUserAvatar(u.id);
    if (res.success) {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, avatar: undefined } : x));
      toast.success(t('avatarRemoved', { name: `${u.firstName} ${u.lastName}` }));
    } else {
      toast.error(res.message ?? t('actionError'));
    }
    setBusy(u.id, false);
  };

  const handleConfirm = () => {
    if (!pending) return;
    if (pending.type === 'lock') handleLockConfirm();
    else if (pending.type === 'unlock') handleUnlockConfirm();
    else handleRemoveAvatarConfirm();
  };

  if (authLoading) return null;
  if (authUser?.role !== 'admin') return null;

  // ── Derived confirm modal content ─────────────────────────────────────

  let confirmMessage = '';
  let confirmLabel = '';
  let confirmClass = 'bg-red-500 hover:bg-red-600';

  if (pending) {
    const name = `${pending.user.firstName} ${pending.user.lastName}`;
    if (pending.type === 'lock') {
      confirmMessage = t('confirmLock', { name });
      confirmLabel = t('actionLock');
      confirmClass = 'bg-red-500 hover:bg-red-600';
    } else if (pending.type === 'unlock') {
      confirmMessage = t('confirmUnlock', { name });
      confirmLabel = t('actionUnlock');
      confirmClass = 'bg-[#3a7d44] hover:bg-[#52a85e]';
    } else {
      confirmMessage = t('confirmRemoveAvatar', { name });
      confirmLabel = t('actionRemoveAvatar');
      confirmClass = 'bg-amber-500 hover:bg-amber-600';
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">
        <div className="h-1 bg-[#3a7d44]" />
        <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#ddf0df] border border-[#3a7d44]/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-[#3a7d44]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0f1f10]">{t('heading')}</h1>
              <p className="text-xs text-[#617061]">{t('subheading', { total })}</p>
            </div>
          </div>
          <button
            onClick={() => load(page)}
            disabled={fetching}
            className="flex items-center gap-1.5 text-sm text-[#617061] hover:text-[#3a7d44] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', fetching && 'animate-spin')} />
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#d8e0d8] px-5 py-4 flex flex-wrap items-center gap-3">

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#617061]" />
          <Input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="pl-9 border-[#d8e0d8] bg-white text-[#0f1f10] text-sm focus-visible:ring-[#3a7d44]"
          />
          {search && (
            <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#617061] hover:text-[#0f1f10]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="border border-[#d8e0d8] rounded-lg px-3 py-2 text-sm text-[#0f1f10] bg-white focus:outline-none focus:ring-1 focus:ring-[#3a7d44]"
        >
          <option value="">{t('filterAllRoles')}</option>
          <option value="admin">{t('roleAdmin')}</option>
          <option value="coach">{t('roleCoach')}</option>
          <option value="client">{t('roleClient')}</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as 'active' | 'locked' | ''); setPage(1); }}
          className="border border-[#d8e0d8] rounded-lg px-3 py-2 text-sm text-[#0f1f10] bg-white focus:outline-none focus:ring-1 focus:ring-[#3a7d44]"
        >
          <option value="">{t('filterAllStatus')}</option>
          <option value="active">{t('statusActive')}</option>
          <option value="locked">{t('statusLocked')}</option>
        </select>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">

        {/* Column headers — desktop only */}
        <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-5 py-3 border-b border-[#f0f4f0] bg-[#f6f8f5]">
          <div className="w-9" />
          <p className="text-xs font-semibold text-[#617061] uppercase tracking-wide">{t('colUser')}</p>
          <p className="text-xs font-semibold text-[#617061] uppercase tracking-wide">{t('colRole')}</p>
          <p className="text-xs font-semibold text-[#617061] uppercase tracking-wide">{t('colStatus')}</p>
          <p className="text-xs font-semibold text-[#617061] uppercase tracking-wide">{t('colJoined')}</p>
          <div className="w-8" />
        </div>

        {fetching ? (
          <TableSkeleton />
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#617061] gap-2">
            <ShieldCheck className="w-8 h-8 opacity-30" />
            <p className="text-sm">{t('noUsers')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#f0f4f0]">
            {users.map(u => (
              <li key={u.id} className={cn(
                'grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-5 py-3.5 hover:bg-[#fafcfa] transition-colors',
                !u.isActive && 'bg-red-50/30',
              )}>
                {/* Avatar */}
                <UserAvatar user={u} />

                {/* Name + email */}
                <div className="min-w-0">
                  <p className={cn('text-sm font-semibold text-[#0f1f10] truncate', !u.isActive && 'text-red-700')}>
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs text-[#617061] truncate">{u.email}</p>
                </div>

                {/* Role — hidden on mobile, shown via badge below */}
                <div className="hidden sm:block">
                  <RoleBadge role={u.role} />
                </div>

                {/* Status */}
                <div className="hidden sm:block">
                  <StatusBadge isActive={u.isActive} t={t} />
                </div>

                {/* Joined date */}
                <p className="hidden sm:block text-xs text-[#617061] whitespace-nowrap">
                  {fmtDate(u.createdAt)}
                </p>

                {/* Actions */}
                <ActionMenu
                  user={u}
                  onLock={id => setPending({ type: 'lock', user: users.find(x => x.id === id)! })}
                  onUnlock={id => setPending({ type: 'unlock', user: users.find(x => x.id === id)! })}
                  onRemoveAvatar={id => setPending({ type: 'removeAvatar', user: users.find(x => x.id === id)! })}
                  busy={busyIds.has(u.id)}
                  t={t}
                />
              </li>
            ))}
          </ul>
        )}

        {/* ── Pagination ──────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#f0f4f0] bg-[#f6f8f5]">
            <p className="text-xs text-[#617061]">
              {t('pageOf', { page, total: totalPages })}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || fetching}
                className="w-8 h-8 rounded-lg border border-[#d8e0d8] flex items-center justify-center text-[#617061] hover:bg-[#f0faf0] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || fetching}
                className="w-8 h-8 rounded-lg border border-[#d8e0d8] flex items-center justify-center text-[#617061] hover:bg-[#f0faf0] disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm modal ────────────────────────────────────────────── */}
      {pending && (
        <ConfirmModal
          message={confirmMessage}
          confirmLabel={confirmLabel}
          confirmClass={confirmClass}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}

    </div>
  );
}
