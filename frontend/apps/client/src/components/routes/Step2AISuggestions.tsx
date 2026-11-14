import React, { useState, useEffect } from 'react';
import type { Place, RouteGenerationResult } from '../../types/route';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Star,
  Clock,
  MapPin,
  Award,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step2Props {
  generationResult: RouteGenerationResult | null;
  isLoading: boolean;
  error: string | null;
  selectedPlaceIds: number[];
  onTogglePlace: (placeId: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onNext: () => void;
  onBack: () => void;
  onRetry: () => void;
}

const WAITING_MESSAGES = [
  'Iniciando modelo DeepSeek AI para turismo en Nicaragua...',
  'Filtrando atractivos turísticos en Granada según tus intereses...',
  'Identificando y priorizando comercios locales con membresía Taguer...',
  'Optimizando la ruta para minimizar tiempos de traslado...',
  'Finalizando itinerario personalizado para ti...',
];

export const Step2AISuggestions: React.FC<Step2Props> = ({
  generationResult,
  isLoading,
  error,
  selectedPlaceIds,
  onTogglePlace,
  onNext,
  onBack,
  onRetry,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate messages during waiting state
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % WAITING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Loading State / Página de Espera
  if (isLoading) {
    return (
      <div className="min-h-[480px] flex flex-col items-center justify-center text-center p-8 bg-white border-2 border-[#e5bdaa] rounded-3xl space-y-8 shadow-xl animate-fade-in">
        <div className="relative">
          {/* Animated Glow Rings */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#e51422] via-[#ffc900] to-[#1457b8] animate-spin blur-lg opacity-60" />
          <div className="absolute inset-0 w-24 h-24 rounded-full bg-white border-2 border-[#e51422] flex items-center justify-center shadow-2xl">
            <Sparkles className="w-10 h-10 text-[#e51422] animate-pulse" />
          </div>
        </div>

        <div className="space-y-3 max-w-md">
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#fff9ef] text-[#e51422] border border-[#e5bdaa] tracking-wide uppercase">
            IA Generativa en progreso
          </span>
          <h3 className="text-3xl font-heading text-neutral-900">
            Diseñando tu ruta inteligente
          </h3>
          <p className="text-sm text-neutral-600 font-sans transition-opacity duration-300 min-h-[40px]">
            {WAITING_MESSAGES[messageIndex]}
          </p>
        </div>

        {/* Progress indicator bar */}
        <div className="w-64 h-2 bg-neutral-100 border border-[#e5bdaa] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#e51422] to-[#ffc900] rounded-full animate-pulse w-3/4 transition-all duration-500" />
        </div>

        <div className="text-xs text-neutral-500 flex items-center gap-2 font-medium">
          <Compass className="w-4 h-4 text-[#1457b8]" />
          <span>Potenciado por la API de DeepSeek & Red de Socios Taguer</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-8 bg-white border-2 border-rose-300 rounded-3xl text-center space-y-4 shadow-md">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-2xl font-heading text-neutral-900">No se pudo generar la ruta</h3>
        <p className="text-sm text-rose-700 max-w-md mx-auto">{error}</p>
        <div className="flex justify-center gap-4 pt-2">
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-full border-2 border-neutral-300 text-sm font-bold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Regresar
          </button>
          <button
            onClick={onRetry}
            className="px-6 py-2.5 rounded-full bg-[#e51422] hover:bg-[#cf101c] text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  if (!generationResult) {
    return null;
  }

  const places = generationResult.places || [];
  const selectedCount = selectedPlaceIds.length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Route Header Banner */}
      <div className="bg-white border-2 border-[#e5bdaa] rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#e51422]/10 text-[#e51422] border border-[#e51422]/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#e51422]" />
              Sugerencia de DeepSeek AI
            </span>
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#fff9ef] text-neutral-800 border border-[#e5bdaa] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              Est. {generationResult.estimated_total_hours} hrs
            </span>
          </div>

          <span className="text-xs font-bold text-neutral-800 bg-[#ffc900]/25 px-3.5 py-1 rounded-full border border-[#ffc900]">
            {selectedCount} de {places.length} paradas seleccionadas
          </span>
        </div>

        <div>
          <h2 className="text-3xl sm:text-4xl font-heading text-neutral-900 tracking-tight">
            {generationResult.title}
          </h2>
          <p className="text-neutral-600 text-sm sm:text-base mt-2 leading-relaxed max-w-3xl font-sans">
            {generationResult.summary}
          </p>
        </div>
      </div>

      {/* Places Selection List */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-heading text-neutral-900 flex items-center gap-2">
            <span>Sitios y Negocios Sugeridos</span>
            <span className="text-xs font-normal text-neutral-500 font-sans">
              (Marca o desmarca para ajustar tu itinerario)
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {places.map((place: Place) => {
            const isSelected = selectedPlaceIds.includes(place.id);
            const isPartner = place.has_membership;

            return (
              <div
                key={place.id}
                onClick={() => onTogglePlace(place.id)}
                className={cn(
                  'relative rounded-3xl border-2 transition-all duration-200 cursor-pointer overflow-hidden p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between shadow-sm',
                  isSelected
                    ? isPartner
                      ? 'border-[#e51422] bg-white shadow-md ring-1 ring-[#e51422]/20'
                      : 'border-[#1457b8] bg-white shadow-md'
                    : 'border-[#e5bdaa] bg-white/70 opacity-65 hover:opacity-100'
                )}
              >
                {/* Left: Order number & thumbnail */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {/* Checkbox badge */}
                  <div
                    className={cn(
                      'w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 transition-colors shadow-2xs',
                      isSelected
                        ? 'border-[#e51422] bg-[#e51422] text-white font-bold'
                        : 'border-[#e5bdaa] bg-[#fff9ef] text-transparent'
                    )}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>

                  {/* Thumbnail Image */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-neutral-100 border border-[#e5bdaa]">
                    {place.image_url ? (
                      <img
                        src={place.image_url}
                        alt={place.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <MapPin className="w-8 h-8" />
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-neutral-950/80 backdrop-blur-xs text-white text-[10px] font-bold flex items-center justify-center">
                      {place.order || 1}
                    </span>
                  </div>

                  {/* Place Header Info for Mobile */}
                  <div className="sm:hidden flex-1">
                    <h4 className="text-base font-bold font-heading text-neutral-900 leading-tight">
                      {place.name}
                    </h4>
                    <span className="text-xs text-neutral-500 font-sans">{place.category}</span>
                  </div>
                </div>

                {/* Center: Details & AI Reason */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xl font-heading text-neutral-900 hidden sm:inline">
                      {place.name}
                    </h4>

                    {/* Taguer Membership Badge */}
                    {isPartner && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#ffc900] text-neutral-950 border border-[#ffc900] flex items-center gap-1 shadow-xs">
                        <Award className="w-3.5 h-3.5" />
                        Partner Taguer
                      </span>
                    )}

                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#fff9ef] text-neutral-700 border border-[#e5bdaa] font-semibold">
                      {place.category}
                    </span>

                    <span className="text-xs text-[#c98224] flex items-center gap-1 font-bold">
                      <Star className="w-3.5 h-3.5 fill-[#ffc900] text-[#ffc900]" />
                      {place.rating}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2 font-sans leading-relaxed">
                    {place.description}
                  </p>

                  {/* AI Recommendation Reason */}
                  {place.ai_recommendation_reason && (
                    <div className="p-3.5 rounded-2xl bg-[#fff9ef] border border-[#e5bdaa] text-xs text-neutral-800 flex items-start gap-2.5 font-sans leading-relaxed">
                      <Sparkles className="w-4 h-4 text-[#c98224] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[#1457b8] mr-1">
                          Por qué visitarlo:
                        </span>
                        <span>{place.ai_recommendation_reason}</span>
                      </div>
                    </div>
                  )}

                  {place.address && (
                    <div className="text-[11px] text-neutral-500 flex items-center gap-1 font-sans">
                      <MapPin className="w-3 h-3 text-[#e51422] shrink-0" />
                      <span>{place.address}</span>
                    </div>
                  )}
                </div>

                {/* Right: Duration badge */}
                <div className="shrink-0 text-right self-end sm:self-center">
                  <span className="text-xs font-bold text-neutral-600 flex items-center gap-1 bg-[#fff9ef] border border-[#e5bdaa] px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    ~{place.estimated_duration_minutes} min
                  </span>
                </div>
              </div>
            );
          })}
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
          <span>Cambiar Departamento/Intereses</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={selectedCount === 0}
          className="px-7 py-3 rounded-full bg-[#e51422] hover:bg-[#cf101c] text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
        >
          <span>Siguiente: Ver Mapa de Ruta ({selectedCount})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
