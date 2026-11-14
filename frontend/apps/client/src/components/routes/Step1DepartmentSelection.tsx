import React from 'react';
import { Link } from 'react-router';
import type { Department, Interest, RecommendedPlace, AIStatusResponse } from '../../types/route';
import {
  Check,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Lock,
  MapPin,
  Users,
  User,
  Crown,
  AlertTriangle,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import { ManualPlacesList } from './ManualPlacesList';
import { cn } from '@/lib/utils';

interface Step1Props {
  departments: Department[];
  interests: Interest[];
  selectedDepartment: string;
  onSelectDepartment: (deptName: string) => void;
  creationMode: 'ai' | 'manual';
  onChangeCreationMode: (mode: 'ai' | 'manual') => void;
  aiStatus: AIStatusResponse | null;
  selectedInterests: string[];
  onToggleInterest: (interestName: string) => void;
  manualPlaces: RecommendedPlace[];
  selectedManualPlaceIds: number[];
  onToggleManualPlace: (placeId: number) => void;
  onSelectAllManualPlaces: () => void;
  onDeselectAllManualPlaces: () => void;
  isLoadingManualPlaces: boolean;
  isGroupRoute: boolean;
  onToggleGroupRoute: (isGroup: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const Step1DepartmentSelection: React.FC<Step1Props> = ({
  departments,
  interests,
  selectedDepartment,
  onSelectDepartment,
  creationMode,
  onChangeCreationMode,
  aiStatus,
  selectedInterests,
  onToggleInterest,
  manualPlaces,
  selectedManualPlaceIds,
  onToggleManualPlace,
  onSelectAllManualPlaces,
  onDeselectAllManualPlaces,
  isLoadingManualPlaces,
  isGroupRoute,
  onToggleGroupRoute,
  onNext,
  onBack,
  isLoading = false,
}) => {
  const isPremium = aiStatus?.is_premium ?? false;
  const canUseAI = aiStatus?.can_use_ai ?? true;
  const canHostGroup = aiStatus?.can_host_group ?? false;

  const handleSelectGroup = (enableGroup: boolean) => {
    if (enableGroup && !canHostGroup) {
      onToggleGroupRoute(false);
      return;
    }
    onToggleGroupRoute(enableGroup);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Section: Select Department */}
      <div>
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-[#1457b8] text-xs font-bold uppercase tracking-wider mb-2">
            <MapPin className="w-4 h-4" />
            <span>Paso 1 de 3: Destino y Configuración de Ruta</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading text-neutral-900 mt-1">
            ¿Qué departamento deseas explorar?
          </h2>
          <p className="text-neutral-600 text-sm sm:text-base mt-1 font-sans">
            Para esta primera versión, la experiencia de rutas inteligentes está activa en Granada. ¡Pronto más destinos!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const isSelected = selectedDepartment.toLowerCase() === dept.name.toLowerCase();
            const isAvailable = dept.is_available;

            return (
              <div
                key={dept.id}
                onClick={() => {
                  if (isAvailable) {
                    onSelectDepartment(dept.name);
                  }
                }}
                className={cn(
                  'relative rounded-3xl overflow-hidden border-2 transition-all duration-200 flex flex-col justify-between shadow-sm',
                  !isAvailable
                    ? 'opacity-60 bg-neutral-100 border-[#e5bdaa] cursor-not-allowed'
                    : isSelected
                    ? 'border-[#e51422] ring-2 ring-[#e51422]/20 bg-white shadow-xl cursor-pointer'
                    : 'border-[#e5bdaa] bg-white hover:border-[#e51422]/60 hover:shadow-md cursor-pointer'
                )}
              >
                {/* Image & Header */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={dept.image_url || '/ciudades/granada.png'}
                    alt={dept.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/ciudades/granada.png';
                    }}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      isAvailable ? 'hover:scale-105' : 'grayscale'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

                  {/* Availability Badge */}
                  <div className="absolute top-3.5 right-3.5">
                    {isAvailable ? (
                      <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#e51422] text-white shadow-md flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Disponible
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-900/80 text-neutral-300 border border-neutral-700 flex items-center gap-1 backdrop-blur-xs">
                        <Lock className="w-3 h-3" />
                        Próximamente
                      </span>
                    )}
                  </div>

                  {/* Selection Radio Dot */}
                  {isAvailable && (
                    <div className="absolute top-3.5 left-3.5">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                          isSelected
                            ? 'border-white bg-[#e51422] text-white shadow-sm'
                            : 'border-white/70 bg-black/40'
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  )}

                  {/* Bottom title in image */}
                  <div className="absolute bottom-3.5 left-4 right-4">
                    <h3 className="text-2xl font-heading text-white drop-shadow-sm">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-[#ffc900] font-bold drop-shadow-xs">
                      {dept.tagline}
                    </p>
                  </div>
                </div>

                {/* Description & Tags */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans">
                    {dept.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dept.highlight_tags.map((tag, i) => (
                      <span
                        key={i}
                        className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
                          tag === 'Próximamente'
                            ? 'bg-neutral-100 text-neutral-500 border border-neutral-300'
                            : 'bg-[#fff9ef] text-neutral-800 border border-[#e5bdaa]'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section: Mode Selector & Itinerary Type */}
      <div className="bg-white border-2 border-[#e5bdaa] rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[#1457b8] text-xs font-bold uppercase tracking-wider mb-1">
            <SlidersHorizontal className="w-4 h-4 text-[#1457b8]" />
            <span>Modalidad de Planificación</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-heading text-neutral-900 mt-1">
            ¿Cómo deseas armar tu recorrido?
          </h3>
          <p className="text-neutral-600 text-sm mt-0.5 font-sans">
            Elige entre la asistencia de nuestra IA de DeepSeek o la selección manual con recomendaciones inteligentes.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option A: Generación con IA */}
          <div
            onClick={() => onChangeCreationMode('ai')}
            className={cn(
              'p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between shadow-xs',
              creationMode === 'ai'
                ? 'border-[#e51422] bg-[#fff9ef] ring-2 ring-[#e51422]/20'
                : 'border-[#e5bdaa] bg-white hover:border-[#e51422]/50'
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#e51422]/10 border border-[#e51422]/20 flex items-center justify-center text-[#e51422]">
                    <Sparkles className="w-5 h-5 text-[#e51422]" />
                  </div>
                  <div>
                    <h4 className="font-heading text-lg font-bold text-neutral-900">
                      Modo Inteligente con IA
                    </h4>
                    <span className="text-xs text-neutral-500 font-medium">
                      Potenciado por DeepSeek AI
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    creationMode === 'ai'
                      ? 'border-[#e51422] bg-[#e51422] text-white'
                      : 'border-neutral-300'
                  )}
                >
                  {creationMode === 'ai' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed font-sans mb-3">
                La IA diseña un itinerario completo optimizado para ti según tus gustos, tiempo de recorrido y negocios destacados.
              </p>
            </div>

            {/* AI Status Badge */}
            <div className="pt-2 border-t border-[#e5bdaa]/60">
              {isPremium ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  Membresía Viajero Activa (IA Ilimitada)
                </span>
              ) : canUseAI ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  1 prueba gratuita disponible
                </span>
              ) : (
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Prueba gratuita agotada (1/1 usada)
                  </span>
                  <p className="text-[11px] text-neutral-600">
                    Para usar la IA sin límites, activa la{' '}
                    <Link
                      to="/billing/pricing"
                      className="text-[#e51422] font-bold underline hover:text-[#cf101c]"
                    >
                      Membresía Viajero ($5/mes)
                    </Link>{' '}
                    o utiliza el <strong>Modo Manual</strong> gratuito.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Option B: Selección Manual con Recomendaciones */}
          <div
            onClick={() => onChangeCreationMode('manual')}
            className={cn(
              'p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between shadow-xs',
              creationMode === 'manual'
                ? 'border-[#e51422] bg-[#fff9ef] ring-2 ring-[#e51422]/20'
                : 'border-[#e5bdaa] bg-white hover:border-[#e51422]/50'
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#1457b8]/10 border border-[#1457b8]/20 flex items-center justify-center text-[#1457b8]">
                    <Compass className="w-5 h-5 text-[#1457b8]" />
                  </div>
                  <div>
                    <h4 className="font-heading text-lg font-bold text-neutral-900">
                      Modo Manual Recomendado
                    </h4>
                    <span className="text-xs text-neutral-500 font-medium">
                      Gratuito e ilimitado para todos
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    creationMode === 'manual'
                      ? 'border-[#e51422] bg-[#e51422] text-white'
                      : 'border-neutral-300'
                  )}
                >
                  {creationMode === 'manual' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed font-sans mb-3">
                Escoge libremente entre todos los destinos disponibles. El orden se optimiza con prioridad a comercios asociados y afinidad con tu perfil.
              </p>
            </div>

            <div className="pt-2 border-t border-[#e5bdaa]/60">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                <Check className="w-3.5 h-3.5 text-blue-600" />
                Siempre disponible (Cuentas Gratis y Premium)
              </span>
            </div>
          </div>
        </div>

        {/* Section: Individual vs Group Itinerary */}
        <div className="pt-6 border-t border-[#e5bdaa]">
          <div className="mb-4">
            <h4 className="text-xl font-heading text-neutral-900">
              Tipo de Itinerario
            </h4>
            <p className="text-xs text-neutral-600 font-sans">
              Decide si viajarás solo o crearás una experiencia compartida donde tus amigos puedan votar qué paradas acompañar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Individual */}
            <div
              onClick={() => onToggleGroupRoute(false)}
              className={cn(
                'p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between',
                !isGroupRoute
                  ? 'border-[#e51422] bg-[#fff9ef] ring-2 ring-[#e51422]/20'
                  : 'border-[#e5bdaa] bg-white hover:border-[#e51422]/50'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-heading font-bold text-sm text-neutral-900">
                    Ruta Individual
                  </h5>
                  <p className="text-[11px] text-neutral-500">
                    Solo para ti y tus puntos ganados
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  !isGroupRoute ? 'border-[#e51422] bg-[#e51422] text-white' : 'border-neutral-300'
                )}
              >
                {!isGroupRoute && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            {/* Group */}
            <div
              onClick={() => handleSelectGroup(true)}
              className={cn(
                'p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between relative',
                isGroupRoute
                  ? 'border-[#e51422] bg-[#fff9ef] ring-2 ring-[#e51422]/20'
                  : 'border-[#e5bdaa] bg-white hover:border-[#e51422]/50',
                !canHostGroup && 'opacity-90'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h5 className="font-heading font-bold text-sm text-neutral-900">
                      Itinerario Grupal
                    </h5>
                    {!canHostGroup && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5 text-amber-600" />
                        Host Premium
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Genera código TAG-XXXX y votación de paradas
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                  isGroupRoute ? 'border-[#e51422] bg-[#e51422] text-white' : 'border-neutral-300'
                )}
              >
                {isGroupRoute && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* Notice if free user tries to host group */}
          {!canHostGroup && isGroupRoute && (
            <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
              <Crown className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  Ser el host de un itinerario grupal requiere la Membresía Viajero ($5/mes).
                </p>
                <p className="text-amber-800">
                  Las cuentas gratuitas pueden unirse a itinerarios existentes creados por hosts Premium. Para hostear tus propios grupos,{' '}
                  <Link
                    to="/billing/pricing"
                    className="font-bold underline text-[#e51422] hover:text-[#cf101c]"
                  >
                    suscríbete aquí
                  </Link>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conditionally Render Step 1 Content Based on Creation Mode */}
      {creationMode === 'ai' ? (
        /* Interests selection for AI mode */
        <div className="bg-white border-2 border-[#e5bdaa] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[#1457b8] text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-[#ffc900]" />
              <span>Personaliza con Inteligencia Artificial</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-heading text-neutral-900 mt-1">
              Selecciona tus intereses para la IA
            </h3>
            <p className="text-neutral-600 text-sm mt-0.5 font-sans">
              DeepSeek AI analizará los sitios emblemáticos y los comercios locales de Taguer para construir una ruta a tu medida.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {interests.map((interest) => {
              const isSelected = selectedInterests.includes(interest.name);
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => onToggleInterest(interest.name)}
                  className={cn(
                    'p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-2xs',
                    isSelected
                      ? 'border-[#1457b8] bg-[#1457b8]/10 text-[#1457b8] ring-2 ring-[#1457b8]/20 shadow-sm'
                      : 'border-[#e5bdaa] bg-[#fff9ef] hover:bg-white text-neutral-800'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold',
                        isSelected
                          ? 'bg-[#1457b8] text-white shadow-xs'
                          : 'bg-white text-neutral-700 border border-[#e5bdaa]'
                      )}
                    >
                      {interest.name.slice(0, 2).toUpperCase()}
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#1457b8] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold block leading-snug">
                    {interest.name}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedInterests.length === 0 && (
            <div className="p-3 rounded-xl bg-[#fff9ef] border border-[#e5bdaa] text-xs text-neutral-700 flex items-center gap-2 font-medium">
              <span className="text-base">💡</span>
              <span>Si no seleccionas ningún interés específico, la IA sugerirá un recorrido balanceado con gastronomía, cultura e historia colonial.</span>
            </div>
          )}
        </div>
      ) : (
        /* Manual Places List (No interest prompt - ranked by partners, DB user interests, rating) */
        <ManualPlacesList
          department={selectedDepartment}
          places={manualPlaces}
          selectedPlaceIds={selectedManualPlaceIds}
          onTogglePlace={onToggleManualPlace}
          onSelectAll={onSelectAllManualPlaces}
          onDeselectAll={onDeselectAllManualPlaces}
          isLoading={isLoadingManualPlaces}
        />
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#f5cfb9]">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 rounded-full border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar</span>
        </button>

        {creationMode === 'ai' ? (
          <button
            type="button"
            onClick={onNext}
            disabled={isLoading || (!isPremium && !canUseAI)}
            className="px-7 py-3 rounded-full bg-[#e51422] hover:bg-[#cf101c] text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>
              {!isPremium && !canUseAI ? 'Prueba IA Agotada' : 'Siguiente: Generar con IA'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={selectedManualPlaceIds.length === 0}
            className="px-7 py-3 rounded-full bg-[#e51422] hover:bg-[#cf101c] text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>
              Siguiente: Ver Mapa ({selectedManualPlaceIds.length} paradas)
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
