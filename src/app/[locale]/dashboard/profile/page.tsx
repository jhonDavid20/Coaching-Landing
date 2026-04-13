'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/session-provider';
import { getFullUserProfile } from '@/actions/user';
import type { UserWithProfile } from '@/actions/user';
import { getCoachProfileById } from '@/actions/coach';
import type { CoachPublicProfile } from '@/actions/coach';
import { getMyActivePackage } from '@/actions/packages';
import type { ClientPackage } from '@/actions/packages';
import EditProfileDrawer from '@/components/profile/edit-profile-drawer';
import {
  User,
  Zap,
  HeartPulse,
  ChevronDown,
  Pencil,
  Package,
  ExternalLink,
} from 'lucide-react';
import { cn, formatUTCDate } from '@/lib/utils';

// ─── Small helpers ───────────────────────────────────────────────────────────

function Field({
  label,
  value,
  notCompleted,
}: {
  label: string;
  value?: string | number | null;
  notCompleted: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-[#617061] mb-0.5 uppercase tracking-wide">{label}</p>
      {value != null && value !== '' ? (
        <p className="text-sm text-[#0f1f10] break-words">{String(value)}</p>
      ) : (
        <p className="text-sm text-[#617061] italic">{notCompleted}</p>
      )}
    </div>
  );
}

function TagList({ tags, noneRegistered }: { tags?: string[] | null; noneRegistered: string }) {
  if (!tags || tags.length === 0) {
    return (
      <span className="inline-flex items-center px-3 py-1 text-xs text-[#617061] border border-dashed border-[#d8e0d8]  rounded-full italic">
        {noneRegistered}
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="px-3 py-1 text-xs text-[#617061] bg-[#f6f8f5]  rounded-full border border-[#d8e0d8] "
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: 'blue' | 'teal' | 'amber' }) {
  const styles = {
    blue: 'bg-[#ddf0df] text-[#3a7d44] border-[#3a7d44]/20',
    teal: 'bg-[#ddf0df] text-[#3a7d44] border-[#3a7d44]/20',
    amber: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border',
        styles[color]
      )}
    >
      {label}
    </span>
  );
}

// ─── Weight progress section ─────────────────────────────────────────────────

function WeightProgress({
  weight,
  targetWeight,
  fitnessGoal,
  labelProgress,
  labelRemaining,
  labelToLose,
  labelToGain,
  labelCurrent,
  labelGoal,
}: {
  weight: number;
  targetWeight: number;
  fitnessGoal?: string;
  labelProgress: string;
  labelRemaining: string;
  labelToLose: string;
  labelToGain: string;
  labelCurrent: string;
  labelGoal: string;
}) {
  const isLoss = fitnessGoal === 'weight_loss' || weight > targetWeight;
  const gap = Math.abs(weight - targetWeight);

  const scaleMin = Math.min(weight, targetWeight) * 0.97;
  const scaleMax = Math.max(weight, targetWeight) * 1.03;
  const range = scaleMax - scaleMin;
  const currentPct = ((weight - scaleMin) / range) * 100;
  const targetPct = ((targetWeight - scaleMin) / range) * 100;

  const filledFrom = Math.min(currentPct, targetPct);
  const filledWidth = Math.abs(currentPct - targetPct);

  return (
    <div className="col-span-1 sm:col-span-2 bg-[#f6f8f5]  rounded-xl p-4 border border-[#d8e0d8]/50">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[#617061] uppercase tracking-wide">
          {labelProgress}
        </p>
        <span className="text-xs text-[#617061]">
          {labelRemaining}{' '}
          <span className="text-[#0f1f10] font-semibold">{gap.toFixed(1)} kg</span>{' '}
          {isLoss ? labelToLose : labelToGain}
        </span>
      </div>
      {/* Scale bar */}
      <div className="relative h-2 bg-gray-200  rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute h-full rounded-full',
            isLoss
              ? 'bg-[#3a7d44]'
              : 'bg-gradient-to-r from-teal-400 to-blue-500'
          )}
          style={{ left: `${filledFrom}%`, width: `${filledWidth}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-[#617061]">
        <span>{Math.min(weight, targetWeight).toFixed(1)} kg</span>
        <span>{Math.max(weight, targetWeight).toFixed(1)} kg</span>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1.5 text-[#617061]">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
          {labelCurrent}: <span className="text-[#0f1f10]">{weight} kg</span>
        </span>
        <span className="flex items-center gap-1.5 text-[#617061]">
          <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
          {labelGoal}: <span className="text-[#0f1f10]">{targetWeight} kg</span>
        </span>
      </div>
    </div>
  );
}

// ─── Accordion section ───────────────────────────────────────────────────────

interface AccordionSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  sectionRef?: React.RefObject<HTMLDivElement | null>;
}

function AccordionSection({
  isOpen,
  onToggle,
  icon,
  iconBg,
  title,
  subtitle,
  children,
  sectionRef,
}: AccordionSectionProps) {
  return (
    <div
      ref={sectionRef}
      className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden"
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-[#f6f8f5]  transition-colors"
      >
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0f1f10]">{title}</p>
          <p className="text-xs text-[#617061] mt-0.5">{subtitle}</p>
        </div>
        <ChevronDown
          className="w-4 h-4 text-[#617061] flex-shrink-0"
          style={{
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Animated body */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div className="border-t border-[#d8e0d8] px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header skeleton */}
      <div className="bg-white rounded-2xl border border-[#d8e0d8] p-6 animate-pulse">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gray-200  flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200  rounded w-48" />
            <div className="h-4 bg-gray-200  rounded w-24" />
          </div>
          <div className="h-9 w-32 bg-gray-200  rounded-lg" />
        </div>
      </div>
      {/* Three accordion skeletons */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-[#d8e0d8] px-6 py-5 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-200  flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-gray-200  rounded w-36" />
              <div className="h-3 bg-gray-200  rounded w-52" />
            </div>
            <div className="w-4 h-4 rounded bg-gray-200 " />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const t = useTranslations('profile');
  const params = useParams();
  const locale = params.locale as string;
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserWithProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [open, setOpen] = useState([false, false, false, false]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // My Coach & Plan — only populated for clients with a coachId
  const [myCoach, setMyCoach] = useState<CoachPublicProfile | null>(null);
  const [myPlan, setMyPlan] = useState<ClientPackage | null>(null);

  const section1Ref = useRef<HTMLDivElement | null>(null);

  const loadProfile = useCallback(() => {
    setProfileLoading(true);
    getFullUserProfile()
      .then((p) => {
        setProfile(p);
        // If this client has an assigned coach, load coach + plan data in parallel
        if (p?.coachId) {
          getCoachProfileById(p.coachId).then((res) => {
            if (res.success) setMyCoach(res.coach);
          });
          getMyActivePackage().then((res) => {
            if (res.success) setMyPlan(res.clientPackage);
          });
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const toggle = (i: number) =>
    setOpen((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  const handleEditProfile = () => {
    setDrawerOpen(true);
  };

  if (authLoading || profileLoading) return <ProfileSkeleton />;

  // ── Translated label maps (built at render time) ──
  const fitnessGoalLabels: Record<string, string> = {
    weight_loss: t('goalWeightLoss'),
    muscle_gain: t('goalMuscleGain'),
    maintenance: t('goalMaintenance'),
    endurance: t('goalEndurance'),
  };

  const activityLevelLabels: Record<string, string> = {
    sedentary: t('activitySedentary'),
    lightly_active: t('activityLightly'),
    moderately_active: t('activityModerately'),
    very_active: t('activityVery'),
  };

  const preferredWorkoutLabels: Record<string, string> = {
    morning: t('workoutMorning'),
    afternoon: t('workoutAfternoon'),
    evening: t('workoutEvening'),
    flexible: t('workoutFlexible'),
  };

  const genderLabels: Record<string, string> = {
    male: t('genderMale'),
    female: t('genderFemale'),
    prefer_not_to_say: t('genderPreferNot'),
    other: t('genderOther'),
  };

  const p = profile?.profile ?? {};
  const displayName =
    profile
      ? `${profile.firstName} ${profile.lastName}`.trim() || profile.username
      : user
      ? `${user.firstName} ${user.lastName}`.trim() || user.username
      : '—';

  const roleLabel = (profile?.role ?? user?.role ?? 'client').replace('_', ' ');
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const hasWeightProgress =
    p.weight != null &&
    p.targetWeight != null &&
    p.weight !== p.targetWeight;

  const notCompleted = t('notCompleted');
  const noneRegistered = t('noneRegistered');

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* ── Profile header ── */}
      <div className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">
        <div className="h-2 bg-[#3a7d44]" />
        <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar */}
          {profile?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-[#d8e0d8] flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#3a7d44] flex items-center justify-center flex-shrink-0 text-white text-2xl font-bold ring-2 ring-[#d8e0d8]">
              {initials || <User className="w-9 h-9" />}
            </div>
          )}

          {/* Name + role */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-[#0f1f10] truncate">{displayName}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#ddf0df] text-[#3a7d44] border border-[#3a7d44]/20 capitalize">
                {roleLabel}
              </span>
              {profile?.isEmailVerified && (
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#ddf0df] text-[#3a7d44] border border-[#3a7d44]/20">
                  {t('verified')}
                </span>
              )}
            </div>
            {p.timezone && (
              <p className="text-xs text-[#617061] mt-1.5">{p.timezone}</p>
            )}
          </div>

          {/* Edit button */}
          <button
            type="button"
            onClick={handleEditProfile}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#3a7d44] hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            {t('editProfile')}
          </button>
        </div>
      </div>

      {/* ── Section 1: Account ── */}
      <AccordionSection
        sectionRef={section1Ref}
        isOpen={open[0]}
        onToggle={() => toggle(0)}
        iconBg="bg-[#ddf0df] border border-[#3a7d44]/20"
        icon={<User className="w-5 h-5 text-[#3a7d44]" />}
        title={t('accountSection')}
        subtitle={t('accountSubtitle')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <Field label={t('firstName')} value={profile?.firstName ?? user?.firstName} notCompleted={notCompleted} />
          <Field label={t('lastName')} value={profile?.lastName ?? user?.lastName} notCompleted={notCompleted} />
          <Field label={t('username')} value={profile?.username ?? user?.username} notCompleted={notCompleted} />
          <Field
            label={t('gender')}
            value={p.gender ? (genderLabels[p.gender] ?? p.gender) : null}
            notCompleted={notCompleted}
          />
          <div className="sm:col-span-2">
            <Field label={t('email')} value={profile?.email ?? user?.email} notCompleted={notCompleted} />
          </div>
          <Field label={t('phone')} value={p.phone} notCompleted={notCompleted} />
          <Field
            label={t('dateOfBirth')}
            value={
              p.dateOfBirth ? formatUTCDate(p.dateOfBirth) : null
            }
            notCompleted={notCompleted}
          />
        </div>
      </AccordionSection>

      {/* ── Section 2: Fitness ── */}
      <AccordionSection
        isOpen={open[1]}
        onToggle={() => toggle(1)}
        iconBg="bg-[#ddf0df] border border-[#3a7d44]/20"
        icon={<Zap className="w-5 h-5 text-[#3a7d44]" />}
        title={t('fitnessSection')}
        subtitle={t('fitnessSubtitle')}
      >
        <div className="space-y-5">
          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            {p.fitnessGoal && (
              <Badge
                label={fitnessGoalLabels[p.fitnessGoal] ?? p.fitnessGoal}
                color="teal"
              />
            )}
            {p.activityLevel && (
              <Badge
                label={activityLevelLabels[p.activityLevel] ?? p.activityLevel}
                color="blue"
              />
            )}
            {!p.fitnessGoal && !p.activityLevel && (
              <p className="text-sm text-[#617061] italic">{t('noObjectives')}</p>
            )}
          </div>

          {/* Weight / Height row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <Field
              label={t('currentWeight')}
              value={p.weight != null ? `${p.weight} kg` : null}
              notCompleted={notCompleted}
            />
            <Field
              label={t('height')}
              value={p.height != null ? `${p.height} cm` : null}
              notCompleted={notCompleted}
            />

            {/* Weight progress bar */}
            {hasWeightProgress && (
              <WeightProgress
                weight={p.weight!}
                targetWeight={p.targetWeight!}
                fitnessGoal={p.fitnessGoal}
                labelProgress={t('weightProgress')}
                labelRemaining={t('remaining')}
                labelToLose={t('weightToLose')}
                labelToGain={t('weightToGain')}
                labelCurrent={t('currentWeightLabel')}
                labelGoal={t('goalLabel')}
              />
            )}

            <Field
              label={t('preferredWorkout')}
              value={
                p.preferredWorkoutTime
                  ? (preferredWorkoutLabels[p.preferredWorkoutTime] ?? p.preferredWorkoutTime)
                  : null
              }
              notCompleted={notCompleted}
            />
            <Field label={t('gymLocation')} value={p.gymLocation} notCompleted={notCompleted} />
          </div>
        </div>
      </AccordionSection>

      {/* ── Section 3: Health ── */}
      <AccordionSection
        isOpen={open[2]}
        onToggle={() => toggle(2)}
        iconBg="bg-amber-500/15 border border-amber-500/30"
        icon={<HeartPulse className="w-5 h-5 text-amber-400" />}
        title={t('healthSection')}
        subtitle={t('healthSubtitle')}
      >
        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium text-[#617061] uppercase tracking-wide mb-2">
              {t('medicalConditions')}
            </p>
            <TagList tags={p.medicalConditions} noneRegistered={noneRegistered} />
          </div>
          <div>
            <p className="text-xs font-medium text-[#617061] uppercase tracking-wide mb-2">
              {t('injuries')}
            </p>
            <TagList tags={p.injuries} noneRegistered={noneRegistered} />
          </div>
          <div>
            <p className="text-xs font-medium text-[#617061] uppercase tracking-wide mb-2">
              {t('allergies')}
            </p>
            <TagList tags={p.allergies} noneRegistered={noneRegistered} />
          </div>
          <div>
            <p className="text-xs font-medium text-[#617061] uppercase tracking-wide mb-2">
              {t('dietaryRestrictions')}
            </p>
            <TagList tags={p.dietaryRestrictions} noneRegistered={noneRegistered} />
          </div>
          {p.notes && (
            <div>
              <p className="text-xs font-medium text-[#617061] uppercase tracking-wide mb-2">
                {t('notes')}
              </p>
              <p className="text-sm text-[#0f1f10]">{p.notes}</p>
            </div>
          )}
        </div>
      </AccordionSection>

      {/* ── Section 4: My Coach & Plan (clients with an assigned coach) ── */}
      {profile?.role === 'client' && profile.coachId && (
        <AccordionSection
          isOpen={open[3]}
          onToggle={() => toggle(3)}
          iconBg="bg-[#ddf0df] border border-[#3a7d44]/20"
          icon={<Package className="w-5 h-5 text-[#3a7d44]" />}
          title="My Coach & Plan"
          subtitle={
            myCoach
              ? `${myCoach.firstName ?? ''} ${myCoach.lastName ?? ''}`.trim() || 'Your assigned coach'
              : 'Loading coach info…'
          }
        >
          <div className="space-y-6">
            {/* ── Coach card ── */}
            {myCoach ? (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#3a7d44] flex items-center justify-center flex-shrink-0 text-white text-base font-bold">
                  {`${myCoach.firstName?.[0] ?? ''}${myCoach.lastName?.[0] ?? ''}`.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0f1f10]">
                    {`${myCoach.firstName ?? ''} ${myCoach.lastName ?? ''}`.trim() || '—'}
                  </p>
                  {myCoach.profileHeadline && (
                    <p className="text-xs text-[#617061] mt-0.5">{myCoach.profileHeadline}</p>
                  )}
                  {myCoach.bio && (
                    <p className="text-sm text-[#617061] mt-2 line-clamp-3">{myCoach.bio}</p>
                  )}
                  {myCoach.specialties && myCoach.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {myCoach.specialties.slice(0, 4).map((s) => (
                        <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-[#ddf0df] text-[#3a7d44] border border-[#3a7d44]/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-[#617061]">
                    {myCoach.yearsOfExperience != null && (
                      <span>{myCoach.yearsOfExperience} yrs experience</span>
                    )}
                    {myCoach.coachingType && (
                      <span className="capitalize">{myCoach.coachingType.replace(/_/g, ' ')}</span>
                    )}
                    {myCoach.sessionRateUSD != null && (
                      <span>${myCoach.sessionRateUSD}/session</span>
                    )}
                  </div>
                  <a
                    href={`/${locale}/dashboard/coaches`}
                    className="inline-flex items-center gap-1 mt-3 text-xs text-[#3a7d44] hover:text-[#3a7d44] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Browse coaches
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#617061] italic">Coach info not available.</p>
            )}

            {/* ── Active plan ── */}
            <div className="border-t border-[#d8e0d8] pt-5">
              <p className="text-xs font-medium text-[#617061] uppercase tracking-wide mb-3">Active Plan</p>
              {myPlan?.package ? (
                <div className="bg-[#ddf0df] rounded-xl p-4 border border-[#3a7d44]/20">
                  <p className="text-sm font-semibold text-[#0f1f10]">{myPlan.package.name}</p>
                  {myPlan.package.description && (
                    <p className="text-xs text-[#617061] mt-0.5">{myPlan.package.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-[#617061]">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">{myPlan.package.durationWeeks}</span> weeks
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">{myPlan.package.sessionsIncluded}</span> sessions included
                    </span>
                    <span className="flex items-center gap-1">
                      $<span className="font-medium">{myPlan.package.priceUSD}</span>
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className={cn(
                      'inline-block px-2.5 py-0.5 text-xs rounded-full border capitalize',
                      myPlan.status === 'active'
                        ? 'bg-[#ddf0df] text-[#3a7d44] border-[#3a7d44]/20'
                        : myPlan.status === 'completed'
                          ? 'bg-[#f6f8f5]  text-[#617061] border-[#d8e0d8] '
                          : 'bg-red-500/10 text-red-500 border-red-500/30'
                    )}>
                      {myPlan.status}
                    </span>
                    {myPlan.startDate && (
                      <span className="ml-2 text-xs text-[#617061]">
                        Started {new Date(myPlan.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#617061] italic">No plan assigned yet. Your coach will assign one soon.</p>
              )}
            </div>
          </div>
        </AccordionSection>
      )}

      {/* ── Edit drawer ── */}
      {profile && (
        <EditProfileDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          profile={profile}
          onSaved={loadProfile}
        />
      )}
    </div>
  );
}
