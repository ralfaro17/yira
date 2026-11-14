import React from 'react';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  plan: string;
  index: number;
  className?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, className }) => {

  return (
    <article className={cn('text-center flex flex-col items-center', className)}>
      <div
        className={cn(
          ' rounded-2xl grid place-items-center text-white shadow-sm transition-transform duration-300 hover:scale-[1.03]'
        )}
      >
        <img src={`/landing-page/plan-${plan}.png`} alt={`Plan ${plan}`} className='rounded-2xl'/>
      </div>
      <h3 className="font-heading text-2xl sm:text-[30px] text-[#f18e00] mt-3 mb-0 leading-tight">
        Plan <strong className="block font-bold">{plan}</strong>
      </h3>
    </article>
  );
};

