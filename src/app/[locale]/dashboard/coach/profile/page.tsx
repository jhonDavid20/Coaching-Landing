'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/session-provider';
import { updateCoachProfile, getCoachOwnProfile, CoachProfileUpdate } from '@/actions/coach';
import { getFullUserProfile } from '@/actions/user';
import AvatarUploader from '@/components/profile/avatar-uploader';
import {
  getCoachPackages,
  createPackage,
  updatePackage,
  deletePackage,
  Package as CoachPackage,
  PackageFormData,
} from '@/actions/packages';
import { toast } from 'sonner';
import {
  User,
  Briefcase,
  Clock,
  DollarSign,
  Globe,
  CheckCircle2,
  Plus,
  Trash2,
  Save,
  Package,
  Edit2,
  ArrowLeft,
  Loader2,
  Pencil,
  X,
  BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyPackageForm(): PackageFormData {
  return { name: '', description: '', durationWeeks: 4, sessionsIncluded: 4, priceUSD: 0, features: [] };
}

// ─── Multi-select pill input ──────────────────────────────────────────────────

function PillInput({
  label,
  values,
  onChange,
  placeholder,
  suggestions,
}: {
  label: string;
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const [input, setInput] = useState('');

  function add(val: string) {
    const trimmed = val.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setInput('');
  }

  function remove(val: string) {
    onChange(values.filter((v) => v !== val));
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#617061] uppercase tracking-wide">{label}</label>
      {/* Pills */}
      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
        {values.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#ddf0df] text-[#2d5a31] rounded-full border border-[#3a7d44]/30"
          >
            {v}
            <button type="button" onClick={() => remove(v)} className="ml-0.5 text-[#3a7d44] hover:text-[#2d5a31]">
              <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="currentColor">
                <path d="M6.5 5l3-3-1.5-1.5L5 3.5 2 .5.5 2 3.5 5 .5 8 2 9.5 5 6.5l3 3L9.5 8 6.5 5z" />
              </svg>
            </button>
          </span>
        ))}
      </div>
      {/* Input */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); } }}
        placeholder={placeholder ?? 'Type and press Enter'}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#617061] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40"
      />
      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {suggestions.filter((s) => !values.includes(s)).slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="px-2 py-0.5 text-xs rounded-full border border-gray-200 border-[#d8e0d8] text-[#617061] hover:border-[#3a7d44] hover:text-[#3a7d44] transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, iconBg, children }: {
  title: string;
  icon: React.ElementType;
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#d8e0d8] flex items-center gap-3">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-[#0f1f10]">{title}</h3>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

// ─── Field wrappers ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#617061] uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, type = 'text',
}: {
  value: string | number | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#617061] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }: {
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#617061] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40 resize-none"
    />
  );
}

function SelectInput({ value, onChange, options }: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Package card (view mode) ─────────────────────────────────────────────────

function PackageCard({
  pkg,
  onEdit,
  onDelete,
  deleting,
}: {
  pkg: CoachPackage;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">
      <div className="h-1 bg-[#3a7d44]" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-[#0f1f10] truncate">{pkg.name}</p>
            {pkg.description && (
              <p className="text-sm text-[#617061] mt-0.5 line-clamp-2">{pkg.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-lg text-[#617061] hover:bg-[#f0f4f0] hover:text-gray-600 transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg text-[#617061] hover:bg-red-50 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
              title="Delete"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        {/* Stats pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-700/40">
            <DollarSign className="w-3 h-3" /> ${pkg.priceUSD}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#ddf0df] text-[#2d5a31] border border-[#3a7d44]/20">
            <Clock className="w-3 h-3" /> {pkg.durationWeeks}w
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f0faf0] text-[#2d5a31] border border-[#3a7d44]/20">
            <CheckCircle2 className="w-3 h-3" /> {pkg.sessionsIncluded} sessions
          </span>
        </div>
        {/* Features list */}
        {pkg.features && pkg.features.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#d8e0d8] space-y-1.5">
            {pkg.features.map((feat, i) => (
              <div key={i} className="flex items-center gap-2">
                <BadgeCheck className="w-3.5 h-3.5 text-[#3a7d44] flex-shrink-0" />
                <span className="text-xs text-[#617061]">{feat}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Package feature input ────────────────────────────────────────────────────

function PackageFeatureInput({ onAdd }: { onAdd: (feat: string) => void }) {
  const t = useTranslations('coachDashboard');
  const [value, setValue] = useState('');
  function add() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  }
  return (
    <div className="flex gap-1.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        placeholder={t('pkgFeaturePlaceholder')}
        className="flex-1 px-2.5 py-2 text-sm rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#617061] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40"
      />
      <button
        type="button"
        onClick={add}
        className="px-3 py-2 bg-[#3a7d44] text-white text-xs font-medium rounded-lg hover:bg-[#2d5a31] transition-colors flex items-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" />
        {t('pkgAdd')}
      </button>
    </div>
  );
}

// ─── Package form (create / edit) ─────────────────────────────────────────────

function PackageForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: PackageFormData;
  onSave: (data: PackageFormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const t = useTranslations('coachDashboard');
  const [form, setForm] = useState<PackageFormData>(initial);
  const up = <K extends keyof PackageFormData>(k: K, v: PackageFormData[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">
      <div className="h-1 bg-[#3a7d44]" />
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label={t('pkgName')}>
              <TextInput value={form.name} onChange={(v) => up('name', v)} placeholder={t('pkgNamePlaceholder')} />
            </Field>
          </div>
          <Field label={t('pkgPrice')}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#617061] text-sm">$</span>
              <input
                type="number"
                min={0}
                value={form.priceUSD || ''}
                onChange={(e) => up('priceUSD', Number(e.target.value))}
                placeholder="499"
                className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#617061] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40"
              />
            </div>
          </Field>
          <Field label={t('pkgDuration')}>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={form.durationWeeks || ''}
                onChange={(e) => up('durationWeeks', Number(e.target.value))}
                className="w-20 px-3 py-2 text-sm rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40"
              />
              <span className="text-sm text-[#617061]">{t('pkgWeeks')}</span>
            </div>
          </Field>
          <Field label={t('pkgSessions')}>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={form.sessionsIncluded || ''}
                onChange={(e) => up('sessionsIncluded', Number(e.target.value))}
                className="w-20 px-3 py-2 text-sm rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40"
              />
              <span className="text-sm text-[#617061]">{t('pkgSessionsUnit')}</span>
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('pkgDescription')}>
              <TextArea
                value={form.description ?? ''}
                onChange={(v) => up('description', v)}
                rows={2}
                placeholder={t('pkgDescPlaceholder')}
              />
            </Field>
          </div>

          {/* Features / what's included */}
          <div className="sm:col-span-2">
            <Field label={t('pkgFeatures')}>
              <div className="space-y-2">
                {(form.features ?? []).map((feat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-[#3a7d44] flex-shrink-0" />
                    <span className="flex-1 text-sm text-[#617061] bg-[#f6f8f5] rounded-lg px-2.5 py-1.5 border border-gray-200 border-[#d8e0d8]">
                      {feat}
                    </span>
                    <button
                      type="button"
                      onClick={() => up('features', (form.features ?? []).filter((_, idx) => idx !== i))}
                      className="text-[#617061] hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <PackageFeatureInput
                  onAdd={(feat) => up('features', [...(form.features ?? []), feat])}
                />
              </div>
            </Field>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-[#617061] hover:text-[#0f1f10] transition-colors"
          >
            {t('pkgCancel')}
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim() || !form.priceUSD || !form.durationWeeks || !form.sessionsIncluded}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl bg-[#162318] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('pkgSave')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile overview (view mode) ────────────────────────────────────────────

function ProfileOverview({
  form,
  loading,
  avatarUrl,
  initials,
  onAvatarChanged,
}: {
  form: CoachProfileUpdate;
  loading: boolean;
  avatarUrl: string | null;
  initials: string;
  onAvatarChanged: (url: string | null) => void;
}) {
  const t = useTranslations('coachDashboard');

  const coachingTypeLabel: Record<string, string> = {
    online: t('coachingOnline'),
    in_person: t('coachingInPerson'),
    hybrid: t('coachingHybrid'),
  };

  const sections = [
    {
      title: t('overviewSectionIdentity'),
      icon: User,
      iconBg: 'bg-[#3a7d44]',
      fields: [
        { label: t('overviewFieldHeadline'), filled: !!form.profileHeadline, value: form.profileHeadline || undefined },
        { label: t('fieldBio'), filled: !!form.bio, value: form.bio ? `${form.bio.slice(0, 100)}${form.bio.length > 100 ? '…' : ''}` : undefined },
        { label: t('fieldYears'), filled: form.yearsOfExperience != null, value: form.yearsOfExperience != null ? `${form.yearsOfExperience} ${t('yrsUnit')}` : undefined },
        { label: t('fieldCoachingType'), filled: !!form.coachingType, value: form.coachingType ? coachingTypeLabel[form.coachingType] : undefined },
      ],
    },
    {
      title: t('sectionExpertise'),
      icon: Briefcase,
      iconBg: 'bg-[#2d5a31]',
      fields: [
        { label: t('fieldSpecialties'), filled: (form.specialties?.length ?? 0) > 0, value: form.specialties?.join(', ') || undefined },
        { label: t('fieldModalities'), filled: (form.trainingModalities?.length ?? 0) > 0, value: form.trainingModalities?.join(', ') || undefined },
        { label: t('fieldClientTypes'), filled: (form.targetClientTypes?.length ?? 0) > 0, value: form.targetClientTypes?.join(', ') || undefined },
        { label: t('fieldCertifications'), filled: (form.certifications?.length ?? 0) > 0, value: form.certifications?.join(', ') || undefined },
        { label: t('overviewFieldLanguages'), filled: (form.languagesSpoken?.length ?? 0) > 0, value: form.languagesSpoken?.join(', ') || undefined },
      ],
    },
    {
      title: t('sectionAvailability'),
      icon: Clock,
      iconBg: 'bg-[#52a85e]',
      fields: [
        { label: t('fieldTimezone'), filled: !!form.timezone, value: form.timezone || undefined },
        { label: t('fieldSessionDuration'), filled: form.sessionDurationMinutes != null, value: form.sessionDurationMinutes != null ? `${form.sessionDurationMinutes} ${t('minutes')}` : undefined },
        { label: t('overviewFieldMaxClients'), filled: form.maxClientCapacity != null, value: form.maxClientCapacity != null ? `${form.maxClientCapacity}` : undefined },
        { label: t('overviewFieldAccepting'), filled: form.acceptingClients != null, value: form.acceptingClients != null ? (form.acceptingClients ? t('boolYes') : t('boolNo')) : undefined },
      ],
    },
    {
      title: t('overviewSectionRates'),
      icon: DollarSign,
      iconBg: 'bg-[#e8a030]',
      fields: [
        { label: t('overviewFieldSessionRate'), filled: form.sessionRateUSD != null, value: form.sessionRateUSD != null ? `$${form.sessionRateUSD}${t('ratePerSession')}` : undefined },
        { label: t('overviewFieldTrialAvailable'), filled: form.trialSessionAvailable != null, value: form.trialSessionAvailable != null ? (form.trialSessionAvailable ? t('boolYes') : t('boolNo')) : undefined },
        ...(form.trialSessionAvailable ? [{ label: t('overviewFieldTrialRate'), filled: form.trialSessionRateUSD != null, value: form.trialSessionRateUSD != null ? (form.trialSessionRateUSD === 0 ? t('freeLabel') : `$${form.trialSessionRateUSD}`) : undefined }] : []),
      ],
    },
    {
      title: t('sectionLinks'),
      icon: Globe,
      iconBg: 'bg-[#617061]',
      fields: [
        { label: t('overviewFieldInstagram'), filled: !!form.instagramHandle, value: form.instagramHandle ? `@${form.instagramHandle}` : undefined },
        { label: t('fieldWebsite'), filled: !!form.websiteUrl, value: form.websiteUrl || undefined },
        { label: t('overviewFieldVideoIntro'), filled: !!form.videoIntroUrl, value: form.videoIntroUrl || undefined },
      ],
    },
  ];

  const allFields = sections.flatMap((s) => s.fields);
  const filledCount = allFields.filter((f) => f.filled).length;
  const totalCount = allFields.length;
  const pct = Math.round((filledCount / totalCount) * 100);
  const barColor = pct >= 80 ? 'bg-[#3a7d44]' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const pctColor = pct >= 80 ? 'text-[#3a7d44]' : pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-[#e8f0e8] rounded-2xl" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-44 bg-[#e8f0e8] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Completeness card */}
      <div className="bg-white rounded-2xl border border-[#d8e0d8] p-5">
        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[#d8e0d8]">
          <AvatarUploader
            currentAvatar={avatarUrl}
            initials={initials}
            size="md"
            onChanged={onAvatarChanged}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0f1f10]">{t('overviewPhotoTitle')}</p>
            <p className="text-xs text-[#617061] mt-0.5">
              {avatarUrl
                ? t('overviewPhotoHover')
                : t('overviewPhotoAdd')}
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold text-[#0f1f10]">{t('overviewCompletenessTitle')}</p>
            <p className="text-xs text-[#617061] mt-0.5">{t('overviewCompletenessFields', { filled: filledCount, total: totalCount })}</p>
          </div>
          <span className={cn('text-2xl font-bold', pctColor)}>{pct}%</span>
        </div>
        <div className="h-2 bg-[#d8e0d8] rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${pct}%` }} />
        </div>
        {pct < 100 && (
          <p className="text-xs text-[#617061] mt-2.5">
            {pct < 50 ? t('overviewLow') : pct < 80 ? t('overviewMid') : t('overviewHigh')}
          </p>
        )}
      </div>

      {/* Section cards */}
      {sections.map(({ title, icon: Icon, iconBg, fields }) => (
        <div key={title} className="bg-white rounded-2xl border border-[#d8e0d8] overflow-hidden">
          <div className="px-6 py-3.5 border-b border-[#d8e0d8] flex items-center gap-3">
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', iconBg)}>
              <Icon className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-[#0f1f10] flex-1">{title}</h3>
            <span className="text-xs text-[#617061]">{fields.filter((f) => f.filled).length}/{fields.length}</span>
          </div>
          <div className="px-6 divide-y divide-[#d8e0d8]">
            {fields.map((field) => (
              <div key={field.label} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <CheckCircle2 className={cn('w-3.5 h-3.5 flex-shrink-0', field.filled ? 'text-[#3a7d44]' : 'text-[#d8e0d8]')} />
                  <p className="text-xs text-[#617061]">{field.label}</p>
                </div>
                {field.filled ? (
                  <p className="text-xs text-[#0f1f10] text-right truncate max-w-[55%]">{field.value}</p>
                ) : (
                  <span className="text-xs text-[#617061] italic">{t('notSet')}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const SPECIALTY_SUGGESTIONS = [
  'Weight Loss', 'Muscle Building', 'HIIT', 'Yoga', 'Pilates',
  'Strength Training', 'Endurance', 'Nutrition', 'Mobility', 'Boxing',
];

const MODALITY_SUGGESTIONS = ['Online', 'In-person', 'Hybrid', 'Group', 'One-on-one'];

const LANGUAGE_SUGGESTIONS = ['English', 'Spanish', 'French', 'Portuguese', 'German', 'Italian'];

const CLIENT_TYPE_SUGGESTIONS = [
  'Beginners', 'Advanced athletes', 'Weight loss', 'Seniors',
  'Post-partum', 'Corporate', 'Teens',
];

const COACHING_TYPES = [
  { value: 'online', label: 'Online' },
  { value: 'in_person', label: 'In-person' },
  { value: 'hybrid', label: 'Hybrid' },
];

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Madrid', 'Europe/Paris', 'America/Sao_Paulo',
  'Asia/Tokyo', 'Asia/Dubai', 'Australia/Sydney',
];

type TabId = 'profile' | 'plans';

export default function CoachProfilePage() {
  const t = useTranslations('coachDashboard');
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>('profile');
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [profileLoading, setProfileLoading] = useState(true);

  // Avatar — lives on users table, loaded separately from coach profile fields
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  // Profile form state
  const [form, setForm] = useState<CoachProfileUpdate>({
    profileHeadline: '',
    bio: '',
    videoIntroUrl: '',
    websiteUrl: '',
    instagramHandle: '',
    specialties: [],
    trainingModalities: [],
    targetClientTypes: [],
    certifications: [],
    languagesSpoken: [],
    yearsOfExperience: undefined,
    coachingType: 'online',
    timezone: 'America/New_York',
    sessionDurationMinutes: 60,
    maxClientCapacity: 10,
    acceptingClients: true,
    sessionRateUSD: undefined,
    trialSessionAvailable: false,
    trialSessionRateUSD: undefined,
    totalClientsTrained: undefined,
  });

  // Packages state
  const [packages, setPackages] = useState<CoachPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesLoaded, setPackagesLoaded] = useState(false); // true after first fetch attempt
  // Which package is being edited (undefined = none, null = new)
  const [editingPackage, setEditingPackage] = useState<CoachPackage | null | undefined>(undefined);
  const [packageSaving, setPackageSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load current profile from the backend on mount.
  useEffect(() => {
    getCoachOwnProfile().then((res) => {
      if (res.success && res.profile) {
        setForm((prev) => ({ ...prev, ...res.profile }));
      }
      setProfileLoading(false);
    });
  }, [user?.id]);

  // Load avatar separately — it lives on users.avatar, not coach_profiles
  useEffect(() => {
    getFullUserProfile().then((profile) => {
      if (profile?.avatar) setAvatarUrl(profile.avatar);
    });
  }, [user?.id]);

  // The packages endpoint is GET /api/packages/coach/:coachId where :coachId = users.id.
  // user.id is available immediately from the auth context — no extra fetch needed.
  const loadPackages = useCallback(async (coachId: string) => {
    setPackagesLoading(true);
    try {
      const res = await getCoachPackages(coachId);
      if (res.success) setPackages(res.packages);
      else toast.error(res.error ?? 'Could not load packages');
    } finally {
      setPackagesLoading(false);
      setPackagesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (tab === 'plans' && user?.id && !packagesLoaded && !packagesLoading) {
      loadPackages(user.id);
    }
  }, [tab, user?.id, packagesLoaded, packagesLoading, loadPackages]);

  function updateForm<K extends keyof CoachProfileUpdate>(key: K, value: CoachProfileUpdate[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const payload: CoachProfileUpdate = { ...form };
      // Strip empty optional strings
      for (const k of ['videoIntroUrl', 'websiteUrl', 'instagramHandle'] as const) {
        if (!payload[k]) delete payload[k];
      }
      const result = await updateCoachProfile(payload);
      if (result.success) {
        toast.success(t('profileSaved'));
        setViewMode('view');
      } else {
        toast.error(result.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePackage(data: PackageFormData) {
    setPackageSaving(true);
    try {
      if (editingPackage && editingPackage.id) {
        // Editing existing
        const res = await updatePackage(editingPackage.id, data);
        if (res.success && res.package) {
          setPackages((prev) => prev.map((p) => (p.id === editingPackage.id ? res.package! : p)));
          toast.success(t('pkgUpdated'));
          setEditingPackage(undefined);
        } else {
          toast.error(res.message);
        }
      } else {
        // Creating new
        const res = await createPackage(data);
        if (res.success && res.package) {
          setPackages((prev) => [res.package!, ...prev]);
          toast.success(t('pkgCreated'));
          setEditingPackage(undefined);
        } else {
          toast.error(res.message);
        }
      }
    } finally {
      setPackageSaving(false);
    }
  }

  async function handleDeletePackage(id: string) {
    setDeletingId(id);
    try {
      const res = await deletePackage(id);
      if (res.success) {
        setPackages((prev) => prev.filter((p) => p.id !== id));
        toast.success(t('pkgRemoved'));
      } else {
        toast.error(res.message);
      }
    } finally {
      setDeletingId(null);
    }
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: t('tabProfile'), icon: User },
    { id: 'plans', label: t('tabPlans'), icon: Package },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {tab === 'profile' && viewMode === 'edit' && (
            <button
              onClick={() => setViewMode('view')}
              className="p-1.5 rounded-lg text-[#617061] hover:bg-[#f0f4f0] hover:text-gray-600 hover:text-[#617061] transition-colors flex-shrink-0"
              aria-label="Back to overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#0f1f10]">{t('profilePlansTitle')}</h1>
            <p className="text-sm text-[#617061] mt-0.5">
              {tab === 'profile' && viewMode === 'edit' ? t('editProfileSubtitle') : t('profilePlansSubtitle')}
            </p>
          </div>
        </div>

        {tab === 'profile' && viewMode === 'view' ? (
          <button
            onClick={() => setViewMode('edit')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl bg-[#162318] hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <Edit2 className="w-4 h-4" />
            {t('editProfile')}
          </button>
        ) : tab === 'profile' ? (
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl bg-[#162318] hover:opacity-90 transition-opacity disabled:opacity-60 flex-shrink-0"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? t('saving') : t('saveButton')}
          </button>
        ) : null}
        {/* Plans tab: saves are inline per-package */}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-[#f6f8f5] rounded-xl p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              tab === id
                ? 'bg-white text-[#0f1f10] shadow-sm'
                : 'text-[#617061] hover:text-[#0f1f10]'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {tab === 'profile' && viewMode === 'view' && (
        <ProfileOverview
          form={form}
          loading={profileLoading}
          avatarUrl={avatarUrl}
          initials={initials}
          onAvatarChanged={(url) => setAvatarUrl(url)}
        />
      )}

      {tab === 'profile' && viewMode === 'edit' && (
        <div className="space-y-5">
          {/* Identity */}
          <Section title={t('sectionIdentity')} icon={User} iconBg="bg-[#3a7d44]">
            {/* Avatar picker inside edit mode */}
            <div className="flex items-center gap-4 pb-5 mb-1 border-b border-[#d8e0d8]">
              <AvatarUploader
                currentAvatar={avatarUrl}
                initials={initials}
                size="md"
                onChanged={(url) => setAvatarUrl(url)}
              />
              <div>
                <p className="text-sm font-medium text-[#0f1f10]">Profile photo</p>
                <p className="text-xs text-[#617061] mt-0.5">
                  Hover to change · trash icon to remove
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Field label={t('fieldHeadline')}>
                  <TextInput
                    value={form.profileHeadline}
                    onChange={(v) => updateForm('profileHeadline', v)}
                    placeholder="e.g. Online fitness coach specializing in sustainable fat loss"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label={t('fieldBio')}>
                  <TextArea
                    value={form.bio}
                    onChange={(v) => updateForm('bio', v)}
                    rows={4}
                    placeholder="Tell clients about your story, approach, and what makes you unique…"
                  />
                </Field>
              </div>
              <Field label={t('fieldYears')}>
                <TextInput
                  type="number"
                  value={form.yearsOfExperience}
                  onChange={(v) => updateForm('yearsOfExperience', Number(v) || undefined)}
                  placeholder="5"
                />
              </Field>
              <Field label={t('fieldCoachingType')}>
                <SelectInput
                  value={form.coachingType}
                  onChange={(v) => updateForm('coachingType', v as 'online' | 'in_person' | 'hybrid')}
                  options={COACHING_TYPES}
                />
              </Field>
            </div>
          </Section>

          {/* Expertise */}
          <Section title={t('sectionExpertise')} icon={Briefcase} iconBg="bg-[#2d5a31]">
            <PillInput
              label={t('fieldSpecialties')}
              values={form.specialties ?? []}
              onChange={(v) => updateForm('specialties', v)}
              placeholder="Type a specialty and press Enter"
              suggestions={SPECIALTY_SUGGESTIONS}
            />
            <PillInput
              label={t('fieldModalities')}
              values={form.trainingModalities ?? []}
              onChange={(v) => updateForm('trainingModalities', v)}
              suggestions={MODALITY_SUGGESTIONS}
            />
            <PillInput
              label={t('fieldClientTypes')}
              values={form.targetClientTypes ?? []}
              onChange={(v) => updateForm('targetClientTypes', v)}
              suggestions={CLIENT_TYPE_SUGGESTIONS}
            />
            <PillInput
              label={t('fieldCertifications')}
              values={form.certifications ?? []}
              onChange={(v) => updateForm('certifications', v)}
              placeholder="e.g. NASM-CPT"
            />
            <PillInput
              label={t('fieldLanguages')}
              values={form.languagesSpoken ?? []}
              onChange={(v) => updateForm('languagesSpoken', v)}
              suggestions={LANGUAGE_SUGGESTIONS}
            />
          </Section>

          {/* Availability */}
          <Section title={t('sectionAvailability')} icon={Clock} iconBg="bg-[#52a85e]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label={t('fieldTimezone')}>
                <SelectInput
                  value={form.timezone}
                  onChange={(v) => updateForm('timezone', v)}
                  options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
                />
              </Field>
              <Field label={t('fieldSessionDuration')}>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={form.sessionDurationMinutes ?? ''}
                    onChange={(e) => updateForm('sessionDurationMinutes', Number(e.target.value))}
                    className="w-24 px-3 py-2 text-sm rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40"
                  />
                  <span className="text-sm text-[#617061]">{t('minutes')}</span>
                </div>
              </Field>
              <Field label={t('fieldMaxClients')}>
                <TextInput
                  type="number"
                  value={form.maxClientCapacity}
                  onChange={(v) => updateForm('maxClientCapacity', Number(v))}
                  placeholder="10"
                />
              </Field>
              <Field label={t('fieldTotalTrained')}>
                <TextInput
                  type="number"
                  value={form.totalClientsTrained}
                  onChange={(v) => updateForm('totalClientsTrained', Number(v) || undefined)}
                  placeholder="50"
                />
              </Field>
              {/* Accepting clients toggle */}
              <div className="sm:col-span-2 flex items-center justify-between bg-[#f6f8f5] rounded-xl p-4">
                <div>
                  <p className="text-sm font-medium text-[#0f1f10]">{t('fieldAccepting')}</p>
                  <p className="text-xs text-[#617061] mt-0.5">{t('fieldAcceptingHint')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateForm('acceptingClients', !form.acceptingClients)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40',
                    form.acceptingClients ? 'bg-[#3a7d44]' : 'bg-[#d8e0d8]'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                      form.acceptingClients ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>
          </Section>

          {/* Rates */}
          <Section title={t('sectionRates')} icon={DollarSign} iconBg="bg-[#e8a030]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label={t('fieldSessionRate')}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#617061] text-sm">$</span>
                  <input
                    type="number"
                    value={form.sessionRateUSD ?? ''}
                    onChange={(e) => updateForm('sessionRateUSD', Number(e.target.value) || undefined)}
                    placeholder="120"
                    className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#617061] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40"
                  />
                </div>
              </Field>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#617061] uppercase tracking-wide">{t('fieldTrialAvailable')}</p>
                  <button
                    type="button"
                    onClick={() => updateForm('trialSessionAvailable', !form.trialSessionAvailable)}
                    className={cn(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                      form.trialSessionAvailable ? 'bg-[#3a7d44]' : 'bg-[#d8e0d8]'
                    )}
                  >
                    <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform', form.trialSessionAvailable ? 'translate-x-4' : 'translate-x-0.5')} />
                  </button>
                </div>
                {form.trialSessionAvailable && (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#617061] text-sm">$</span>
                    <input
                      type="number"
                      value={form.trialSessionRateUSD ?? ''}
                      onChange={(e) => updateForm('trialSessionRateUSD', Number(e.target.value) || undefined)}
                      placeholder={t('fieldTrialRatePlaceholder')}
                      className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border border-gray-200 border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#617061] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]/40"
                    />
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Links */}
          <Section title={t('sectionLinks')} icon={Globe} iconBg="bg-[#617061]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label={t('fieldVideoIntro')}>
                <TextInput value={form.videoIntroUrl} onChange={(v) => updateForm('videoIntroUrl', v)} placeholder="https://youtube.com/..." />
              </Field>
              <Field label={t('fieldWebsite')}>
                <TextInput value={form.websiteUrl} onChange={(v) => updateForm('websiteUrl', v)} placeholder="https://yoursite.com" />
              </Field>
              <Field label={t('fieldInstagram')}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#617061] text-sm">@</span>
                  <TextInput value={form.instagramHandle} onChange={(v) => updateForm('instagramHandle', v)} placeholder="yourhandle" />
                </div>
              </Field>
            </div>
          </Section>
        </div>
      )}

      {/* ── Plans tab ── */}
      {tab === 'plans' && (
        <div className="space-y-5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#617061]">
              {t('plansPublicHint')}
            </p>
            {editingPackage === undefined && (
              <button
                type="button"
                onClick={() => setEditingPackage(null)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#3a7d44] hover:bg-[#ddf0df] rounded-xl border border-[#3a7d44]/20 transition-colors"
              >
                <Plus className="w-4 h-4" /> {t('newPackage')}
              </button>
            )}
          </div>

          {/* Loading spinner */}
          {packagesLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[#617061]" />
            </div>
          )}

          {/* New / edit form */}
          {editingPackage !== undefined && (
            <PackageForm
              initial={editingPackage ? {
                name: editingPackage.name,
                description: editingPackage.description ?? '',
                durationWeeks: editingPackage.durationWeeks,
                sessionsIncluded: editingPackage.sessionsIncluded,
                priceUSD: editingPackage.priceUSD,
                features: editingPackage.features ?? [],
              } : emptyPackageForm()}
              onSave={handleSavePackage}
              onCancel={() => setEditingPackage(undefined)}
              saving={packageSaving}
            />
          )}

          {/* Empty state */}
          {!packagesLoading && user?.id && packages.length === 0 && editingPackage === undefined && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200 border-[#d8e0d8]">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 bg-white flex items-center justify-center mb-4">
                <Package className="w-7 h-7 text-[#617061]" />
              </div>
              <p className="text-sm font-medium text-[#617061]">{t('noPackagesYet')}</p>
              <p className="text-xs text-[#617061] mt-1 mb-4">{t('noPackagesYetHint')}</p>
              <button
                type="button"
                onClick={() => setEditingPackage(null)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#3a7d44] hover:text-[#2d5a31] transition-colors"
              >
                <Plus className="w-4 h-4" /> {t('createFirstPackage')}
              </button>
            </div>
          )}

          {/* Package cards */}
          {!packagesLoading && packages.map((pkg) => (
            editingPackage && editingPackage.id === pkg.id ? null : (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onEdit={() => setEditingPackage(pkg)}
                onDelete={() => handleDeletePackage(pkg.id)}
                deleting={deletingId === pkg.id}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}
