import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { SavedRoute, RouteItemDetail, Place } from '../../types/route';
import { useAuthSessionQuery } from '@/features/auth/hooks/use-auth-queries';
import { usePaqui } from '../../context/PaquiContext';
import { PaquiNavBadge } from '../../components/gamification/PaquiNavBadge';
import { FuiFooter } from '../../figma-ui/components/FuiFooter';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
} from '@vis.gl/react-google-maps';
import {
  Users,
  Copy,
  Check,
  Crown,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Share2,
  AlertCircle,
  Eye,
  EyeOff,
  Map as MapIcon,
  Trophy,
  Navigation,
  Compass,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export const GroupRouteView: React.FC = () => {
  const { t } = useTranslation();
  const { codeOrId } = useParams<{ codeOrId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshWallet } = usePaqui();
  const sessionQuery = useAuthSessionQuery();
  const currentUser = sessionQuery.data?.data?.user;

  // Tabs: 'map' (Mapa interactivo) or 'voting' (Sala y votación de paradas)
  const initialTab = searchParams.get('tab') === 'voting' ? 'voting' : 'map';
  const [activeTab, setActiveTab] = useState<'map' | 'voting'>(initialTab);

  const [route, setRoute] = useState<SavedRoute | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [votingItemId, setVotingItemId] = useState<number | null>(null);
  const [hideDiscarded, setHideDiscarded] = useState<boolean>(false);
  const [wasUnlinked, setWasUnlinked] = useState<boolean>(false);

  // Map state
  const [selectedMarkerPlace, setSelectedMarkerPlace] = useState<Place | null>(null);
  const [completingItemId, setCompletingItemId] = useState<number | null>(null);
  const [isCompletingRoute, setIsCompletingRoute] = useState<boolean>(false);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const loadRoute = async () => {
    if (!codeOrId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getGroupRoute(codeOrId);
      if (data.status === 'CANCELLED' || !data.items || data.items.length === 0) {
        throw new Error('Este itinerario grupal fue cancelado o no tiene paradas disponibles.');
      }
      setRoute(data);
      if (data.items.length > 0 && !selectedMarkerPlace) {
        setSelectedMarkerPlace(data.items[0].place);
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el itinerario grupal.');
      try {
        await api.cleanupActiveRoute({ invite_code: codeOrId });
        setWasUnlinked(true);
        queryClient.invalidateQueries({ queryKey: ['active-route'] });
      } catch (cleanupErr) {
        console.warn('Auto-cleanup error:', cleanupErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoute();
  }, [codeOrId]);

  const handleTabChange = (tab: 'map' | 'voting') => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  const handleCopyCode = () => {
    if (!route?.invite_code) return;
    navigator.clipboard.writeText(route.invite_code);
    setCopiedCode(true);
    toast.success(`Código de invitación ${route.invite_code} copiado.`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    if (!route?.invite_code) return;
    const url = `${window.location.origin}/rutas/grupal/${route.invite_code}`;
    navigator.clipboard.writeText(url);
    toast.success('Enlace de invitación copiado al portapapeles.');
  };

  const handleVote = async (itemId: number, attending: boolean) => {
    if (!route) return;
    if (!currentUser) {
      toast.error('Debes iniciar sesión para votar tu asistencia.');
      return;
    }

    setVotingItemId(itemId);
    try {
      const result = await api.voteRouteItem(route.id, itemId, attending);
      toast.success(result.message);

      // Optimistically update route state
      setRoute((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((item) => {
            if (item.id === itemId) {
              const currentAttendingList = item.attending_users || [];
              const updatedAttendingList = attending
                ? currentAttendingList.some((u) => u.id === Number(currentUser.id))
                  ? currentAttendingList
                  : [
                      ...currentAttendingList,
                      {
                        id: Number(currentUser.id),
                        username: currentUser.username || 'Tú',
                        display: currentUser.display || 'Tú',
                      },
                    ]
                : currentAttendingList.filter((u) => u.id !== Number(currentUser.id));

              return {
                ...item,
                my_attending: attending,
                attending_users: updatedAttendingList,
                attending_users_count: updatedAttendingList.length,
              };
            }
            return item;
          }),
        };
      });
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar tu asistencia.');
    } finally {
      setVotingItemId(null);
    }
  };

  const handleCompleteStop = async (item: RouteItemDetail) => {
    if (!route) return;
    setCompletingItemId(item.id);
    try {
      const result = await api.completeRouteItem(route.id, item.id);
      if (result.success) {
        toast.success(result.message, { duration: 5000 });
        await refreshWallet();
        // Optimistically update item completion
        setRoute((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((it) =>
              it.id === item.id ? { ...it, is_completed: true, my_completed: true } : it
            ),
          };
        });

        if (result.all_stops_completed) {
          toast.info(
            '¡Has completado todas tus paradas! Ya puedes finalizar tu itinerario y reclamar el bono de 50 paquipuntos.',
            { duration: 6000 }
          );
        }
      } else if (result.already_completed) {
        toast.info(result.message);
        setRoute((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((it) =>
              it.id === item.id ? { ...it, is_completed: true, my_completed: true } : it
            ),
          };
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar la parada');
    } finally {
      setCompletingItemId(null);
    }
  };

  const handleFinishRoute = async () => {
    if (!route) return;
    setIsCompletingRoute(true);
    try {
      const result = await api.completeRoute(route.id);
      if (result.success) {
        toast.success(result.message, { duration: 6000 });
        setRoute((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
        await refreshWallet();
        queryClient.invalidateQueries({ queryKey: ['active-route'] });
      } else {
        toast.info(result.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al finalizar la ruta');
    } finally {
      setIsCompletingRoute(false);
    }
  };

  const handleFocusPlaceOnMap = (place: Place) => {
    setSelectedMarkerPlace(place);
    handleTabChange('map');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff9ef] flex flex-col justify-between">
        <div className="max-w-4xl mx-auto w-full px-4 py-20 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-heading font-bold text-neutral-800">
            Cargando itinerario grupal...
          </h2>
        </div>
        <FuiFooter />
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="min-h-screen bg-[#fff9ef] flex flex-col justify-between">
        <div className="max-w-md mx-auto w-full px-4 py-20 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-neutral-900">
            Itinerario no disponible o con error
          </h2>
          <p className="text-sm text-neutral-600">
            {error || 'No pudimos encontrar el itinerario grupal con el código proporcionado.'}
          </p>
          {wasUnlinked && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-semibold space-y-1 text-left">
              <p className="font-bold">✓ Participación liberada automáticamente</p>
              <p className="text-[11px] text-emerald-700 font-normal">
                Hemos desvinculado tu perfil de esta ruta para que puedas unirte a otro grupo o crear un nuevo itinerario sin bloqueos.
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/rutas/unirse"
              className="px-5 py-2.5 rounded-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs"
            >
              Unirse a otro grupo
            </Link>
            <Link
              to="/rutas/crear"
              className="px-5 py-2.5 rounded-full bg-[#e51422] hover:bg-[#cf101c] text-white font-bold text-xs shadow-xs"
            >
              Crear nuevo itinerario
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs"
            >
              Ir al Inicio
            </Link>
          </div>
        </div>
        <FuiFooter />
      </div>
    );
  }

  // Filter items based on user discarded preference in voting tab
  const visibleVotingItems = hideDiscarded
    ? route.items.filter((item) => item.my_attending !== false)
    : route.items;

  // User attendance and completion stats
  const attendingItems = route.items.filter((item) => item.my_attending !== false);
  const completedAttendingItems = attendingItems.filter((item) => item.is_completed);
  const allAttendingCompleted =
    attendingItems.length > 0 && completedAttendingItems.length === attendingItems.length;
  const isRouteCompleted = route.status === 'COMPLETED';

  // Default center for Google Maps
  const defaultCenter =
    route.items.length > 0
      ? {
          lat: Number(route.items[0].place.latitude),
          lng: Number(route.items[0].place.longitude),
        }
      : { lat: 11.9298, lng: -85.9538 };

  return (
    <div className="min-h-screen bg-[#fff9ef] text-neutral-900 font-sans selection:bg-[#ffc900] selection:text-neutral-900 flex flex-col justify-between">
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-6 flex-1">
        {/* Top Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-neutral-700 hover:text-neutral-900 px-4 py-2 rounded-full border-2 border-[#e5bdaa] bg-white hover:bg-neutral-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('nav.home', 'Inicio')}</span>
            </button>
            <PaquiNavBadge />
          </div>

          {/* Primary View Switcher Tabs: Map vs Voting */}
          <div className="flex items-center p-1 rounded-full bg-white border-2 border-purple-300 shadow-xs self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => handleTabChange('map')}
              className={cn(
                'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer',
                activeTab === 'map'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-purple-700 hover:bg-purple-50'
              )}
            >
              <MapIcon className="w-4 h-4" />
              <span>{t('groupRoute.mapTab', 'Mapa del Recorrido')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('voting')}
              className={cn(
                'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer',
                activeTab === 'voting'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-purple-700 hover:bg-purple-50'
              )}
            >
              <Users className="w-4 h-4" />
              <span>{t('groupRoute.votingTab', 'Sala & Votación')}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black">
                {route.items.length}
              </span>
            </button>
          </div>
        </div>

        {/* Group Header Card */}
        <div className="bg-white border-2 border-purple-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-purple-100 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {t('groupRoute.activeRouteIndicator', 'Ruta Activa')}: {t('activeBanner.group', 'Grupo')}{' '}
                  {route.invite_code || route.id}
                </span>
                {route.is_host && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-black text-[10px]">
                    Host 👑
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-heading text-neutral-900">
                {route.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
                <span className="flex items-center gap-1 font-bold text-neutral-800">
                  <MapPin className="w-3.5 h-3.5 text-[#e51422]" />
                  {route.department}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  {t('groupRoute.creator', 'Host')}:{' '}
                  <strong className="text-neutral-900">
                    {route.host?.display || route.host?.username || 'Viajero'}
                  </strong>
                </span>
                <span>•</span>
                <span>{route.participants_count} {t('groupRoute.participants', 'participantes')}</span>
                <span>•</span>
                <span className="font-bold text-emerald-700">
                  {completedAttendingItems.length} de {attendingItems.length} {t('groupRoute.stopsCompleted', 'paradas visitadas')}
                </span>
              </div>
            </div>

            {/* Invite Code Share Card */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 flex flex-col items-center text-center space-y-2 self-start md:self-auto min-w-[220px]">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
                {t('groupRoute.inviteCode', 'Código para compartir')}
              </span>
              <span className="font-mono text-2xl font-black text-purple-950 tracking-wider px-3 py-1 bg-white rounded-xl border border-purple-200 shadow-2xs select-all">
                {route.invite_code}
              </span>
              <div className="flex items-center gap-2 pt-1 w-full">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? t('groupRoute.copied', '¡Copiado!') : t('groupRoute.copyCode', 'Copiar')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copiar enlace directo"
                  className="p-1.5 rounded-xl bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Participants Badges Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                Miembros del Grupo ({route.participants.length})
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {route.participants.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold',
                      p.is_host
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-neutral-50 text-neutral-800 border-neutral-200'
                    )}
                  >
                    <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                      {p.user.profile_picture_url ? (
                        <img
                          src={p.user.profile_picture_url}
                          alt={p.user.display}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        p.user.display.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <span>{p.user.display}</span>
                    {p.is_host && <Crown className="w-3 h-3 text-amber-600" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Route Status / Complete Action */}
            <div className="self-end sm:self-auto">
              {isRouteCompleted ? (
                <div className="px-5 py-2 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-2 shadow-xs">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  <span>¡Ruta Finalizada! Bono de 50 paquipuntos reclamado</span>
                </div>
              ) : allAttendingCompleted ? (
                <button
                  type="button"
                  onClick={handleFinishRoute}
                  disabled={isCompletingRoute}
                  className="px-6 py-2.5 rounded-full bg-[#ffc900] hover:bg-[#ffd633] text-neutral-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer animate-bounce"
                >
                  <Trophy className="w-4 h-4" />
                  <span>
                    {isCompletingRoute ? 'Finalizando...' : '¡Finalizar Ruta (+50 paquipuntos)!'}
                  </span>
                </button>
              ) : (
                <div className="px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-purple-600" />
                  <span>
                    Ruta en curso ({completedAttendingItems.length}/{attendingItems.length} completadas)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TAB 1: INTERACTIVE GOOGLE MAP & STOPS TIMELINE */}
        {activeTab === 'map' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Timeline: List of Stops (5 cols) */}
              <div className="lg:col-span-5 bg-white border-2 border-purple-300 rounded-3xl p-5 space-y-4 max-h-[620px] overflow-y-auto shadow-sm">
                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                  <h3 className="text-base font-heading text-neutral-900 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-purple-700" />
                    <span>Paradas del Recorrido</span>
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-purple-900 border border-purple-200">
                    {completedAttendingItems.length} de {attendingItems.length} visitadas
                  </span>
                </div>

                <div className="space-y-3">
                  {route.items.map((item) => {
                    const place = item.place;
                    const isSelected = selectedMarkerPlace?.id === place.id;
                    const isPartner = place.has_membership;
                    const isNature = (place.category || '').toLowerCase().includes('naturaleza');
                    const isAttending = item.my_attending !== false;
                    const isCompleted = item.is_completed;
                    const isCompleting = completingItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedMarkerPlace(place)}
                        className={cn(
                          'p-4 rounded-2xl border-2 transition-all cursor-pointer',
                          isSelected
                            ? 'border-purple-600 bg-purple-50/50 shadow-md ring-1 ring-purple-600/30'
                            : isCompleted
                            ? 'border-emerald-200 bg-emerald-50/40'
                            : !isAttending
                            ? 'border-neutral-200 bg-neutral-50/80 opacity-70'
                            : 'border-[#e5bdaa] bg-[#fff9ef]/40 hover:bg-white'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-xs shadow-2xs',
                              isCompleted
                                ? 'bg-emerald-600 text-white'
                                : isPartner
                                ? 'bg-[#ffc900] text-neutral-950 font-black'
                                : isAttending
                                ? 'bg-purple-700 text-white'
                                : 'bg-neutral-300 text-neutral-700'
                            )}
                          >
                            {isCompleted ? '✓' : item.order}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4
                                className={cn(
                                  'text-sm font-bold truncate font-heading text-neutral-900',
                                  isCompleted && 'line-through opacity-70'
                                )}
                              >
                                {place.name}
                              </h4>
                              {isPartner && (
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#ffc900] text-neutral-950 border border-[#ffc900]">
                                  Partner (+20)
                                </span>
                              )}
                              {isNature && (
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  Naturaleza (+30)
                                </span>
                              )}
                              {!isAttending && (
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-700">
                                  Descartada
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                              {place.address || place.category}
                            </p>

                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-500">
                              <span className="flex items-center gap-1 font-semibold">
                                <Clock className="w-3 h-3" />
                                ~{place.estimated_duration_minutes} min
                              </span>
                              <span>•</span>
                              <span className="text-[#1457b8] font-bold">{place.category}</span>
                            </div>

                            {/* Complete Stop Button */}
                            <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between">
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Parada completada
                                </span>
                              ) : !isAttending ? (
                                <span className="text-[11px] text-neutral-400 italic">
                                  No asistes a esta parada
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompleteStop(item);
                                  }}
                                  disabled={isCompleting}
                                  className="px-3 py-1 rounded-full bg-[#ffc900] hover:bg-[#ffd633] text-neutral-950 font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                                >
                                  <img
                                    src="/paqui puntos-01.svg"
                                    alt="paquipuntos"
                                    className="size-3 object-contain shrink-0"
                                  />
                                  <span>
                                    {isCompleting ? 'Registrando...' : 'Marcar Visitada (+paquipuntos)'}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Google Map (7 cols) */}
              <div
                className="lg:col-span-7 h-[500px] sm:h-[620px] rounded-3xl overflow-hidden border-2 border-purple-300 shadow-xl relative bg-white"
                style={{ minHeight: '550px' }}
              >
                {googleMapsApiKey ? (
                  <APIProvider apiKey={googleMapsApiKey}>
                    <Map
                      defaultCenter={defaultCenter}
                      defaultZoom={13}
                      mapId="TAGUER_GROUP_MAP_ID"
                      style={{ width: '100%', height: '100%' }}
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                    >
                      {route.items.map((item) => {
                        const place = item.place;
                        const isCompleted = item.is_completed;
                        const isPartner = place.has_membership;
                        const isAttending = item.my_attending !== false;

                        return (
                          <AdvancedMarker
                            key={item.id}
                            position={{
                              lat: Number(place.latitude),
                              lng: Number(place.longitude),
                            }}
                            onClick={() => setSelectedMarkerPlace(place)}
                          >
                            <Pin
                              background={
                                isCompleted
                                  ? '#059669'
                                  : isPartner
                                  ? '#ffc900'
                                  : isAttending
                                  ? '#7e22ce'
                                  : '#9ca3af'
                              }
                              borderColor="#ffffff"
                              glyphColor={isPartner ? '#171717' : '#ffffff'}
                            >
                              <span className="font-bold text-xs">
                                {isCompleted ? '✓' : item.order}
                              </span>
                            </Pin>
                          </AdvancedMarker>
                        );
                      })}

                      {/* InfoWindow for Clicked Stop */}
                      {selectedMarkerPlace && (
                        <InfoWindow
                          position={{
                            lat: Number(selectedMarkerPlace.latitude),
                            lng: Number(selectedMarkerPlace.longitude),
                          }}
                          onCloseClick={() => setSelectedMarkerPlace(null)}
                        >
                          <div className="p-1.5 max-w-xs text-neutral-900 font-sans">
                            {selectedMarkerPlace.image_url && (
                              <img
                                src={selectedMarkerPlace.image_url}
                                alt={selectedMarkerPlace.name}
                                className="w-full h-24 object-cover rounded-xl mb-2 border border-neutral-200"
                              />
                            )}
                            <div className="flex items-center gap-1.5 mb-1">
                              <h4 className="font-bold text-sm text-neutral-900 font-heading">
                                {selectedMarkerPlace.name}
                              </h4>
                              {selectedMarkerPlace.has_membership && (
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#ffc900] text-neutral-950">
                                  Partner
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-600 line-clamp-2 mb-1.5">
                              {selectedMarkerPlace.description}
                            </p>
                            <p className="text-[11px] font-bold text-[#1457b8]">
                              📍 {selectedMarkerPlace.address || selectedMarkerPlace.category}
                            </p>

                            {/* Complete button in popup */}
                            {(() => {
                              const currItem = route.items.find(
                                (it) => it.place.id === selectedMarkerPlace.id
                              );
                              if (!currItem) return null;

                              if (currItem.is_completed) {
                                return (
                                  <div className="mt-2 pt-2 border-t border-neutral-200">
                                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                      ✓ Parada completada
                                    </span>
                                  </div>
                                );
                              }

                              if (currItem.my_attending === false) {
                                return (
                                  <div className="mt-2 pt-2 border-t border-neutral-200">
                                    <span className="text-[11px] text-neutral-400 italic">
                                      Descartada de tu recorrido
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <div className="mt-2 pt-2 border-t border-neutral-200">
                                  <button
                                    type="button"
                                    onClick={() => handleCompleteStop(currItem)}
                                    disabled={completingItemId === currItem.id}
                                    className="w-full py-1.5 rounded-full bg-[#ffc900] hover:bg-[#ffd633] text-neutral-950 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                  >
                                    <img
                                      src="/paqui puntos-01.svg"
                                      alt="paquipuntos"
                                      className="size-3.5 object-contain shrink-0"
                                    />
                                    <span>Completar parada (+paquipuntos)</span>
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </InfoWindow>
                      )}
                    </Map>
                  </APIProvider>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-neutral-500">
                    <MapPin className="w-10 h-10 text-purple-600 mb-2 animate-bounce" />
                    <p className="font-bold text-neutral-800">Clave de Google Maps no configurada</p>
                    <p className="text-xs mt-1">
                      Configura VITE_GOOGLE_MAPS_API_KEY en frontend/apps/client/.env
                    </p>
                  </div>
                )}

                {/* Map Overlay Badge */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border-2 border-purple-300 text-xs font-bold text-neutral-800 flex items-center gap-2 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                  <span>Ruta grupal en tiempo real</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GROUP ROOM & ATTENDANCE VOTING */}
        {activeTab === 'voting' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-heading text-neutral-900">
                  Paradas del Itinerario & Votación de Asistencia
                </h2>
                <p className="text-xs text-neutral-600">
                  Vota en qué puntos puedes acompañar al grupo. Rechazar una parada{' '}
                  <strong>no te saca del grupo</strong>, solo la descarta de tu recorrido personal.
                </p>
              </div>

              {/* Filter Toggle */}
              <button
                type="button"
                onClick={() => setHideDiscarded(!hideDiscarded)}
                className={cn(
                  'px-4 py-2 rounded-full border-2 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-2xs',
                  hideDiscarded
                    ? 'border-purple-600 bg-purple-50 text-purple-900'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                )}
              >
                {hideDiscarded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>
                  {hideDiscarded
                    ? `Mostrando solo mis paradas (${attendingItems.length})`
                    : `Mostrar todas (${route.items.length})`}
                </span>
              </button>
            </div>

            {/* Stops List */}
            <div className="space-y-4">
              {visibleVotingItems.map((item) => {
                const isAttending = item.my_attending !== false;
                const attendees = item.attending_users || [];
                const isVoting = votingItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-5 rounded-3xl border-2 transition-all bg-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6',
                      !isAttending
                        ? 'border-neutral-200 bg-neutral-50/70 opacity-75'
                        : 'border-[#e5bdaa] hover:border-purple-300'
                    )}
                  >
                    {/* Left: Place info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-2xl flex items-center justify-center font-heading font-black text-sm shrink-0 shadow-xs',
                          isAttending
                            ? 'bg-purple-700 text-white'
                            : 'bg-neutral-200 text-neutral-600'
                        )}
                      >
                        #{item.order}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-heading font-bold text-neutral-900">
                            {item.place.name}
                          </h3>
                          {item.place.has_membership && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e51422]/10 text-[#e51422] border border-[#e51422]/20">
                              Partner Taguer
                            </span>
                          )}
                          {!isAttending && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-700">
                              Descartada de tu recorrido
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
                          <span className="font-bold bg-neutral-100 px-2 py-0.5 rounded-md">
                            {item.place.category}
                          </span>
                          <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {item.place.rating}
                          </span>
                          <span className="flex items-center gap-1 text-neutral-500">
                            <Clock className="w-3.5 h-3.5" />
                            {item.place.estimated_duration_minutes} min
                          </span>
                          {item.place.address && (
                            <span className="text-neutral-500 truncate max-w-xs">
                              📍 {item.place.address}
                            </span>
                          )}
                        </div>

                        {item.ai_recommendation_reason && (
                          <p className="text-xs text-neutral-600 italic bg-[#fff9ef] p-2 rounded-xl border border-[#e5bdaa]">
                            💡 {item.ai_recommendation_reason}
                          </p>
                        )}

                        {/* Attendee avatars list */}
                        <div className="pt-2 flex items-center gap-2 text-xs text-neutral-600">
                          <span className="font-bold text-purple-900">
                            {attendees.length} acompañan:
                          </span>
                          {attendees.length > 0 ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              {attendees.map((att) => (
                                <span
                                  key={att.id}
                                  className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-medium"
                                >
                                  {att.display}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic">Nadie confirmado aún</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
                      {/* Map Focus Button */}
                      <button
                        type="button"
                        onClick={() => handleFocusPlaceOnMap(item.place)}
                        className="px-3.5 py-2 rounded-full border-2 border-purple-200 text-purple-800 hover:bg-purple-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <MapIcon className="w-3.5 h-3.5 text-purple-600" />
                        <span>Ver en el mapa</span>
                      </button>

                      {/* Vote Buttons */}
                      <button
                        type="button"
                        disabled={isVoting}
                        onClick={() => handleVote(item.id, true)}
                        className={cn(
                          'px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs',
                          isAttending
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30 shadow-xs'
                            : 'bg-white border-2 border-neutral-300 text-neutral-700 hover:border-emerald-500 hover:text-emerald-700'
                        )}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isAttending ? 'Acompaño ✓' : 'Acompañar'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isVoting}
                        onClick={() => handleVote(item.id, false)}
                        className={cn(
                          'px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs',
                          !isAttending
                            ? 'bg-neutral-800 text-white ring-2 ring-neutral-800/30 shadow-xs'
                            : 'bg-white border-2 border-neutral-300 text-neutral-700 hover:border-rose-400 hover:text-rose-600'
                        )}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{!isAttending ? 'Descartada' : 'No puedo ir'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <FuiFooter className="mt-12" />
    </div>
  );
};
