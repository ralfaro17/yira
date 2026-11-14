import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAuthSessionQuery } from '@/features/auth/hooks/use-auth-queries';
import { PaquiNavBadge } from '../../components/gamification/PaquiNavBadge';
import { FuiFooter } from '../../figma-ui/components/FuiFooter';
import { Users, ArrowRight, ArrowLeft, KeyRound, AlertCircle, AlertTriangle, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { SavedRoute } from '../../types/route';

export const JoinGroupRoutePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionQuery = useAuthSessionQuery();
  const isAuthenticated = sessionQuery.data?.meta?.is_authenticated === true;

  useEffect(() => {
    if (sessionQuery.isSuccess && !isAuthenticated) {
      navigate('/login?next=/rutas/unirse', { replace: true });
    }
  }, [sessionQuery.isSuccess, isAuthenticated, navigate]);

  const [inviteCode, setInviteCode] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingActiveRoute, setExistingActiveRoute] = useState<SavedRoute | null>(null);

  useEffect(() => {
    let active = true;
    async function checkActiveRoute() {
      try {
        const resp = await api.getActiveRoute();
        if (active && resp.has_active_route && resp.route) {
          setExistingActiveRoute(resp.route);
        }
      } catch (err) {
        console.error('Error checking active route:', err);
      }
    }
    checkActiveRoute();
    return () => {
      active = false;
    };
  }, []);

  const handleCancelExistingActiveRoute = async () => {
    if (!existingActiveRoute) return;
    if (
      !window.confirm(
        `¿Deseas cancelar o abandonar tu ruta activa actual "${existingActiveRoute.title}" para unirte a otro itinerario?`
      )
    ) {
      return;
    }
    setIsCancelling(true);
    try {
      try {
        const resp = await api.cancelRoute(existingActiveRoute.id);
        toast.success(resp.message || 'Ruta cancelada/abandonada exitosamente.');
      } catch {
        const cleanResp = await api.cleanupActiveRoute({ route_id: existingActiveRoute.id });
        toast.success(cleanResp.message || 'Ruta liberada exitosamente.');
      }
      setExistingActiveRoute(null);
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['active-route'] });
    } catch (err: any) {
      toast.error(err.message || 'Error al cancelar o abandonar la ruta activa.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();

    if (!cleanCode) {
      toast.error(t('routes.enterCodeAlert', 'Por favor ingresa un código de invitación o ID.'));
      return;
    }

    if (!isAuthenticated) {
      toast.info(t('routes.noAccountAlert', 'Debes iniciar sesión para unirte a un itinerario grupal.'));
      navigate('/login');
      return;
    }

    // Si el usuario ya está activo en este mismo código, ir directo
    if (
      existingActiveRoute &&
      (cleanCode === existingActiveRoute.invite_code || Number(cleanCode) === existingActiveRoute.id)
    ) {
      navigate(`/rutas/grupal/${existingActiveRoute.invite_code || existingActiveRoute.id}`);
      return;
    }

    // Si tiene OTRA ruta activa diferente, bloquear unión en el cliente
    if (existingActiveRoute) {
      const msg = `Ya eres parte de un itinerario activo ('${existingActiveRoute.title}'). Debes completarlo o cancelarlo antes de unirte a otro.`;
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setIsJoining(true);
    setErrorMessage(null);

    try {
      const payload = cleanCode.startsWith('TAG-') || isNaN(Number(cleanCode))
        ? { invite_code: cleanCode }
        : { route_id: Number(cleanCode) };

      const response = await api.joinGroupRoute(payload);
      queryClient.invalidateQueries({ queryKey: ['active-route'] });
      toast.success(response.message);

      const targetIdentifier = response.route.invite_code || response.route.id;
      navigate(`/rutas/grupal/${targetIdentifier}`);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo unir al itinerario.');
      setErrorMessage(err.message || 'No se pudo encontrar o unirse al itinerario.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff9ef] text-neutral-900 font-sans selection:bg-[#ffc900] selection:text-neutral-900 flex flex-col justify-between">
      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 space-y-8 flex-1">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="text-xs font-bold text-neutral-700 hover:text-neutral-900 px-4 py-2 rounded-full border-2 border-[#e5bdaa] bg-white hover:bg-neutral-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('common.back', 'Volver al Inicio')}</span>
          </Link>
          <PaquiNavBadge />
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-purple-300 rounded-3xl p-8 sm:p-10 shadow-md space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-sm">
              <Users className="w-8 h-8" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-heading text-neutral-900">
              {t('routes.joinGroupTitle', 'Unirse a un Itinerario Grupal')}
            </h1>

            <p className="text-sm text-neutral-600 max-w-md mx-auto">
              {t('routes.joinGroupSubtitle', 'Ingresa el código compartido por el anfitrión para ver las paradas y sincronizar la ruta.')}
            </p>
          </div>

          {existingActiveRoute && (
            <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-400 text-amber-950 space-y-3.5 shadow-sm animate-fade-in">
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-2xl bg-amber-200/90 flex items-center justify-center shrink-0 text-amber-800 shadow-2xs">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-neutral-950">
                      Ruta Activa
                    </span>
                    {existingActiveRoute.is_group && existingActiveRoute.invite_code && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-200 text-purple-900 border border-purple-300">
                        Grupo {existingActiveRoute.invite_code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-neutral-900">
                    Ya eres parte del itinerario &ldquo;{existingActiveRoute.title}&rdquo;.
                  </p>
                  <p className="text-[11px] text-neutral-600 leading-relaxed">
                    No puedes unirte a otro itinerario mientras tengas una ruta activa. Puedes regresar a tu ruta actual o cancelarla / abandonarla a continuación.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-amber-200">
                <Link
                  to={
                    existingActiveRoute.is_group && existingActiveRoute.invite_code
                      ? `/rutas/grupal/${existingActiveRoute.invite_code}?tab=map`
                      : `/rutas/grupal/${existingActiveRoute.id}?tab=map`
                  }
                  className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="size-3.5" />
                  <span>Ir a mi Ruta Activa</span>
                </Link>

                <button
                  type="button"
                  onClick={handleCancelExistingActiveRoute}
                  disabled={isCancelling}
                  className="px-3.5 py-2 rounded-full bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 ml-auto"
                >
                  {isCancelling ? 'Procesando...' : '🚫 Cancelar / Abandonar Ruta Actual'}
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="inviteCode" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                {t('routes.inviteCodeLabel', 'Código de Invitación')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                  <KeyRound className="w-5 h-5 text-purple-500" />
                </div>
                <input
                  id="inviteCode"
                  type="text"
                  placeholder="TAG-XXXXX"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  disabled={isJoining}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-[#e5bdaa] focus:border-purple-600 focus:outline-hidden font-mono text-lg font-bold tracking-wider placeholder:font-sans placeholder:font-normal placeholder:text-neutral-400 uppercase text-neutral-900 bg-white shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isJoining || !inviteCode.trim()}
              className="w-full py-4 rounded-full bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>{isJoining ? t('routes.joiningBtn', 'Verificando e Ingresando...') : t('routes.joinBtn', 'Unirme al Itinerario')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Info footer */}
          <div className="pt-6 border-t border-neutral-100 text-center text-xs text-neutral-500 space-y-1">
            <p>
              ¿Quieres ser anfitrión de tus propios viajes compartidos?
            </p>
            <p>
              Adquiere la{' '}
              <Link to="/billing/pricing" className="text-[#e51422] font-bold hover:underline">
                Membresía Viajero ($5/mes)
              </Link>{' '}
              para crear itinerarios grupales ilimitados.
            </p>
          </div>
        </div>
      </main>

      <FuiFooter />
    </div>
  );
};
