'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { completeCoachOnboarding, CoachOnboardingPayload, CoachingType } from '@/actions/coach-onboarding';
import { toast } from 'sonner';
import AvatarUploader from '@/components/profile/avatar-uploader';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  BookOpen,
  Award,
  Layers,
  CalendarClock,
  DollarSign,
  Plus,
  X,
} from 'lucide-react';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  profileHeadline: z
    .string()
    .min(5, 'At least 5 characters')
    .max(160, 'Maximum 160 characters'),
  bio: z
    .string()
    .min(20, 'Tell us a bit more (min 20 characters)')
    .max(1000, 'Maximum 1000 characters'),
  videoIntroUrl: z
    .string()
    .url('Must be a valid URL (https://...)')
    .optional()
    .or(z.literal('')),
});

const step2Schema = z.object({
  yearsOfExperience: z
    .number({ invalid_type_error: 'Required' })
    .int()
    .min(0, 'Cannot be negative')
    .max(60, 'Please enter a realistic value'),
});

const step3Schema = z.object({
  coachingType: z.enum(['online', 'in_person', 'hybrid'] as const),
  instagramHandle: z.string().optional(),
  websiteUrl: z
    .string()
    .url('Must be a valid URL (https://...)')
    .optional()
    .or(z.literal('')),
});

const step4Schema = z.object({
  timezone: z.string().min(1, 'Please select a timezone'),
  sessionDurationMinutes: z
    .number({ invalid_type_error: 'Required' })
    .int()
    .positive('Must be positive'),
  maxClientCapacity: z
    .number({ invalid_type_error: 'Required' })
    .int()
    .min(1, 'At least 1 client'),
  acceptingClients: z.boolean(),
  totalClientsTrained: z.number().int().min(0).optional(),
});

const step5Schema = z.object({
  sessionRateUSD: z
    .number({ invalid_type_error: 'Required' })
    .positive('Must be greater than 0'),
  trialSessionAvailable: z.boolean(),
  trialSessionRateUSD: z.number().positive().optional(),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;
type Step4 = z.infer<typeof step4Schema>;
type Step5 = z.infer<typeof step5Schema>;

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Your story',       subtitle: 'Introduce yourself to future clients',    icon: BookOpen      },
  { title: 'Expertise',        subtitle: 'Your specialties and training background', icon: Award         },
  { title: 'Coaching style',   subtitle: 'How and where you coach',                 icon: Layers        },
  { title: 'Availability',     subtitle: 'Capacity, schedule, and timezone',        icon: CalendarClock },
  { title: 'Pricing',          subtitle: 'Set your rates and session options',      icon: DollarSign    },
  { title: 'All set!',         subtitle: 'Review your profile before publishing',   icon: CheckCircle2  },
];
const TOTAL = STEPS.length;

// ─── Static option lists ──────────────────────────────────────────────────────

const SPECIALTIES = [
  'Weight Loss', 'Muscle Building', 'Athletic Performance', 'Post-Rehab',
  'Flexibility & Mobility', 'Endurance / Cardio', 'Body Composition',
  'Sports-Specific', 'Nutrition Coaching', 'Mental Performance',
];
const MODALITIES = [
  'Strength Training', 'HIIT', 'CrossFit', 'Yoga', 'Pilates',
  'Powerlifting', 'Olympic Lifting', 'Functional Training',
  'Calisthenics', 'Cardio', 'Martial Arts / Boxing', 'Dance / Zumba',
];
const CLIENT_TYPES = [
  'Beginners', 'Intermediate', 'Advanced', 'Athletes',
  'Seniors (60+)', 'Youth (Under 18)', 'Pre/Postnatal',
  'Post-Rehab', 'Busy Professionals', 'Weight Management',
];
const LANGUAGES = [
  'English', 'Spanish', 'Portuguese', 'French',
  'German', 'Italian', 'Mandarin', 'Arabic', 'Other',
];
const COMMON_CERTS = [
  'NASM-CPT', 'ACE', 'ISSA', 'ACSM', 'NSCA-CSCS',
  'NCSF', 'AFAA', 'Yoga RYT-200', 'Yoga RYT-500', 'Precision Nutrition L1',
];
const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Mexico_City', 'America/Bogota',
  'America/Lima', 'America/Santiago', 'America/Argentina/Buenos_Aires',
  'America/Caracas', 'Europe/Madrid', 'Europe/London', 'UTC',
];
const SESSION_DURATIONS = [30, 45, 60, 75, 90, 120];

// ─── Reusable primitives ──────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-red-500 text-xs mt-1.5">{message}</p>;
}

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <p className="text-sm font-medium text-[#0f1f10] mb-2">
      {children}
      {optional && <span className="text-[#617061] font-normal ml-1">— optional</span>}
    </p>
  );
}

function TextInput({
  placeholder,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      placeholder={placeholder}
      className={cn(
        'w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10]',
        'focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44]',
        'placeholder-[#a0b0a0]',
        className,
      )}
      {...props}
    />
  );
}

function Textarea({ placeholder, rows = 4, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      placeholder={placeholder}
      rows={rows}
      className={cn(
        'w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10] resize-none',
        'focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44]',
        'placeholder-[#a0b0a0]',
        className,
      )}
      {...props}
    />
  );
}

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
          : 'border-[#d8e0d8] bg-[#f6f8f5] text-[#617061] hover:border-[#3a7d44] hover:bg-[#f0faf0]',
      )}
    >
      {icon && <span className="text-2xl mb-2 block">{icon}</span>}
      <span className="font-medium block">{label}</span>
      {description && (
        <span className={cn('text-sm mt-0.5 block', selected ? 'text-[#2d5a31]' : 'text-[#617061]')}>
          {description}
        </span>
      )}
    </button>
  );
}

function Chips({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          className={cn(
            'px-3 py-1.5 rounded-full border text-sm transition-all duration-200',
            selected.includes(o)
              ? 'border-[#3a7d44] bg-[#ddf0df] text-[#2d5a31]'
              : 'border-[#d8e0d8] bg-white text-[#617061] hover:border-[#3a7d44]',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// Dynamic tag-input (certifications)
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');

  const add = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInput('');
  };

  return (
    <div className="space-y-3">
      {/* Common presets */}
      <div className="flex flex-wrap gap-2">
        {COMMON_CERTS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => add(c)}
            disabled={tags.includes(c)}
            className={cn(
              'px-2.5 py-1 rounded-full border text-xs transition-all',
              tags.includes(c)
                ? 'border-[#3a7d44]/40 bg-[#ddf0df] text-[#3a7d44] cursor-default'
                : 'border-[#d8e0d8] text-[#617061] hover:border-[#3a7d44]',
            )}
          >
            {tags.includes(c) ? '✓ ' : '+ '}{c}
          </button>
        ))}
      </div>

      {/* Free-text add */}
      <div className="flex gap-2">
        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(input); } }}
          placeholder="Type a certification and press Enter…"
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => add(input)}
          className="px-3 py-2 rounded-lg bg-[#ddf0df] border border-[#3a7d44]/30 text-[#3a7d44] hover:bg-[#c8dcc9] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Added tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#ddf0df] border border-[#3a7d44]/30 rounded-full text-sm text-[#2d5a31]"
            >
              {t}
              <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))}>
                <X className="w-3 h-3 hover:text-white" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Review summary row ───────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-[#f6f8f5] rounded-lg px-4 py-3">
      <p className="text-xs text-[#617061] mb-0.5">{label}</p>
      <div className="text-sm text-[#0f1f10] font-medium">{value || '—'}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CoachOnboardingPage() {
  const router = useRouter();
  const locale = useLocale();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<'forward' | 'back'>('forward');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Accumulated form data across all steps
  const [data, setData] = useState<Partial<CoachOnboardingPayload>>({
    acceptingClients: true,
    trialSessionAvailable: false,
  });

  // Avatar URL set after upload (optional — user can skip)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Multi-select state (not managed by react-hook-form)
  const [specialties,       setSpecialties]       = useState<string[]>([]);
  const [modalities,        setModalities]         = useState<string[]>([]);
  const [clientTypes,       setClientTypes]        = useState<string[]>([]);
  const [certifications,    setCertifications]     = useState<string[]>([]);
  const [languages,         setLanguages]          = useState<string[]>([]);

  // Per-step forms
  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: { profileHeadline: data.profileHeadline ?? '', bio: data.bio ?? '', videoIntroUrl: data.videoIntroUrl ?? '' } });
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema), defaultValues: { yearsOfExperience: data.yearsOfExperience } });
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema), defaultValues: { coachingType: data.coachingType, instagramHandle: data.instagramHandle ?? '', websiteUrl: data.websiteUrl ?? '' } });
  const form4 = useForm<Step4>({ resolver: zodResolver(step4Schema), defaultValues: { timezone: data.timezone ?? '', sessionDurationMinutes: data.sessionDurationMinutes, maxClientCapacity: data.maxClientCapacity, acceptingClients: data.acceptingClients ?? true, totalClientsTrained: data.totalClientsTrained } });
  const form5 = useForm<Step5>({ resolver: zodResolver(step5Schema), defaultValues: { sessionRateUSD: data.sessionRateUSD, trialSessionAvailable: data.trialSessionAvailable ?? false, trialSessionRateUSD: data.trialSessionRateUSD } });

  // ── Navigation ──────────────────────────────────────────────────────────────

  const next = async () => {
    let patch: Partial<CoachOnboardingPayload> = {};
    let valid = false;

    if (step === 1) {
      valid = await form1.trigger();
      if (valid) patch = form1.getValues();
    } else if (step === 2) {
      valid = await form2.trigger();
      if (valid) patch = { ...form2.getValues(), specialties, trainingModalities: modalities, targetClientTypes: clientTypes, certifications };
    } else if (step === 3) {
      valid = await form3.trigger();
      if (valid) patch = { ...form3.getValues(), languagesSpoken: languages };
    } else if (step === 4) {
      valid = await form4.trigger();
      if (valid) patch = form4.getValues();
    } else if (step === 5) {
      valid = await form5.trigger();
      if (valid) patch = form5.getValues();
    }

    if (!valid) return;
    setData((prev) => ({ ...prev, ...patch }));
    setDir('forward');
    setStep((s) => s + 1);
  };

  const back = () => { setDir('back'); setStep((s) => s - 1); };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Merge the separate multi-select arrays (they're stored outside `data`)
      const merged: Partial<CoachOnboardingPayload> = {
        ...data,
        specialties,
        trainingModalities: modalities,
        targetClientTypes: clientTypes,
        certifications,
        languagesSpoken: languages,
      };

      // Sanitize: strip NaN from optional number fields, strip empty strings
      // from optional URL/string fields so the backend gets undefined not null
      const clean: Record<string, unknown> = { ...merged };
      const optionalNumbers: (keyof CoachOnboardingPayload)[] = ['totalClientsTrained', 'trialSessionRateUSD'];
      const optionalStrings: (keyof CoachOnboardingPayload)[] = ['videoIntroUrl', 'websiteUrl', 'instagramHandle'];
      for (const k of optionalNumbers) {
        if (clean[k] == null || (typeof clean[k] === 'number' && isNaN(clean[k] as number))) {
          delete clean[k];
        }
      }
      for (const k of optionalStrings) {
        if (clean[k] === '') delete clean[k];
      }

      const result = await completeCoachOnboarding(clean as unknown as CoachOnboardingPayload);
      if (result.success) {
        toast.success('Your coach profile is live!');
        router.push(`/${locale}/dashboard`);
      } else {
        setSubmitError(result.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step renderers ──────────────────────────────────────────────────────────

  const renderStep1 = () => {
    const { register, formState: { errors } } = form1;
    return (
      <div className="space-y-5">
        {/* ── Profile photo (optional) ── */}
        <div className="flex flex-col items-center gap-2 pb-2">
          <AvatarUploader
            currentAvatar={avatarUrl}
            size="lg"
            onChanged={(url) => {
              setAvatarUrl(url);
            }}
          />
          <p className="text-xs text-[#617061]">
            {avatarUrl ? 'Looking great! You can change it anytime.' : 'Add a profile photo — optional but recommended'}
          </p>
        </div>

        <div>
          <Label>Profile headline</Label>
          <TextInput {...register('profileHeadline')} placeholder="e.g. Strength & Mobility Coach for Busy Professionals" />
          <FieldError message={errors.profileHeadline?.message} />
          <p className="text-xs text-[#617061] mt-1">Max 160 characters — shows under your name on your profile</p>
        </div>
        <div>
          <Label>Professional bio</Label>
          <Textarea {...register('bio')} placeholder="Tell potential clients about your coaching philosophy, background, and what makes you unique…" rows={5} />
          <FieldError message={errors.bio?.message} />
        </div>
        <div>
          <Label optional>Intro video URL</Label>
          <TextInput {...register('videoIntroUrl')} placeholder="https://youtube.com/watch?v=..." type="url" />
          <FieldError message={errors.videoIntroUrl?.message} />
          <p className="text-xs text-[#617061] mt-1">YouTube or Vimeo link — profiles with video convert 3× better</p>
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    const { register, formState: { errors } } = form2;
    return (
      <div className="space-y-6">
        <div>
          <Label>Years of experience</Label>
          <TextInput type="number" min={0} max={60} placeholder="5" {...register('yearsOfExperience', { valueAsNumber: true })} className="max-w-[140px]" />
          <FieldError message={errors.yearsOfExperience?.message} />
        </div>
        <div>
          <Label>Specialties <span className="text-gray-500 font-normal text-xs">(select all that apply)</span></Label>
          <Chips options={SPECIALTIES} selected={specialties} onChange={setSpecialties} />
        </div>
        <div>
          <Label>Training modalities</Label>
          <Chips options={MODALITIES} selected={modalities} onChange={setModalities} />
        </div>
        <div>
          <Label>Types of clients you work with</Label>
          <Chips options={CLIENT_TYPES} selected={clientTypes} onChange={setClientTypes} />
        </div>
        <div>
          <Label optional>Certifications</Label>
          <TagInput tags={certifications} onChange={setCertifications} />
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const { register, watch, setValue, formState: { errors } } = form3;
    const coachingType = watch('coachingType');
    return (
      <div className="space-y-6">
        <div>
          <Label>How do you coach?</Label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'online',    label: 'Online',     icon: '💻' },
              { value: 'in_person', label: 'In-person',  icon: '🏋️' },
              { value: 'hybrid',    label: 'Hybrid',     icon: '🔀' },
            ].map((o) => (
              <SelectCard
                key={o.value}
                label={o.label}
                icon={o.icon}
                selected={coachingType === o.value}
                onClick={() => setValue('coachingType', o.value as CoachingType, { shouldValidate: true })}
              />
            ))}
          </div>
          <FieldError message={errors.coachingType?.message} />
        </div>
        <div>
          <Label>Languages spoken</Label>
          <Chips options={LANGUAGES} selected={languages} onChange={setLanguages} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label optional>Instagram</Label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 rounded-l-lg border-y border-l border-[#d8e0d8] bg-[#f6f8f5] text-[#617061] text-sm select-none">@</span>
              <input
                {...register('instagramHandle')}
                placeholder="yourhandle"
                className="flex-1 px-3 py-2.5 rounded-r-lg border border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44] placeholder-[#a0b0a0]"
              />
            </div>
          </div>
          <div>
            <Label optional>Website / Linktree</Label>
            <TextInput {...register('websiteUrl')} placeholder="https://yoursite.com" type="url" />
            <FieldError message={errors.websiteUrl?.message} />
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const { register, watch, setValue, formState: { errors } } = form4;
    const accepting = watch('acceptingClients');
    const duration  = watch('sessionDurationMinutes');
    return (
      <div className="space-y-6">
        <div>
          <Label>Timezone</Label>
          <select {...register('timezone')} className="w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="" disabled className="bg-gray-800">Select your timezone</option>
            {TIMEZONES.map((tz) => <option key={tz} value={tz} className="bg-gray-800">{tz}</option>)}
          </select>
          <FieldError message={errors.timezone?.message} />
        </div>
        <div>
          <Label>Default session length</Label>
          <div className="flex flex-wrap gap-2">
            {SESSION_DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setValue('sessionDurationMinutes', d, { shouldValidate: true })}
                className={cn(
                  'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                  duration === d
                    ? 'border-[#3a7d44] bg-[#ddf0df] text-[#2d5a31]'
                    : 'border-[#d8e0d8] text-[#617061] hover:border-[#3a7d44]',
                )}
              >
                {d} min
              </button>
            ))}
          </div>
          <FieldError message={errors.sessionDurationMinutes?.message} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Max active clients</Label>
            <TextInput type="number" min={1} placeholder="20" {...register('maxClientCapacity', { valueAsNumber: true })} />
            <FieldError message={errors.maxClientCapacity?.message} />
          </div>
          <div>
            <Label optional>Total clients trained</Label>
            <TextInput type="number" min={0} placeholder="150" {...register('totalClientsTrained', { valueAsNumber: true })} />
          </div>
        </div>
        <div>
          <Label>Currently accepting new clients?</Label>
          <div className="grid grid-cols-2 gap-3">
            <SelectCard label="Yes, open" icon="🟢" selected={accepting === true}  onClick={() => setValue('acceptingClients', true)} />
            <SelectCard label="No, full"  icon="🔴" selected={accepting === false} onClick={() => setValue('acceptingClients', false)} />
          </div>
        </div>
      </div>
    );
  };

  const renderStep5 = () => {
    const { register, watch, setValue, formState: { errors } } = form5;
    const trialAvailable  = watch('trialSessionAvailable');
    return (
      <div className="space-y-6">
        <div>
          <Label>Session rate (USD)</Label>
          <div className="flex items-center">
            <span className="px-3 py-2.5 rounded-l-lg border-y border-l border-[#d8e0d8] bg-[#f6f8f5] text-[#617061] text-sm select-none">$</span>
            <input
              type="number"
              min={1}
              step="0.01"
              placeholder="75.00"
              {...register('sessionRateUSD', { valueAsNumber: true })}
              className="flex-1 px-3 py-2.5 rounded-r-lg border border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44] placeholder-[#a0b0a0]"
            />
          </div>
          <FieldError message={errors.sessionRateUSD?.message} />
          <p className="text-xs text-[#617061] mt-1">Per session, before any platform fees</p>
        </div>
        <div>
          <Label>Offer a trial session?</Label>
          <div className="grid grid-cols-2 gap-3">
            <SelectCard label="Yes" icon="🎯" description="Show a discounted first session" selected={trialAvailable === true}  onClick={() => setValue('trialSessionAvailable', true)} />
            <SelectCard label="No"  icon="🚫" selected={trialAvailable === false} onClick={() => setValue('trialSessionAvailable', false)} />
          </div>
        </div>
        {trialAvailable && (
          <div>
            <Label optional>Trial session rate (USD)</Label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 rounded-l-lg border-y border-l border-[#d8e0d8] bg-[#f6f8f5] text-[#617061] text-sm select-none">$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="25.00"
                {...register('trialSessionRateUSD', { valueAsNumber: true })}
                className="flex-1 px-3 py-2.5 rounded-r-lg border border-[#d8e0d8] bg-white text-[#0f1f10] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44] placeholder-[#a0b0a0]"
              />
            </div>
            <FieldError message={errors.trialSessionRateUSD?.message} />
          </div>
        )}
        <p className="text-sm text-gray-500 bg-[#f6f8f5] rounded-lg px-4 py-3">
          💡 You can adjust pricing at any time from your dashboard settings.
        </p>
      </div>
    );
  };

  const renderStep6 = () => {
    const merged = {
      ...data,
      specialties, trainingModalities: modalities,
      targetClientTypes: clientTypes, certifications, languagesSpoken: languages,
    };
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center mb-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Your photo"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-[#3a7d44]"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#ddf0df] border-2 border-[#3a7d44] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#3a7d44]" />
            </div>
          )}
        </div>
        <p className="text-center text-[#617061] text-sm mb-4">
          Looking good! Review your details below — you can update everything later from your dashboard.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SummaryRow label="Headline"      value={merged.profileHeadline} />
          <SummaryRow label="Coaching type" value={
            merged.coachingType
              ? ({ online: '💻 Online', in_person: '🏋️ In-person', hybrid: '🔀 Hybrid' } as Record<string, string>)[merged.coachingType] ?? merged.coachingType
              : '—'
          } />
          <SummaryRow label="Experience"    value={merged.yearsOfExperience != null ? `${merged.yearsOfExperience} years` : '—'} />
          <SummaryRow label="Session rate"  value={merged.sessionRateUSD != null ? `$${merged.sessionRateUSD}/session` : '—'} />
          <SummaryRow label="Session length" value={merged.sessionDurationMinutes != null ? `${merged.sessionDurationMinutes} min` : '—'} />
          <SummaryRow label="Max clients"   value={merged.maxClientCapacity != null ? String(merged.maxClientCapacity) : '—'} />
          <SummaryRow label="Accepting clients" value={merged.acceptingClients ? '🟢 Yes' : '🔴 No'} />
          <SummaryRow label="Trial session" value={merged.trialSessionAvailable ? `Yes — $${merged.trialSessionRateUSD ?? '?'}` : 'No'} />
        </div>

        {merged.specialties.length > 0 && (
          <SummaryRow label="Specialties" value={
            <div className="flex flex-wrap gap-1 mt-1">
              {merged.specialties.map((s) => <span key={s} className="text-xs bg-[#ddf0df] text-[#2d5a31] px-2 py-0.5 rounded-full">{s}</span>)}
            </div>
          } />
        )}
        {merged.certifications.length > 0 && (
          <SummaryRow label="Certifications" value={merged.certifications.join(' · ')} />
        )}

        {submitError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
            <p className="text-red-500 text-sm">{submitError}</p>
          </div>
        )}
      </div>
    );
  };

  // ── Render shell ────────────────────────────────────────────────────────────

  const cfg = STEPS[step - 1];
  const StepIcon = cfg.icon;

  const renderStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8f5] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#162318] tracking-tight">
            Steady<span className="text-[#3a7d44]">Vitality</span>
          </h1>
          <p className="text-[#617061] text-sm mt-1">Coach onboarding</p>
        </div>

        {/* Progress */}
        <div className="mb-2 flex items-center justify-between text-xs text-[#617061]">
          <span>Step {step} of {TOTAL}</span>
          <span>{Math.round((step / TOTAL) * 100)}%</span>
        </div>
        <div className="w-full bg-[#d8e0d8] rounded-full h-1.5 mb-8">
          <div
            className="h-1.5 rounded-full bg-[#3a7d44] transition-all duration-500 ease-out"
            style={{ width: `${(step / TOTAL) * 100}%` }}
          />
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all duration-300',
                i + 1 < step  ? 'w-5 h-1.5 bg-[#3a7d44]' :
                i + 1 === step ? 'w-5 h-1.5 bg-[#3a7d44]' :
                                 'w-1.5 h-1.5 bg-[#d8e0d8]',
              )}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#d8e0d8] overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-[#d8e0d8]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ddf0df] border border-[#3a7d44]/20 flex items-center justify-center flex-shrink-0">
                <StepIcon className="w-5 h-5 text-[#3a7d44]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#0f1f10]">{cfg.title}</h2>
                <p className="text-sm text-[#617061]">{cfg.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            <div
              key={step}
              className={cn(
                'animate-in fade-in duration-300',
                dir === 'forward' ? 'slide-in-from-right-4' : 'slide-in-from-left-4',
              )}
            >
              {renderStep()}
            </div>
          </div>

          {/* Navigation */}
          <div className="px-8 pb-8 pt-6 border-t border-[#d8e0d8] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={back}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#d8e0d8] text-[#617061] text-sm font-medium hover:bg-[#f0faf0] transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : <div />}

            {step < TOTAL ? (
              <button
                type="button"
                onClick={next}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#162318] hover:bg-[#243d27] text-white text-sm font-medium transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#162318] hover:bg-[#243d27] text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                ) : submitError ? 'Try again' : (
                  <><CheckCircle2 className="w-4 h-4" />Publish my profile</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
