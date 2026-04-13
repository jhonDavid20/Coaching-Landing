'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { registerCoach } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShieldCheck, Mail } from 'lucide-react';

// ── Schema — matches POST /api/auth/coach/register body ───────────────────────

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const result = await registerCoach({
        token: inviteToken,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (result.success) {
        toast.success('Account created! Setting up your coach profile…');
        // Middleware will detect role:coach + hasCompletedOnboarding:false
        // and redirect to /onboarding/coach automatically
        setTimeout(() => {
          window.location.href = `/${locale}/dashboard`;
        }, 100);
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
    <div className="max-w-md w-full">
      <div className="bg-[#1a1d27] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-purple-600 to-blue-600" />

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{t('heading')}</h1>
            <p className="text-sm text-gray-400">{t('subtitle')}</p>
          </div>

          {/* Locked email chip */}
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 mb-6">
            <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-blue-400 font-medium">{t('invitedEmail')}</p>
              <p className="text-sm text-white truncate">{lockedEmail}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-gray-300">{t('firstNameLabel')}</Label>
                <Input
                  id="firstName"
                  type="text"
                  {...register('firstName')}
                  placeholder={t('firstNamePlaceholder')}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500"
                />
                {errors.firstName && (
                  <p className="text-xs text-red-400">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-gray-300">{t('lastNameLabel')}</Label>
                <Input
                  id="lastName"
                  type="text"
                  {...register('lastName')}
                  placeholder={t('lastNamePlaceholder')}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500"
                />
                {errors.lastName && (
                  <p className="text-xs text-red-400">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-gray-300">{t('passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder={t('passwordPlaceholder')}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500"
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-gray-300">{t('confirmPasswordLabel')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                placeholder={t('confirmPasswordPlaceholder')}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition-opacity py-3 font-semibold disabled:opacity-50"
            >
              {submitting ? t('creating') : t('createButton')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
