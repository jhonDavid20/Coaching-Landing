'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/components/auth/session-provider';
import { getAdminStats, AdminStats } from '@/actions/admin';
import { createInvite } from '@/actions/invites';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  UserPlus,
  Mail,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ── Colour palette ─────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  admin:  '#162318',
  coach:  '#3a7d44',
  client: '#52a85e',
  user:   '#c8dcc9',
};
const FALLBACK_COLORS = ['#162318', '#3a7d44', '#52a85e', '#c8dcc9', '#ddf0df'];

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtShortDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Sub-components ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconBg: string;   // bg + border + text classes for icon container
  delta?: string;
}

function StatCard({ label, value, icon: Icon, iconBg, delta }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#d8e0d8] p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#617061] font-medium uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="text-2xl font-bold text-[#0f1f10] leading-tight">
          {value}
        </p>
        {delta && (
          <p className="text-xs text-[#3a7d44] font-medium mt-0.5">{delta}</p>
        )}
      </div>
    </div>
  );
}

// ── Custom tooltip for Area chart ─────────────────────────────────────────

function AreaTooltip({ active, payload, label, t }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  t: (k: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const n = payload[0].value;
  return (
    <div className="bg-white border border-[#d8e0d8] rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-[#617061] mb-1">{label}</p>
      <p className="font-semibold text-[#0f1f10]">
        {n} {n !== 1 ? t('signups') : t('signup')}
      </p>
    </div>
  );
}

// ── Custom tooltip for Pie chart ──────────────────────────────────────────

function PieTooltip({ active, payload, t }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
  t: (k: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const n = payload[0].value;
  return (
    <div className="bg-white border border-[#d8e0d8] rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-[#0f1f10] capitalize">{payload[0].name}</p>
      <p className="text-[#617061]">{n} {n !== 1 ? t('users') : t('user')}</p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f0faf0] rounded-xl ${className}`} />;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-24" />
    </div>
  );
}

// ── Quick-invite form ─────────────────────────────────────────────────────

function QuickInviteForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const locale = useLocale();
  const t = useTranslations('adminOverview');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    const res = await createInvite(email.trim());
    if (res.success) {
      toast.success(t('inviteSent'));
      setEmail('');
      onSuccess();
    } else {
      toast.error(res.message || t('inviteFailed'));
    }
    setSending(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#d8e0d8] p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#ddf0df] border border-[#3a7d44]/20 flex items-center justify-center">
            <Send className="w-4 h-4 text-[#3a7d44]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0f1f10]">{t('quickInviteTitle')}</p>
            <p className="text-xs text-[#617061]">{t('quickInviteSubtitle')}</p>
          </div>
        </div>
        <form onSubmit={handleSend} className="flex flex-1 gap-2">
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="coach@example.com"
            required
            className="flex-1 border-[#d8e0d8] bg-white text-[#0f1f10] focus-visible:ring-[#3a7d44] text-sm"
          />
          <Button
            type="submit"
            disabled={sending || !email.trim()}
            className="bg-[#3a7d44] hover:bg-[#52a85e] text-white transition-colors flex-shrink-0"
          >
            {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('sendButton')}
          </Button>
        </form>
        <button
          onClick={() => window.location.href = `/${locale}/dashboard/admin/invites`}
          className="flex items-center gap-1 text-xs text-[#3a7d44] hover:text-[#162318] transition-colors flex-shrink-0 whitespace-nowrap"
        >
          {t('manageAll')} <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('adminOverview');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [fetching, setFetching] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Guard
  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.replace(`/${locale}/dashboard/profile`);
    }
  }, [authLoading, user, router, locale]);

  const load = useCallback(async () => {
    setFetching(true);
    const res = await getAdminStats();
    if (res.success && res.stats) {
      setStats(res.stats);
      setLastRefreshed(new Date());
    } else {
      toast.error(res.message || t('failedToLoad'));
    }
    setFetching(false);
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') load();
  }, [authLoading, user, load]);

  if (authLoading || (fetching && !stats)) return <OverviewSkeleton />;
  if (user?.role !== 'admin') return null;

  // ── Derived data for charts ──────────────────────────────────────────

  const signupsData = (stats?.signupsByDay ?? []).map(d => ({
    date: fmtShortDate(d.date),
    count: d.count,
  }));

  const roleData = Object.entries(stats?.users.byRole ?? {}).map(([name, value]) => ({
    name: capitalize(name),
    value,
    key: name,
  }));

  const totalSignups30d = signupsData.reduce((s, d) => s + d.count, 0);
  const peakDay = signupsData.reduce((max, d) => d.count > max.count ? d : max, { date: '—', count: 0 });

  const xTickCount = Math.max(1, Math.floor(signupsData.length / 6));

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">
        <div className="h-1 bg-[#3a7d44]" />
        <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#ddf0df] border border-[#3a7d44]/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#3a7d44]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0f1f10]">{t('heading')}</h1>
              <p className="text-xs text-[#617061]">
                {lastRefreshed
                  ? t('lastRefreshed', { time: lastRefreshed.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) })
                  : t('loading')}
              </p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={fetching}
            className="flex items-center gap-1.5 text-sm text-[#617061] hover:text-[#3a7d44] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('totalUsers')}
          value={stats?.users.total ?? 0}
          icon={Users}
          iconBg="bg-[#ddf0df] border border-[#3a7d44]/20 text-[#3a7d44]"
        />
        <StatCard
          label={t('newThisWeek')}
          value={stats?.users.newThisWeek ?? 0}
          icon={UserPlus}
          iconBg="bg-[#ddf0df] border border-[#3a7d44]/20 text-[#3a7d44]"
          delta={stats?.users.newThisWeek ? t('sinceMonday', { n: stats.users.newThisWeek }) : undefined}
        />
        <StatCard
          label={t('coaches')}
          value={stats?.users.byRole?.coach ?? stats?.users.byRole?.Coach ?? 0}
          icon={ShieldCheck}
          iconBg="bg-[#162318]/10 border border-[#162318]/20 text-[#162318]"
        />
        <StatCard
          label={t('pendingInvites')}
          value={stats?.invites.pending ?? 0}
          icon={Mail}
          iconBg="bg-amber-50 border border-amber-200 text-amber-600"
        />
      </div>

      {/* ── Charts row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart — signups/30d */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#d8e0d8] p-5">
          <div className="flex items-start justify-between mb-4 gap-2">
            <div>
              <p className="text-sm font-semibold text-[#0f1f10] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#3a7d44]" />
                {t('signupsChart')}
              </p>
              <p className="text-xs text-[#617061] mt-0.5">
                {t('signupsSummary', { total: totalSignups30d, count: peakDay.count, date: peakDay.date })}
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={signupsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3a7d44" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3a7d44" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8e0d8" strokeOpacity={0.6} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#617061' }}
                tickLine={false}
                axisLine={false}
                interval={xTickCount}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#617061' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<AreaTooltip t={t} />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3a7d44"
                strokeWidth={2}
                fill="url(#signupGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#3a7d44', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut — users by role */}
        <div className="bg-white rounded-2xl border border-[#d8e0d8] p-5">
          <p className="text-sm font-semibold text-[#0f1f10] flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#3a7d44]" />
            {t('usersByRole')}
          </p>
          <p className="text-xs text-[#617061] mb-3">
            {stats?.users.total ?? 0} {t('users')}
          </p>
          {roleData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-[#617061]">
              {t('noData')}
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {roleData.map((entry, i) => (
                      <Cell
                        key={entry.key}
                        fill={ROLE_COLORS[entry.key] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip t={t} />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="space-y-1.5 mt-2">
                {roleData.map((entry, i) => {
                  const color = ROLE_COLORS[entry.key] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                  const pct = stats?.users.total
                    ? Math.round((entry.value / stats.users.total) * 100)
                    : 0;
                  return (
                    <div key={entry.key} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[#617061] capitalize">{entry.name}</span>
                      </div>
                      <span className="font-medium text-[#0f1f10]">
                        {entry.value} <span className="text-[#617061] font-normal">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Invite summary strip ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#d8e0d8] p-5">
        <p className="text-sm font-semibold text-[#0f1f10] mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-amber-500" />
          {t('invitePipeline')}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { labelKey: 'totalSent', value: stats?.invites.total,    color: 'text-[#0f1f10]' },
            { labelKey: 'pending',   value: stats?.invites.pending,  color: 'text-amber-500' },
            { labelKey: 'accepted',  value: stats?.invites.accepted, color: 'text-[#3a7d44]' },
            { labelKey: 'expired',   value: stats?.invites.expired,  color: 'text-red-400' },
          ] as const).map(item => (
            <div key={item.labelKey} className="text-center p-3 bg-[#f6f8f5] rounded-xl">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value ?? 0}</p>
              <p className="text-xs text-[#617061] mt-0.5">{t(item.labelKey)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick invite ──────────────────────────────────────────────── */}
      <QuickInviteForm onSuccess={load} />

    </div>
  );
}
