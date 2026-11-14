import React from 'react';
import { useTranslation } from 'react-i18next';
import { Instagram, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FuiFooterProps {
  className?: string;
}

export const FuiFooter: React.FC<FuiFooterProps> = ({ className }) => {
  const { t } = useTranslation();

  return (
    <footer
      id="fui-contact"
      className={cn(
        'bg-[#da1311] bg-[url("/banner-figma-red-navs.png")] bg-cover bg-center bg-no-repeat text-white',
        'min-h-[150px] px-6 sm:px-16 py-8 flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-24 shadow-inner',
        className
      )}
    >
      <div className="text-center sm:text-left">
        <small className="block relative left-20 top-4 text-center sm:text-left font-bold text-sm tracking-wider uppercase opacity-90 mt-1">
          {t('footer.tag', 'Somos')}
        </small>
        <p className="font-['Tropika'] text-5xl sm:text-[58px] leading-[0.8] m-0">
          {t('footer.brand', 'Taguer')}
        </p>
      </div>

      <div className="text-center sm:text-right">
        <strong className="block text-sm sm:text-base font-semibold mb-2">
          {t('footer.followUs', 'Siguenos en nuestras cuentas oficiales')}
        </strong>
        <p className="flex items-center justify-center sm:justify-end gap-4 text-xs sm:text-sm font-medium text-white/95">
          <span className="inline-flex items-center gap-1.5">
            <Instagram size={16} className="text-white" /> taguer.oficial
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Music2 size={16} className="text-white" /> taguer_of
          </span>
        </p>
      </div>
    </footer>
  );
};

