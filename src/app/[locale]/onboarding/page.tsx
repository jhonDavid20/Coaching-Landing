'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { completeOnboarding } from '@/actions/onboarding';
import type { OnboardingFormInput } from '@/actions/onboarding';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Target,
  Activity,
  Heart,
  Settings,
  Dumbbell,
  Globe,
} from 'lucide-react';

// ─── Schemas ────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  fitnessGoal: z.enum(['lose_weight', 'gain_muscle', 'maintain', 'endurance']),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
});

const step2Schema = z.object({
  birthDate: z.string().min(1),
  gender: z.enum(['male', 'female', 'prefer_not_to_say', 'other']),
  height: z.number({ invalid_type_error: '' }).positive(),
  currentWeight: z.number({ invalid_type_error: '' }).positive(),
  targetWeight: z.number().positive().optional(),
});

const step3Schema = z.object({
  medicalConditions: z.array(z.string()).optional(),
  injuries: z.array(z.string()).optional(),
  medications: z.string().optional(),
  foodAllergies: z.array(z.string()).optional(),
});

const step4Schema = z.object({
  preferredSchedule: z.enum(['morning', 'afternoon', 'evening', 'flexible']),
  gymLocation: z.string().optional(),
  timezone: z.string().min(1),
  phone: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

type OnboardingFormData = Step1Data & Step2Data & Step3Data & Step4Data;

// ─── Static (non-translatable) options ──────────────────────────────────────

const TIMEZONES = [
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Argentina/Buenos_Aires',
  'America/Santiago',
  'America/Caracas',
  'America/New_York',
  'Europe/Madrid',
  'UTC',
];

// ─── Sub-components ──────────────────────────────────────────────────────────

interface SelectCardProps {
  label: string;
  icon?: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

function SelectCard({ label, icon, description, selected, onClick }: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border-2 rounded-xl p-4 text-left transition-all duration-200 w-full',
        selected
          ? 'border-[#3a7d44] bg-[#ddf0df] text-[#162318]'
          : 'border-[#d8e0d8] bg-[#f6f8f5] text-[#617061] hover:border-[#3a7d44] hover:bg-[#f0faf0]'
      )}
    >
      {icon && <span className="text-2xl mb-2 block">{icon}</span>}
      <span className="font-medium block">{label}</span>
      {description && (
        <span className={cn('text-sm mt-1 block', selected ? 'text-[#2d5a31]' : 'text-gray-500')}>
          {description}
        </span>
      )}
    </button>
  );
}

interface MultiSelectChipsProps {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function MultiSelectChips({ options, selected, onChange }: MultiSelectChipsProps) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={cn(
            'px-3 py-1.5 rounded-full border text-sm transition-all duration-200',
            selected.includes(opt)
              ? 'border-[#3a7d44] bg-[#ddf0df] text-[#2d5a31]'
              : 'border-[#d8e0d8] bg-white text-[#617061] hover:border-[#3a7d44]'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

interface FieldErrorProps {
  message?: string;
}

function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return <p className="text-red-400 text-xs mt-1">{message}</p>;
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('onboarding');

  const handleSwitchLocale = () => {
    const nextLocale = locale === 'en' ? 'es' : 'en';
    router.replace(pathname, { locale: nextLocale, scroll: false });
  };

  const handleFinishLater = () => {
    window.location.href = `/${locale}`;
  };

  // Step config — defined inside component to use t()
  const STEP_CONFIG = [
    { title: t('step1Title'), subtitle: t('step1Subtitle'), icon: Target },
    { title: t('step2Title'), subtitle: t('step2Subtitle'), icon: Dumbbell },
    { title: t('step3Title'), subtitle: t('step3Subtitle'), icon: Heart },
    { title: t('step4Title'), subtitle: t('step4Subtitle'), icon: Settings },
    { title: t('step5Title'), subtitle: t('step5Subtitle'), icon: CheckCircle2 },
  ];

  // Locale-aware chip options — values are localised strings, stored to DB in user's locale
  const MEDICAL_CONDITIONS = [
    t('conditionDiabetes'),
    t('conditionHypertension'),
    t('conditionAsthma'),
    t('conditionArthritis'),
    t('conditionHeartDisease'),
    t('conditionOther'),
  ];
  const INJURIES = [
    t('injuryKnee'),
    t('injuryLowerBack'),
    t('injuryShoulder'),
    t('injuryHip'),
    t('injuryAnkle'),
    t('injuryNeck'),
    t('injuryOther'),
  ];
  const FOOD_ALLERGIES = [
    t('allergyGluten'),
    t('allergyDairy'),
    t('allergyNuts'),
    t('allergySeafood'),
    t('allergyEggs'),
    t('allergySoy'),
    t('allergyOther'),
  ];

  const [formData, setFormData] = useState<Partial<OnboardingFormData>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 3 multi-select state (not managed by react-hook-form)
  const [medicalConditions, setMedicalConditions] = useState<string[]>(
    formData.medicalConditions ?? []
  );
  const [injuries, setInjuries] = useState<string[]>(formData.injuries ?? []);
  const [foodAllergies, setFoodAllergies] = useState<string[]>(formData.foodAllergies ?? []);

  // One form per step — defaultValues restore from accumulated formData on remount
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fitnessGoal: formData.fitnessGoal,
      activityLevel: formData.activityLevel,
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      birthDate: formData.birthDate ?? '',
      gender: formData.gender,
      height: formData.height,
      currentWeight: formData.currentWeight,
      targetWeight: formData.targetWeight,
    },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      medications: formData.medications ?? '',
    },
  });

  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      preferredSchedule: formData.preferredSchedule,
      gymLocation: formData.gymLocation ?? '',
      timezone: formData.timezone ?? '',
      phone: formData.phone ?? '',
    },
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleNext = async () => {
    let stepValues: Partial<OnboardingFormData> = {};
    let valid = false;

    if (currentStep === 1) {
      valid = await step1Form.trigger();
      if (valid) stepValues = step1Form.getValues();
    } else if (currentStep === 2) {
      valid = await step2Form.trigger();
      if (valid) stepValues = step2Form.getValues();
    } else if (currentStep === 3) {
      valid = true;
      stepValues = {
        ...step3Form.getValues(),
        medicalConditions,
        injuries,
        foodAllergies,
      };
    } else if (currentStep === 4) {
      valid = await step4Form.trigger();
      if (valid) stepValues = step4Form.getValues();
    }

    if (!valid) return;

    setFormData((prev) => ({ ...prev, ...stepValues }));
    setDirection('forward');
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setDirection('back');
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await completeOnboarding(formData as OnboardingFormInput);
      if (result.success) {
        toast.success(t('successMessage'));
        router.push(`/${locale}/dashboard`);
      } else {
        setSubmitError(result.message || t('errorGeneral'));
      }
    } catch {
      setSubmitError(t('errorUnexpected'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step renderers ─────────────────────────────────────────────────────────

  const renderStep1 = () => {
    const { watch, setValue } = step1Form;
    const fitnessGoal = watch('fitnessGoal');
    const activityLevel = watch('activityLevel');
    const errors = step1Form.formState.errors;

    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-[#0f1f10] mb-3">{t('fitnessGoalLabel')}</p>
          <div className="grid grid-cols-2 gap-3">
            <SelectCard
              label={t('goalLoseWeight')}
              icon="🔥"
              selected={fitnessGoal === 'lose_weight'}
              onClick={() => setValue('fitnessGoal', 'lose_weight', { shouldValidate: true })}
            />
            <SelectCard
              label={t('goalGainMuscle')}
              icon="💪"
              selected={fitnessGoal === 'gain_muscle'}
              onClick={() => setValue('fitnessGoal', 'gain_muscle', { shouldValidate: true })}
            />
            <SelectCard
              label={t('goalMaintain')}
              icon="⚖️"
              selected={fitnessGoal === 'maintain'}
              onClick={() => setValue('fitnessGoal', 'maintain', { shouldValidate: true })}
            />
            <SelectCard
              label={t('goalEndurance')}
              icon="🏃"
              selected={fitnessGoal === 'endurance'}
              onClick={() => setValue('fitnessGoal', 'endurance', { shouldValidate: true })}
            />
          </div>
          <FieldError message={errors.fitnessGoal?.message} />
        </div>

        <div>
          <p className="text-sm font-medium text-[#0f1f10] mb-3">{t('activityLevelLabel')}</p>
          <div className="grid grid-cols-1 gap-3">
            <SelectCard
              label={t('activitySedentary')}
              description={t('activitySedentaryDesc')}
              selected={activityLevel === 'sedentary'}
              onClick={() => setValue('activityLevel', 'sedentary', { shouldValidate: true })}
            />
            <SelectCard
              label={t('activityLightly')}
              description={t('activityLightlyDesc')}
              selected={activityLevel === 'lightly_active'}
              onClick={() => setValue('activityLevel', 'lightly_active', { shouldValidate: true })}
            />
            <SelectCard
              label={t('activityModerately')}
              description={t('activityModeratelyDesc')}
              selected={activityLevel === 'moderately_active'}
              onClick={() =>
                setValue('activityLevel', 'moderately_active', { shouldValidate: true })
              }
            />
            <SelectCard
              label={t('activityVery')}
              description={t('activityVeryDesc')}
              selected={activityLevel === 'very_active'}
              onClick={() => setValue('activityLevel', 'very_active', { shouldValidate: true })}
            />
          </div>
          <FieldError message={errors.activityLevel?.message} />
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    const { register, watch, setValue, formState: { errors } } = step2Form;
    const gender = watch('gender');

    return (
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#0f1f10] mb-1">
            {t('birthDate')}
          </label>
          <input
            type="date"
            {...register('birthDate')}
            className="w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44]"
          />
          <FieldError message={errors.birthDate?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0f1f10] mb-3">{t('gender')}</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'male', label: t('genderMale') },
              { value: 'female', label: t('genderFemale') },
              { value: 'prefer_not_to_say', label: t('genderPreferNot') },
              { value: 'other', label: t('genderOther') },
            ].map((opt) => (
              <SelectCard
                key={opt.value}
                label={opt.label}
                selected={gender === opt.value}
                onClick={() =>
                  setValue('gender', opt.value as Step2Data['gender'], { shouldValidate: true })
                }
              />
            ))}
          </div>
          <FieldError message={errors.gender?.message} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#0f1f10] mb-1">{t('height')}</label>
            <input
              type="number"
              placeholder="170"
              {...register('height', { valueAsNumber: true })}
              className="w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44] placeholder-[#a0b0a0]"
            />
            <FieldError message={errors.height?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0f1f10] mb-1">
              {t('currentWeight')}
            </label>
            <input
              type="number"
              placeholder="70"
              {...register('currentWeight', { valueAsNumber: true })}
              className="w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44] placeholder-[#a0b0a0]"
            />
            <FieldError message={errors.currentWeight?.message} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0f1f10] mb-1">
            {t('targetWeight')}{' '}
            <span className="text-[#617061] font-normal">{t('optional')}</span>
          </label>
          <input
            type="number"
            placeholder="65"
            {...register('targetWeight', { valueAsNumber: true })}
            className="w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44] placeholder-[#a0b0a0]"
          />
          <FieldError message={errors.targetWeight?.message} />
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const { register } = step3Form;

    return (
      <div className="space-y-6">
        <p className="text-sm text-[#617061]">{t('step3OptionalNote')}</p>

        <div>
          <label className="block text-sm font-medium text-[#0f1f10] mb-3">
            {t('medicalConditions')}
          </label>
          <MultiSelectChips
            options={MEDICAL_CONDITIONS}
            selected={medicalConditions}
            onChange={setMedicalConditions}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0f1f10] mb-3">
            {t('injuries')}
          </label>
          <MultiSelectChips
            options={INJURIES}
            selected={injuries}
            onChange={setInjuries}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0f1f10] mb-1">
            {t('medications')}{' '}
            <span className="text-[#617061] font-normal">{t('medicationsFreeField')}</span>
          </label>
          <textarea
            {...register('medications')}
            rows={2}
            placeholder={t('medicationsPlaceholder')}
            className="w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44] placeholder-[#a0b0a0] resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0f1f10] mb-3">
            {t('foodAllergies')}
          </label>
          <MultiSelectChips
            options={FOOD_ALLERGIES}
            selected={foodAllergies}
            onChange={setFoodAllergies}
          />
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const { register, watch, setValue, formState: { errors } } = step4Form;
    const preferredSchedule = watch('preferredSchedule');

    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-[#0f1f10] mb-3">{t('preferredScheduleLabel')}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'morning', label: t('scheduleMorning'), icon: '🌅' },
              { value: 'afternoon', label: t('scheduleAfternoon'), icon: '☀️' },
              { value: 'evening', label: t('scheduleEvening'), icon: '🌙' },
              { value: 'flexible', label: t('scheduleFlexible'), icon: '📅' },
            ].map((opt) => (
              <SelectCard
                key={opt.value}
                label={opt.label}
                icon={opt.icon}
                selected={preferredSchedule === opt.value}
                onClick={() =>
                  setValue('preferredSchedule', opt.value as Step4Data['preferredSchedule'], {
                    shouldValidate: true,
                  })
                }
              />
            ))}
          </div>
          <FieldError message={errors.preferredSchedule?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0f1f10] mb-1">
            {t('timezone')}
          </label>
          <select
            {...register('timezone')}
            className="w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44]"
          >
            <option value="" disabled className="bg-gray-800">
              {t('timezoneSelect')}
            </option>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz} className="bg-gray-800">
                {tz}
              </option>
            ))}
          </select>
          <FieldError message={errors.timezone?.message} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#0f1f10] mb-1">
              {t('gymLocation')}{' '}
              <span className="text-[#617061] font-normal">{t('optional')}</span>
            </label>
            <input
              type="text"
              placeholder="Gold's Gym, Home…"
              {...register('gymLocation')}
              className="w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44] placeholder-[#a0b0a0]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0f1f10] mb-1">
              {t('phone')}{' '}
              <span className="text-[#617061] font-normal">{t('optional')}</span>
            </label>
            <input
              type="tel"
              placeholder="+52 55 1234 5678"
              {...register('phone')}
              className="w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44] placeholder-[#a0b0a0]"
            />
          </div>
        </div>
      </div>
    );
  };

  const GOAL_LABELS: Record<string, string> = {
    lose_weight: `🔥 ${t('goalLoseWeight')}`,
    gain_muscle: `💪 ${t('goalGainMuscle')}`,
    maintain: `⚖️ ${t('goalMaintain')}`,
    endurance: `🏃 ${t('goalEndurance')}`,
  };
  const ACTIVITY_LABELS: Record<string, string> = {
    sedentary: t('activitySedentary'),
    lightly_active: t('activityLightly'),
    moderately_active: t('activityModerately'),
    very_active: t('activityVery'),
  };
  const GENDER_LABELS: Record<string, string> = {
    male: t('genderMale'),
    female: t('genderFemale'),
    prefer_not_to_say: t('genderPreferNot'),
    other: t('genderOther'),
  };
  const SCHEDULE_LABELS: Record<string, string> = {
    morning: `🌅 ${t('scheduleMorning')}`,
    afternoon: `☀️ ${t('scheduleAfternoon')}`,
    evening: `🌙 ${t('scheduleEvening')}`,
    flexible: `📅 ${t('scheduleFlexible')}`,
  };

  const renderStep5 = () => {
    const items = [
      { label: t('summaryGoal'), value: formData.fitnessGoal ? GOAL_LABELS[formData.fitnessGoal] : '—' },
      {
        label: t('summaryActivityLevel'),
        value: formData.activityLevel ? ACTIVITY_LABELS[formData.activityLevel] : '—',
      },
      { label: t('summaryBirthDate'), value: formData.birthDate || '—' },
      { label: t('summaryGender'), value: formData.gender ? GENDER_LABELS[formData.gender] : '—' },
      { label: t('summaryHeight'), value: formData.height ? `${formData.height} cm` : '—' },
      { label: t('summaryCurrentWeight'), value: formData.currentWeight ? `${formData.currentWeight} kg` : '—' },
      {
        label: t('summaryTargetWeight'),
        value: formData.targetWeight ? `${formData.targetWeight} kg` : t('summaryTargetWeightNone'),
      },
      {
        label: t('summarySchedule'),
        value: formData.preferredSchedule ? SCHEDULE_LABELS[formData.preferredSchedule] : '—',
      },
      { label: t('summaryTimezone'), value: formData.timezone || '—' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#ddf0df] border-2 border-[#3a7d44] flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[#3a7d44]" />
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm">{t('reviewNote')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(({ label, value }) => (
            <div key={label} className="bg-[#f0faf0] border border-[#d8e0d8] rounded-lg px-4 py-3">
              <p className="text-xs text-[#617061] mb-0.5">{label}</p>
              <p className="text-sm text-[#0f1f10] font-medium">{value}</p>
            </div>
          ))}
        </div>

        {submitError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
            <p className="text-red-400 text-sm">{submitError}</p>
          </div>
        )}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const stepConfig = STEP_CONFIG[currentStep - 1];
  const StepIcon = stepConfig.icon;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8f5] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Brand + top actions */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#162318] tracking-tight">
            Steady<span className="text-[#52a85e]">Vitality</span>
          </h1>
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <button
              type="button"
              onClick={handleSwitchLocale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#617061] border border-[#d8e0d8] bg-white hover:bg-[#f0f4f0] hover:text-[#162318] transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {locale === 'en' ? 'ES' : 'EN'}
            </button>
            {/* Finish later */}
            <button
              type="button"
              onClick={handleFinishLater}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#617061] border border-[#d8e0d8] bg-white hover:bg-[#f0f4f0] hover:text-[#162318] transition-colors"
            >
              {t('finishLater')}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2 flex items-center justify-between text-xs text-[#617061]">
          <span>{t('stepIndicator')} {currentStep} {t('of')} 5</span>
          <span>{Math.round((currentStep / 5) * 100)}%</span>
        </div>
        <div className="w-full bg-[#d8e0d8] rounded-full h-1.5 mb-8">
          <div
            className="h-1.5 rounded-full bg-[#3a7d44] transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Step card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#d8e0d8] overflow-hidden">
          {/* Step header */}
          <div className="px-8 pt-8 pb-6 border-b border-[#d8e0d8]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ddf0df] border border-[#3a7d44]/20 flex items-center justify-center flex-shrink-0">
                <StepIcon className="w-5 h-5 text-[#3a7d44]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#0f1f10]">{stepConfig.title}</h2>
                <p className="text-sm text-[#617061]">{stepConfig.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Animated step content */}
          <div className="px-8 py-6">
            <div
              key={currentStep}
              className={cn(
                'animate-in fade-in duration-300',
                direction === 'forward' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'
              )}
            >
              {renderCurrentStep()}
            </div>
          </div>

          {/* Navigation */}
          <div className="px-8 pb-8 flex items-center justify-between border-t border-[#d8e0d8] pt-6">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#d8e0d8] text-[#617061] text-sm font-medium hover:bg-[#eff2ee] hover:text-[#162318] transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('back')}
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#162318] text-white text-sm font-medium hover:bg-[#243d27] transition-colors"
              >
                {t('next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#162318] text-white text-sm font-medium hover:bg-[#243d27] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : submitError ? (
                  t('retry')
                ) : (
                  <>
                    {t('submit')}
                    <Activity className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
