'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale } from 'next-intl';
import { Loader2, Mail, UserCheck, Dumbbell, AlertTriangle } from 'lucide-react';
import { registerClient } from '@/actions/auth';

const schema = z
  .object({
    firstName: z.string().min(2, 'At least 2 characters'),
    lastName: z.string().min(2, 'At least 2 characters'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Must include uppercase, lowercase, number, and special character'
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
  coachName: string;
}

export default function ClientInviteSignup({ inviteToken, lockedEmail, coachName }: Props) {
  const locale = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    try {
      if (existingRole) {
        await fetch('/api/auth/logout', { method: 'POST' });
      }
      const result = await registerClient({
        token: inviteToken,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      });
      if (!result.success) {
        setError(result.message || 'Registration failed. Please try again.');
        return;
      }
      window.location.href = `/${locale}/onboarding`;
    } catch {
      setError('Network error. Please check your connection and try again.');
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
                You have an active <strong>{existingRole}</strong> session. Submitting will sign
                you out and create your new client account.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-[#d8e0d8] overflow-hidden">
          <div className="h-1 bg-[#3a7d44]" />

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-[#d8e0d8] text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#ddf0df] border border-[#3a7d44]/20 flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-7 h-7 text-[#3a7d44]" />
            </div>
            <h2 className="text-xl font-semibold text-[#0f1f10]">You&apos;ve been invited!</h2>
            <p className="text-sm text-[#617061] mt-1">
              <span className="text-[#3a7d44] font-medium">{coachName}</span> has invited you to join as a client.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-5">
            {/* Locked email */}
            <div>
              <label className="block text-xs font-medium text-[#617061] uppercase tracking-wide mb-1.5">
                Invited email
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-[#f6f8f5]">
                <Mail className="w-4 h-4 text-[#3a7d44] flex-shrink-0" />
                <span className="text-sm text-[#0f1f10]">{lockedEmail}</span>
              </div>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#617061] uppercase tracking-wide mb-1.5">
                  First name
                </label>
                <input
                  {...register('firstName')}
                  placeholder="Jane"
                  className="w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10] placeholder-[#a0b0a0] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44] text-sm"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#617061] uppercase tracking-wide mb-1.5">
                  Last name
                </label>
                <input
                  {...register('lastName')}
                  placeholder="Smith"
                  className="w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10] placeholder-[#a0b0a0] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44] text-sm"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[#617061] uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                {...register('password')}
                placeholder="Create a strong password"
                className="w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10] placeholder-[#a0b0a0] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44] text-sm"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#617061] uppercase tracking-wide mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                {...register('confirmPassword')}
                placeholder="Repeat your password"
                className="w-full px-3 py-2.5 rounded-lg border border-[#d8e0d8] bg-white text-[#0f1f10] placeholder-[#a0b0a0] focus:outline-none focus:ring-2 focus:ring-[#3a7d44] focus:border-[#3a7d44] text-sm"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#3a7d44] hover:bg-[#52a85e] text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
              ) : (
                <><Dumbbell className="w-4 h-4" /> Create account &amp; get started</>
              )}
            </button>

            <p className="text-center text-xs text-[#617061]">
              After creating your account you&apos;ll complete a short fitness questionnaire
              so {coachName} can personalize your program.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
