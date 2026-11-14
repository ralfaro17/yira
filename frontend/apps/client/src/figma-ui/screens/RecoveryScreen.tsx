import React from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AuthShell } from '../components/AuthShell';
import { FormField } from '../components/FormField';
import { FuiButton } from '../components/FuiButton';
import type { Screen } from '../types';

interface RecoveryScreenProps {
  navigate?: (screen: Screen) => void;
  step: 'email' | 'code' | 'reset';
}

export const RecoveryScreen: React.FC<RecoveryScreenProps> = ({ navigate, step }) => {
  const { t } = useTranslation();
  const routerNavigate = useNavigate();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navigate) {
      navigate('forgot-code');
    } else {
      routerNavigate('/figma-ui/forgot-password/code');
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navigate) {
      navigate('reset');
    } else {
      routerNavigate('/figma-ui/reset-password');
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    routerNavigate('/login');
  };

  const backTo =
    step === 'email'
      ? '/figma-ui/login'
      : step === 'code'
        ? '/figma-ui/forgot-password'
        : '/figma-ui/forgot-password/code';

  return (
    <AuthShell
      navigate={navigate}
      back={step === 'email' ? 'login' : step === 'code' ? 'forgot' : 'forgot-code'}
      backTo={backTo}
      title={
        <>
          {t('figmaScreens.recovery.title', 'Recupera tu')}<br />
          <strong className="font-['Tropika_Script','Tropika',cursive] font-normal">
            {t('figmaScreens.recovery.titleHighlight', 'Contraseña')}
          </strong>
        </>
      }
      subtitle={
        step === 'code'
          ? t(
              'figmaScreens.recovery.subtitleCode',
              'Hemos enviado un código de recuperación a tu dirección de correo electrónico'
            )
          : undefined
      }
    >
      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="grid gap-5 text-left">
          <FormField
            label={t('auth.identifierLabel', 'Ingresa tu correo de recuperación')}
            type="email"
            placeholder="tu@correo.com"
            required
          />
          <div className="text-center pt-3">
            <FuiButton type="submit" className="min-w-[190px]">
              {t('common.continue', 'Continuar')}
            </FuiButton>
          </div>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleCodeSubmit} className="grid gap-5 text-left">
          <FormField
            label={t('auth.verifyEmail.manualHeaderTitle', 'Ingresa el código de recuperación')}
            placeholder={t('auth.verifyEmail.manualKeyPlaceholder', 'Código de 6 dígitos')}
            required
          />
          <div className="text-center pt-3">
            <FuiButton type="submit" className="min-w-[190px]">
              {t('common.continue', 'Continuar')}
            </FuiButton>
          </div>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleResetSubmit} className="grid gap-5 text-left">
          <FormField
            label={t('auth.resetPasswordForm.newPasswordLabel', 'Ingresa tu contraseña nueva')}
            type="password"
            placeholder="••••••••"
            required
          />
          <FormField
            label={t('auth.resetPasswordForm.confirmPasswordLabel', 'Confirma tu contraseña')}
            type="password"
            placeholder="••••••••"
            required
          />
          <div className="text-center pt-3">
            <FuiButton type="submit" className="min-w-[190px]">
              {t('common.continue', 'Continuar')}
            </FuiButton>
          </div>
        </form>
      )}
    </AuthShell>
  );
};
