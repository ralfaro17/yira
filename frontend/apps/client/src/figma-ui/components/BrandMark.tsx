import React from 'react';
import { cn } from '@/lib/utils';

interface BrandMarkProps {
  onClick?: () => void;
  variant?: 'primary' | 'inverted';
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  onClick,
  variant = 'primary',
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Taguer Inicio"
      className={cn(
        'w-12 h-12 rounded-full font-heading text-[34px] leading-none grid place-items-center select-none transition-transform hover:scale-105 active:scale-95 cursor-pointer border-0 shadow-sm shrink-0',
        variant === 'inverted'
          ? 'bg-white text-[#e51422]'
          : 'bg-[#e51422] text-white',
        className
      )}
    >
      T
    </button>
  );
};
