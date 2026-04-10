'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { getCoachSetup } from '@/actions/auth';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {validateInvite, ValidateInviteResult} from "@/actions/invites";

export default function InviteLandingPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('inviteLanding');

  const [token, setToken]     = useState('');
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError(t('emptyError'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setLoading(true);
      const validatedToken: ValidateInviteResult = await validateInvite(trimmed);

      if (validatedToken.success && validatedToken.invite) {
        // Extraemos el tipo basándonos en la estructura de tu respuesta (data.type)
        const inviteType = validatedToken.invite.data?.type;
        const token = trimmed; // El token que el usuario ingresó

        if (inviteType === 'coach') {
          // Ruta: /en/invite/[token]
          router.push(`/invite/${token}`);
        } else if (inviteType === 'client') {
          // Ruta: /en/invite/client/[token]
          router.push(`/invite/client/${token}`);
        } else {
          // Si el tipo no es reconocido
          setError(t({ key: 'invalidInviteType' }));
        }
      } else {
        // Si success es false (token inválido o expirado)
        setError(t('emptyError'));
      }
    } catch (error) {
      console.error("Navigation error:", error);
      setError(t('emptyError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Fit<span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Coach</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t('brandSubtitle')}</p>
        </div>

        <div className="bg-[#1a1d27] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
          {/* Accent bar */}
          <div className="h-1 bg-gradient-to-r from-purple-600 to-blue-600" />

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{t('heading')}</h2>
              <p className="text-sm text-gray-400">{t('subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t('tokenLabel')}
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => { setToken(e.target.value); setError(null); }}
                  placeholder={t('tokenPlaceholder')}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700/50 text-white font-mono text-sm
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    placeholder-gray-600"
                />
                {error && (
                  <p className="text-xs text-red-400 mt-1.5">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
                  bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm
                  hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{t('validating')}</>
                ) : (
                  <>{t('continueButton')} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-600">
              {t('hasAccount')}{' '}
              <Link href={`/${locale}/auth`} className="text-gray-400 hover:text-white transition-colors">
                {t('signIn')}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          {t('noInvite')}
        </p>
      </div>
    </div>
  );
}
