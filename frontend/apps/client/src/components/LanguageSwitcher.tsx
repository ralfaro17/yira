import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'pill' | 'compact' | 'light';
  showLabel?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className,
  variant = 'pill',
  showLabel = false,
}) => {
  const { i18n, t } = useTranslation();

  const currentLang = (i18n.resolvedLanguage || i18n.language || 'es').startsWith('en')
    ? 'en'
    : 'es';

  const handleSetLanguage = (lang: 'es' | 'en') => {
    if (currentLang !== lang) {
      i18n.changeLanguage(lang);
    }
  };

  const isLight = variant === 'light';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5',
        className
      )}
      role="group"
      aria-label={t('nav.language', 'Idioma')}
    >
      {showLabel && (
        <span
          className={cn(
            'text-xs font-semibold flex items-center gap-1',
            isLight ? 'text-neutral-600' : 'text-white/80'
          )}
        >
          <Globe className="size-3.5" />
          <span>{t('nav.language', 'Idioma')}:</span>
        </span>
      )}

      <div
        className={cn(
          'inline-flex items-center rounded-full p-0.5 transition-all text-xs font-bold border shadow-xs',
          isLight
            ? 'bg-neutral-100 border-neutral-300 text-neutral-800'
            : 'bg-white/15 border-white/30 text-white backdrop-blur-xs'
        )}
      >
        <button
          type="button"
          onClick={() => handleSetLanguage('es')}
          className={cn(
            'px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 select-none',
            currentLang === 'es'
              ? isLight
                ? 'bg-[#da1311] text-white shadow-xs'
                : 'bg-white text-[#da1311] shadow-xs'
              : isLight
                ? 'text-neutral-600 hover:text-neutral-900'
                : 'text-white/80 hover:text-white'
          )}
          title="Español"
          aria-pressed={currentLang === 'es'}
        >
          <span className="text-xs">🇪🇸</span>
          <span className="text-[11px] font-bold">ES</span>
        </button>

        <button
          type="button"
          onClick={() => handleSetLanguage('en')}
          className={cn(
            'px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 select-none',
            currentLang === 'en'
              ? isLight
                ? 'bg-[#da1311] text-white shadow-xs'
                : 'bg-white text-[#da1311] shadow-xs'
              : isLight
                ? 'text-neutral-600 hover:text-neutral-900'
                : 'text-white/80 hover:text-white'
          )}
          title="English"
          aria-pressed={currentLang === 'en'}
        >
          <span className="text-xs">🇺🇸</span>
          <span className="text-[11px] font-bold">EN</span>
        </button>
      </div>
    </div>
  );
};

