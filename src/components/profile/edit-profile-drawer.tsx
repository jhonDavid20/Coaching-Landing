'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { updateProfileFields } from '@/actions/user';
import { updateUserProfile } from '@/actions/auth';
import type { UserWithProfile, UserProfile } from '@/actions/user';
import AvatarUploader from '@/components/profile/avatar-uploader';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormValues {
  firstName: string;
  lastName: string;
  username: string;
  gender: string;
  dateOfBirth: string;
  height: string;
  weight: string;
  targetWeight: string;
  phone: string;
  activityLevel: string;
  fitnessGoal: string;
  preferredWorkoutTime: string;
  gymLocation: string;
  timezone: string;
  notes: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MULTI_SELECT_FIELDS = ['medicalConditions', 'medications', 'injuries', 'allergies', 'dietaryRestrictions'] as const;
type MultiField = typeof MULTI_SELECT_FIELDS[number];

const MULTI_FIELD_OPTIONS: Record<MultiField, string[]> = {
  medicalConditions: ['Diabetes', 'Hipertensión', 'Asma', 'Artritis', 'Enfermedad cardíaca'],
  medications: [],
  injuries: ['Rodilla', 'Espalda baja', 'Hombro', 'Cadera', 'Tobillo', 'Cuello'],
  allergies: ['Gluten', 'Lácteos', 'Nueces', 'Mariscos', 'Huevos', 'Soja'],
  dietaryRestrictions: ['Vegetariano', 'Vegano', 'Sin gluten', 'Sin lactosa', 'Keto', 'Paleo'],
};

const TIMEZONES = [
  'America/Mexico_City', 'America/Bogota', 'America/Lima',
  'America/Argentina/Buenos_Aires', 'America/Santiago', 'America/Caracas',
  'America/New_York', 'Europe/Madrid', 'UTC',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-[#617061] uppercase tracking-wide mb-1">
      {children}
    </label>
  );
}

function InputField({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 rounded-lg border text-sm',
        'border-[#d8e0d8] bg-white text-[#0f1f10]',
        'placeholder-[#617061]',
        'focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-transparent',
        '[color-scheme:light]',
        className
      )}
      {...props}
    />
  );
}

function SelectField({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full px-3 py-2 rounded-lg border text-sm',
        'border-[#d8e0d8] bg-white text-[#0f1f10]',
        'focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-transparent',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

// ─── Multi-select chip input ─────────────────────────────────────────────────

function MultiSelectInput({
  label,
  options,
  selected,
  onChange,
  addAnotherLabel,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  addAnotherLabel: string;
}) {
  const [custom, setCustom] = useState('');

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  const addCustom = () => {
    const val = custom.trim();
    if (val && !selected.includes(val)) {
      onChange([...selected, val]);
    }
    setCustom('');
  };

  return (
    <div>
      <Label>{label}</Label>
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                'px-2.5 py-1 rounded-full border text-xs transition-colors',
                selected.includes(opt)
                  ? 'border-[#3a7d44] bg-[#ddf0df] text-[#2d5a31]'
                  : 'border-[#d8e0d8] bg-transparent text-[#617061] hover:border-[#3a7d44]/50'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      {/* Custom entry */}
      <div className="flex gap-2">
        <InputField
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder={addAnotherLabel}
        />
        <button
          type="button"
          onClick={addCustom}
          className="px-3 py-2 text-xs rounded-lg border border-[#d8e0d8] text-[#617061] hover:bg-[#f6f8f5] transition-colors flex-shrink-0"
        >
          +
        </button>
      </div>
      {/* Selected values */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#ddf0df] text-[#2d5a31] border border-[#3a7d44]/30"
            >
              {v}
              <button type="button" onClick={() => toggle(v)} className="hover:text-[#0f1f10]">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section divider ─────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-xs font-semibold text-[#617061] uppercase tracking-wider whitespace-nowrap">
        {children}
      </p>
      <div className="flex-1 h-px bg-[#d8e0d8]" />
    </div>
  );
}

// ─── Main drawer ─────────────────────────────────────────────────────────────

interface EditProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserWithProfile;
  onSaved: () => void;
  /** Called immediately after upload/remove so the parent header updates without waiting for a reload. */
  onAvatarChanged?: (url: string | null) => void;
}

export default function EditProfileDrawer({
  isOpen,
  onClose,
  profile,
  onSaved,
  onAvatarChanged,
}: EditProfileDrawerProps) {
  const t = useTranslations('profile');
  const p: UserProfile = profile.profile ?? {};

  // Track avatar changes independently (upload happens immediately on pick)
  const [liveAvatar, setLiveAvatar] = useState<string | null>(profile.avatar ?? null);

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      username: profile.username ?? '',
      gender: p.gender ?? '',
      dateOfBirth: p.dateOfBirth?.slice(0, 10) ?? '',
      height: p.height != null && p.height !== 0 ? String(p.height) : '',
      weight: p.weight != null && p.weight !== 0 ? String(p.weight) : '',
      targetWeight: p.targetWeight != null && p.targetWeight !== 0 ? String(p.targetWeight) : '',
      phone: p.phone ?? '',
      activityLevel: p.activityLevel ?? '',
      fitnessGoal: p.fitnessGoal ?? '',
      preferredWorkoutTime: p.preferredWorkoutTime ?? '',
      gymLocation: p.gymLocation ?? '',
      timezone: p.timezone ?? '',
      notes: p.notes ?? '',
    },
  });

  // Multi-select arrays
  const [arrays, setArrays] = useState<Record<MultiField, string[]>>({
    medicalConditions: p.medicalConditions ?? [],
    medications: p.medications ?? [],
    injuries: p.injuries ?? [],
    allergies: p.allergies ?? [],
    dietaryRestrictions: p.dietaryRestrictions ?? [],
  });

  const setArray = (field: MultiField) => (v: string[]) =>
    setArrays((prev) => ({ ...prev, [field]: v }));

  // Reset form when profile changes or drawer reopens
  useEffect(() => {
    if (isOpen) {
      setLiveAvatar(profile.avatar ?? null);
      const latest: UserProfile = profile.profile ?? {};
      reset({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        username: profile.username ?? '',
        gender: latest.gender ?? '',
        dateOfBirth: latest.dateOfBirth?.slice(0, 10) ?? '',
        height: latest.height != null && latest.height !== 0 ? String(latest.height) : '',
        weight: latest.weight != null && latest.weight !== 0 ? String(latest.weight) : '',
        targetWeight: latest.targetWeight != null && latest.targetWeight !== 0 ? String(latest.targetWeight) : '',
        phone: latest.phone ?? '',
        activityLevel: latest.activityLevel ?? '',
        fitnessGoal: latest.fitnessGoal ?? '',
        preferredWorkoutTime: latest.preferredWorkoutTime ?? '',
        gymLocation: latest.gymLocation ?? '',
        timezone: latest.timezone ?? '',
        notes: latest.notes ?? '',
      });
      setArrays({
        medicalConditions: latest.medicalConditions ?? [],
        medications: latest.medications ?? [],
        injuries: latest.injuries ?? [],
        allergies: latest.allergies ?? [],
        dietaryRestrictions: latest.dietaryRestrictions ?? [],
      });
    }
  }, [isOpen, profile, reset]);

  const [saving, setSaving] = useState(false);

  const multiFieldLabels: Record<MultiField, string> = {
    medicalConditions: t('medicalConditionsLabel'),
    medications: t('medicationsLabel'),
    injuries: t('injuriesLabel'),
    allergies: t('allergiesLabel'),
    dietaryRestrictions: t('dietaryRestrictionsLabel'),
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      // ── User-level fields ──
      const userDiff: { firstName?: string; lastName?: string; username?: string } = {};
      if (values.firstName !== profile.firstName) userDiff.firstName = values.firstName;
      if (values.lastName !== profile.lastName) userDiff.lastName = values.lastName;
      if (values.username !== profile.username) userDiff.username = values.username;

      // ── Profile-level fields ──
      const profilePatch: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = {};

      const str = (key: keyof FormValues, profileKey: keyof UserProfile) => {
        const v = values[key]?.trim();
        if (v !== undefined && v !== (p[profileKey] ?? '')) {
          (profilePatch as Record<string, unknown>)[profileKey] = v || null;
        }
      };
      const num = (key: keyof FormValues, profileKey: keyof UserProfile) => {
        const raw = values[key];
        const n = raw ? parseFloat(raw as string) : null;
        const orig = p[profileKey] as number | undefined | null;
        if (n !== (orig ?? null) && !(isNaN(n ?? NaN) && !orig)) {
          (profilePatch as Record<string, unknown>)[profileKey] = n && !isNaN(n) ? n : null;
        }
      };

      str('gender', 'gender');
      str('dateOfBirth', 'dateOfBirth');
      str('phone', 'phone');
      str('activityLevel', 'activityLevel');
      str('fitnessGoal', 'fitnessGoal');
      str('preferredWorkoutTime', 'preferredWorkoutTime');
      str('gymLocation', 'gymLocation');
      str('timezone', 'timezone');
      str('notes', 'notes');
      num('height', 'height');
      num('weight', 'weight');
      num('targetWeight', 'targetWeight');

      // Arrays
      for (const field of MULTI_SELECT_FIELDS) {
        const orig = JSON.stringify(p[field] ?? []);
        const next = JSON.stringify(arrays[field]);
        if (orig !== next) {
          (profilePatch as Record<string, unknown>)[field] = arrays[field];
        }
      }

      const promises: Promise<{ success: boolean; message: string }>[] = [];

      if (Object.keys(userDiff).length > 0) {
        promises.push(updateUserProfile(userDiff));
      }
      if (Object.keys(profilePatch).length > 0) {
        promises.push(updateProfileFields(profilePatch));
      }

      if (promises.length === 0) {
        toast.info(t('noChanges'));
        setSaving(false);
        return;
      }

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.success);

      if (failed.length > 0) {
        toast.error(failed[0].message || t('updateError'));
      } else {
        toast.success(t('updateSuccess'));
        onSaved();
        onClose();
      }
    } catch {
      toast.error(t('updateError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Modal — centered in the content area (below header, right of sidebar) */}
      <div
        className={cn(
          'fixed top-16 bottom-0 left-0 lg:left-64 right-0 z-[70] flex items-center justify-center p-4 pointer-events-none',
        )}
      >
        <div
          className={cn(
            'relative w-full max-w-2xl bg-white border border-[#d8e0d8] rounded-2xl shadow-xl',
            'flex flex-col',
            'max-h-[90vh] sm:max-h-[85vh]',
            'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
            isOpen
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
          )}
        >
          {/* Top accent bar */}
          <div className="h-1 bg-[#162318] rounded-t-2xl flex-shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#d8e0d8] flex-shrink-0">
            <div>
              <h2 className="text-base font-semibold text-[#0f1f10]">{t('editProfile')}</h2>
              <p className="text-xs text-[#617061] mt-0.5">{t('editProfileSubtitle')}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#617061] hover:text-[#0f1f10] hover:bg-[#f6f8f5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable form body */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

              {/* ── Avatar ── */}
              <div className="flex flex-col items-center gap-2 pb-2 border-b border-[#d8e0d8]">
                <AvatarUploader
                  currentAvatar={liveAvatar}
                  initials={
                    `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() || undefined
                  }
                  size="lg"
                  onChanged={(url) => {
                    setLiveAvatar(url);
                    // Bubble up immediately so the profile header updates without
                    // waiting for a full form save / reload
                    onAvatarChanged?.(url);
                  }}
                />
                <p className="text-xs text-[#617061]">
                  {liveAvatar ? 'Hover to change • click the trash icon to remove' : 'Click the camera icon to add a photo'}
                </p>
              </div>

              {/* ── Personal ── */}
              <SectionTitle>{t('personalInfoSection')}</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('firstName')}</Label>
                  <InputField {...register('firstName')} placeholder="Juan" />
                </div>
                <div>
                  <Label>{t('lastName')}</Label>
                  <InputField {...register('lastName')} placeholder="García" />
                </div>
                <div>
                  <Label>{t('username')}</Label>
                  <InputField {...register('username')} placeholder="juangarcia" />
                </div>
                <div>
                  <Label>{t('gender')}</Label>
                  <SelectField {...register('gender')}>
                    <option value="">{t('notSpecified')}</option>
                    <option value="male">{t('genderMale')}</option>
                    <option value="female">{t('genderFemale')}</option>
                    <option value="prefer_not_to_say">{t('genderPreferNot')}</option>
                    <option value="other">{t('genderOther')}</option>
                  </SelectField>
                </div>
                <div>
                  <Label>{t('phone')}</Label>
                  <InputField {...register('phone')} type="tel" placeholder="+52 55 0000 0000" />
                </div>
                <div>
                  <Label>{t('dateOfBirth')}</Label>
                  <InputField {...register('dateOfBirth')} type="date" />
                </div>
              </div>

              {/* ── Fitness ── */}
              <SectionTitle>{t('fitnessInfo')}</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('fitnessGoalLabel')}</Label>
                  <SelectField {...register('fitnessGoal')}>
                    <option value="">{t('notSpecified')}</option>
                    <option value="weight_loss">{t('goalWeightLoss')}</option>
                    <option value="muscle_gain">{t('goalMuscleGain')}</option>
                    <option value="maintenance">{t('goalMaintenance')}</option>
                    <option value="endurance">{t('goalEndurance')}</option>
                  </SelectField>
                </div>
                <div>
                  <Label>{t('activityLevelLabel')}</Label>
                  <SelectField {...register('activityLevel')}>
                    <option value="">{t('notSpecified')}</option>
                    <option value="sedentary">{t('activitySedentary')}</option>
                    <option value="lightly_active">{t('activityLightly')}</option>
                    <option value="moderately_active">{t('activityModerately')}</option>
                    <option value="very_active">{t('activityVery')}</option>
                  </SelectField>
                </div>
                <div>
                  <Label>{t('weightKg')}</Label>
                  <InputField {...register('weight')} type="number" step="0.1" placeholder="80" />
                </div>
                <div>
                  <Label>{t('heightCm')}</Label>
                  <InputField {...register('height')} type="number" placeholder="175" />
                </div>
                <div>
                  <Label>{t('targetWeightKg')}</Label>
                  <InputField {...register('targetWeight')} type="number" step="0.1" placeholder="70" />
                </div>
                <div>
                  <Label>{t('preferredWorkout')}</Label>
                  <SelectField {...register('preferredWorkoutTime')}>
                    <option value="">{t('notSpecified')}</option>
                    <option value="morning">{t('workoutMorning')}</option>
                    <option value="afternoon">{t('workoutAfternoon')}</option>
                    <option value="evening">{t('workoutEvening')}</option>
                    <option value="flexible">{t('workoutFlexible')}</option>
                  </SelectField>
                </div>
                <div className="col-span-2">
                  <Label>{t('gymLocation')}</Label>
                  <InputField {...register('gymLocation')} placeholder="Gold's Gym, CDMX" />
                </div>
                <div className="col-span-2">
                  <Label>{t('timezone')}</Label>
                  <SelectField {...register('timezone')}>
                    <option value="">{t('notSpecified')}</option>
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </SelectField>
                </div>
              </div>

              {/* ── Health ── */}
              <SectionTitle>{t('healthInfo')}</SectionTitle>
              <div className="space-y-5">
                {MULTI_SELECT_FIELDS.map((field) => (
                  <MultiSelectInput
                    key={field}
                    label={multiFieldLabels[field]}
                    options={MULTI_FIELD_OPTIONS[field]}
                    selected={arrays[field]}
                    onChange={setArray(field)}
                    addAnotherLabel={t('addAnother')}
                  />
                ))}
                <div>
                  <Label>{t('additionalNotes')}</Label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    placeholder={t('notesPlaceholder')}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border text-sm resize-none',
                      'border-[#d8e0d8] bg-white text-[#0f1f10]',
                      'placeholder-[#617061]',
                      'focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-transparent'
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#d8e0d8] flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-[#617061] rounded-lg border border-[#d8e0d8] hover:bg-[#f6f8f5] transition-colors disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg bg-[#162318] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? t('saving') : t('saveChanges')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
