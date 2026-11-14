import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthShell } from '../components/AuthShell';
import { FormField } from '../components/FormField';
import { FuiButton } from '../components/FuiButton';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Screen } from '../types';

interface ScreenProps {
  navigate?: (screen: Screen) => void;
}

export const SignupType: React.FC<ScreenProps> = ({ navigate }) => {
  const { t } = useTranslation();
  const routerNavigate = useNavigate();

  return (
    <AuthShell
      navigate={navigate}
      back="login"
      backTo="/figma-ui/login"
      title={
        <>
          {t('figmaScreens.signupType.title', 'Crea una')}<br />
          <strong className="font-['Tropika_Script','Tropika',cursive] font-normal">
            {t('figmaScreens.signupType.titleHighlight', 'Cuenta nueva')}
          </strong>
        </>
      }
      subtitle={t(
        'figmaScreens.signupType.subtitle',
        'Selecciona el tipo de usuario con el que deseas registrarte'
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
        <button
          type="button"
          onClick={() => (navigate ? navigate('signup-profile') : routerNavigate('/figma-ui/signup/profile'))}
          className="min-h-[170px] sm:min-h-[200px] bg-white border-3 border-[#e51422] rounded-2xl text-[#e51422] hover:bg-red-50/50 transition-all cursor-pointer grid place-content-center gap-2 p-6 shadow-sm group hover:-translate-y-1"
        >
          <span className="font-heading text-3xl sm:text-[42px] leading-tight">
            {t('figmaScreens.signupType.traveler', 'Viajero')}
          </span>
          <small className="text-sm sm:text-base font-sans text-neutral-600 font-normal">
            {t('figmaScreens.signupType.travelerDesc', 'Descubre nuevos lugares')}
          </small>
        </button>

        <button
          type="button"
          onClick={() => (navigate ? navigate('signup-profile') : routerNavigate('/figma-ui/signup/profile'))}
          className="min-h-[170px] sm:min-h-[200px] bg-white border-3 border-[#e51422] rounded-2xl text-[#e51422] hover:bg-red-50/50 transition-all cursor-pointer grid place-content-center gap-2 p-6 shadow-sm group hover:-translate-y-1"
        >
          <span className="font-heading text-3xl sm:text-[42px] leading-tight">
            {t('figmaScreens.signupType.merchant', 'Comercio')}
          </span>
          <small className="text-sm sm:text-base font-sans text-neutral-600 font-normal">
            {t('figmaScreens.signupType.merchantDesc', 'Haz crecer tu negocio')}
          </small>
        </button>
      </div>
    </AuthShell>
  );
};

export const ProfileScreen: React.FC<ScreenProps> = ({ navigate }) => {
  const routerNavigate = useNavigate();
  const [gender, setGender] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navigate) {
      navigate('signup-account');
    } else {
      routerNavigate('/figma-ui/signup/account');
    }
  };

  return (
    <AuthShell
      navigate={navigate}
      back="signup-type"
      backTo="/figma-ui/signup"
      title={
        <>
          Crea una<br />
          <strong className="font-['Tropika_Script','Tropika',cursive] font-normal">Cuenta nueva</strong>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-5 text-left">
        <FormField label="Ingresa tus nombres" placeholder="Ej. Juan Carlos" required />
        <FormField label="Ingresa tus apellidos" placeholder="Ej. Pérez Silva" required />
        <FormField label="Ingresa tu fecha de nacimiento" type="date" required />

        <div className="grid gap-2 text-left">
          <Label className="text-base font-semibold text-neutral-800">Ingresa tu genero</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="w-full h-[54px] border-2 border-[#e5bdaa] rounded-xl bg-white px-4 font-sans text-[17px] text-neutral-800 focus:border-[#e51422] focus:ring-0 shadow-none">
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent className="bg-white border-2 border-[#e5bdaa] rounded-xl shadow-lg">
              <SelectItem value="femenino" className="text-base py-2.5">Femenino</SelectItem>
              <SelectItem value="masculino" className="text-base py-2.5">Masculino</SelectItem>
              <SelectItem value="otro" className="text-base py-2.5">Otro / Prefiero no decir</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-center pt-3">
          <FuiButton type="submit" className="min-w-[190px]">
            Continuar
          </FuiButton>
        </div>
      </form>
    </AuthShell>
  );
};

export const AccountScreen: React.FC<ScreenProps> = ({ navigate }) => {
  const routerNavigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navigate) {
      navigate('signup-experience');
    } else {
      routerNavigate('/figma-ui/signup/experience');
    }
  };

  return (
    <AuthShell
      navigate={navigate}
      back="signup-profile"
      backTo="/figma-ui/signup/profile"
      title={
        <>
          Crea una<br />
          <strong className="font-['Tropika_Script','Tropika',cursive] font-normal">Cuenta nueva</strong>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-5 text-left">
        <FormField
          label="Ingresa tu dirección de correo electrónico"
          type="email"
          placeholder="tu@correo.com"
          required
        />
        <FormField
          label="Crea tu contraseña"
          type="password"
          placeholder="••••••••"
          required
        />
        <FormField
          label="Confirma tu contraseña"
          type="password"
          placeholder="••••••••"
          required
        />
        <div className="text-center pt-3">
          <FuiButton type="submit" className="min-w-[190px]">
            Continuar
          </FuiButton>
        </div>
      </form>
    </AuthShell>
  );
};

export const ExperienceScreen: React.FC<ScreenProps> = ({ navigate }) => {
  const routerNavigate = useNavigate();
  const levels = ['Principiante', 'Intermedio', 'Experto'];

  return (
    <AuthShell
      navigate={navigate}
      back="signup-account"
      backTo="/figma-ui/signup/account"
      title={
        <>
          Crea una<br />
          <strong className="font-['Tropika_Script','Tropika',cursive] font-normal">Cuenta nueva</strong>
        </>
      }
      subtitle="Para continuar, selecciona el nivel de experiencia que deseas"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {levels.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => (navigate ? navigate('signup-business') : routerNavigate('/figma-ui/signup/business'))}
            className="min-h-[140px] sm:min-h-[160px] bg-white border-3 border-[#1457b8] rounded-2xl text-[#1457b8] hover:bg-blue-50/50 transition-all cursor-pointer relative flex flex-col justify-center items-center gap-1 p-5 shadow-sm group hover:-translate-y-1"
          >
            <span className="font-heading text-2xl sm:text-[34px] leading-tight">{level}</span>
            <small className="text-xs sm:text-sm font-sans text-neutral-600 font-normal">
              Elige tu aventura
            </small>
            <span className="w-8 h-8 rounded-full border-2 border-[#1457b8] grid place-items-center text-[#1457b8] mt-3 group-hover:bg-[#1457b8] group-hover:text-white transition-colors">
              <Check size={18} />
            </span>
          </button>
        ))}
      </div>
    </AuthShell>
  );
};

export const BusinessScreen: React.FC<ScreenProps> = ({ navigate }) => {
  const routerNavigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navigate) {
      navigate('signup-health');
    } else {
      routerNavigate('/figma-ui/signup/health');
    }
  };

  return (
    <AuthShell
      navigate={navigate}
      back="signup-experience"
      backTo="/figma-ui/signup/experience"
      title={
        <>
          Crea una<br />
          <strong className="font-['Tropika_Script','Tropika',cursive] font-normal">Cuenta nueva</strong>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-5 text-left">
        <FormField label="Ingresa el nombre de la sucursal" placeholder="Ej. Hotel Granada Centro" required />
        <FormField label="Ingresa la dirección" placeholder="Calle La Calzada, Granada" required />
        <FormField label="Ingresa un número de teléfono de contacto" type="tel" placeholder="+505 8888 8888" required />
        <div className="text-center pt-3">
          <FuiButton type="submit" className="min-w-[190px]">
            Finalizar
          </FuiButton>
        </div>
      </form>
    </AuthShell>
  );
};

export const HealthScreen: React.FC<ScreenProps> = ({ navigate }) => {
  const routerNavigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navigate) {
      navigate('signup-done');
    } else {
      routerNavigate('/figma-ui/signup/done');
    }
  };

  return (
    <AuthShell
      navigate={navigate}
      back="signup-business"
      backTo="/figma-ui/signup/business"
      title={
        <>
          Crea una<br />
          <strong className="font-['Tropika_Script','Tropika',cursive] font-normal">Cuenta nueva</strong>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-5 text-left">
        <FormField label="Ingresa tus condiciones médicas" placeholder="Opcional (alergias, etc.)" />
        <FormField label="Ingresa el nombre de tu contacto de emergencia (opcional)" placeholder="Nombre completo" />
        <FormField label="Ingresa el número de tu contacto de emergencia (opcional)" type="tel" placeholder="+505 8888 8888" />

        <details className="border-2 border-[#e5bdaa] rounded-xl p-3.5 bg-white group cursor-pointer">
          <summary className="flex items-center justify-between font-semibold text-sm sm:text-base text-neutral-800 select-none">
            <span>Agrega el enlace de tu página web</span>
            <ChevronDown size={18} className="text-neutral-500 transition-transform group-open:rotate-180" />
          </summary>
          <div className="pt-3">
            <FormField label="Enlace web" placeholder="https://tupagina.com" />
          </div>
        </details>

        <div className="text-center pt-3">
          <FuiButton type="submit" className="min-w-[190px]">
            Continuar
          </FuiButton>
        </div>
      </form>
    </AuthShell>
  );
};

export const DoneScreen: React.FC<ScreenProps> = () => {
  const routerNavigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#e51422] text-white flex flex-col items-center justify-center p-6 sm:p-10 text-center relative overflow-hidden">
      <div className="max-w-xl flex flex-col items-center z-10">
        <button
          type="button"
          onClick={() => routerNavigate('/')}
          className="flex items-center gap-2.5 transition-transform hover:scale-105 border-0 bg-transparent cursor-pointer p-0 mb-2"
        >
          <img src="/logo-blanco-negro.svg" alt="Taguer" className="size-12" />
        </button>

        <p className="font-['Tropika_Script','Tropika',cursive] text-6xl sm:text-[80px] leading-[0.8] mt-7 mb-3">
          ¡Listo!
        </p>

        <h1 className="font-heading text-4xl sm:text-[68px] leading-[0.9] font-normal my-4">
          ¡Ya puedes iniciar sesión<br />con tu nueva cuenta!
        </h1>

        <div className="mt-8">
          <FuiButton
            onClick={() => routerNavigate('/login')}
            className="bg-white text-[#e51422] hover:bg-neutral-100 hover:text-[#c90f1b]"
          >
            Inicia Sesión <ArrowRight size={18} />
          </FuiButton>
        </div>
      </div>
    </div>
  );
};

