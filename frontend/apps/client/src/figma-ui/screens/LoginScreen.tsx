import React from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AuthShell } from '../components/AuthShell';
import { FormField } from '../components/FormField';
import { FuiButton } from '../components/FuiButton';
import type { Screen } from '../types';

interface LoginScreenProps {
  navigate?: (screen: Screen) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigate }) => {
  const routerNavigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    routerNavigate('/login');
  };

  return (
    <AuthShell
      navigate={navigate}
      backTo="/figma-ui"
      title={t('auth.welcomeBack', 'Bienvenido')}
      subtitle={t('auth.loginSubtitle', 'Inicia sesión para continuar')}
    >
      <form onSubmit={handleSubmit} className="grid gap-5 text-left">
        <FormField
          label={t('auth.emailLabel', 'Ingresa tu correo electrónico')}
          type="email"
          placeholder="tu@correo.com"
          required
        />
        <FormField
          label={t('auth.passwordLabel', 'Ingresa tu contraseña')}
          type="password"
          placeholder="••••••••"
          required
        />
        <div className="text-center pt-2">
          <FuiButton type="submit" className="min-w-[190px]">
            {t('common.continue', 'Continuar')}
          </FuiButton>
        </div>
      </form>

      <div className="mt-7 text-center">
        <button
          type="button"
          onClick={() => (navigate ? navigate('forgot') : routerNavigate('/figma-ui/forgot-password'))}
          className="text-sm sm:text-[15px] font-medium text-neutral-600 hover:text-[#e51422] transition-colors cursor-pointer border-0 bg-transparent"
        >
          {t('auth.forgotPasswordLink', '¿Olvidaste tu contraseña?')}
        </button>
      </div>

      <p className="mt-4 text-sm sm:text-[15px] text-neutral-600">
        {t('auth.firstTimeHere', '¿Primera vez aquí?')}{' '}
        <button
          type="button"
          onClick={() => (navigate ? navigate('signup-type') : routerNavigate('/figma-ui/signup'))}
          className="font-bold text-[#e51422] hover:underline cursor-pointer border-0 bg-transparent"
        >
          {t('auth.signupTitle', 'Crea tu cuenta')}
        </button>
      </p>
    </AuthShell>
  );
};

