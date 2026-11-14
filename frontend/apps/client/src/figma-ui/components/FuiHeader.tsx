import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import type { Screen } from '../types';
import { cn } from '@/lib/utils';

interface FuiHeaderProps {
  navigate: (screen: Screen) => void;
  className?: string;
}

export const FuiHeader: React.FC<FuiHeaderProps> = ({ navigate, className }) => {
  const routerNavigate = useNavigate();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (action: () => void) => {
    action();
    setMobileOpen(false);
  };

  return (
    <header
      className={cn(
        'h-[82px] max-sm:h-[66px] px-6 sm:px-12 lg:px-16 flex items-center justify-between relative z-30',
        'bg-[#da1311] bg-[url("/banner-figma-red-navs.png")] bg-cover bg-center bg-no-repeat text-white shadow-sm',
        className
      )}
    >
      <button
        type="button"
        onClick={() => routerNavigate('/')}
        className="flex items-center gap-2.5 transition-transform hover:scale-105 border-0 bg-transparent cursor-pointer p-0"
      >
        <img src="/logo-blanco-negro.svg" alt="Taguer" className="size-8" />
        <span className="font-heading text-2xl font-bold tracking-tight text-white drop-shadow-xs">
          Taguer
        </span>
      </button>

      {/* Desktop Navigation */}
      <nav className="hidden sm:flex items-center gap-6 lg:gap-8">
        <button
          type="button"
          onClick={() => navigate('home')}
          className="text-sm font-semibold text-white/95 hover:text-[#ffc900] transition-colors cursor-pointer"
        >
          {t('nav.home', 'Inicio')}
        </button>
        <button
          type="button"
          onClick={() => document.getElementById('fui-about')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-sm font-semibold text-white/95 hover:text-[#ffc900] transition-colors cursor-pointer"
        >
          {t('footer.aboutTaguer', '¿Qué es Taguer?')}
        </button>
        <button
          type="button"
          onClick={() => document.getElementById('fui-contact')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-sm font-semibold text-white/95 hover:text-[#ffc900] transition-colors cursor-pointer"
        >
          {t('footer.contactTitle', 'Contacto')}
        </button>
        <button
          type="button"
          onClick={() => routerNavigate('/login')}
          className="text-sm font-semibold text-white hover:text-[#ffc900] transition-colors cursor-pointer"
        >
          {t('nav.login', 'Inicia Sesión')}
        </button>
        <LanguageSwitcher />
      </nav>

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="sm:hidden text-white p-2 cursor-pointer transition-transform active:scale-95"
        aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {mobileOpen ? <X size={26} /> : <Menu size={26} />}
      </button>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="sm:hidden absolute top-[66px] left-0 right-0 bg-[#da1311] bg-[url('/banner-figma-red-navs.png')] bg-cover bg-center border-t border-white/10 p-5 shadow-xl flex flex-col gap-4 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-white/70">
              {t('nav.language', 'Idioma')}
            </span>
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            onClick={() => handleNav(() => navigate('home'))}
            className="text-left text-base font-semibold text-white hover:text-[#ffc900] py-1 cursor-pointer"
          >
            {t('nav.home', 'Inicio')}
          </button>
          <button
            type="button"
            onClick={() =>
              handleNav(() => document.getElementById('fui-about')?.scrollIntoView({ behavior: 'smooth' }))
            }
            className="text-left text-base font-semibold text-white hover:text-[#ffc900] py-1 cursor-pointer"
          >
            {t('footer.aboutTaguer', '¿Qué es Taguer?')}
          </button>
          <button
            type="button"
            onClick={() =>
              handleNav(() => document.getElementById('fui-contact')?.scrollIntoView({ behavior: 'smooth' }))
            }
            className="text-left text-base font-semibold text-white hover:text-[#ffc900] py-1 cursor-pointer"
          >
            {t('footer.contactTitle', 'Contacto')}
          </button>
          <button
            type="button"
            onClick={() => handleNav(() => routerNavigate('/login'))}
            className="text-left text-base font-bold text-[#ffc900] hover:text-white py-1 cursor-pointer"
          >
            {t('nav.login', 'Inicia Sesión')}
          </button>
        </div>
      )}
    </header>
  );
};

