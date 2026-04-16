'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { getClientById, getCoachOwnProfile, CoachClient } from '@/actions/coach';
import {
  getCoachPackages,
  getClientActivePackage,
  assignPackage,
  updateClientPackageDetails,
  Package as CoachPackage,
  ClientPackage,
} from '@/actions/packages';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { resolveHealthTagKey } from '@/lib/health-tag-map';
import {
  ArrowLeft,
  Loader2,
  User,
  HeartPulse,
  Package,
  Target,
  StickyNote,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  X,
  Save,
  Pencil,
  BadgeCheck,
  Scale,
  Ruler,
  Flame,
  Clock,
  MapPin,
  Languages,
  Calendar,
  Dumbbell,
  Activity,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(firstName: string, lastName: string) {
  return `${(firstName[0] ?? '')}${(lastName[0] ?? '')}`.toUpperCase();
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function weeksRemaining(startDate?: string, durationWeeks?: number): number | null {
  if (!startDate || !durationWeeks) return null;
  const end = new Date(startDate).getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24 * 7)));
}

// ─── Status styles ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#ddf0df] text-[#2d5a31] border-[#3a7d44]/30',
  trial: 'bg-amber-50 text-amber-700 border-amber-300',
  inactive: 'bg-[#f6f8f5] text-[#617061] border-[#d8e0d8]',
};

// Maps enum value → translation key (in clientDetail namespace)
const GOAL_LABEL_KEYS: Record<string, string> = {
  weight_loss: 'goalWeightLoss',
  muscle_gain: 'goalMuscleGain',
  maintenance: 'goalMaintenance',
  endurance:   'goalEndurance',
};

const GOAL_COLORS: Record<string, string> = {
  weight_loss: 'bg-[#f0faf0] text-[#2d5a31] border-[#3a7d44]/30',
  muscle_gain: 'bg-[#e8f4ea] text-[#2d5a31] border-[#3a7d44]/30',
  maintenance: 'bg-[#f6f8f5] text-[#617061] border-[#d8e0d8]',
  endurance: 'bg-amber-50 text-amber-700 border-amber-300',
};

const ACTIVITY_LABEL_KEYS: Record<string, string> = {
  sedentary:         'activitySedentary',
  lightly_active:    'activityLightly',
  moderately_active: 'activityModerately',
  very_active:       'activityVery',
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[#d8e0d8]">
        <div className="w-7 h-7 rounded-lg bg-[#f6f8f5] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <p className="text-sm font-semibold text-[#0f1f10]">{title}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[#d8e0d8] last:border-0">
      <span className="text-xs text-[#617061] uppercase tracking-wide flex-shrink-0">{label}</span>
      <span className="text-sm text-[#617061] text-right">{value}</span>
    </div>
  );
}

// ─── Tag list ─────────────────────────────────────────────────────────────────

function TagList({ tags, empty }: { tags?: string[] | null; empty?: string }) {
  const tOnboarding = useTranslations('onboarding');
  if (!tags || tags.length === 0) {
    return empty ? <p className="text-xs text-[#617061] italic">{empty}</p> : null;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const key = resolveHealthTagKey(tag);
        const label = key ? tOnboarding(key) : tag;
        return (
          <span key={tag} className="px-2.5 py-1 text-xs rounded-full bg-[#f6f8f5] text-[#617061] border border-gray-200 border-[#d8e0d8]">
            {label}
          </span>
        );
      })}
    </div>
  );
}

// ─── Weight progress bar ──────────────────────────────────────────────────────

function WeightProgress({ weight, targetWeight, fitnessGoal }: { weight: number; targetWeight: number; fitnessGoal?: string }) {
  const t = useTranslations('clientDetail');
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
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-[#617061]">
        <span className="font-medium">{weight} kg <span className="text-[#617061] font-normal">{t('weightCurrent')}</span></span>
        <span className="text-[#3a7d44] font-semibold">{gap.toFixed(1)} kg {isLoss ? t('toLose') : t('toGain')}</span>
        <span className="font-medium">{targetWeight} kg <span className="text-[#617061] font-normal">{t('weightGoal')}</span></span>
      </div>
      <div className="relative h-2.5 bg-[#f6f8f5] rounded-full overflow-hidden">
        <div
          className={cn('absolute h-full rounded-full', isLoss ? 'bg-[#3a7d44]' : 'bg-[#3a7d44]')}
          style={{ left: `${filledFrom}%`, width: `${filledWidth}%` }}
        />
      </div>
    </div>
  );
}

// ─── Session bubbles ──────────────────────────────────────────────────────────

function SessionBubbles({ total, completed }: { total: number; completed: number }) {
  const shown = Math.min(total, 24);
  const overflow = total > 24 ? total - 24 : 0;
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: shown }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center transition-all',
            i < completed
              ? 'bg-[#3a7d44] shadow-sm shadow-teal-500/30'
              : 'bg-[#f6f8f5] border border-gray-200 border-[#d8e0d8]'
          )}
        >
          {i < completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full bg-[#f6f8f5] border border-gray-200 border-[#d8e0d8] flex items-center justify-center">
          <span className="text-[9px] font-bold text-[#617061]">+{overflow}</span>
        </div>
      )}
    </div>
  );
}

// ─── Goal input helper ────────────────────────────────────────────────────────

function GoalInput({ goals, onChange }: { goals: string[]; onChange: (goals: string[]) => void }) {
  const t = useTranslations('clientDetail');
  const [input, setInput] = useState('');
  function add() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onChange([...goals, trimmed]);
    setInput('');
  }
  return (
    <div className="space-y-2">
      {goals.map((g, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-[#3a7d44] flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-bold text-[#3a7d44]">{i + 1}</span>
          </div>
          <span className="flex-1 text-sm text-[#617061] bg-gray-50 bg-white rounded-lg px-3 py-1.5 border border-gray-200 border-[#d8e0d8]">{g}</span>
          <button onClick={() => onChange(goals.filter((_, idx) => idx !== i))} className="text-[#617061] hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={t('goalPlaceholder')}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#617061] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40"
        />
        <button onClick={add} className="px-3 py-2 bg-[#3a7d44] text-white text-sm rounded-lg hover:bg-[#2d5a31] transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Package management section ───────────────────────────────────────────────

function PackageSection({
  clientId,
  coachPackages,
}: {
  clientId: string;
  coachPackages: CoachPackage[];
}) {
  const t = useTranslations('clientDetail');
  const [assignedPackage, setAssignedPackage] = useState<ClientPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'view' | 'edit' | 'assign'>('view');

  // assign form
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignGoals, setAssignGoals] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  // edit form
  const [editSessions, setEditSessions] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [editGoals, setEditGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadPackage = useCallback(async () => {
    setLoading(true);
    const res = await getClientActivePackage(clientId);
    setAssignedPackage(res.clientPackage);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { loadPackage(); }, [loadPackage]);

  function openEdit() {
    if (!assignedPackage) return;
    setEditSessions(assignedPackage.sessionsCompleted ?? 0);
    setEditNotes(assignedPackage.notes ?? '');
    setEditGoals(assignedPackage.goals ?? []);
    setMode('edit');
  }

  async function handleAssign() {
    if (!selectedPkgId) return;
    setAssigning(true);
    const res = await assignPackage(selectedPkgId, {
      clientId,
      notes: assignNotes || undefined,
      goals: assignGoals.length > 0 ? assignGoals : undefined,
    });
    if (res.success) {
      toast.success(t('packageAssigned'));
      setSelectedPkgId('');
      setAssignNotes('');
      setAssignGoals([]);
      setMode('view');
      await loadPackage();
    } else {
      toast.error(res.message);
    }
    setAssigning(false);
  }

  async function handleSave() {
    if (!assignedPackage) return;
    setSaving(true);
    const res = await updateClientPackageDetails(assignedPackage.id, {
      sessionsCompleted: editSessions,
      notes: editNotes || undefined,
      goals: editGoals.length > 0 ? editGoals : [],
    });
    if (res.success) {
      toast.success(t('planUpdated'));
      setAssignedPackage(res.clientPackage ?? {
        ...assignedPackage,
        sessionsCompleted: editSessions,
        notes: editNotes || undefined,
        goals: editGoals,
      });
      setMode('view');
    } else {
      toast.error(res.message);
    }
    setSaving(false);
  }

  const activePackages = coachPackages.filter((p) => p.isActive);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#617061] py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> {t('loadingPlan')}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── No package yet ── */}
      {!assignedPackage && mode !== 'assign' && (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 border-[#d8e0d8] rounded-2xl">
          <Package className="w-8 h-8 text-[#d8e0d8] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#617061] mb-1">{t('noPlanYet')}</p>
          <p className="text-xs text-[#617061] mb-4">{t('noPlanDesc')}</p>
          {activePackages.length > 0 ? (
            <button
              onClick={() => setMode('assign')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#162318] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> {t('assignPackage')}
            </button>
          ) : (
            <p className="text-xs text-[#617061] italic">{t('createPackagesFirst')}</p>
          )}
        </div>
      )}

      {/* ── Active package view ── */}
      {assignedPackage?.package && mode === 'view' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#0f1f10]">{assignedPackage.package.name}</h3>
              {assignedPackage.package.description && (
                <p className="text-sm text-[#617061] mt-0.5">{assignedPackage.package.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border capitalize',
                assignedPackage.status === 'active'
                  ? 'bg-[#ddf0df] text-[#2d5a31] border-[#3a7d44]/30'
                  : assignedPackage.status === 'completed'
                  ? 'bg-[#f6f8f5] text-[#617061] border-gray-300'
                  : 'bg-red-500/10 text-red-500 border-red-500/30'
              )}>
                {assignedPackage.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {assignedPackage.status}
              </span>
              <button
                onClick={openEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3a7d44] bg-[#ddf0df] border border-[#3a7d44]/20 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> {t('editPlan')}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#f6f8f5] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[#0f1f10]">{assignedPackage.package.durationWeeks}w</p>
              <p className="text-xs text-[#617061] mt-0.5">{t('duration')}</p>
            </div>
            <div className="bg-[#f6f8f5] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[#3a7d44]">
                {assignedPackage.sessionsCompleted ?? 0}/{assignedPackage.package.sessionsIncluded}
              </p>
              <p className="text-xs text-[#617061] mt-0.5">{t('sessionsDoneLabel')}</p>
            </div>
            <div className="bg-[#f6f8f5] rounded-xl p-3 text-center">
              <p className={cn(
                'text-lg font-bold',
                (() => {
                  const wl = weeksRemaining(assignedPackage.startDate, assignedPackage.package.durationWeeks);
                  return wl !== null && wl <= 2 ? 'text-amber-500' : 'text-[#0f1f10]';
                })()
              )}>
                {weeksRemaining(assignedPackage.startDate, assignedPackage.package.durationWeeks) ?? '—'}w
              </p>
              <p className="text-xs text-[#617061] mt-0.5">{t('weeksLeft')}</p>
            </div>
          </div>

          {/* Session bubble map */}
          <div>
            <p className="text-xs font-semibold text-[#617061] uppercase tracking-wide mb-2">{t('sessionProgress')}</p>
            <SessionBubbles
              total={assignedPackage.package.sessionsIncluded}
              completed={assignedPackage.sessionsCompleted ?? 0}
            />
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-[#617061] mb-1.5">
              <span>{t('started', { date: fmtDate(assignedPackage.startDate) })}</span>
              <span>{t('percentComplete', { pct: assignedPackage.package.sessionsIncluded > 0
                ? Math.round(((assignedPackage.sessionsCompleted ?? 0) / assignedPackage.package.sessionsIncluded) * 100)
                : 0 })}</span>
            </div>
            <div className="h-2 bg-[#f6f8f5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3a7d44] rounded-full transition-all duration-700"
                style={{
                  width: `${assignedPackage.package.sessionsIncluded > 0
                    ? Math.round(((assignedPackage.sessionsCompleted ?? 0) / assignedPackage.package.sessionsIncluded) * 100)
                    : 0}%`
                }}
              />
            </div>
          </div>

          {/* Features */}
          {assignedPackage.package.features && assignedPackage.package.features.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#617061] uppercase tracking-wide mb-2">{t('whatsIncluded')}</p>
              <div className="space-y-1.5">
                {assignedPackage.package.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-[#3a7d44] flex-shrink-0" />
                    <span className="text-sm text-[#617061]">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {(assignedPackage.goals ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#617061] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> {t('goalsLabel')}
              </p>
              <div className="space-y-2">
                {assignedPackage.goals!.map((g, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full border-2 border-[#3a7d44] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-[#3a7d44]">{i + 1}</span>
                    </div>
                    <span className="text-sm text-[#617061]">{g}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coach note */}
          {assignedPackage.notes && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-xl">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" /> {t('yourNote')}
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{assignedPackage.notes}</p>
            </div>
          )}

          {/* Change package */}
          {activePackages.length > 0 && (
            <button
              onClick={() => setMode('assign')}
              className="text-xs text-[#617061] hover:text-[#3a7d44] transition-colors underline"
            >
              {t('assignDifferent')}
            </button>
          )}
        </div>
      )}

      {/* ── Edit plan ── */}
      {mode === 'edit' && assignedPackage?.package && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0f1f10]">
              {t('editing', { name: assignedPackage.package.name })}
            </p>
            <button onClick={() => setMode('view')} className="text-xs text-[#617061] hover:text-gray-600">
              {t('cancel')}
            </button>
          </div>

          {/* Sessions stepper */}
          <div>
            <p className="text-sm font-medium text-[#617061] mb-3">{t('sessionsCompleted')}</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setEditSessions((n) => Math.max(0, n - 1))}
                className="w-10 h-10 rounded-xl bg-[#f6f8f5] border border-gray-200 border-[#d8e0d8] flex items-center justify-center hover:bg-[#e8f0e8] transition-colors"
              >
                <Minus className="w-4 h-4 text-[#617061]" />
              </button>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#0f1f10] tabular-nums">{editSessions}</p>
                <p className="text-xs text-[#617061]">{t('of')} {assignedPackage.package.sessionsIncluded}</p>
              </div>
              <button
                onClick={() => setEditSessions((n) => Math.min(assignedPackage.package!.sessionsIncluded, n + 1))}
                className="w-10 h-10 rounded-xl bg-[#f6f8f5] border border-gray-200 border-[#d8e0d8] flex items-center justify-center hover:bg-[#e8f0e8] transition-colors"
              >
                <Plus className="w-4 h-4 text-[#617061]" />
              </button>
            </div>
          </div>

          {/* Goals */}
          <div>
            <p className="text-sm font-medium text-[#617061] mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#3a7d44]" /> {t('goalsForClient')}
            </p>
            <GoalInput goals={editGoals} onChange={setEditGoals} />
          </div>

          {/* Note */}
          <div>
            <p className="text-sm font-medium text-[#617061] mb-2 flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-500" /> {t('noteForClient')}
            </p>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              placeholder={t('notePlaceholder')}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#617061] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#162318] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? t('saving') : t('saveChanges')}
            </button>
            <button
              onClick={() => setMode('view')}
              className="px-4 py-2.5 text-sm text-[#617061] border border-gray-200 border-[#d8e0d8] rounded-xl hover:bg-[#f6f8f5] transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* ── Assign form ── */}
      {mode === 'assign' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0f1f10]">
              {assignedPackage ? t('changePackage') : t('assignPackage')}
            </p>
            <button onClick={() => setMode('view')} className="text-xs text-[#617061] hover:text-gray-600">
              {t('cancel')}
            </button>
          </div>

          {/* Package picker */}
          <div>
            <p className="text-sm font-medium text-[#617061] mb-2">{t('choosePackage')}</p>
            <div className="space-y-2">
              {activePackages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={cn(
                    'w-full text-left px-4 py-3.5 rounded-xl border transition-all',
                    selectedPkgId === pkg.id
                      ? 'border-[#3a7d44] bg-[#ddf0df]'
                      : 'border-gray-200 border-[#d8e0d8] bg-white hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#0f1f10]">{pkg.name}</p>
                      {pkg.description && <p className="text-xs text-[#617061] mt-0.5 line-clamp-1">{pkg.description}</p>}
                    </div>
                    <span className="text-sm font-bold text-[#3a7d44] flex-shrink-0">${pkg.priceUSD}</span>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-[#617061]">
                    <span>{pkg.durationWeeks} weeks</span>
                    <span>·</span>
                    <span>{pkg.sessionsIncluded} sessions</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Goals */}
          {selectedPkgId && (
            <>
              <div>
                <p className="text-sm font-medium text-[#617061] mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#3a7d44]" /> Goals <span className="text-xs text-[#617061] font-normal">({t('optional')})</span>
                </p>
                <GoalInput goals={assignGoals} onChange={setAssignGoals} />
              </div>

              <div>
                <p className="text-sm font-medium text-[#617061] mb-2 flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-amber-500" /> {t('noteForClient')} <span className="text-xs text-[#617061] font-normal">({t('optional')})</span>
                </p>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  rows={3}
                  placeholder={t('notePlaceholder')}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#617061] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40 resize-none"
                />
              </div>
            </>
          )}

          <button
            onClick={handleAssign}
            disabled={assigning || !selectedPkgId}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#162318] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
            {assigning ? t('assigning') : t('assignPackage')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('clientDetail');
  const clientId = params.clientId as string;

  const [client, setClient] = useState<CoachClient | null>(null);
  const [coachPackages, setCoachPackages] = useState<CoachPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [clientRes, profileRes] = await Promise.all([
        getClientById(clientId),
        getCoachOwnProfile(),
      ]);

      if (!clientRes.success || !clientRes.client) {
        setError(clientRes.error ?? 'Client not found');
      } else {
        setClient(clientRes.client);
      }

      const coachProfileId = profileRes?.coachProfileId;
      if (coachProfileId) {
        const pkgRes = await getCoachPackages(coachProfileId);
        if (pkgRes.success) setCoachPackages(pkgRes.packages);
      }

      setLoading(false);
    }
    load();
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#617061]" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[#617061]">{error ?? t('notFound')}</p>
        <button
          onClick={() => router.push(`/${locale}/dashboard/coach/clients`)}
          className="text-sm text-[#3a7d44] hover:underline"
        >
          {t('backToClients')}
        </button>
      </div>
    );
  }

  const p = client.profile ?? {};
  const age = calcAge(p.dateOfBirth);
  const hasWeightProgress = p.weight != null && p.targetWeight != null && p.weight !== p.targetWeight;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* ── Back button ── */}
      <button
        onClick={() => router.push(`/${locale}/dashboard/coach/clients`)}
        className="inline-flex items-center gap-2 text-sm text-[#617061] hover:text-gray-800 hover:text-[#0f1f10] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToClients')}
      </button>

      {/* ── Header card ── */}
      <div className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden mb-6">
        <div className="h-20 bg-[#162318]" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-[#162318] border-4 border-white flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden">
              {client.avatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={client.avatar} alt={`${client.firstName} ${client.lastName}`} className="w-full h-full object-cover" />
                : getInitials(client.firstName, client.lastName)}
            </div>
            <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full border capitalize mb-1', STATUS_STYLES[client.status] ?? STATUS_STYLES.inactive)}>
              {client.status}
            </span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#0f1f10]">
                {client.firstName} {client.lastName}
              </h1>
              <p className="text-sm text-[#617061] mt-0.5">{client.email}</p>
              {p.fitnessGoal && (
                <span className={cn('inline-block mt-2 px-2.5 py-0.5 text-xs font-medium rounded-full border', GOAL_COLORS[p.fitnessGoal] ?? 'bg-gray-100 text-[#617061] border-gray-300')}>
                  {GOAL_LABEL_KEYS[p.fitnessGoal] ? t(GOAL_LABEL_KEYS[p.fitnessGoal] as Parameters<typeof t>[0]) : p.fitnessGoal}
                </span>
              )}
            </div>

            <div className="flex gap-6 text-center">
              <div>
                <p className="text-xl font-bold text-[#0f1f10]">{client.sessionsCompleted}</p>
                <p className="text-xs text-[#617061]">{t('sessionsDone')}</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[#0f1f10]">{fmtDate(client.joinedAt)}</p>
                <p className="text-xs text-[#617061]">{t('joined')}</p>
              </div>
              {client.lastSessionAt && (
                <div>
                  <p className="text-xl font-bold text-[#0f1f10]">{fmtDate(client.lastSessionAt)}</p>
                  <p className="text-xs text-[#617061]">{t('lastSession')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">

        {/* ── Left: Client profile ── */}
        <div className="space-y-5">

          {/* Personal info */}
          <Section title={t('sectionPersonal')} icon={<User className="w-3.5 h-3.5 text-[#617061]" />}>
            <div className="space-y-0">
              <InfoRow label={t('labelGender')} value={p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1).replace(/_/g, ' ') : null} />
              <InfoRow label={t('labelAge')} value={age != null ? t('yearsOld', { age }) : null} />
              <InfoRow label={t('labelTimezone')} value={p.timezone?.replace(/_/g, ' ')} />
              <InfoRow label={t('labelPhone')} value={p.phone} />
              <InfoRow label={t('labelSchedule')} value={p.preferredWorkoutTime ? p.preferredWorkoutTime.charAt(0).toUpperCase() + p.preferredWorkoutTime.slice(1) : null} />
              {p.gymLocation && <InfoRow label={t('labelGym')} value={p.gymLocation} />}
            </div>
          </Section>

          {/* Fitness profile */}
          <Section title={t('sectionFitness')} icon={<Activity className="w-3.5 h-3.5 text-[#3a7d44]" />}>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {p.weight != null && (
                  <div className="bg-[#f6f8f5] rounded-xl p-3 text-center">
                    <Scale className="w-4 h-4 text-[#617061] mx-auto mb-1" />
                    <p className="text-lg font-bold text-[#0f1f10]">{p.weight}</p>
                    <p className="text-xs text-[#617061]">{t('kgCurrent')}</p>
                  </div>
                )}
                {p.targetWeight != null && (
                  <div className="bg-[#f6f8f5] rounded-xl p-3 text-center">
                    <Target className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-[#3a7d44]">{p.targetWeight}</p>
                    <p className="text-xs text-[#617061]">{t('kgTarget')}</p>
                  </div>
                )}
                {p.height != null && (
                  <div className="bg-[#f6f8f5] rounded-xl p-3 text-center">
                    <Ruler className="w-4 h-4 text-[#617061] mx-auto mb-1" />
                    <p className="text-lg font-bold text-[#0f1f10]">{p.height}</p>
                    <p className="text-xs text-[#617061]">cm</p>
                  </div>
                )}
              </div>

              {hasWeightProgress && (
                <WeightProgress
                  weight={p.weight!}
                  targetWeight={p.targetWeight!}
                  fitnessGoal={p.fitnessGoal}
                />
              )}

              <div className="space-y-0">
                <InfoRow label={t('labelActivityLevel')} value={p.activityLevel ? (ACTIVITY_LABEL_KEYS[p.activityLevel] ? t(ACTIVITY_LABEL_KEYS[p.activityLevel] as Parameters<typeof t>[0]) : p.activityLevel) : null} />
              </div>
            </div>
          </Section>

          {/* Health */}
          <Section title={t('sectionHealth')} icon={<HeartPulse className="w-3.5 h-3.5 text-red-500" />}>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#617061] uppercase tracking-wide mb-2">{t('labelMedicalConditions')}</p>
                <TagList tags={p.medicalConditions} empty={t('noneReported')} />
              </div>
              <div>
                <p className="text-xs text-[#617061] uppercase tracking-wide mb-2">{t('labelInjuries')}</p>
                <TagList tags={p.injuries} empty={t('noneReported')} />
              </div>
              <div>
                <p className="text-xs text-[#617061] uppercase tracking-wide mb-2">{t('labelAllergies')}</p>
                <TagList tags={p.allergies} empty={t('noneReported')} />
              </div>
              <div>
                <p className="text-xs text-[#617061] uppercase tracking-wide mb-2">{t('labelDietary')}</p>
                <TagList tags={p.dietaryRestrictions} empty={t('noneReported')} />
              </div>
              {p.notes && (
                <div className="pt-3 border-t border-[#d8e0d8]">
                  <p className="text-xs text-[#617061] uppercase tracking-wide mb-2">{t('labelNotes')}</p>
                  <p className="text-sm text-[#617061] leading-relaxed bg-amber-50 dark:bg-amber-900/15 rounded-xl p-3 border border-amber-200 dark:border-amber-800/50">
                    {p.notes}
                  </p>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* ── Right: Package management ── */}
        <div className="space-y-5">
          <Section title={t('sectionPlan')} icon={<Package className="w-3.5 h-3.5 text-purple-500" />}>
            <PackageSection clientId={client.id} coachPackages={coachPackages} />
          </Section>
        </div>

      </div>
    </div>
  );
}
