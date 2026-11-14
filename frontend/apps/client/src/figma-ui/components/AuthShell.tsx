import React from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import type { Screen } from '../types';
import { cn } from '@/lib/utils';

interface AuthShellProps {
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  back?: Screen | string;
  backTo?: string;
  navigate?: (screen: Screen) => void;
  className?: string;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  title,
  subtitle,
  children,
  back,
  backTo,
  navigate,
  className,
}) => {
  const routerNavigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    if (backTo) {
      routerNavigate(backTo);
    } else if (back && navigate) {
      navigate(back as Screen);
    } else if (typeof back === 'string' && back.startsWith('/')) {
      routerNavigate(back);
    } else if (typeof back === 'string') {
      routerNavigate(-1);
    } else {
      routerNavigate('/');
    }
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-[#fff9ef] via-white to-[#ffe8df] grid place-items-center p-6 sm:p-10 relative text-neutral-900',
        className
      )}
    >
      <button
        type="button"
        onClick={handleBack}
        className="absolute top-6 left-6 sm:left-8 border-0 bg-transparent flex items-center gap-2 text-sm sm:text-base font-semibold text-neutral-800 hover:text-[#e51422] transition-colors cursor-pointer"
      >
        <ArrowLeft size={18} /> {t('common.back', 'Volver')}
      </button>

      <div className="w-full max-w-[620px] text-center py-8">
        <h1 className="font-heading font-normal text-4xl sm:text-[62px] leading-[0.85] text-neutral-900 mb-6">
          {title}
        </h1>

        {subtitle && (
          <p className="text-base sm:text-[19px] text-neutral-600 max-w-[530px] mx-auto mb-8 leading-snug">
            {subtitle}
          </p>
        )}

        {children}
      </div>
    </div>
  );
};

