'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
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
  active: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
  trial: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  inactive: 'bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400 border-gray-300 dark:border-gray-600',
};

const GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Weight Loss',
  muscle_gain: 'Muscle Gain',
  maintenance: 'Maintenance',
  endurance: 'Endurance',
};

const GOAL_COLORS: Record<string, string> = {
  weight_loss: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-400/30',
  muscle_gain: 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-400/30',
  maintenance: 'bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-400/30',
  endurance: 'bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-400/30',
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  moderately_active: 'Moderately Active',
  very_active: 'Very Active',
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-xs text-gray-400 uppercase tracking-wide flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-700 dark:text-gray-300 text-right">{value}</span>
    </div>
  );
}

// ─── Tag list ─────────────────────────────────────────────────────────────────

function TagList({ tags, empty }: { tags?: string[] | null; empty?: string }) {
  if (!tags || tags.length === 0) {
    return empty ? <p className="text-xs text-gray-400 italic">{empty}</p> : null;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          {tag}
        </span>
      ))}
    </div>
  );
}

// ─── Weight progress bar ──────────────────────────────────────────────────────

function WeightProgress({ weight, targetWeight, fitnessGoal }: { weight: number; targetWeight: number; fitnessGoal?: string }) {
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
      <div className="flex justify-between text-xs text-gray-500">
        <span className="font-medium">{weight} kg <span className="text-gray-400 font-normal">current</span></span>
        <span className="text-blue-500 font-semibold">{gap.toFixed(1)} kg {isLoss ? 'to lose' : 'to gain'}</span>
        <span className="font-medium">{targetWeight} kg <span className="text-gray-400 font-normal">goal</span></span>
      </div>
      <div className="relative h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn('absolute h-full rounded-full', isLoss ? 'bg-gradient-to-r from-blue-500 to-teal-400' : 'bg-gradient-to-r from-teal-400 to-blue-500')}
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
              ? 'bg-teal-500 shadow-sm shadow-teal-500/30'
              : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          )}
        >
          {i < completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
          <span className="text-[9px] font-bold text-gray-400">+{overflow}</span>
        </div>
      )}
    </div>
  );
}

// ─── Goal input helper ────────────────────────────────────────────────────────

function GoalInput({ goals, onChange }: { goals: string[]; onChange: (goals: string[]) => void }) {
  const [input, setInput] = useState('');
  function add() {
    const t = input.trim();
    if (!t) return;
    onChange([...goals, t]);
    setInput('');
  }
  return (
    <div className="space-y-2">
      {goals.map((g, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-bold text-blue-400">{i + 1}</span>
          </div>
          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5 border border-gray-200 dark:border-gray-700">{g}</span>
          <button onClick={() => onChange(goals.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Add a goal and press Enter…"
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <button onClick={add} className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
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
      toast.success('Package assigned');
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
      toast.success('Plan updated');
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
      <div className="flex items-center gap-2 text-gray-400 py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading plan…
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── No package yet ── */}
      {!assignedPackage && mode !== 'assign' && (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
          <Package className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 mb-1">No plan assigned yet</p>
          <p className="text-xs text-gray-400 mb-4">Assign a package to start tracking this client's progress</p>
          {activePackages.length > 0 ? (
            <button
              onClick={() => setMode('assign')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Assign Package
            </button>
          ) : (
            <p className="text-xs text-gray-400 italic">Create packages in your profile first</p>
          )}
        </div>
      )}

      {/* ── Active package view ── */}
      {assignedPackage?.package && mode === 'view' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{assignedPackage.package.name}</h3>
              {assignedPackage.package.description && (
                <p className="text-sm text-gray-500 mt-0.5">{assignedPackage.package.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border capitalize',
                assignedPackage.status === 'active'
                  ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30'
                  : assignedPackage.status === 'completed'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 border-gray-300'
                  : 'bg-red-500/10 text-red-500 border-red-500/30'
              )}>
                {assignedPackage.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {assignedPackage.status}
              </span>
              <button
                onClick={openEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit plan
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{assignedPackage.package.durationWeeks}w</p>
              <p className="text-xs text-gray-400 mt-0.5">duration</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                {assignedPackage.sessionsCompleted ?? 0}/{assignedPackage.package.sessionsIncluded}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">sessions done</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-center">
              <p className={cn(
                'text-lg font-bold',
                (() => {
                  const wl = weeksRemaining(assignedPackage.startDate, assignedPackage.package.durationWeeks);
                  return wl !== null && wl <= 2 ? 'text-amber-500' : 'text-gray-900 dark:text-white';
                })()
              )}>
                {weeksRemaining(assignedPackage.startDate, assignedPackage.package.durationWeeks) ?? '—'}w
              </p>
              <p className="text-xs text-gray-400 mt-0.5">weeks left</p>
            </div>
          </div>

          {/* Session bubble map */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Session progress</p>
            <SessionBubbles
              total={assignedPackage.package.sessionsIncluded}
              completed={assignedPackage.sessionsCompleted ?? 0}
            />
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Started {fmtDate(assignedPackage.startDate)}</span>
              <span>{assignedPackage.package.sessionsIncluded > 0
                ? Math.round(((assignedPackage.sessionsCompleted ?? 0) / assignedPackage.package.sessionsIncluded) * 100)
                : 0}% complete</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-blue-500 rounded-full transition-all duration-700"
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">What&apos;s included</p>
              <div className="space-y-1.5">
                {assignedPackage.package.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {(assignedPackage.goals ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Goals
              </p>
              <div className="space-y-2">
                {assignedPackage.goals!.map((g, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-blue-400">{i + 1}</span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{g}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coach note */}
          {assignedPackage.notes && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-xl">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" /> Your note
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{assignedPackage.notes}</p>
            </div>
          )}

          {/* Change package */}
          {activePackages.length > 0 && (
            <button
              onClick={() => setMode('assign')}
              className="text-xs text-gray-400 hover:text-blue-500 transition-colors underline"
            >
              Assign a different package
            </button>
          )}
        </div>
      )}

      {/* ── Edit plan ── */}
      {mode === 'edit' && assignedPackage?.package && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Editing: {assignedPackage.package.name}
            </p>
            <button onClick={() => setMode('view')} className="text-xs text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </div>

          {/* Sessions stepper */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sessions completed</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setEditSessions((n) => Math.max(0, n - 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{editSessions}</p>
                <p className="text-xs text-gray-400">of {assignedPackage.package.sessionsIncluded}</p>
              </div>
              <button
                onClick={() => setEditSessions((n) => Math.min(assignedPackage.package!.sessionsIncluded, n + 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Goals */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" /> Goals for this client
            </p>
            <GoalInput goals={editGoals} onChange={setEditGoals} />
          </div>

          {/* Note */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-500" /> Note for client
            </p>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Focus on form before increasing weight…"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              onClick={() => setMode('view')}
              className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Assign form ── */}
      {mode === 'assign' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {assignedPackage ? 'Change package' : 'Assign a package'}
            </p>
            <button onClick={() => setMode('view')} className="text-xs text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </div>

          {/* Package picker */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Choose a package</p>
            <div className="space-y-2">
              {activePackages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={cn(
                    'w-full text-left px-4 py-3.5 rounded-xl border transition-all',
                    selectedPkgId === pkg.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{pkg.name}</p>
                      {pkg.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{pkg.description}</p>}
                    </div>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">${pkg.priceUSD}</span>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
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
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" /> Goals <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </p>
                <GoalInput goals={assignGoals} onChange={setAssignGoals} />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-amber-500" /> Note for client <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </p>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Focus on form before increasing weight…"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                />
              </div>
            </>
          )}

          <button
            onClick={handleAssign}
            disabled={assigning || !selectedPkgId}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
            {assigning ? 'Assigning…' : 'Assign Package'}
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
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500">{error ?? 'Client not found'}</p>
        <button
          onClick={() => router.push(`/${locale}/dashboard/coach/clients`)}
          className="text-sm text-blue-500 hover:underline"
        >
          Back to clients
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
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to clients
      </button>

      {/* ── Header card ── */}
      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-6">
        <div className="h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 border-4 border-white dark:border-[#1a1d27] flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {getInitials(client.firstName, client.lastName)}
            </div>
            <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full border capitalize mb-1', STATUS_STYLES[client.status] ?? STATUS_STYLES.inactive)}>
              {client.status}
            </span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {client.firstName} {client.lastName}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{client.email}</p>
              {p.fitnessGoal && (
                <span className={cn('inline-block mt-2 px-2.5 py-0.5 text-xs font-medium rounded-full border', GOAL_COLORS[p.fitnessGoal] ?? 'bg-gray-100 text-gray-500 border-gray-300')}>
                  {GOAL_LABELS[p.fitnessGoal] ?? p.fitnessGoal}
                </span>
              )}
            </div>

            <div className="flex gap-6 text-center">
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{client.sessionsCompleted}</p>
                <p className="text-xs text-gray-400">sessions done</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{fmtDate(client.joinedAt)}</p>
                <p className="text-xs text-gray-400">joined</p>
              </div>
              {client.lastSessionAt && (
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{fmtDate(client.lastSessionAt)}</p>
                  <p className="text-xs text-gray-400">last session</p>
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
          <Section title="Personal Info" icon={<User className="w-3.5 h-3.5 text-gray-500" />}>
            <div className="space-y-0">
              <InfoRow label="Gender" value={p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1).replace(/_/g, ' ') : null} />
              <InfoRow label="Age" value={age != null ? `${age} years old` : null} />
              <InfoRow label="Timezone" value={p.timezone?.replace(/_/g, ' ')} />
              <InfoRow label="Phone" value={p.phone} />
              <InfoRow label="Preferred schedule" value={p.preferredWorkoutTime ? p.preferredWorkoutTime.charAt(0).toUpperCase() + p.preferredWorkoutTime.slice(1) : null} />
              {p.gymLocation && <InfoRow label="Gym / Location" value={p.gymLocation} />}
            </div>
          </Section>

          {/* Fitness profile */}
          <Section title="Fitness Profile" icon={<Activity className="w-3.5 h-3.5 text-blue-500" />}>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {p.weight != null && (
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-center">
                    <Scale className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{p.weight}</p>
                    <p className="text-xs text-gray-400">kg current</p>
                  </div>
                )}
                {p.targetWeight != null && (
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-center">
                    <Target className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{p.targetWeight}</p>
                    <p className="text-xs text-gray-400">kg target</p>
                  </div>
                )}
                {p.height != null && (
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-center">
                    <Ruler className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{p.height}</p>
                    <p className="text-xs text-gray-400">cm</p>
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
                <InfoRow label="Activity level" value={p.activityLevel ? (ACTIVITY_LABELS[p.activityLevel] ?? p.activityLevel) : null} />
              </div>
            </div>
          </Section>

          {/* Health */}
          <Section title="Health & Medical" icon={<HeartPulse className="w-3.5 h-3.5 text-red-500" />}>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Medical conditions</p>
                <TagList tags={p.medicalConditions} empty="None reported" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Injuries</p>
                <TagList tags={p.injuries} empty="None reported" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Allergies</p>
                <TagList tags={p.allergies} empty="None reported" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Dietary restrictions</p>
                <TagList tags={p.dietaryRestrictions} empty="None reported" />
              </div>
              {p.notes && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Onboarding notes</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-amber-50 dark:bg-amber-900/15 rounded-xl p-3 border border-amber-200 dark:border-amber-800/50">
                    {p.notes}
                  </p>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* ── Right: Package management ── */}
        <div className="space-y-5">
          <Section title="Plan & Package" icon={<Package className="w-3.5 h-3.5 text-purple-500" />}>
            <PackageSection clientId={client.id} coachPackages={coachPackages} />
          </Section>
        </div>

      </div>
    </div>
  );
}
