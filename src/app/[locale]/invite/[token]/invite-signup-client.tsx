'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { registerCoach } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShieldCheck, Mail, AlertTriangle } from 'lucide-react';

const schema = z
  .object({
    firstName: z.string().min(2, 'At least 2 characters'),
    lastName:  z.string().min(2, 'At least 2 characters'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Must contain uppercase, lowercase, number, and special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  inviteToken: string;
  lockedEmail: string;
}

export default function InviteSignupClient({ inviteToken, lockedEmail }: Props) {
  const locale = useLocale();
  const t = useTranslations('inviteSignup');
  const [submitting, setSubmitting] = useState(false);
  const [existingRole, setExistingRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      const match = document.cookie.split('; ').find((r) => r.startsWith('user_data='));
      if (match) {
        const raw = decodeURIComponent(match.split('=').slice(1).join('='));
        const userData = JSON.parse(raw);
        if (userData?.role) setExistingRole(userData.role);
      }
    } catch { /* ignore */ }
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (existingRole) {
        await fetch('/api/auth/logout', { method: 'POST' });
      }
      const result = await registerCoach({
        token: inviteToken,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      if (result.success) {
        toast.success('Account created! Setting up your coach profile…');
        setTimeout(() => { window.location.href = `/${locale}/onboarding/coach`; }, 100);
      } else {
        toast.error(result.message || 'Registration failed. Please try again.');
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8f5] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <a href={`/${locale}`}>
            <h1 className="text-2xl font-bold text-[#162318] tracking-tight">
              Steady<span className="text-[#3a7d44]">Vitality</span>
            </h1>
          </a>
        </div>

        {/* Existing session warning */}
        {existingRole && (
          <div className="mb-4 flex gap-3 items-start bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700">You&apos;re already signed in</p>
              <p className="text-xs text-amber-600 mt-0.5">
                You have an active <strong>{existingRole}</strong> session. Submitting will sign you
                out and create your new coach account.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-[#d8e0d8] overflow-hidden">
          <div className="h-1 bg-[#3a7d44]" />
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-[#ddf0df] border border-[#3a7d44]/20 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7 text-[#3a7d44]" />
              </div>
              <h1 className="text-2xl font-bold text-[#0f1f10] mb-1">{t('heading')}</h1>
              <p className="text-sm text-[#617061]">{t('subtitle')}</p>
            </div>

            {/* Locked email */}
            <div className="flex items-center gap-2 bg-[#f6f8f5] border border-[#d8e0d8] rounded-lg px-4 py-3 mb-6">
              <Mail className="w-4 h-4 text-[#3a7d44] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-[#617061] font-medium">{t('invitedEmail')}</p>
                <p className="text-sm text-[#0f1f10] truncate">{lockedEmail}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-[#0f1f10] text-sm font-medium">
                    {t('firstNameLabel')}
                  </Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder={t('firstNamePlaceholder')}
                    className="border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#a0b0a0] focus-visible:ring-[#3a7d44]"
                  />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-[#0f1f10] text-sm font-medium">
                    {t('lastNameLabel')}
                  </Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder={t('lastNamePlaceholder')}
                    className="border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#a0b0a0] focus-visible:ring-[#3a7d44]"
                  />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[#0f1f10] text-sm font-medium">
                  {t('passwordLabel')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder={t('passwordPlaceholder')}
                  className="border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#a0b0a0] focus-visible:ring-[#3a7d44]"
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-[#0f1f10] text-sm font-medium">
                  {t('confirmPasswordLabel')}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  placeholder={t('confirmPasswordPlaceholder')}
                  className="border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#a0b0a0] focus-visible:ring-[#3a7d44]"
                />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#3a7d44] hover:bg-[#52a85e] text-white transition-colors py-3 font-semibold disabled:opacity-50"
              >
                {submitting ? t('creating') : t('createButton')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
