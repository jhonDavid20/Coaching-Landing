'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/components/auth/session-provider';
import { createInvite, listInvites, revokeInvite, permanentDeleteInvite, Invite, InviteListResult } from '@/actions/invites';
import { toast } from 'sonner';
import { Mail, Plus, Copy, Check, RefreshCw, Clock, UserCheck, Ban, ShieldOff, X, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Invite['status'] }) {
  const map = {
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    },
    accepted: {
      label: 'Accepted',
      icon: UserCheck,
      className: 'bg-[#ddf0df] text-[#3a7d44] border-[#3a7d44]/20',
    },
    expired: {
      label: 'Expired',
      icon: Ban,
      className: 'bg-red-500/10 text-red-500 border-red-500/30',
    },
  };

  const cfg = map[status] ?? map.pending;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full border ${cfg.className}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ── Copy-link button ──────────────────────────────────────────────────────────

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const locale = useLocale();

  const handleCopy = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/${locale}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy invite link"
      className="p-1.5 rounded-md text-[#617061] hover:text-[#3a7d44] hover:bg-[#ddf0df] transition-colors"
    >
      {copied ? <Check className="w-4 h-4 text-[#3a7d44]" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

// ── Revoke button (pending only) ──────────────────────────────────────────────

function RevokeButton({ id, onRevoked }: { id: string; onRevoked: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const res = await revokeInvite(id);
    if (res.success) {
      toast.success('Invite revoked');
      onRevoked();
    } else {
      toast.error(res.message || 'Failed to revoke');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Revoke invite"
      className="p-1 rounded-md text-[#617061] hover:text-orange-500 hover:bg-orange-500/10 transition-colors disabled:opacity-50"
    >
      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldX className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── Delete button (any status) ────────────────────────────────────────────────

function DeleteButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const res = await permanentDeleteInvite(id);
    if (res.success) {
      toast.success('Invite deleted');
      onDeleted();
    } else {
      toast.error(res.message || 'Failed to delete');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Delete invite"
      className="p-1 rounded-md text-[#617061] hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-[#f6f8f5] ">
          <div className="h-4 bg-gray-200  rounded w-1/3" />
          <div className="h-4 bg-gray-200  rounded w-20" />
          <div className="h-4 bg-gray-200  rounded w-32 ml-auto" />
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminInvitesPage() {
  const t = useTranslations('adminInvites');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  const [result, setResult] = useState<InviteListResult | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);

  // ── Guard: redirect non-admins ───────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.replace(`/${locale}/dashboard`);
    }
  }, [authLoading, user, router, locale]);

  // ── Load invites ─────────────────────────────────────────────────────────
  const load = useCallback(async (p: number) => {
    setListLoading(true);
    const data = await listInvites(p, 20);
    setResult(data);
    setListLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      load(page);
    }
  }, [authLoading, user, page, load]);

  // ── Create invite ─────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setCreating(true);
    const res = await createInvite(email.trim());

    if (res.success) {
      toast.success(t('createSuccess'));
      setEmail('');
      load(page);
    } else {
      toast.error(res.message || t('createError'));
    }
    setCreating(false);
  };

  if (authLoading) return null;
  if (user?.role !== 'admin') return null;

  const invites = result?.invites ?? [];
  const pagination = result?.pagination;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">
        <div className="h-2 bg-[#3a7d44]" />
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#ddf0df] border border-[#3a7d44]/20 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-[#3a7d44]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0f1f10]">{t('title')}</h1>
            <p className="text-sm text-[#617061]">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Create invite form */}
      <div className="bg-white rounded-2xl border border-[#d8e0d8] p-6">
        <h2 className="text-sm font-semibold text-[#0f1f10] mb-4">{t('createTitle')}</h2>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="invite-email" className="sr-only">
              {t('emailLabel')}
            </Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
              className="bg-background border-[#d8e0d8]  text-[#0f1f10] "
            />
          </div>
          <Button
            type="submit"
            disabled={creating || !email.trim()}
            className="flex items-center gap-2 bg-[#3a7d44] text-white hover:opacity-90 transition-opacity"
          >
            {creating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {creating ? t('creating') : t('createButton')}
          </Button>
        </form>
      </div>

      {/* Invite list */}
      <div className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">
        {/* List header */}
        <div className="px-6 py-4 border-b border-[#d8e0d8] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0f1f10]">
            {t('listTitle')}
            {pagination && (
              <span className="ml-2 text-xs font-normal text-[#617061]">
                ({pagination.total} {t('total')})
              </span>
            )}
          </h2>
          <button
            onClick={() => load(page)}
            className="p-1.5 rounded-md text-[#617061] hover:text-[#3a7d44] hover:bg-[#ddf0df] transition-colors"
            title={t('refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${listLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {listLoading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : invites.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ShieldOff className="w-10 h-10 mx-auto text-[#c8dcc9]  mb-3" />
            <p className="text-sm text-[#617061]">{t('noInvites')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0f4f0] ">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[#f6f8f5]  transition-colors"
              >
                {/* Email */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0f1f10] truncate">{invite.email}</p>
                  <p className="text-xs text-[#617061] mt-0.5">
                    {t('created')}{' '}
                    {new Date(invite.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Status */}
                <StatusBadge status={invite.status} />

                {/* Actions */}
                <div className="flex items-center gap-0.5">
                  {/* Copy link — pending only */}
                  {invite.status === 'pending' && (
                    <CopyLinkButton token={invite.token} />
                  )}
                  {/* Revoke — pending only (blocks used invites on backend) */}
                  {invite.status === 'pending' && (
                    <RevokeButton id={invite.id} onRevoked={() => load(page)} />
                  )}
                  {/* Delete — always available, calls /permanent */}
                  <DeleteButton id={invite.id} onDeleted={() => load(page)} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#d8e0d8] flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || listLoading}
              onClick={() => setPage((p) => p - 1)}
            >
              {t('prev')}
            </Button>
            <span className="text-xs text-[#617061]">
              {t('pageOf', { page, total: pagination.totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages || listLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('next')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
