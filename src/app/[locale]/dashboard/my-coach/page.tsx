'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/session-provider';
import { getCoachProfileById, CoachPublicProfile } from '@/actions/coach';
import { getMyActivePackage, ClientPackage } from '@/actions/packages';
import { getFullUserProfile } from '@/actions/user';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Video,
  MapPin,
  Globe,
  Instagram,
  Clock,
  Star,
  Calendar,
  ChevronRight,
  Loader2,
  UserX,
  Search,
  Languages,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Target,
  MessageCircle,
  Zap,
  BadgeCheck,
  TrendingUp,
  Gift,
  StickyNote,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function weeksRemaining(startDate?: string, durationWeeks?: number): number | null {
  if (!startDate || !durationWeeks) return null;
  const end = new Date(startDate).getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000;
  const remaining = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24 * 7));
  return Math.max(0, remaining);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function planEndDate(startDate?: string, durationWeeks?: number): string {
  if (!startDate || !durationWeeks) return '—';
  const end = new Date(startDate).getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000;
  return formatDate(new Date(end).toISOString());
}

// ─── Coaching type badge ──────────────────────────────────────────────────────

function CoachingTypeBadge({ type }: { type?: string }) {
  if (!type) return null;
  const map: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    online: {
      label: 'Online',
      icon: <Video className="w-3.5 h-3.5" />,
      cls: 'bg-[#ddf0df] text-[#2d5a31] border-[#3a7d44]/30',
    },
    in_person: {
      label: 'In-Person',
      icon: <MapPin className="w-3.5 h-3.5" />,
      cls: 'bg-[#f0faf0] text-[#2d5a31] border-[#3a7d44]/20',
    },
    hybrid: {
      label: 'Hybrid',
      icon: <Shuffle className="w-3.5 h-3.5" />,
      cls: 'bg-[#e8f4ea] text-[#2d5a31] border-[#3a7d44]/30',
    },
  };
  const cfg = map[type] ?? map.online;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border', cfg.cls)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'amber' | 'teal' | 'blue';
}) {
  const accentCls =
    accent === 'amber'
      ? 'text-amber-500'
      : accent === 'teal'
      ? 'text-[#3a7d44]'
      : accent === 'blue'
      ? 'text-[#3a7d44]'
      : 'text-[#0f1f10]';

  return (
    <div className="bg-white rounded-2xl border border-[#d8e0d8] p-4 text-center">
      <p className={cn('text-2xl font-bold', accentCls)}>{value}</p>
      <p className="text-xs font-medium text-[#617061] mt-0.5">{label}</p>
      {sub && <p className="text-xs text-[#617061] mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Session bubbles ──────────────────────────────────────────────────────────

function SessionBubbles({
  total,
  completed,
}: {
  total: number;
  completed: number;
}) {
  // Show at most 20 bubbles; if more sessions, show +N
  const displayMax = 20;
  const shown = Math.min(total, displayMax);
  const overflow = total > displayMax ? total - displayMax : 0;

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {Array.from({ length: shown }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center transition-all',
            i < completed
              ? 'bg-[#3a7d44] shadow-sm shadow-[#3a7d44]/30'
              : 'bg-[#f6f8f5] border border-[#d8e0d8]'
          )}
        >
          {i < completed && <CheckCircle2 className="w-3 h-3 text-white" />}
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-6 h-6 rounded-full bg-[#f6f8f5] border border-[#d8e0d8] flex items-center justify-center">
          <span className="text-[9px] font-bold text-[#617061]">+{overflow}</span>
        </div>
      )}
    </div>
  );
}

// ─── Plan timeline bar ────────────────────────────────────────────────────────

function PlanTimeline({
  startDate,
  durationWeeks,
}: {
  startDate?: string;
  durationWeeks: number;
}) {
  if (!startDate) return null;

  const start = new Date(startDate);
  const end = new Date(start.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);
  const now = Date.now();
  const total = end.getTime() - start.getTime();
  const elapsed = Math.min(Math.max(now - start.getTime(), 0), total);
  const pct = total > 0 ? Math.round((elapsed / total) * 100) : 0;

  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-[#617061] mb-1.5">
        <span>{formatDate(startDate)}</span>
        <span>{formatDate(end.toISOString())}</span>
      </div>
      <div className="relative h-2 bg-[#f6f8f5] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#3a7d44] rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        {/* Today marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-[#3a7d44] rounded-full shadow"
          style={{ left: `calc(${pct}% - 5px)` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[#617061] mt-1">
        <span>Start</span>
        <span className="text-[#3a7d44] font-medium">Today ({pct}%)</span>
        <span>End</span>
      </div>
    </div>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: ClientPackage }) {
  const pkg = plan.package;
  if (!pkg) return null;

  const total = pkg.sessionsIncluded;
  const completed = plan.sessionsCompleted ?? 0;
  const sessionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const weeksLeft = weeksRemaining(plan.startDate, pkg.durationWeeks);
  const isExpiringSoon = weeksLeft !== null && weeksLeft <= 2 && weeksLeft > 0;
  const isExpired = weeksLeft === 0;
  const hasGoals = plan.goals && plan.goals.length > 0;
  const hasNotes = !!plan.notes?.trim();
  const hasFeatures = pkg.features && pkg.features.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">
      {/* Plan header */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs font-medium text-[#617061] uppercase tracking-wide mb-1">Active Plan</p>
            <h3 className="text-lg font-bold text-[#0f1f10]">{pkg.name}</h3>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border capitalize flex-shrink-0',
              plan.status === 'active'
                ? 'bg-[#ddf0df] text-[#2d5a31] border-[#3a7d44]/30'
                : plan.status === 'completed'
                ? 'bg-[#f6f8f5] text-[#617061] border-[#d8e0d8]'
                : 'bg-red-500/10 text-red-500 border-red-500/30'
            )}
          >
            {plan.status === 'active' ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {plan.status}
          </span>
        </div>

        {pkg.description && (
          <p className="text-sm text-[#617061] mt-1 leading-relaxed">{pkg.description}</p>
        )}
      </div>

      {/* Timeline */}
      <div className="px-6 pb-5 border-b border-[#d8e0d8]">
        <PlanTimeline startDate={plan.startDate} durationWeeks={pkg.durationWeeks} />
      </div>

      {/* Session progress */}
      <div className="px-6 py-5 border-b border-[#d8e0d8]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-[#0f1f10]">Sessions</p>
            <p className="text-xs text-[#617061] mt-0.5">
              {completed} completed · {total - completed} remaining
            </p>
          </div>
          <span
            className={cn(
              'text-2xl font-bold tabular-nums',
              sessionPct === 100
                ? 'text-[#3a7d44]'
                : sessionPct >= 60
                ? 'text-[#3a7d44]'
                : 'text-[#0f1f10]'
            )}
          >
            {sessionPct}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-[#f6f8f5] rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-[#3a7d44] rounded-full transition-all duration-700"
            style={{ width: `${sessionPct}%` }}
          />
        </div>

        {/* Bubble map */}
        <SessionBubbles total={total} completed={completed} />
      </div>

      {/* Key plan numbers */}
      <div className="grid grid-cols-3 divide-x divide-[#d8e0d8] border-b border-[#d8e0d8]">
        <div className="px-4 py-4 text-center">
          <p className="text-base font-bold text-[#0f1f10]">{pkg.durationWeeks}w</p>
          <p className="text-[11px] text-[#617061] mt-0.5">duration</p>
        </div>
        <div className="px-4 py-4 text-center">
          <p
            className={cn(
              'text-base font-bold',
              isExpired ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : 'text-[#0f1f10]'
            )}
          >
            {isExpired ? 'Ended' : weeksLeft !== null ? `${weeksLeft}w` : '—'}
          </p>
          <p className="text-[11px] text-[#617061] mt-0.5">
            {isExpired ? '' : 'weeks left'}
          </p>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="text-base font-bold text-[#0f1f10]">${pkg.priceUSD}</p>
          <p className="text-[11px] text-[#617061] mt-0.5">plan price</p>
        </div>
      </div>

      {/* What's included */}
      {hasFeatures && (
        <div className="px-6 py-5 border-b border-[#d8e0d8]">
          <p className="text-xs font-semibold text-[#617061] uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5" />
            What&apos;s included
          </p>
          <div className="space-y-2">
            {pkg.features!.map((feat, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <BadgeCheck className="w-4 h-4 text-[#3a7d44] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#617061]">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
      {hasGoals && (
        <div className="px-6 py-5 border-b border-[#d8e0d8]">
          <p className="text-xs font-semibold text-[#617061] uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Your goals
          </p>
          <div className="space-y-2">
            {plan.goals!.map((goal, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full border-2 border-[#3a7d44] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-[#3a7d44]">{i + 1}</span>
                </div>
                <span className="text-sm text-[#617061]">{goal}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coach notes */}
      {hasNotes && (
        <div className="px-6 py-5 border-b border-[#d8e0d8]">
          <p className="text-xs font-semibold text-[#617061] uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <StickyNote className="w-3.5 h-3.5" />
            Note from your coach
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{plan.notes}</p>
          </div>
        </div>
      )}

      {/* Expiry warnings */}
      {(isExpiringSoon || isExpired) && (
        <div
          className={cn(
            'mx-6 mb-5 mt-1 p-3 rounded-xl border text-xs font-medium',
            isExpired
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-400'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400'
          )}
        >
          {isExpired
            ? 'Your plan has ended. Reach out to your coach to start a new one.'
            : `⚠ Only ${weeksLeft} week${weeksLeft === 1 ? '' : 's'} left — talk to your coach about renewal.`}
        </div>
      )}
    </div>
  );
}

// ─── Session-type card ────────────────────────────────────────────────────────

function SessionTypeCard({ coach }: { coach: CoachPublicProfile }) {
  const type = coach.coachingType ?? 'online';
  const isOnline = type === 'online' || type === 'hybrid';
  const isInPerson = type === 'in_person' || type === 'hybrid';

  return (
    <div className="bg-white rounded-2xl border border-[#d8e0d8] p-6 space-y-4">
      <p className="text-xs font-medium text-[#617061] uppercase tracking-wide">How you train</p>

      {isOnline && (
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ddf0df] border border-[#3a7d44]/20 flex items-center justify-center flex-shrink-0">
            <Video className="w-4 h-4 text-[#3a7d44]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0f1f10]">Online Sessions</p>
            <p className="text-xs text-[#617061] mt-0.5">
              {coach.timezone
                ? `Coach is in ${coach.timezone.replace(/_/g, ' ')}`
                : 'Remote coaching via video call'}
            </p>
            {coach.sessionDurationMinutes && (
              <p className="text-xs text-[#617061] mt-0.5">
                <Clock className="inline w-3 h-3 mr-1" />
                {coach.sessionDurationMinutes} min per session
              </p>
            )}
          </div>
        </div>
      )}

      {isInPerson && (
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#0f1f10]">In-Person Sessions</p>
            <p className="text-xs text-[#617061] mt-0.5">Meet with your coach at an agreed location</p>
            {coach.sessionDurationMinutes && (
              <p className="text-xs text-[#617061] mt-0.5">
                <Clock className="inline w-3 h-3 mr-1" />
                {coach.sessionDurationMinutes} min per session
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Coach contact section ────────────────────────────────────────────────────

function ContactCoachCard({ coach }: { coach: CoachPublicProfile }) {
  const hasLinks = coach.instagramHandle || coach.websiteUrl || coach.email;
  if (!hasLinks) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#d8e0d8] p-6">
      <p className="text-xs font-medium text-[#617061] uppercase tracking-wide mb-4 flex items-center gap-1.5">
        <MessageCircle className="w-3.5 h-3.5" />
        Contact your coach
      </p>
      <div className="flex flex-wrap gap-2">
        {coach.instagramHandle && (
          <a
            href={`https://instagram.com/${coach.instagramHandle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl bg-[#f6f8f5] text-[#617061] border border-[#d8e0d8] hover:border-pink-400 transition-colors"
          >
            <Instagram className="w-4 h-4" />
            Instagram
          </a>
        )}
        {coach.websiteUrl && (
          <a
            href={coach.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl bg-[#f6f8f5] text-[#617061] border border-gray-200 border-[#d8e0d8] hover:border-gray-400 transition-colors"
          >
            <Globe className="w-4 h-4" />
            Website
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {coach.email && (
          <a
            href={`mailto:${coach.email}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl bg-[#ddf0df] text-[#2d5a31] border border-[#3a7d44]/20 hover:border-[#3a7d44] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Email
          </a>
        )}
      </div>
    </div>
  );
}

// ─── No-coach state ───────────────────────────────────────────────────────────

function NoCoachState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-[#f6f8f5] border border-dashed border-gray-300 border-[#d8e0d8] flex items-center justify-center mb-6">
        <UserX className="w-9 h-9 text-[#617061]" />
      </div>
      <h2 className="text-xl font-bold text-[#0f1f10] mb-2">No coach yet</h2>
      <p className="text-sm text-[#617061] max-w-xs mb-6">
        You haven't been connected with a coach. Browse our marketplace to find the right fit for your goals.
      </p>
      <button
        onClick={onBrowse}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        <Search className="w-4 h-4" />
        Browse Coaches
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyCoachPage() {
  const { user } = useAuth();
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [coach, setCoach] = useState<CoachPublicProfile | null>(null);
  const [plan, setPlan] = useState<ClientPackage | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    Promise.all([
      getFullUserProfile(),
      getMyActivePackage(),
    ]).then(([profileRes, planRes]) => {
      const cid = profileRes?.coachId ?? null;
      setCoachId(cid);

      if (planRes.clientPackage) setPlan(planRes.clientPackage);

      if (cid) {
        getCoachProfileById(cid).then((res) => {
          if (res.success) setCoach(res.coach);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#617061]" />
      </div>
    );
  }

  if (!coachId) {
    return (
      <NoCoachState onBrowse={() => router.push(`/${locale}/dashboard/coaches`)} />
    );
  }

  const initials =
    `${coach?.firstName?.[0] ?? ''}${coach?.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const fullName =
    `${coach?.firstName ?? ''} ${coach?.lastName ?? ''}`.trim() || 'Your Coach';
  const daysTogether = daysSince(plan?.startDate);
  const sessionsCompleted = plan?.sessionsCompleted ?? 0;
  const sessionsTotal = plan?.package?.sessionsIncluded ?? 0;
  const weeksLeft = weeksRemaining(plan?.startDate, plan?.package?.durationWeeks);

  const bioText = coach?.bio ?? '';
  const bioLong = bioText.length > 180;
  const bioDisplay = bioLong && !bioExpanded ? bioText.slice(0, 180) + '…' : bioText;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">
        {/* Gradient banner */}
        <div className="h-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700" />

        <div className="px-6 pb-6">
          {/* Avatar + coaching type badge */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-[#162318] border-4 border-white flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {initials}
            </div>
            <div className="flex items-center gap-2 mb-1">
              {coach?.acceptingClients && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#ddf0df] text-[#2d5a31] border border-[#3a7d44]/30">
                  <Zap className="w-3 h-3" />
                  Accepting clients
                </span>
              )}
              <CoachingTypeBadge type={coach?.coachingType} />
            </div>
          </div>

          <h1 className="text-xl font-bold text-[#0f1f10]">{fullName}</h1>

          {coach?.profileHeadline && (
            <p className="text-sm text-[#617061] mt-0.5">{coach.profileHeadline}</p>
          )}

          {/* Bio with expand/collapse */}
          {bioText && (
            <div className="mt-3">
              <p className="text-sm text-[#617061] leading-relaxed">
                {bioDisplay}
              </p>
              {bioLong && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="inline-flex items-center gap-1 text-xs text-[#3a7d44] hover:text-blue-600 mt-1 font-medium transition-colors"
                >
                  {bioExpanded ? (
                    <>Show less <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>Read more <ChevronDown className="w-3.5 h-3.5" /></>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Specialties */}
          {coach?.specialties && coach.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {coach.specialties.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 text-xs rounded-full bg-[#ddf0df] text-[#2d5a31] border border-[#3a7d44]/20"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Training modalities (separate style from specialties) */}
          {coach?.trainingModalities && coach.trainingModalities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {coach.trainingModalities.map((m) => (
                <span
                  key={m}
                  className="px-2 py-0.5 text-xs rounded-full bg-[#e8f4ea] text-[#2d5a31] border border-[#3a7d44]/20"
                >
                  {m}
                </span>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-[#617061]">
            {coach?.yearsOfExperience != null && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                {coach.yearsOfExperience} yrs experience
              </span>
            )}
            {coach?.sessionDurationMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {coach.sessionDurationMinutes} min sessions
              </span>
            )}
            {coach?.languagesSpoken && coach.languagesSpoken.length > 0 && (
              <span className="flex items-center gap-1">
                <Languages className="w-3.5 h-3.5" />
                {coach.languagesSpoken.join(', ')}
              </span>
            )}
            {coach?.trialSessionAvailable && (
              <span className="flex items-center gap-1 text-[#3a7d44] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Trial available
                {coach.trialSessionRateUSD != null && ` · $${coach.trialSessionRateUSD}`}
              </span>
            )}
          </div>

          {/* Certifications */}
          {coach?.certifications && coach.certifications.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#d8e0d8]">
              <p className="text-xs font-medium text-[#617061] uppercase tracking-wide mb-2">
                Certifications
              </p>
              <div className="flex flex-wrap gap-1.5">
                {coach.certifications.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-[#f6f8f5] text-[#617061] border border-gray-200 border-[#d8e0d8]"
                  >
                    <Dumbbell className="w-3 h-3" />
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Journey stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Days training"
          value={daysTogether !== null ? daysTogether : '—'}
          sub="together"
          accent="blue"
        />
        <StatCard
          label="Sessions done"
          value={sessionsTotal > 0 ? `${sessionsCompleted}/${sessionsTotal}` : '—'}
          sub="completed"
          accent="teal"
        />
        <StatCard
          label="Weeks left"
          value={
            weeksLeft !== null ? (weeksLeft === 0 ? 'Done' : weeksLeft) : '—'
          }
          sub={weeksLeft !== null && weeksLeft <= 2 && weeksLeft > 0 ? '⚠ ending soon' : 'remaining'}
          accent={weeksLeft !== null && weeksLeft <= 2 && weeksLeft > 0 ? 'amber' : undefined}
        />
      </div>

      {/* ── Plan card ──────────────────────────────────────────────────────── */}
      {plan ? (
        <PlanCard plan={plan} />
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 border-[#d8e0d8] p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f6f8f5] flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-[#d8e0d8]" />
          </div>
          <p className="text-sm font-medium text-[#617061]">No active plan</p>
          <p className="text-xs text-[#617061] mt-1">Your coach hasn't assigned a plan yet.</p>
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-[#3a7d44]">Plans include sessions, goals, and your coach's notes</p>
          </div>
        </div>
      )}

      {/* ── How you train ──────────────────────────────────────────────────── */}
      {coach && <SessionTypeCard coach={coach} />}

      {/* ── Contact coach ──────────────────────────────────────────────────── */}
      {coach && <ContactCoachCard coach={coach} />}

      {/* ── Browse other coaches ───────────────────────────────────────────── */}
      <button
        onClick={() => router.push(`/${locale}/dashboard/coaches`)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-[#d8e0d8] text-sm font-medium text-[#617061] hover:border-[#3a7d44] transition-colors group"
      >
        <span className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#617061] group-hover:text-[#3a7d44] transition-colors" />
          Browse other coaches
        </span>
        <ChevronRight className="w-4 h-4 text-[#617061] group-hover:text-[#3a7d44] transition-colors" />
      </button>
    </div>
  );
}
