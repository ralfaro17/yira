import React from 'react';
import type { RecommendedPlace } from '../../types/route';
import {
  Check,
  Star,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ManualPlacesListProps {
  department: string;
  places: RecommendedPlace[];
  selectedPlaceIds: number[];
  onTogglePlace: (placeId: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isLoading: boolean;
}

export const ManualPlacesList: React.FC<ManualPlacesListProps> = ({
  department,
  places,
  selectedPlaceIds,
  onTogglePlace,
  onSelectAll,
  onDeselectAll,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white border-2 border-[#e5bdaa] rounded-3xl space-y-4">
        <div className="w-10 h-10 border-4 border-[#e51422] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-neutral-700">
          Cargando destinos en {department} ordenados por comercios asociados e intereses de tu perfil...
        </p>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="p-8 text-center bg-white border-2 border-[#e5bdaa] rounded-3xl space-y-2">
        <p className="text-sm text-neutral-600">
          No se encontraron destinos disponibles en {department} actualmente.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-[#e5bdaa] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[#1457b8] text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-[#ffc900]" />
            <span>Recomendación Inteligente de Sitios</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-heading text-neutral-900 mt-1">
            Selecciona los destinos de tu ruta
          </h3>
          <p className="text-neutral-600 text-sm mt-0.5 font-sans">
            El listado está ordenado con prioridad para <strong>Partners oficiales Taguer</strong> y afinidad con los <strong>intereses registrados en tu cuenta</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs font-bold px-3 py-1.5 rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
          >
            Seleccionar todos
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-xs font-bold px-3 py-1.5 rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
          >
            Limpiar selección
          </button>
        </div>
      </div>

      {/* Selected counter banner */}
      <div className="p-3.5 rounded-2xl bg-[#fff9ef] border border-[#e5bdaa] flex items-center justify-between text-xs font-bold text-neutral-800">
        <span>
          Lugares seleccionados: <strong className="text-[#e51422]">{selectedPlaceIds.length}</strong> de {places.length}
        </span>
        {selectedPlaceIds.length === 0 && (
          <span className="text-amber-700 font-medium">Selecciona al menos 1 destino para continuar</span>
        )}
      </div>

      {/* Places grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {places.map((place, index) => {
          const isSelected = selectedPlaceIds.includes(place.id);

          return (
            <div
              key={place.id}
              onClick={() => onTogglePlace(place.id)}
              className={cn(
                'group relative rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs',
                isSelected
                  ? 'border-[#e51422] bg-[#fff9ef] ring-2 ring-[#e51422]/20 shadow-md'
                  : 'border-[#e5bdaa] bg-white hover:border-[#e51422]/50 hover:shadow-xs'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Ranking order badge */}
                <div className="shrink-0 flex flex-col items-center">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                      place.is_partner_promoted
                        ? 'bg-[#e51422] text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                    )}
                  >
                    #{index + 1}
                  </div>
                  {place.is_partner_promoted && (
                    <Award className="w-4 h-4 text-[#e51422] mt-1" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-heading text-lg font-bold text-neutral-900 group-hover:text-[#e51422] transition-colors line-clamp-1">
                      {place.name}
                    </h4>

                    {/* Checkbox button */}
                    <div
                      className={cn(
                        'w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors',
                        isSelected
                          ? 'border-[#e51422] bg-[#e51422] text-white'
                          : 'border-neutral-300 bg-white'
                      )}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-600">
                    <span className="font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-full">
                      {place.category}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {place.rating}
                    </span>
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Clock className="w-3.5 h-3.5" />
                      {place.estimated_duration_minutes} min
                    </span>
                  </div>

                  {/* Badges for Taguer Partner or Matched Interests */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {place.is_partner_promoted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e51422]/10 text-[#e51422] border border-[#e51422]/30">
                        <Award className="w-3 h-3" />
                        Partner Taguer
                      </span>
                    )}

                    {place.matched_interests && place.matched_interests.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        Afinidad: {place.matched_interests.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Recommendation explanation */}
                  {place.recommendation_reason && (
                    <p className="mt-2 text-xs text-neutral-600 italic bg-neutral-50 p-2 rounded-xl border border-neutral-200">
                      💡 {place.recommendation_reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
