import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
  className,
}) => {
  return (
    <div className={cn('grid gap-2 text-left', className)}>
      <Label className="text-base font-semibold text-neutral-800">{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full h-[54px] border-2 border-[#e5bdaa] rounded-xl bg-white px-4 font-sans text-[17px] text-neutral-800 placeholder:text-neutral-400 focus-visible:border-[#e51422] focus-visible:ring-2 focus-visible:ring-[#e51422]/20 shadow-none transition-colors"
      />
    </div>
  );
};

