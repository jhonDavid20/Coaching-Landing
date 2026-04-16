'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/session-provider';
import { getCoachStats, getCoachClients, CoachStats, CoachClient } from '@/actions/coach';
import {
  Users,
  TrendingUp,
  DollarSign,
  CalendarClock,
  RefreshCw,
  Dumbbell,
  Clock,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtRelativeDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays < 7) return `In ${diffDays} days`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#d8e0d8] p-5 flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', gradient)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-[#0f1f10] leading-none">{value}</p>
        <p className="text-sm text-[#617061] mt-0.5">{label}</p>
        {sub && <p className="text-xs text-[#617061] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#d8e0d8] p-5 h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#d8e0d8] h-72" />
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#d8e0d8] h-72" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CoachOverviewPage() {
  const t = useTranslations('coachDashboard');
  const { user } = useAuth();
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [clients, setClients] = useState<CoachClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.firstName ?? user?.username ?? '';

  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const [statsRes, clientsRes] = await Promise.all([getCoachStats(), getCoachClients()]);
      if (statsRes.success) setStats(statsRes.stats);
      if (clientsRes.success) setClients(clientsRes.clients);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <OverviewSkeleton />;

  const activeClients = clients.filter((c) => c.status === 'active');
  const trialClients = clients.filter((c) => c.status === 'trial');

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1f10]">
            {t('greeting', { name: firstName })}
          </h1>
          <p className="text-sm text-[#617061] mt-0.5">{t('greetingSubtitle')}</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#617061] hover:bg-[#f0f4f0] rounded-lg transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          {t('refresh')}
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label={t('activeClients')}
          value={stats?.activeClients ?? activeClients.length}
          sub={t('trialClientsCount', { n: stats?.trialClients ?? trialClients.length })}
          icon={Users}
          gradient="bg-[#3a7d44]"
        />
        <StatCard
          label={t('sessionsThisMonth')}
          value={stats?.sessionsThisMonth ?? 0}
          icon={CalendarClock}
          gradient="bg-[#52a85e]"
        />
        <StatCard
          label={t('revenueThisMonth')}
          value={fmtCurrency(stats?.revenueThisMonth ?? 0)}
          icon={DollarSign}
          gradient="bg-[#2d5a31]"
        />
        <StatCard
          label={t('totalClients')}
          value={clients.length}
          sub={t('allTime')}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* ── Lower panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Active client highlights ── */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#d8e0d8] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ddf0df] flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="text-sm font-semibold text-[#0f1f10]">{t('activeClientsTitle')}</h2>
          </div>
          <div className="divide-y divide-gray-100 divide-[#d8e0d8]">
            {activeClients.slice(0, 5).length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-[#617061]">{t('noActiveClients')}</div>
            )}
            {activeClients.slice(0, 5).map((client) => {
              const goalMap: Record<string, string> = {
                weight_loss: t('goalWeightLoss'),
                muscle_gain: t('goalMuscleGain'),
                maintenance: t('goalMaintenance'),
                endurance: t('goalEndurance'),
              };
              const goal = client.profile?.fitnessGoal;
              return (
                <div key={client.id} className="px-6 py-4 flex items-center gap-4 hover:bg-[#f6f8f5] transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#162318] flex items-center justify-center flex-shrink-0 text-white text-sm font-bold overflow-hidden">
                    {client.avatar
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={client.avatar} alt={`${client.firstName} ${client.lastName}`} className="w-full h-full object-cover" />
                      : getInitials(client.firstName, client.lastName)}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0f1f10] truncate">
                      {client.firstName} {client.lastName}
                    </p>
                    {goal && (
                      <p className="text-xs text-[#617061] mt-0.5">{goalMap[goal] ?? goal}</p>
                    )}
                  </div>
                  {/* Sessions */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[#0f1f10]">{client.sessionsCompleted}</p>
                    <p className="text-xs text-[#617061]">{t('sessions')}</p>
                  </div>
                  {/* Next session */}
                  {client.nextSessionAt && (
                    <div className="hidden sm:flex flex-col items-end flex-shrink-0 min-w-[80px]">
                      <span className="text-xs font-medium text-[#3a7d44]">
                        {fmtRelativeDate(client.nextSessionAt)}
                      </span>
                      <span className="text-xs text-[#617061]">{fmtTime(client.nextSessionAt)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {activeClients.length > 5 && (
            <div className="px-6 py-3 border-t border-[#d8e0d8] text-center">
              <p className="text-xs text-[#617061]">{t('andMore', { n: activeClients.length - 5 })}</p>
            </div>
          )}
        </div>

        {/* ── Upcoming sessions ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#d8e0d8] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ddf0df] flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-purple-500" />
            </div>
            <h2 className="text-sm font-semibold text-[#0f1f10]">{t('upcomingSessions')}</h2>
          </div>
          <div className="divide-y divide-gray-100 divide-[#d8e0d8]">
            {(!stats?.upcomingSessions || stats.upcomingSessions.length === 0) && (
              <div className="px-6 py-10 text-center text-sm text-[#617061]">{t('noUpcomingSessions')}</div>
            )}
            {(stats?.upcomingSessions ?? []).map((session) => (
              <div key={session.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0f1f10] truncate">{session.clientName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#617061]">{fmtRelativeDate(session.scheduledAt)}</span>
                      <span className="text-[#d8e0d8]">·</span>
                      <span className="text-xs text-[#617061]">{fmtTime(session.scheduledAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {session.type === 'trial' ? (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-medium">
                        <Flame className="w-3 h-3" /> {t('trial')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-teal-500/15 text-[#3a7d44] border border-teal-500/25 font-medium">
                        <Dumbbell className="w-3 h-3" /> {t('regular')}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-[#617061]">
                      <Clock className="w-3 h-3" /> {session.durationMinutes}m
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
