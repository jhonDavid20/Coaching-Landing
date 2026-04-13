'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';

export default function AuthLeftPanel() {
  const t = useTranslations('auth');

  return (
    <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#162318] p-12">
      <div>
        <p className="text-[#c8dcc9] text-sm font-semibold uppercase tracking-widest mb-10">
          {t('panelLabel')}
        </p>
        <h1 className="text-4xl font-extrabold text-white leading-tight mb-6">
          {t('panelHeading')}
        </h1>
        <p className="text-[#c8dcc9] text-base leading-relaxed mb-10">
          {t('panelDescription')}
        </p>
        <ul className="space-y-4">
          {(['feature1', 'feature2', 'feature3', 'feature4'] as const).map((key) => (
            <li key={key} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#3a7d44] flex-shrink-0" />
              <span className="text-[#c8dcc9] text-sm">{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Testimonial */}
      <div className="bg-[#1e3320] rounded-xl p-5 border border-[#2d5a31]/40">
        <p className="text-[#c8dcc9] text-sm leading-relaxed italic mb-4">
          &quot;{t('testimonialQuote')}&quot;
        </p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ddf0df] flex items-center justify-center text-[#2d5a31] text-xs font-bold">
            CM
          </div>
          <div>
            <p className="text-white text-xs font-semibold">{t('testimonialName')}</p>
            <p className="text-[#617061] text-xs">{t('testimonialRole')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
