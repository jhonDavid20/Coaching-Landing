'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { getCoachMarketplace, getMyCoach, requestCoachConnection, MarketplaceCoach } from '@/actions/marketplace';
import { useAuth } from '@/components/auth/session-provider';
import { getCoachPackages, requestPackage, Package as CoachPackage } from '@/actions/packages';
import { toast } from 'sonner';
import {
  Search,
  Users,
  Star,
  Clock,
  DollarSign,
  Flame,
  CheckCircle2,
  Dumbbell,
  Languages,
  Filter,
  X,
  ExternalLink,
  Instagram,
  Video,
  Award,
  Target,
  Zap,
  ChevronRight,
  UserCheck,
  MapPin,
  Mail,
  TrendingUp,
  ShieldCheck,
  Package,
  Loader2,
  ServerCrash,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

const AVATAR_GRADIENTS = [
  'from-blue-500 to-purple-600',
  'from-teal-500 to-blue-600',
  'from-purple-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-green-500 to-teal-600',
];

function avatarGradient(id: string) {
  const idx = id.charCodeAt(id.length - 1) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

const COACHING_TYPE_LABELS: Record<string, string> = {
  online: 'Online',
  in_person: 'In-person',
  hybrid: 'Hybrid',
};

const COACHING_TYPE_STYLES: Record<string, string> = {
  online: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-400/30',
  in_person: 'bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-400/30',
  hybrid: 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-400/30',
};

// ─── Coach profile drawer ──────────────────────────────────────────────────

function CoachDrawer({
  coach,
  requested,
  onRequest,
  onClose,
  hasCoach,
  t,
}: {
  coach: MarketplaceCoach;
  requested: boolean;
  onRequest: () => void;
  onClose: () => void;
  hasCoach: boolean;
  t: (key: string, opts?: Record<string, string | number>) => string;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const p = coach.profile ?? {};
  const coachingType = p.coachingType ?? 'online';

  // ── Packages ─────────────────────────────────────────────────────────────
  const [packages, setPackages] = useState<CoachPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!coach.coachProfileId) { setPackagesLoading(false); return; }
    setPackagesLoading(true);
    getCoachPackages(coach.coachProfileId).then((res) => {
      if (res.success) setPackages(res.packages.filter((pkg) => pkg.isActive));
      setPackagesLoading(false);
    });
  }, [coach.coachProfileId]);

  async function handleRequestPackage(pkg: CoachPackage) {
    setRequestingId(pkg.id);
    const res = await requestPackage(pkg.id);
    if (res.success) {
      setRequestedIds((prev) => new Set(prev).add(pkg.id));
      toast.success(`Package "${pkg.name}" requested! Your coach will confirm it.`);
    } else {
      toast.error(res.message);
    }
    setRequestingId(null);
  }

  // Close on Escape or outside click
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleBackdrop(e: React.MouseEvent) {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div
        ref={drawerRef}
        className="relative w-full max-w-md h-full bg-white dark:bg-[#1a1d27] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className={cn('h-1.5 bg-gradient-to-r', avatarGradient(coach.id))} />

        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-start gap-4">
          {/* Avatar */}
          <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 text-white text-lg font-bold', avatarGradient(coach.id))}>
            {getInitials(coach.firstName, coach.lastName)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
              {coach.firstName} {coach.lastName}
            </p>
            {p.profileHeadline && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{p.profileHeadline}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Always accepting since backend filters by acceptingClients=true */}
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-400/30 font-medium">
                <ShieldCheck className="w-3 h-3" />
                {t('drawerOpenToClients')}
              </span>
              <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border', COACHING_TYPE_STYLES[coachingType])}>
                {COACHING_TYPE_LABELS[coachingType]}
              </span>
              {p.trialSessionAvailable && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-400/30 font-medium">
                  <Flame className="w-3 h-3" />
                  {p.trialSessionRateUSD === 0 ? t('freeTrial') : t('paidTrial', { price: p.trialSessionRateUSD ?? 0 })}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label={t('drawerClose')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {p.yearsOfExperience != null && (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                <Star className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Experience</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.yearsOfExperience} yrs</p>
                </div>
              </div>
            )}
            {coach.activeClientsCount != null && (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Clients on platform</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{coach.activeClientsCount}</p>
                </div>
              </div>
            )}
            {p.sessionDurationMinutes != null && (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                <Clock className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Session length</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.sessionDurationMinutes} min</p>
                </div>
              </div>
            )}
            {p.timezone && (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">{t('drawerTimezone')}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.timezone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Capacity / availability bar */}
          {p.maxClientCapacity != null && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                {t('drawerSpotsLabel')}
              </h3>
              {(() => {
                const total = p.maxClientCapacity!;
                const taken = coach.activeClientsCount ?? 0;
                const available = Math.max(0, total - taken);
                const pct = Math.min(100, Math.round((taken / total) * 100));
                const barColor = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-green-500';
                return (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        {available === 0
                          ? t('drawerFullyBooked')
                          : t('drawerSpotsAvailable', { available, total })}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()}
            </section>
          )}

          {/* Bio */}
          {p.bio && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">About</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{p.bio}</p>
            </section>
          )}

          {/* Pricing */}
          {(p.sessionRateUSD != null || p.trialSessionAvailable) && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                {t('drawerPricing')}
              </h3>
              <div className="space-y-2">
                {p.sessionRateUSD != null && (
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Regular session</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${p.sessionRateUSD}<span className="text-xs font-normal text-gray-400">{t('drawerPerSession')}</span>
                    </span>
                  </div>
                )}
                {p.trialSessionAvailable && (
                  <div className="flex items-center justify-between bg-amber-500/5 border border-amber-400/20 rounded-xl px-4 py-3">
                    <span className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      {t('drawerTrialAvailable')}
                    </span>
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      {p.trialSessionRateUSD === 0 ? 'Free' : `$${p.trialSessionRateUSD}`}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Specialties */}
          {p.specialties && p.specialties.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Specialties
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {p.specialties.map((s) => (
                  <span key={s} className="px-2.5 py-1 text-xs rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-400/20">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {p.certifications && p.certifications.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                {t('drawerCertifications')}
              </h3>
              <div className="space-y-1.5">
                {p.certifications.map((cert) => (
                  <div key={cert} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                    {cert}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Session format — coaching type + modalities combined */}
          {(p.coachingType || (p.trainingModalities && p.trainingModalities.length > 0)) && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5" />
                {t('drawerSessionFormat')}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {p.coachingType && (
                  <span className={cn('px-2.5 py-1 text-xs rounded-full border font-medium', COACHING_TYPE_STYLES[p.coachingType])}>
                    {COACHING_TYPE_LABELS[p.coachingType]}
                  </span>
                )}
                {(p.trainingModalities ?? []).map((m) => (
                  <span key={m} className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    {m}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Target client types */}
          {p.targetClientTypes && p.targetClientTypes.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                {t('drawerTargetClients')}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {p.targetClientTypes.map((tc) => (
                  <span key={tc} className="px-2.5 py-1 text-xs rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-400/20">
                    {tc}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {p.languagesSpoken && p.languagesSpoken.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" />
                {t('drawerLanguages')}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {p.languagesSpoken.map((lang) => (
                  <span key={lang} className="px-2.5 py-1 text-xs rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-400/20">
                    {lang}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── Packages / Plans ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              Available Plans
            </h3>

            {packagesLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading plans…
              </div>
            ) : packages.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No plans available yet.</p>
            ) : (
              <div className="space-y-3">
                {packages.map((pkg) => {
                  const isRequested = requestedIds.has(pkg.id);
                  const isRequesting = requestingId === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{pkg.name}</p>
                          {pkg.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{pkg.description}</p>
                          )}
                        </div>
                        <p className="text-base font-bold text-gray-900 dark:text-white flex-shrink-0">
                          ${pkg.priceUSD}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {pkg.durationWeeks} weeks
                        </span>
                        <span className="text-gray-300 dark:text-gray-700">·</span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" />
                          {pkg.sessionsIncluded} sessions
                        </span>
                      </div>

                      {isRequested ? (
                        <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Requested — your coach will confirm
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRequestPackage(pkg)}
                          disabled={isRequesting || !!requestingId}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                        >
                          {isRequesting && <Loader2 className="w-3 h-3 animate-spin" />}
                          {isRequesting ? 'Requesting…' : 'Select this plan'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Contact email */}
          {coach.email && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {t('drawerEmail')}
              </h3>
              <a
                href={`mailto:${coach.email}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
              >
                {coach.email}
              </a>
            </section>
          )}

          {/* Social / external links */}
          {(p.instagramHandle || p.websiteUrl || p.videoIntroUrl) && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                {t('drawerSocialLinks')}
              </h3>
              <div className="space-y-2">
                {p.instagramHandle && (
                  <a
                    href={`https://instagram.com/${p.instagramHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-pink-600 dark:text-pink-400 hover:underline"
                  >
                    <Instagram className="w-4 h-4 flex-shrink-0" />
                    @{p.instagramHandle.replace('@', '')}
                  </a>
                )}
                {p.websiteUrl && (
                  <a
                    href={p.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    {p.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {p.videoIntroUrl && (
                  <a
                    href={p.videoIntroUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    <Video className="w-4 h-4 flex-shrink-0" />
                    {t('drawerVideoIntro')}
                  </a>
                )}
              </div>
            </section>
          )}
        </div>

        {/* ── Sticky footer CTA ──────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1a1d27]">
          {hasCoach ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm font-medium">
              <UserCheck className="w-4 h-4" />
              You already have a coach
            </div>
          ) : requested ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-400/30 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              {t('requestSent')}
            </div>
          ) : (
            <button
              onClick={onRequest}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Dumbbell className="w-4 h-4" />
              {t('requestConnect')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Coach card ───────────────────────────────────────────────────────────────

function CoachCard({
  coach,
  requested,
  onRequest,
  onViewProfile,
  hasCoach,
  t,
}: {
  coach: MarketplaceCoach;
  requested: boolean;
  onRequest: () => void;
  onViewProfile: () => void;
  hasCoach: boolean;
  t: (key: string, opts?: Record<string, string | number>) => string;
}) {
  const p = coach.profile ?? {};
  const coachingType = p.coachingType ?? 'online';

  return (
    <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600" />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={cn('w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 text-white text-base font-bold', avatarGradient(coach.id))}>
            {getInitials(coach.firstName, coach.lastName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {coach.firstName} {coach.lastName}
            </p>
            {p.profileHeadline && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.profileHeadline}</p>
            )}
          </div>
          {/* Coaching type badge */}
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border flex-shrink-0', COACHING_TYPE_STYLES[coachingType])}>
            {COACHING_TYPE_LABELS[coachingType]}
          </span>
        </div>

        {/* Bio */}
        {p.bio && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-4">{p.bio}</p>
        )}

        {/* Specialties */}
        {p.specialties && p.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {p.specialties.slice(0, 3).map((s) => (
              <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                {s}
              </span>
            ))}
            {p.specialties.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                +{p.specialties.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {p.yearsOfExperience != null && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>{t('yearsExp', { n: p.yearsOfExperience })}</span>
            </div>
          )}
          {coach.activeClientsCount != null && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>{t('clientsTrained', { n: coach.activeClientsCount })}</span>
            </div>
          )}
          {p.sessionDurationMinutes != null && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
              <span>{p.sessionDurationMinutes} min</span>
            </div>
          )}
          {p.languagesSpoken && p.languagesSpoken.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Languages className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <span className="truncate">{p.languagesSpoken.slice(0, 2).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="flex items-center gap-3 mb-4">
          {p.sessionRateUSD != null && (
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white">
              <DollarSign className="w-3.5 h-3.5 text-gray-400" />
              {p.sessionRateUSD}<span className="text-xs font-normal text-gray-500">/session</span>
            </div>
          )}
          {p.trialSessionAvailable && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-400/30 font-medium">
              <Flame className="w-3 h-3" />
              {p.trialSessionRateUSD === 0 ? t('freeTrial') : t('paidTrial', { price: p.trialSessionRateUSD ?? 0 })}
            </span>
          )}
        </div>

        {/* CTAs */}
        <div className="mt-auto space-y-2">
          {hasCoach ? (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-xs font-medium">
              <UserCheck className="w-3.5 h-3.5" />
              You already have a coach
            </div>
          ) : requested ? (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-400/30 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              {t('requestSent')}
            </div>
          ) : (
            <button
              onClick={onRequest}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Dumbbell className="w-4 h-4" />
              {t('requestConnect')}
            </button>
          )}
          <button
            onClick={onViewProfile}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {t('viewProfile')}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MarketplaceSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 h-80" />
      ))}
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

const COACHING_TYPE_FILTERS = ['all', 'online', 'in_person', 'hybrid'] as const;
type CoachingTypeFilter = typeof COACHING_TYPE_FILTERS[number];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CoachMarketplacePage() {
  const { user } = useAuth();
  const t = useTranslations('marketplace');
  const [coaches, setCoaches] = useState<MarketplaceCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CoachingTypeFilter>('all');
  const [trialOnly, setTrialOnly] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [requesting, setRequesting] = useState<string | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<MarketplaceCoach | null>(null);
  const [myCoach, setMyCoach] = useState<{ hasCoach: boolean; coach?: MarketplaceCoach }>({ hasCoach: false });

  // Derive hasCoach from the auth cookie immediately — no extra API call needed.
  // user.coachId is set by the backend on GET /api/users/me once a coach assigns them.
  const hasCoachFromSession = !!(user?.coachId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [marketRes, myCoachRes] = await Promise.all([
        getCoachMarketplace(),
        getMyCoach(),
      ]);
      if (marketRes.success) setCoaches(marketRes.coaches);
      else setApiError(true);
      setMyCoach(myCoachRes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // hasCoach: session is the instant signal; myCoach is the richer one (includes coach name/headline).
  const hasCoach = hasCoachFromSession || myCoach.hasCoach;

  async function handleRequest(coachId: string) {
    // Guard on the frontend before even hitting the network
    if (hasCoach) {
      toast.error("You're already connected to a coach. Disconnect first to request a new one.");
      return;
    }
    setRequesting(coachId);
    try {
      const result = await requestCoachConnection(coachId);
      if (result.success) {
        setRequestedIds((prev) => new Set([...prev, coachId]));
        toast.success(t('requestSentToast'));
      } else if (result.errorCode === 'ALREADY_HAS_COACH') {
        // Backend 409 — session was stale, update UI state
        toast.error("You're already connected to a coach.");
        setMyCoach((prev) => ({ ...prev, hasCoach: true }));
      } else {
        toast.error(result.message);
      }
    } finally {
      setRequesting(null);
    }
  }

  const tProxy = (key: string, opts?: Record<string, string | number>) =>
    t(key as Parameters<typeof t>[0], opts as Record<string, string>);

  const filtered = coaches.filter((c) => {
    const profile = c.profile ?? {};
    const name = `${c.firstName} ${c.lastName}`.toLowerCase();
    const specs = (profile.specialties ?? []).join(' ').toLowerCase();
    const headline = (profile.profileHeadline ?? '').toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !search || name.includes(q) || specs.includes(q) || headline.includes(q);
    const matchType = typeFilter === 'all' || profile.coachingType === typeFilter;
    const matchTrial = !trialOnly || profile.trialSessionAvailable;
    return matchSearch && matchType && matchTrial;
  });

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('subtitle', { n: coaches.length })}</p>
        </div>

        {/* ── Your current coach banner ── */}
        {myCoach.hasCoach && myCoach.coach && (
          <div className="flex items-center gap-4 bg-teal-500/10 border border-teal-400/30 rounded-2xl px-5 py-4">
            <div className={cn('w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 text-white text-sm font-bold', avatarGradient(myCoach.coach.id))}>
              {getInitials(myCoach.coach.firstName, myCoach.coach.lastName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-0.5">Your coach</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {myCoach.coach.firstName} {myCoach.coach.lastName}
              </p>
              {myCoach.coach.profile?.profileHeadline && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{myCoach.coach.profile.profileHeadline}</p>
              )}
            </div>
            <UserCheck className="w-5 h-5 text-teal-500 flex-shrink-0" />
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1d27] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <span className="text-xs">×</span>
              </button>
            )}
          </div>

          {/* Type filter tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {COACHING_TYPE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                  typeFilter === f
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                {f === 'all' ? t('filterAll') : COACHING_TYPE_LABELS[f]}
              </button>
            ))}
          </div>

          {/* Trial toggle */}
          <button
            onClick={() => setTrialOnly((v) => !v)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl border transition-colors',
              trialOnly
                ? 'bg-amber-500/10 border-amber-400/40 text-amber-600 dark:text-amber-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-amber-400 hover:text-amber-600'
            )}
          >
            <Flame className="w-3.5 h-3.5" />
            {t('trialFilter')}
          </button>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <MarketplaceSkeleton />
        ) : apiError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <ServerCrash className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Could not load coaches</p>
            <p className="text-xs text-gray-400 mt-1">Make sure the API server is running and try again.</p>
            <button
              onClick={load}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Filter className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">{t('noResults')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((coach) => (
              <CoachCard
                key={coach.id}
                coach={coach}
                requested={requestedIds.has(coach.id) || requesting === coach.id}
                onRequest={() => handleRequest(coach.id)}
                onViewProfile={() => setSelectedCoach(coach)}
                hasCoach={myCoach.hasCoach}
                t={tProxy}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Coach profile drawer ── */}
      {selectedCoach && (
        <CoachDrawer
          coach={selectedCoach}
          requested={requestedIds.has(selectedCoach.id) || requesting === selectedCoach.id}
          onRequest={() => handleRequest(selectedCoach.id)}
          onClose={() => setSelectedCoach(null)}
          hasCoach={myCoach.hasCoach}
          t={tProxy}
        />
      )}
    </>
  );
}
