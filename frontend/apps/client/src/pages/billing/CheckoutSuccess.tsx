import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CheckCircle, Loader2, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

function getCookie(name: string) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default function CheckoutSuccess() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const queryClient = useQueryClient();

  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      if (!sessionId) {
        setVerifying(false);
        return;
      }

      try {
        const csrftoken = getCookie('csrftoken');
        await axios.post(
          '/api/billing/verify-checkout-session/',
          { session_id: sessionId },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
            },
          }
        );

        if (isMounted) {
          setVerifying(false);
          // Invalidate relevant caches immediately
          queryClient.invalidateQueries({ queryKey: ['ai-status'] });
          queryClient.invalidateQueries({ queryKey: ['active-subscription'] });
          queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        }
      } catch (err: any) {
        console.error('Error verifying checkout session:', err);
        if (isMounted) {
          setError(
            err.response?.data?.error ||
              t(
                'pricing.success.fallbackError',
                'No se pudo verificar la sesión de pago automáticamente, pero tu compra está en proceso.'
              )
          );
          setVerifying(false);
          // Still invalidate in case it synced through fallback
          queryClient.invalidateQueries({ queryKey: ['ai-status'] });
          queryClient.invalidateQueries({ queryKey: ['active-subscription'] });
        }
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [sessionId, queryClient, t]);

  return (
    <div className="min-h-screen bg-[#fff9ef] text-neutral-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white border-2 border-[#e5bdaa] rounded-3xl p-8 sm:p-10 text-center shadow-lg">
        {verifying ? (
          <div className="py-8 space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 text-[#e51422] animate-spin" />
            </div>
            <h1 className="text-2xl font-heading text-neutral-900">
              {t('pricing.success.verifying', 'Verificando tu membresía...')}
            </h1>
            <p className="text-neutral-600 text-sm">
              {t(
                'pricing.success.verifyingDesc',
                'Estamos activando tus privilegios premium y sincronizando tu cuenta con Stripe.'
              )}
            </p>
          </div>
        ) : error ? (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-amber-600" />
              </div>
            </div>
            <h1 className="text-3xl font-heading text-neutral-900">
              {t('pricing.success.verificationInProgress', 'Verificación en proceso')}
            </h1>
            <p className="text-neutral-600 text-sm leading-relaxed">
              {error}
            </p>
            <div className="pt-2 flex flex-col gap-3">
              <Link
                to="/rutas/crear"
                className="w-full py-3.5 px-6 rounded-full bg-[#e51422] text-white font-bold text-base hover:bg-[#cf101c] shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>{t('pricing.success.goToRouteWizard', 'Ir al Creador de Rutas')}</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/billing/pricing"
                className="w-full py-3 px-6 rounded-full border-2 border-[#e5bdaa] text-neutral-700 font-bold text-sm hover:border-neutral-400 transition-colors"
              >
                {t('pricing.success.viewMembershipStatus', 'Ver Estado de Membresías')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-200">
                <CheckCircle className="h-12 w-12 text-emerald-600" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 border border-emerald-300 bg-emerald-50 rounded-full text-emerald-800 font-bold text-xs px-3.5 py-1 mb-3">
                <Sparkles className="size-3.5 text-amber-500" />
                <span>{t('pricing.success.activeBadge', 'Membresía Activa')}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-heading text-neutral-900 mb-2">
                {t('pricing.success.title', '¡Pago Exitoso!')}
              </h1>
              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                {t(
                  'pricing.success.desc',
                  'Tu membresía ha sido activada correctamente. Ahora disfrutas de acceso ilimitado a itinerarios con Inteligencia Artificial, rutas grupales y multiplicadores de paquipuntos.'
                )}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link
                to="/rutas/crear"
                className="w-full py-3.5 px-6 rounded-full bg-[#e51422] text-white font-bold text-base hover:bg-[#cf101c] shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('pricing.success.createAiRoute', 'Crear Itinerario con IA')}</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/"
                className="w-full py-3 px-6 rounded-full border-2 border-[#e5bdaa] text-neutral-700 font-bold text-sm hover:border-neutral-400 transition-colors cursor-pointer"
              >
                {t('pricing.success.backHome', 'Volver al Inicio')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
