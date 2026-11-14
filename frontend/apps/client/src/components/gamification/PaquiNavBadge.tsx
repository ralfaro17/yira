import React from 'react';
import { useNavigate } from 'react-router';
import { Zap, Sparkles } from 'lucide-react';
import { usePaqui } from '../../context/PaquiContext';

export const PaquiNavBadge: React.FC = () => {
  const navigate = useNavigate();
  const { balance, hasActiveMembership, membershipMultiplier, isLoading, wallet } = usePaqui();

  if (isLoading || !wallet) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/paquipoints')}
      title="Ir a la Tienda de Paquipuntos"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ffc900] hover:bg-[#ffbe00] text-neutral-950 transition-all text-xs font-bold cursor-pointer group shadow-sm hover:scale-105 active:scale-95 border border-[#e5a800]"
    >
      <div className="size-5 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        <img
          src="/paqui puntos-01.svg"
          alt="paquipuntos"
          className="size-5 object-contain drop-shadow-2xs"
        />
      </div>

      <span className="text-neutral-950 font-black tracking-tight">
        {balance.toLocaleString()}{' '}
        <span className="text-neutral-800 font-semibold">paquipuntos</span>
      </span>

      {hasActiveMembership && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#e51422] text-white font-black text-[10px] tracking-wider uppercase shadow-xs">
          <Zap className="w-2.5 h-2.5 fill-current" />
          {membershipMultiplier}x
        </span>
      )}

      <Sparkles className="w-3 h-3 text-neutral-900 opacity-70 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};
