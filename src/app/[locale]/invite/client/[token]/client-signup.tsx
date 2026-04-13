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

  // Detect if the visitor already has an active session (e.g. a coach testing their
  // own invite link). We read the non-httpOnly user_data cookie via document.cookie.
  // If found, we show a warning instead of letting them create a second account.
  useEffect(() => {
    try {
      const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith('user_data='));
      if (match) {
        const raw = decodeURIComponent(match.split('=').slice(1).join('='));
        const userData = JSON.parse(raw);
        if (userData?.role) setExistingRole(userData.role);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);
    try {
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

      // Redirect to client onboarding — the coach link is already established on the backend
      window.location.href = `/${locale}/onboarding`;
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Fit<span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Coach</span>
          </h1>
        </div>

        {/* Already-logged-in warning */}
        {existingRole && (
          <div className="mb-4 flex gap-3 items-start bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">You&apos;re already signed in</p>
              <p className="text-xs text-amber-400/80 mt-0.5">
                You have an active <strong>{existingRole}</strong> session. To use this invite link,{' '}
                <a href="/api/auth/logout" className="underline hover:text-amber-300">
                  sign out first
                </a>{' '}
                or open this link in a private browser window.
              </p>
            </div>
          </div>
        )}

        <div className="bg-[#1a1d27] rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-800 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">You've been invited!</h2>
            <p className="text-sm text-gray-400 mt-1">
              <span className="text-blue-400 font-medium">{coachName}</span> has invited you to join as a client.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-5">
            {/* Locked email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                Invited email
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-700 bg-gray-700/30">
                <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-300">{lockedEmail}</span>
              </div>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                  First name
                </label>
                <input
                  {...register('firstName')}
                  placeholder="Jane"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {errors.firstName && (
                  <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                  Last name
                </label>
                <input
                  {...register('lastName')}
                  placeholder="Smith"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {errors.lastName && (
                  <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                {...register('password')}
                placeholder="Create a strong password"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                {...register('confirmPassword')}
                placeholder="Repeat your password"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <Dumbbell className="w-4 h-4" />
                  Create account & get started
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-500">
              After creating your account you'll complete a short fitness questionnaire
              so {coachName} can personalize your program.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
