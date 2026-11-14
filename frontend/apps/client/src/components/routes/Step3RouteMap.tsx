import React, { useState } from 'react';
import { Link } from 'react-router';
import type { Place, SavedRoute } from '../../types/route';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  X,
  Compass,
  ArrowLeft,
  Trophy,
  Sparkles,
  Users,
} from 'lucide-react';
import { api } from '../../services/api';
import { usePaqui } from '../../context/PaquiContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Step3Props {
  routeTitle: string;
  department: string;
  selectedPlaces: Place[];
  onBack: () => void;
  onCancel: () => void;
  onStartRoute: () => void;
  isSaving?: boolean;
  savedRoute?: SavedRoute | null;
}

export const Step3RouteMap: React.FC<Step3Props> = ({
  routeTitle,
  department,
  selectedPlaces,
  onBack,
  onCancel,
  onStartRoute,
  isSaving = false,
  savedRoute,
}) => {
  const { refreshWallet } = usePaqui();

  const [selectedMarkerPlace, setSelectedMarkerPlace] = useState<Place | null>(
    selectedPlaces[0] || null
  );
  const [routeStarted, setRouteStarted] = useState<boolean>(Boolean(savedRoute));
  const [completedPlaceIds, setCompletedPlaceIds] = useState<Set<number>>(() => {
    if (savedRoute?.items) {
      return new Set(
        savedRoute.items.filter((it) => it.is_completed).map((it) => it.place.id)
      );
    }
    return new Set();
  });
  const [completingPlaceId, setCompletingPlaceId] = useState<number | null>(null);
  const [isCompletingRoute, setIsCompletingRoute] = useState<boolean>(false);
  const [routeFinished, setRouteFinished] = useState<boolean>(
    savedRoute?.status === 'COMPLETED'
  );

  // Default center Granada, Nicaragua
  const defaultCenter = selectedPlaces.length > 0
    ? { lat: Number(selectedPlaces[0].latitude), lng: Number(selectedPlaces[0].longitude) }
    : { lat: 11.9298, lng: -85.9538 };

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const handleStart = () => {
    setRouteStarted(true);
    onStartRoute();
  };

  const handleCompleteStop = async (e: React.MouseEvent, place: Place) => {
    e.stopPropagation();
    if (!savedRoute) {
      toast.info('Inicia la ruta primero para registrar tus visitas.');
      return;
    }

    const item = (savedRoute.items || []).find((it) => it.place.id === place.id);
    if (!item) {
      toast.error('No se encontró la parada en la ruta activa.');
      return;
    }

    setCompletingPlaceId(place.id);
    try {
      const result = await api.completeRouteItem(savedRoute.id, item.id);
      if (result.success) {
        toast.success(result.message, { duration: 5000 });
        setCompletedPlaceIds((prev) => new Set([...prev, place.id]));
        await refreshWallet();
        if (result.all_stops_completed) {
          toast.info('¡Has completado todas las paradas! Ya puedes finalizar tu ruta y reclamar el bono de 50 paquipuntos.', {
            duration: 6000,
          });
        }
      } else if (result.already_completed) {
        toast.info(result.message);
        setCompletedPlaceIds((prev) => new Set([...prev, place.id]));
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar la parada');
    } finally {
      setCompletingPlaceId(null);
    }
  };

  const handleFinishRoute = async () => {
    if (!savedRoute) return;
    setIsCompletingRoute(true);
    try {
      const result = await api.completeRoute(savedRoute.id);
      if (result.success) {
        toast.success(result.message, { duration: 6000 });
        setRouteFinished(true);
        await refreshWallet();
      } else {
        toast.info(result.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al finalizar la ruta');
    } finally {
      setIsCompletingRoute(false);
    }
  };

  const allStopsCompleted =
    selectedPlaces.length > 0 &&
    selectedPlaces.every((p) => completedPlaceIds.has(p.id));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Route Info & Header */}
      <div className="bg-white border-2 border-[#e5bdaa] rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#1457b8] uppercase tracking-wider mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Paso 3 de 3: Mapa de Recorrido en {department}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading text-neutral-900 mt-1">
            {routeTitle}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5 font-sans">
            {selectedPlaces.length} paradas planificadas. Completa paradas para ganar{' '}
            <span className="text-[#c98224] font-bold">paquipuntos</span>.
          </p>
        </div>

        {/* Action buttons header */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full border-2 border-neutral-300 text-neutral-700 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <X className="w-4 h-4" />
            <span>Salir</span>
          </button>

          {!routeStarted && !savedRoute ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-full bg-[#e51422] hover:bg-[#cf101c] text-white font-bold text-xs sm:text-sm shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Navigation className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Empezar ruta'}</span>
            </button>
          ) : routeFinished ? (
            <div className="px-5 py-2 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-2 shadow-xs">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <span>¡Ruta Finalizada! Bono de 50 paquipuntos reclamado</span>
            </div>
          ) : allStopsCompleted ? (
            <button
              type="button"
              onClick={handleFinishRoute}
              disabled={isCompletingRoute}
              className="px-6 py-2.5 rounded-full bg-[#ffc900] hover:bg-[#ffd633] text-neutral-950 font-black text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer animate-bounce"
            >
              <Trophy className="w-4 h-4" />
              <span>
                {isCompletingRoute ? 'Finalizando...' : '¡Finalizar Ruta (+50 paquipuntos)!'}
              </span>
            </button>
          ) : (
            <div className="px-5 py-2 rounded-full bg-[#fff9ef] border-2 border-[#e5bdaa] text-neutral-800 font-bold text-xs flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Ruta Activa ({completedPlaceIds.size}/{selectedPlaces.length} paradas)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Group Route Banner */}
      {savedRoute?.is_group && savedRoute.invite_code && (
        <div className="p-5 rounded-3xl bg-purple-50 border-2 border-purple-300 text-purple-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-base text-purple-900">
                  ¡Itinerario Grupal Activo!
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-200 text-purple-900">
                  Host
                </span>
              </div>
              <p className="text-xs text-purple-700 mt-0.5">
                Código para compartir:{' '}
                <strong className="font-mono text-sm bg-white px-2.5 py-0.5 rounded-lg border border-purple-200 select-all">
                  {savedRoute.invite_code}
                </strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(savedRoute.invite_code || '');
                toast.success(`Código ${savedRoute.invite_code} copiado al portapapeles`);
              }}
              className="px-4 py-2 rounded-full bg-white border border-purple-300 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Copiar Código
            </button>
            <Link
              to={`/rutas/grupal/${savedRoute.invite_code}`}
              className="px-4 py-2 rounded-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Ver Sala de Grupo & Votación &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid: Left Itinerary Timeline + Right Google Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Stops Timeline (4 cols) */}
        <div className="lg:col-span-4 bg-white border-2 border-[#e5bdaa] rounded-3xl p-5 space-y-4 max-h-[600px] overflow-y-auto shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f5cfb9] pb-3">
            <h3 className="text-base font-heading text-neutral-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#e51422]" />
              <span>Itinerario de Paradas</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#fff9ef] text-neutral-700 border border-[#e5bdaa]">
              {completedPlaceIds.size} de {selectedPlaces.length} visitadas
            </span>
          </div>

          <div className="space-y-3">
            {selectedPlaces.map((place, index) => {
              const orderNum = index + 1;
              const isSelected = selectedMarkerPlace?.id === place.id;
              const isPartner = place.has_membership;
              const isNature = (place.category || '').toLowerCase().includes('naturaleza');
              const isCompleted = completedPlaceIds.has(place.id);
              const isCompleting = completingPlaceId === place.id;

              return (
                <div
                  key={place.id}
                  onClick={() => setSelectedMarkerPlace(place)}
                  className={cn(
                    'p-4 rounded-2xl border-2 transition-all cursor-pointer',
                    isSelected
                      ? 'border-[#e51422] bg-[#fff9ef] shadow-md ring-1 ring-[#e51422]/20'
                      : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/50'
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
                          : 'bg-[#e51422] text-white'
                      )}
                    >
                      {isCompleted ? '✓' : orderNum}
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
                      </div>

                      <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5 font-sans">
                        {place.address || place.category}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-500 font-sans">
                        <span className="flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3" />
                          ~{place.estimated_duration_minutes} min
                        </span>
                        <span>•</span>
                        <span className="text-[#1457b8] font-bold">{place.category}</span>
                      </div>

                      {/* Paqui Reward Completion Button */}
                      {(savedRoute || routeStarted) && (
                        <div className="mt-2.5 pt-2 border-t border-[#f5cfb9] flex items-center justify-between">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Parada completada
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleCompleteStop(e, place)}
                              disabled={isCompleting || !savedRoute}
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
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Google Map (8 cols) */}
        <div
          className="lg:col-span-8 h-[500px] sm:h-[600px] rounded-3xl overflow-hidden border-2 border-[#e5bdaa] shadow-xl relative bg-white"
          style={{ minHeight: '550px' }}
        >
          {googleMapsApiKey ? (
            <APIProvider apiKey={googleMapsApiKey}>
              <Map
                defaultCenter={defaultCenter}
                defaultZoom={13}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_git_agentskills_v1']}
                style={{ width: '100%', height: '100%' }}
                gestureHandling="greedy"
                disableDefaultUI={false}
              >
                {selectedPlaces.map((place, index) => {
                  const orderNum = index + 1;
                  const isCompleted = completedPlaceIds.has(place.id);
                  const isPartner = place.has_membership;

                  return (
                    <AdvancedMarker
                      key={place.id}
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
                            : '#e51422'
                        }
                        borderColor="#ffffff"
                        glyphColor={isPartner ? '#171717' : '#ffffff'}
                      >
                        <span className="font-bold text-xs">
                          {isCompleted ? '✓' : orderNum}
                        </span>
                      </Pin>
                    </AdvancedMarker>
                  );
                })}

                {/* InfoWindow for clicked Place */}
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
                          className="w-full h-24 object-cover rounded-xl mb-2 border border-[#e5bdaa]"
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
                      <p className="text-xs text-neutral-600 line-clamp-2 mb-1.5 font-sans">
                        {selectedMarkerPlace.description}
                      </p>
                      <p className="text-[11px] font-bold text-[#1457b8]">
                        📍 {selectedMarkerPlace.address}
                      </p>

                      {/* InfoWindow complete button */}
                      {(savedRoute || routeStarted) && (
                        <div className="mt-2 pt-2 border-t border-neutral-200">
                          {completedPlaceIds.has(selectedMarkerPlace.id) ? (
                            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                              ✓ Parada completada
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleCompleteStop(e, selectedMarkerPlace)}
                              disabled={completingPlaceId === selectedMarkerPlace.id || !savedRoute}
                              className="w-full py-1.5 rounded-full bg-[#ffc900] hover:bg-[#ffd633] text-neutral-950 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                            >
                              <img
                                src="/paqui puntos-01.svg"
                                alt="paquipuntos"
                                className="size-3.5 object-contain shrink-0"
                              />
                              <span>Completar parada (+paquipuntos)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-neutral-500">
              <MapPin className="w-10 h-10 text-[#e51422] mb-2 animate-bounce" />
              <p className="font-bold text-neutral-800">Clave de Google Maps no configurada</p>
              <p className="text-xs mt-1">
                Configura VITE_GOOGLE_MAPS_API_KEY en tu archivo frontend/apps/client/.env
              </p>
            </div>
          )}

          {/* Map Overlay Badge */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border-2 border-[#e5bdaa] text-xs font-bold text-neutral-800 flex items-center gap-2 shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#e51422] animate-ping" />
            <span>Ruta mapeada en tiempo real</span>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#f5cfb9]">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 rounded-full border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Modificar selección de lugares</span>
        </button>

        {!routeStarted && !savedRoute ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={isSaving}
            className="px-7 py-3 rounded-full bg-[#e51422] hover:bg-[#cf101c] text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Navigation className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Empezar ruta'}</span>
          </button>
        ) : allStopsCompleted && !routeFinished ? (
          <button
            type="button"
            onClick={handleFinishRoute}
            disabled={isCompletingRoute}
            className="px-7 py-3 rounded-full bg-[#ffc900] hover:bg-[#ffd633] text-neutral-950 font-black text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>{isCompletingRoute ? 'Reclamando...' : '¡Finalizar Ruta y Reclamar 50 paquipuntos!'}</span>
          </button>
        ) : (
          <div className="text-xs text-neutral-600 flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-[#c98224]" />
            <span>Visita cada parada para acumular paquipuntos antes de completar tu ruta.</span>
          </div>
        )}
      </div>
    </div>
  );
};
