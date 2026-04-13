'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import {
  getCoachClients,
  getCoachOwnProfile,
  getConnectionRequests,
  respondToConnectionRequest,
  createClientInvite,
  CoachClient,
  ClientStatus,
  ConnectionRequest,
} from '@/actions/coach';
import {
  getCoachPackages,
  getClientActivePackage,
  assignPackage,
  updateClientPackageDetails,
  Package as CoachPackage,
  ClientPackage,
} from '@/actions/packages';
import { toast } from 'sonner';
import {
  Search,
  X,
  User,
  ChevronRight,
  HeartPulse,
  Zap,
  CalendarClock,
  Dumbbell,
  UserPlus,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Link2,
  Package,
  Loader2,
  Plus,
  Minus,
  Target,
  StickyNote,
  Pencil,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function fmtDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fmtRelative(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)}d ago`;
  return fmtDate(iso);
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ClientStatus, string> = {
  active: 'bg-[#ddf0df] text-[#2d5a31] border-[#3a7d44]/30',
  trial: 'bg-amber-50 text-amber-700 border-amber-300',
  inactive: 'bg-[#f6f8f5] text-[#617061] border-[#d8e0d8]',
};

function StatusBadge({ status, label }: { status: ClientStatus; label: string }) {
  return (
    <span className={cn('px-2.5 py-0.5 text-xs font-medium rounded-full border capitalize', STATUS_STYLES[status])}>
      {label}
    </span>
  );
}

// ─── Goal badge ───────────────────────────────────────────────────────────────

const GOAL_COLORS: Record<string, string> = {
  weight_loss: 'bg-[#f0faf0] text-[#2d5a31] border-[#3a7d44]/30',
  muscle_gain: 'bg-[#e8f4ea] text-[#2d5a31] border-[#3a7d44]/30',
  maintenance: 'bg-[#f6f8f5] text-[#617061] border-[#d8e0d8]',
  endurance: 'bg-amber-50 text-amber-700 border-amber-300',
};

function GoalBadge({ goal, label }: { goal?: string; label?: string }) {
  if (!goal || !label) return null;
  return (
    <span className={cn('px-2.5 py-0.5 text-xs font-medium rounded-full border', GOAL_COLORS[goal] ?? 'bg-gray-100 text-[#617061] border-gray-300')}>
      {label}
    </span>
  );
}

// ─── Weight progress bar ──────────────────────────────────────────────────────

function MiniWeightBar({
  weight,
  targetWeight,
  fitnessGoal,
}: {
  weight: number;
  targetWeight: number;
  fitnessGoal?: string;
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
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[#617061]">
        <span>{weight} kg</span>
        <span className="font-medium text-[#617061]">{gap.toFixed(1)} kg {isLoss ? 'left to lose' : 'left to gain'}</span>
        <span>{targetWeight} kg</span>
      </div>
      <div className="relative h-1.5 bg-[#e8f0e8] rounded-full overflow-hidden">
        <div
          className={cn('absolute h-full rounded-full', isLoss ? 'bg-[#3a7d44]' : 'bg-[#3a7d44]')}
          style={{ left: `${filledFrom}%`, width: `${filledWidth}%` }}
        />
      </div>
    </div>
  );
}

// ─── Tag list ─────────────────────────────────────────────────────────────────

function TagList({ tags, empty }: { tags?: string[] | null; empty: string }) {
  if (!tags || tags.length === 0) return <p className="text-xs text-[#617061] italic">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-[#f6f8f5] text-[#617061] border border-gray-200 border-[#d8e0d8]">
          {tag}
        </span>
      ))}
    </div>
  );
}

// ─── Client Drawer ────────────────────────────────────────────────────────────

function ClientDrawer({
  client,
  onClose,
  goalLabels,
  statusLabels,
  t,
  coachPackages,
}: {
  client: CoachClient;
  onClose: () => void;
  goalLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  t: (key: string) => string;
  coachPackages: CoachPackage[];
}) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const p = client.profile ?? {};

  // ── Package state ────────────────────────────────────────────────────────
  const [assignedPackage, setAssignedPackage] = useState<ClientPackage | null>(null);
  const [packageLoading, setPackageLoading] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Fields for new assignment
  const [assignNotes, setAssignNotes] = useState('');
  const [assignGoals, setAssignGoals] = useState<string[]>([]);
  const [assignGoalInput, setAssignGoalInput] = useState('');

  // Edit mode for existing assignment
  const [editingPlan, setEditingPlan] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editGoals, setEditGoals] = useState<string[]>([]);
  const [editGoalInput, setEditGoalInput] = useState('');
  const [editSessions, setEditSessions] = useState(0);
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPackageLoading(true);
    getClientActivePackage(client.id).then((res) => {
      if (!cancelled) {
        setAssignedPackage(res.clientPackage);
        setPackageLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [client.id]);

  function openEditPlan(pkg: ClientPackage) {
    setEditNotes(pkg.notes ?? '');
    setEditGoals(pkg.goals ?? []);
    setEditSessions(pkg.sessionsCompleted ?? 0);
    setEditingPlan(true);
  }

  async function handleAssign() {
    if (!selectedPackageId) return;
    setAssigning(true);
    const res = await assignPackage(selectedPackageId, {
      clientId: client.id,
      notes: assignNotes || undefined,
      goals: assignGoals.length > 0 ? assignGoals : undefined,
    });
    if (res.success) {
      toast.success('Package assigned successfully');
      setSelectedPackageId('');
      setAssignNotes('');
      setAssignGoals([]);
      getClientActivePackage(client.id).then((r) => setAssignedPackage(r.clientPackage));
    } else {
      toast.error(res.message || 'Failed to assign package');
    }
    setAssigning(false);
  }

  async function handleSavePlan() {
    if (!assignedPackage) return;
    setSavingPlan(true);
    const res = await updateClientPackageDetails(assignedPackage.id, {
      notes: editNotes || undefined,
      goals: editGoals.length > 0 ? editGoals : [],
      sessionsCompleted: editSessions,
    });
    if (res.success) {
      toast.success('Plan updated');
      if (res.clientPackage) {
        setAssignedPackage(res.clientPackage);
      } else {
        // Patch locally so UI reflects immediately
        setAssignedPackage((prev) => prev ? {
          ...prev,
          notes: editNotes || undefined,
          goals: editGoals,
          sessionsCompleted: editSessions,
        } : prev);
      }
      setEditingPlan(false);
    } else {
      toast.error(res.message || 'Failed to update plan');
    }
    setSavingPlan(false);
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const displayName = `${client.firstName} ${client.lastName}`;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />

      {/* Panel */}
      <div
        ref={drawerRef}
        className="fixed top-16 right-0 z-50 h-[calc(100vh-4rem)] w-full max-w-sm bg-white border-l border-[#d8e0d8] shadow-2xl overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-[#d8e0d8] flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-full bg-[#162318] flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
            {getInitials(client.firstName, client.lastName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0f1f10] truncate">{displayName}</p>
            <p className="text-xs text-[#617061] truncate">{client.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#617061] hover:bg-[#f0f4f0] hover:text-[#0f1f10] transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status + goal row */}
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={client.status} label={statusLabels[client.status] ?? client.status} />
            {p.fitnessGoal && (
              <GoalBadge goal={p.fitnessGoal} label={goalLabels[p.fitnessGoal] ?? p.fitnessGoal} />
            )}
          </div>

          {/* Session stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f6f8f5] rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-[#0f1f10]">{client.sessionsCompleted}</p>
              <p className="text-xs text-[#617061] mt-0.5">{t('drawerSessions')}</p>
            </div>
            <div className="bg-[#f6f8f5] rounded-xl p-3 text-center">
              <p className="text-sm font-medium text-[#617061]">
                {fmtDate(client.joinedAt) ?? '—'}
              </p>
              <p className="text-xs text-[#617061] mt-0.5">{t('drawerJoined')}</p>
            </div>
          </div>

          {/* Next session */}
          {client.nextSessionAt && (
            <div className="flex items-center gap-3 bg-[#f0faf0] rounded-xl p-3 border border-[#3a7d44]/20">
              <CalendarClock className="w-4 h-4 text-[#3a7d44] flex-shrink-0" />
              <div>
                <p className="text-xs text-[#3a7d44] font-medium">{t('drawerNextSession')}</p>
                <p className="text-sm text-[#2d5a31]">{fmtRelative(client.nextSessionAt)}</p>
              </div>
            </div>
          )}

          {/* Last session */}
          {client.lastSessionAt && (
            <div className="text-xs text-[#617061]">
              {t('drawerLastSession')}: <span className="text-[#617061]">{fmtRelative(client.lastSessionAt)}</span>
            </div>
          )}

          {/* ── Fitness section ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#ddf0df] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-[#3a7d44]" />
              </div>
              <p className="text-xs font-semibold text-[#617061] uppercase tracking-wide">{t('drawerFitness')}</p>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {p.weight != null && (
                <div>
                  <p className="text-xs text-[#617061] uppercase tracking-wide">{t('drawerWeight')}</p>
                  <p className="text-sm text-[#0f1f10]">{p.weight} kg</p>
                </div>
              )}
              {p.height != null && (
                <div>
                  <p className="text-xs text-[#617061] uppercase tracking-wide">{t('drawerHeight')}</p>
                  <p className="text-sm text-[#0f1f10]">{p.height} cm</p>
                </div>
              )}
              {p.activityLevel && (
                <div className="col-span-2">
                  <p className="text-xs text-[#617061] uppercase tracking-wide">{t('drawerActivity')}</p>
                  <p className="text-sm text-[#0f1f10] capitalize">{p.activityLevel.replace(/_/g, ' ')}</p>
                </div>
              )}
            </div>

            {p.weight != null && p.targetWeight != null && p.weight !== p.targetWeight && (
              <MiniWeightBar weight={p.weight} targetWeight={p.targetWeight} fitnessGoal={p.fitnessGoal} />
            )}
          </div>

          {/* ── Health section ── */}
          <div className="space-y-4 pt-2 border-t border-[#d8e0d8]">
            <div className="flex items-center gap-2 pt-2">
              <div className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center">
                <HeartPulse className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-xs font-semibold text-[#617061] uppercase tracking-wide">{t('drawerHealth')}</p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-[#617061] uppercase tracking-wide mb-1">{t('drawerConditions')}</p>
                <TagList tags={p.medicalConditions} empty={t('drawerNone')} />
              </div>
              <div>
                <p className="text-xs text-[#617061] uppercase tracking-wide mb-1">{t('drawerInjuries')}</p>
                <TagList tags={p.injuries} empty={t('drawerNone')} />
              </div>
              <div>
                <p className="text-xs text-[#617061] uppercase tracking-wide mb-1">{t('drawerAllergies')}</p>
                <TagList tags={p.allergies} empty={t('drawerNone')} />
              </div>
              <div>
                <p className="text-xs text-[#617061] uppercase tracking-wide mb-1">{t('drawerDiet')}</p>
                <TagList tags={p.dietaryRestrictions} empty={t('drawerNone')} />
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          {p.notes && (
            <div className="pt-2 border-t border-[#d8e0d8]">
              <div className="flex items-center gap-2 pt-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-[#ddf0df] flex items-center justify-center">
                  <Dumbbell className="w-3.5 h-3.5 text-[#3a7d44]" />
                </div>
                <p className="text-xs font-semibold text-[#617061] uppercase tracking-wide">{t('drawerNotes')}</p>
              </div>
              <p className="text-sm text-[#617061] bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                {p.notes}
              </p>
            </div>
          )}

          {/* ── Package / Plan ── */}
          <div className="pt-2 border-t border-[#d8e0d8]">
            <div className="flex items-center justify-between pt-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-purple-500/15 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 text-[#3a7d44]" />
                </div>
                <p className="text-xs font-semibold text-[#617061] uppercase tracking-wide">Package / Plan</p>
              </div>
              {assignedPackage && !editingPlan && (
                <button
                  onClick={() => openEditPlan(assignedPackage)}
                  className="inline-flex items-center gap-1 text-xs text-[#3a7d44] hover:text-[#2d5a31] font-medium"
                >
                  <Pencil className="w-3 h-3" />
                  Edit plan
                </button>
              )}
            </div>

            {/* Loading */}
            {packageLoading ? (
              <div className="flex items-center gap-2 text-xs text-[#617061] mb-3">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading…</span>
              </div>
            ) : assignedPackage?.package ? (
              <>
                {/* Current package summary */}
                <div className="bg-[#f0faf0] rounded-xl p-3 border border-[#3a7d44]/20 mb-3">
                  <p className="text-sm font-medium text-[#0f1f10]">{assignedPackage.package.name}</p>
                  <p className="text-xs text-[#617061] mt-0.5">
                    {assignedPackage.package.durationWeeks}w · {assignedPackage.package.sessionsIncluded} sessions · ${assignedPackage.package.priceUSD}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn(
                      'px-2 py-0.5 text-xs rounded-full border capitalize',
                      assignedPackage.status === 'active'
                        ? 'bg-teal-500/10 text-[#3a7d44] border-teal-500/30'
                        : assignedPackage.status === 'completed'
                          ? 'bg-[#f6f8f5] text-[#617061] border-[#d8e0d8]'
                          : 'bg-red-500/10 text-red-500 border-red-500/30'
                    )}>
                      {assignedPackage.status}
                    </span>
                    {/* Sessions completed chip */}
                    <span className="px-2 py-0.5 text-xs rounded-full bg-[#ddf0df] text-[#2d5a31] border border-[#3a7d44]/30">
                      {assignedPackage.sessionsCompleted ?? 0}/{assignedPackage.package.sessionsIncluded} sessions
                    </span>
                  </div>
                </div>

                {/* Goals preview */}
                {(assignedPackage.goals ?? []).length > 0 && !editingPlan && (
                  <div className="mb-3">
                    <p className="text-[11px] font-semibold text-[#617061] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Target className="w-3 h-3" /> Goals
                    </p>
                    <div className="space-y-1">
                      {assignedPackage.goals!.map((g, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-[#3a7d44] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[8px] font-bold text-blue-400">{i + 1}</span>
                          </div>
                          <span className="text-xs text-[#617061]">{g}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes preview */}
                {assignedPackage.notes && !editingPlan && (
                  <div className="mb-3 p-2.5 bg-amber-50 dark:bg-amber-900/15 rounded-lg border border-amber-200 dark:border-amber-800/50">
                    <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                      <StickyNote className="w-3 h-3" /> Note
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{assignedPackage.notes}</p>
                  </div>
                )}

                {/* Edit panel */}
                {editingPlan && (
                  <div className="space-y-4 mb-3 p-3 bg-[#f6f8f5] rounded-xl border border-gray-200 border-[#d8e0d8]">
                    {/* Sessions completed stepper */}
                    <div>
                      <p className="text-xs font-semibold text-[#617061] mb-2">Sessions completed</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setEditSessions((n) => Math.max(0, n - 1))}
                          className="w-8 h-8 rounded-lg bg-[#e8f0e8] flex items-center justify-center hover:bg-[#e8f0e8] transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5 text-[#617061]" />
                        </button>
                        <span className="text-lg font-bold text-[#0f1f10] tabular-nums w-8 text-center">
                          {editSessions}
                        </span>
                        <button
                          onClick={() => setEditSessions((n) => Math.min(assignedPackage.package!.sessionsIncluded, n + 1))}
                          className="w-8 h-8 rounded-lg bg-[#e8f0e8] flex items-center justify-center hover:bg-[#e8f0e8] transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#617061]" />
                        </button>
                        <span className="text-xs text-[#617061]">of {assignedPackage.package!.sessionsIncluded}</span>
                      </div>
                    </div>

                    {/* Goals */}
                    <div>
                      <p className="text-xs font-semibold text-[#617061] mb-2 flex items-center gap-1">
                        <Target className="w-3 h-3" /> Goals for this client
                      </p>
                      <div className="space-y-1.5 mb-2">
                        {editGoals.map((g, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="flex-1 text-xs text-[#617061] bg-white rounded-lg px-2.5 py-1.5 border border-gray-200 border-[#d8e0d8]">
                              {g}
                            </span>
                            <button
                              onClick={() => setEditGoals((prev) => prev.filter((_, idx) => idx !== i))}
                              className="text-[#617061] hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          value={editGoalInput}
                          onChange={(e) => setEditGoalInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editGoalInput.trim()) {
                              setEditGoals((prev) => [...prev, editGoalInput.trim()]);
                              setEditGoalInput('');
                            }
                          }}
                          placeholder="Add a goal…"
                          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#3a7d44]"
                        />
                        <button
                          onClick={() => {
                            if (editGoalInput.trim()) {
                              setEditGoals((prev) => [...prev, editGoalInput.trim()]);
                              setEditGoalInput('');
                            }
                          }}
                          className="px-2.5 py-1.5 bg-[#3a7d44] text-white text-xs rounded-lg hover:bg-[#2d5a31] transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <p className="text-xs font-semibold text-[#617061] mb-2 flex items-center gap-1">
                        <StickyNote className="w-3 h-3" /> Note for client
                      </p>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={3}
                        placeholder="e.g. Focus on form before increasing weight…"
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#3a7d44] resize-none"
                      />
                    </div>

                    {/* Save / cancel */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSavePlan}
                        disabled={savingPlan}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#162318] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                      >
                        {savingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {savingPlan ? 'Saving…' : 'Save changes'}
                      </button>
                      <button
                        onClick={() => setEditingPlan(false)}
                        className="px-3 py-2 text-xs text-[#617061] hover:text-[#617061] rounded-lg border border-gray-200 border-[#d8e0d8]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-[#617061] italic mb-3">No package assigned yet.</p>
            )}

            {/* Assign / change package */}
            {coachPackages.filter((pkg) => pkg.isActive).length > 0 && (
              <div className="space-y-3">
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40"
                >
                  <option value="">{assignedPackage ? 'Change to a different package…' : 'Select a package…'}</option>
                  {coachPackages.filter((pkg) => pkg.isActive).map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} — {pkg.durationWeeks}w · {pkg.sessionsIncluded} sessions · ${pkg.priceUSD}
                    </option>
                  ))}
                </select>

                {/* Notes + goals for new assignment (shown only when a package is selected) */}
                {selectedPackageId && (
                  <div className="space-y-3 p-3 bg-[#f6f8f5] rounded-xl border border-gray-200 border-[#d8e0d8]">
                    {/* Goals */}
                    <div>
                      <p className="text-xs font-semibold text-[#617061] mb-2 flex items-center gap-1">
                        <Target className="w-3 h-3" /> Goals (optional)
                      </p>
                      <div className="space-y-1.5 mb-2">
                        {assignGoals.map((g, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="flex-1 text-xs text-[#617061] bg-white rounded-lg px-2.5 py-1.5 border border-gray-200 border-[#d8e0d8]">
                              {g}
                            </span>
                            <button
                              onClick={() => setAssignGoals((prev) => prev.filter((_, idx) => idx !== i))}
                              className="text-[#617061] hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          value={assignGoalInput}
                          onChange={(e) => setAssignGoalInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && assignGoalInput.trim()) {
                              setAssignGoals((prev) => [...prev, assignGoalInput.trim()]);
                              setAssignGoalInput('');
                            }
                          }}
                          placeholder="Add a goal and press Enter…"
                          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#3a7d44]"
                        />
                        <button
                          onClick={() => {
                            if (assignGoalInput.trim()) {
                              setAssignGoals((prev) => [...prev, assignGoalInput.trim()]);
                              setAssignGoalInput('');
                            }
                          }}
                          className="px-2.5 py-1.5 bg-[#3a7d44] text-white text-xs rounded-lg hover:bg-[#2d5a31] transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Note */}
                    <div>
                      <p className="text-xs font-semibold text-[#617061] mb-1.5 flex items-center gap-1">
                        <StickyNote className="w-3 h-3" /> Note for client (optional)
                      </p>
                      <textarea
                        value={assignNotes}
                        onChange={(e) => setAssignNotes(e.target.value)}
                        rows={2}
                        placeholder="e.g. Focus on form before increasing weight…"
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#3a7d44] resize-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAssign}
                  disabled={assigning || !selectedPackageId}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#162318] text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {assigning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {assigning ? 'Assigning…' : assignedPackage ? 'Change Package' : 'Assign Package'}
                </button>
              </div>
            )}

            {coachPackages.filter((pkg) => pkg.isActive).length === 0 && !packageLoading && (
              <p className="text-xs text-[#617061] italic">Create packages in your profile to assign them here.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Client card ─────────────────────────────────────────────────────────────

function ClientCard({
  client,
  onClick,
  onViewProfile,
  goalLabels,
  statusLabels,
}: {
  client: CoachClient;
  onClick: () => void;
  onViewProfile: () => void;
  goalLabels: Record<string, string>;
  statusLabels: Record<string, string>;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#d8e0d8] p-5 hover:border-[#3a7d44] hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-[#162318] flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
          {getInitials(client.firstName, client.lastName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[#0f1f10] truncate">
              {client.firstName} {client.lastName}
            </p>
          </div>
          <p className="text-xs text-[#617061] truncate mt-0.5">{client.email}</p>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <StatusBadge status={client.status} label={statusLabels[client.status] ?? client.status} />
            {client.profile?.fitnessGoal && (
              <GoalBadge goal={client.profile.fitnessGoal} label={goalLabels[client.profile.fitnessGoal] ?? client.profile.fitnessGoal} />
            )}
          </div>

          {/* Sessions + last session */}
          <div className="flex items-center gap-3 mt-3 text-xs text-[#617061]">
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3 h-3" />
              <span>{client.sessionsCompleted} sessions</span>
            </span>
            {client.lastSessionAt && (
              <>
                <span className="text-[#d8e0d8]">·</span>
                <span className="flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" />
                  <span>{fmtRelative(client.lastSessionAt)}</span>
                </span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#d8e0d8]">
            <button
              type="button"
              onClick={onViewProfile}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#162318] rounded-lg hover:opacity-90 transition-opacity"
            >
              <User className="w-3.5 h-3.5" />
              View Profile
            </button>
            <button
              type="button"
              onClick={onClick}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#617061] bg-[#f6f8f5] rounded-lg hover:bg-[#e8f0e8] transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              Quick view
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Invite Client modal ──────────────────────────────────────────────────────

function InviteClientModal({ onClose, locale }: { onClose: () => void; locale: string }) {
  const t = useTranslations('coachDashboard');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  async function handleSend() {
    if (!email.trim()) return;
    setSending(true);
    try {
      const result = await createClientInvite(email.trim());
      if (result.success) {
        setDone(true);
        // Build the invite URL from the token returned by the backend, or fall back to a local link
        const url = result.inviteUrl ?? (result.token
          ? `${window.location.origin}/${locale}/invite/client/${result.token}`
          : null);
        setInviteUrl(url);
      } else {
        toast.error(result.message);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#d8e0d8] overflow-hidden z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#d8e0d8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ddf0df] flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-[#3a7d44]" />
            </div>
            <p className="text-sm font-semibold text-[#0f1f10]">{t('inviteClientTitle')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#617061] hover:bg-[#f0f4f0] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!done ? (
            <>
              <p className="text-sm text-[#617061]">{t('inviteClientHint')}</p>
              <div>
                <label className="block text-xs font-medium text-[#617061] uppercase tracking-wide mb-1.5">{t('inviteClientEmail')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  placeholder="client@example.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#617061] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={sending || !email.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#162318] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {sending ? <>{t('inviteSending')}</> : <><Send className="w-4 h-4" /> {t('inviteSendButton')}</>}
              </button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#ddf0df] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-[#3a7d44]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0f1f10]">{t('inviteSentTitle')}</p>
                <p className="text-xs text-[#617061] mt-1">{t('inviteSentDesc', { email })}</p>
              </div>
              {inviteUrl && (
                <div className="bg-[#f6f8f5] rounded-xl p-3 text-left">
                  <p className="text-xs text-[#617061] mb-1">{t('inviteLinkLabel')}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-[#3a7d44] truncate">{inviteUrl}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success(t('inviteLinkCopied')); }}
                      className="p-1.5 rounded-lg text-[#617061] hover:bg-[#e8f0e8] transition-colors flex-shrink-0"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
              <button onClick={onClose} className="w-full px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 border-[#d8e0d8] text-[#617061] hover:bg-[#f6f8f5] transition-colors">
                {t('inviteDoneButton')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pending connection requests panel ────────────────────────────────────────

function RequestsPanel({
  t,
  onClientAccepted,
}: {
  t: (key: string) => string;
  onClientAccepted?: () => void;
}) {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getConnectionRequests();
    if (res.success) setRequests(res.requests.filter(r => r.status === 'pending'));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function respond(requestId: string, action: 'accept' | 'decline') {
    setResponding(requestId);
    const result = await respondToConnectionRequest(requestId, action);
    if (result.success) {
      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success(action === 'accept' ? t('requestAccepted') : t('requestDeclined'));
      if (action === 'accept') onClientAccepted?.();
    } else {
      toast.error(result.message);
    }
    setResponding(null);
  }

  if (loading || requests.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
      <div className="px-5 py-3 border-b border-amber-200 dark:border-amber-800 flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">{requests.length}</span>
        </div>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{t('pendingRequestsTitle')}</p>
        <Clock className="w-4 h-4 text-amber-500 ml-auto" />
      </div>
      <div className="divide-y divide-amber-200/60 dark:divide-amber-800/60">
        {requests.map((req) => {
          const goalMap: Record<string, string> = {
            weight_loss: t('goalWeightLoss'),
            muscle_gain: t('goalMuscleGain'),
            maintenance: t('goalMaintenance'),
            endurance: t('goalEndurance'),
          };
          return (
            <div key={req.id} className="px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                {req.clientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0f1f10]">{req.clientName}</p>
                <p className="text-xs text-[#617061] truncate">{req.clientEmail}</p>
                {req.clientProfile?.fitnessGoal && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    {goalMap[req.clientProfile.fitnessGoal] ?? req.clientProfile.fitnessGoal}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => respond(req.id, 'accept')}
                  disabled={responding === req.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 text-white text-xs font-medium hover:bg-teal-600 transition-colors disabled:opacity-60"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t('acceptRequest')}
                </button>
                <button
                  onClick={() => respond(req.id, 'decline')}
                  disabled={responding === req.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 border-[#d8e0d8] text-[#617061] text-xs font-medium hover:bg-[#f0f4f0] transition-colors disabled:opacity-60"
                >
                  <XCircle className="w-3.5 h-3.5" /> {t('declineRequest')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ClientsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-[#e8f0e8] rounded-xl w-full max-w-sm" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#d8e0d8] h-36" />
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const STATUS_FILTERS: (ClientStatus | 'all')[] = ['all', 'active', 'trial', 'inactive'];

export default function CoachClientsPage() {
  const t = useTranslations('coachDashboard');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const [clients, setClients] = useState<CoachClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [selectedClient, setSelectedClient] = useState<CoachClient | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Coach packages — loaded once so the drawer can assign without refetching
  const [coachPackages, setCoachPackages] = useState<CoachPackage[]>([]);
  const [coachProfileId, setCoachProfileId] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCoachClients();
      if (res.success) setClients(res.clients);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Fetch coach profile ID, then load packages
  useEffect(() => {
    getCoachOwnProfile().then((res) => {
      const id = res.coachProfileId;
      if (id) {
        setCoachProfileId(id);
        getCoachPackages(id).then((pkgRes) => {
          if (pkgRes.success) setCoachPackages(pkgRes.packages);
        });
      }
    });
  }, []);

  const goalLabels: Record<string, string> = {
    weight_loss: t('goalWeightLoss'),
    muscle_gain: t('goalMuscleGain'),
    maintenance: t('goalMaintenance'),
    endurance: t('goalEndurance'),
  };

  const statusLabels: Record<string, string> = {
    active: t('statusActive'),
    trial: t('statusTrial'),
    inactive: t('statusInactive'),
  };

  const filtered = clients.filter((c) => {
    const matchSearch =
      !search ||
      `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts: Record<string, number> = {
    all: clients.length,
    active: clients.filter((c) => c.status === 'active').length,
    trial: clients.filter((c) => c.status === 'trial').length,
    inactive: clients.filter((c) => c.status === 'inactive').length,
  };

  if (loading) return <ClientsSkeleton />;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1f10]">{t('clientsTitle')}</h1>
          <p className="text-sm text-[#617061] mt-0.5">{t('clientsSubtitle', { n: clients.length })}</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl bg-[#162318] hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          {t('inviteClientButton')}
        </button>
      </div>

      {/* ── Pending connection requests ── */}
      <RequestsPanel
        t={(key: string) => t(key as Parameters<typeof t>[0])}
        onClientAccepted={load}
      />

      {/* ── Search + filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#617061]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#617061] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#617061] hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-[#f6f8f5] rounded-xl p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                statusFilter === s
                  ? 'bg-white text-[#0f1f10] shadow-sm'
                  : 'text-[#617061] hover:text-[#617061]'
              )}
            >
              {s === 'all' ? t('filterAll') : statusLabels[s]}
              <span className="ml-1.5 text-[#617061]">({statusCounts[s]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Client grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#f6f8f5] flex items-center justify-center mb-4">
            <User className="w-7 h-7 text-[#617061]" />
          </div>
          <p className="text-sm font-medium text-[#617061]">{search ? t('noResults') : t('noClients')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => setSelectedClient(client)}
              onViewProfile={() => router.push(`/${locale}/dashboard/coach/clients/${client.id}`)}
              goalLabels={goalLabels}
              statusLabels={statusLabels}
            />
          ))}
        </div>
      )}

      {/* ── Invite modal ── */}
      {showInviteModal && (
        <InviteClientModal onClose={() => setShowInviteModal(false)} locale={locale} />
      )}

      {/* ── Detail drawer ── */}
      {selectedClient && (
        <ClientDrawer
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          goalLabels={goalLabels}
          statusLabels={statusLabels}
          t={(key: string) => t(key as Parameters<typeof t>[0])}
          coachPackages={coachPackages}
        />
      )}
    </div>
  );
}
