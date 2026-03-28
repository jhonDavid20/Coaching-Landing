'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
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
} from 'lucide-react';

// ─── Schemas ────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  fitnessGoal: z.enum(['lose_weight', 'gain_muscle', 'maintain', 'endurance']),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
});

const step2Schema = z.object({
  birthDate: z.string().min(1, 'Requerido'),
  gender: z.enum(['male', 'female', 'prefer_not_to_say', 'other']),
  height: z
    .number({ invalid_type_error: 'Requerido' })
    .positive('Debe ser un valor positivo'),
  currentWeight: z
    .number({ invalid_type_error: 'Requerido' })
    .positive('Debe ser un valor positivo'),
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
  timezone: z.string().min(1, 'Requerido'),
  phone: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

type OnboardingFormData = Step1Data & Step2Data & Step3Data & Step4Data;

// ─── Static options ─────────────────────────────────────────────────────────

const MEDICAL_CONDITIONS = [
  'Diabetes',
  'Hipertensión',
  'Asma',
  'Artritis',
  'Enfermedad cardíaca',
  'Otro',
];
const INJURIES = ['Rodilla', 'Espalda baja', 'Hombro', 'Cadera', 'Tobillo', 'Cuello', 'Otro'];
const FOOD_ALLERGIES = ['Gluten', 'Lácteos', 'Nueces', 'Mariscos', 'Huevos', 'Soja', 'Otro'];
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
          ? 'border-blue-500 bg-blue-500/10 text-white'
          : 'border-gray-700 bg-[#1a1d27] text-gray-300 hover:border-gray-500 hover:bg-gray-700/50'
      )}
    >
      {icon && <span className="text-2xl mb-2 block">{icon}</span>}
      <span className="font-medium block">{label}</span>
      {description && (
        <span className={cn('text-sm mt-1 block', selected ? 'text-blue-200' : 'text-gray-500')}>
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
              ? 'border-blue-500 bg-blue-500/20 text-blue-300'
              : 'border-gray-600 bg-[#1a1d27] text-gray-400 hover:border-gray-500'
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

// ─── Step headers config ────────────────────────────────────────────────────

const STEP_CONFIG = [
  { title: 'Tu objetivo', subtitle: 'Cuéntanos qué quieres lograr', icon: Target },
  { title: 'Datos físicos', subtitle: 'Información sobre tu cuerpo', icon: Dumbbell },
  { title: 'Salud e historial', subtitle: 'Opcional — nos ayuda a personalizar tu plan', icon: Heart },
  { title: 'Preferencias', subtitle: 'Cómo y cuándo quieres entrenar', icon: Settings },
  { title: '¡Todo listo!', subtitle: 'Revisa tu información antes de comenzar', icon: CheckCircle2 },
];

// ─── Main component ──────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const locale = useLocale();

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
        toast.success('¡Bienvenido! Tu perfil está listo.');
        router.push(`/${locale}/dashboard`);
      } else {
        setSubmitError(result.message || 'Ocurrió un error. Por favor intenta de nuevo.');
      }
    } catch {
      setSubmitError('Ocurrió un error inesperado. Por favor intenta de nuevo.');
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
          <p className="text-sm font-medium text-gray-300 mb-3">¿Cuál es tu objetivo principal?</p>
          <div className="grid grid-cols-2 gap-3">
            <SelectCard
              label="Perder peso"
              icon="🔥"
              selected={fitnessGoal === 'lose_weight'}
              onClick={() => setValue('fitnessGoal', 'lose_weight', { shouldValidate: true })}
            />
            <SelectCard
              label="Ganar músculo"
              icon="💪"
              selected={fitnessGoal === 'gain_muscle'}
              onClick={() => setValue('fitnessGoal', 'gain_muscle', { shouldValidate: true })}
            />
            <SelectCard
              label="Mantener peso"
              icon="⚖️"
              selected={fitnessGoal === 'maintain'}
              onClick={() => setValue('fitnessGoal', 'maintain', { shouldValidate: true })}
            />
            <SelectCard
              label="Mejorar resistencia"
              icon="🏃"
              selected={fitnessGoal === 'endurance'}
              onClick={() => setValue('fitnessGoal', 'endurance', { shouldValidate: true })}
            />
          </div>
          <FieldError message={errors.fitnessGoal?.message} />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-300 mb-3">¿Cuál es tu nivel de actividad actual?</p>
          <div className="grid grid-cols-1 gap-3">
            <SelectCard
              label="Sedentario"
              description="Poco o nada de ejercicio"
              selected={activityLevel === 'sedentary'}
              onClick={() => setValue('activityLevel', 'sedentary', { shouldValidate: true })}
            />
            <SelectCard
              label="Ligeramente activo"
              description="1-3 días/semana"
              selected={activityLevel === 'lightly_active'}
              onClick={() => setValue('activityLevel', 'lightly_active', { shouldValidate: true })}
            />
            <SelectCard
              label="Moderadamente activo"
              description="3-5 días/semana"
              selected={activityLevel === 'moderately_active'}
              onClick={() => setValue('activityLevel', 'moderately_active', { shouldValidate: true })}
            />
            <SelectCard
              label="Muy activo"
              description="6-7 días/semana"
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
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            {...register('birthDate')}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
          />
          <FieldError message={errors.birthDate?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Género</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'male', label: 'Masculino' },
              { value: 'female', label: 'Femenino' },
              { value: 'prefer_not_to_say', label: 'Prefiero no decir' },
              { value: 'other', label: 'Otro' },
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Altura (cm)</label>
            <input
              type="number"
              placeholder="170"
              {...register('height', { valueAsNumber: true })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
            />
            <FieldError message={errors.height?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Peso actual (kg)
            </label>
            <input
              type="number"
              placeholder="70"
              {...register('currentWeight', { valueAsNumber: true })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
            />
            <FieldError message={errors.currentWeight?.message} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Peso objetivo (kg){' '}
            <span className="text-gray-500 font-normal">— opcional</span>
          </label>
          <input
            type="number"
            placeholder="65"
            {...register('targetWeight', { valueAsNumber: true })}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
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
        <p className="text-sm text-gray-400">
          Todos los campos de este paso son opcionales. Esta información nos ayuda a personalizar
          tu plan de entrenamiento.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Condiciones médicas
          </label>
          <MultiSelectChips
            options={MEDICAL_CONDITIONS}
            selected={medicalConditions}
            onChange={setMedicalConditions}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Lesiones previas
          </label>
          <MultiSelectChips
            options={INJURIES}
            selected={injuries}
            onChange={setInjuries}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Medicamentos <span className="text-gray-500 font-normal">— campo libre</span>
          </label>
          <textarea
            {...register('medications')}
            rows={2}
            placeholder="Ej: Metformina 500mg, Losartán..."
            className="w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Alergias alimentarias
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
          <p className="text-sm font-medium text-gray-300 mb-3">¿Cuándo prefieres entrenar?</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'morning', label: 'Mañana', icon: '🌅' },
              { value: 'afternoon', label: 'Tarde', icon: '☀️' },
              { value: 'evening', label: 'Noche', icon: '🌙' },
              { value: 'flexible', label: 'Flexible', icon: '📅' },
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
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Zona horaria
          </label>
          <select
            {...register('timezone')}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="" disabled className="bg-gray-800">
              Selecciona tu zona horaria
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
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Gym / Ubicación{' '}
              <span className="text-gray-500 font-normal">— opcional</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Gold's Gym, Casa..."
              {...register('gymLocation')}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Teléfono{' '}
              <span className="text-gray-500 font-normal">— opcional</span>
            </label>
            <input
              type="tel"
              placeholder="+52 55 1234 5678"
              {...register('phone')}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
            />
          </div>
        </div>
      </div>
    );
  };

  const GOAL_LABELS: Record<string, string> = {
    lose_weight: '🔥 Perder peso',
    gain_muscle: '💪 Ganar músculo',
    maintain: '⚖️ Mantener peso',
    endurance: '🏃 Mejorar resistencia',
  };
  const ACTIVITY_LABELS: Record<string, string> = {
    sedentary: 'Sedentario',
    lightly_active: 'Ligeramente activo',
    moderately_active: 'Moderadamente activo',
    very_active: 'Muy activo',
  };
  const GENDER_LABELS: Record<string, string> = {
    male: 'Masculino',
    female: 'Femenino',
    prefer_not_to_say: 'Prefiero no decir',
    other: 'Otro',
  };
  const SCHEDULE_LABELS: Record<string, string> = {
    morning: '🌅 Mañana',
    afternoon: '☀️ Tarde',
    evening: '🌙 Noche',
    flexible: '📅 Flexible',
  };

  const renderStep5 = () => {
    const items = [
      { label: 'Objetivo', value: formData.fitnessGoal ? GOAL_LABELS[formData.fitnessGoal] : '—' },
      {
        label: 'Nivel de actividad',
        value: formData.activityLevel ? ACTIVITY_LABELS[formData.activityLevel] : '—',
      },
      { label: 'Fecha de nacimiento', value: formData.birthDate || '—' },
      { label: 'Género', value: formData.gender ? GENDER_LABELS[formData.gender] : '—' },
      { label: 'Altura', value: formData.height ? `${formData.height} cm` : '—' },
      { label: 'Peso actual', value: formData.currentWeight ? `${formData.currentWeight} kg` : '—' },
      {
        label: 'Peso objetivo',
        value: formData.targetWeight ? `${formData.targetWeight} kg` : 'No especificado',
      },
      {
        label: 'Horario preferido',
        value: formData.preferredSchedule ? SCHEDULE_LABELS[formData.preferredSchedule] : '—',
      },
      { label: 'Zona horaria', value: formData.timezone || '—' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm">
          Revisa tu información. Podrás modificarla más adelante desde tu perfil.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(({ label, value }) => (
            <div key={label} className="bg-gray-800/50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className="text-sm text-white font-medium">{value}</p>
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
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Fit<span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Coach</span>
          </h1>
        </div>

        {/* Progress bar */}
        <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
          <span>Paso {currentStep} de 5</span>
          <span>{Math.round((currentStep / 5) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-1.5 mb-8">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Step card */}
        <div className="bg-[#1a1d27] rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
          {/* Step header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <StepIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{stepConfig.title}</h2>
                <p className="text-sm text-gray-400">{stepConfig.subtitle}</p>
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
          <div className="px-8 pb-8 flex items-center justify-between border-t border-gray-800 pt-6">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-700/50 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : submitError ? (
                  'Intentar de nuevo'
                ) : (
                  <>
                    Comenzar mi journey
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
