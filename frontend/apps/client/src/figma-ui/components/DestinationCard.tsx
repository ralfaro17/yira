import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DestinationCardProps {
  name: string;
  image: string;
  description: string;
  onContact?: () => void;
  className?: string;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({
  name,
  image,
  description,
  onContact,
  className,
}) => {
  const handleContact = () => {
    if (onContact) {
      onContact();
    } else {
      document.getElementById('fui-contact')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { t } = useTranslation();

  return (
    <article className={cn('flex flex-col items-center text-center group', className)}>
      <div className="w-full overflow-hidden rounded-xl bg-slate-100 shadow-sm transition-transform duration-300 group-hover:scale-[1.02]">
        <img
          src={image}
          alt={name}
          className="w-full object-contain object-center rounded-xl block bg-slate-50"
          loading="lazy"
        />
      </div>
      <h3 className="font-heading text-[#f1a800] text-[28px] mt-3 mb-1 leading-tight">
        {name}
      </h3>
      <p className="text-xs text-neutral-600 min-h-[28px] max-w-[220px] mx-auto my-1 leading-snug">
        {description}
      </p>
      <button
        type="button"
        onClick={handleContact}
        className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-neutral-900 bg-white px-3.5 py-1 text-xs font-sans font-medium text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
      >
        <MapPin size={12} /> {t('home.contactBtn', 'Contacto')}
      </button>
    </article>
  );
};

