import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FuiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  outline?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FuiButton: React.FC<FuiButtonProps> = ({
  children,
  onClick,
  outline = false,
  type = 'button',
  className,
  ...props
}) => {
  return (
    <Button
      type={type}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full min-h-12 px-6 py-2.5 font-bold text-lg font-sans transition-all cursor-pointer shadow-md',
        outline
          ? 'bg-white text-[#e51422] border-2 border-[#e51422] hover:bg-red-50 hover:text-[#c90f1b] hover:-translate-y-0.5'
          : 'bg-[#e51422] text-white border-0 hover:bg-[#cf101c] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

