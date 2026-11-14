import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import type {
  Department,
  Interest,
  Place,
  RecommendedPlace,
  RouteGenerationResult,
  SavedRoute,
  AIStatusResponse,
} from '../../types/route';
import { Step1DepartmentSelection } from '../../components/routes/Step1DepartmentSelection';
import { Step2AISuggestions } from '../../components/routes/Step2AISuggestions';
import { Step3RouteMap } from '../../components/routes/Step3RouteMap';
import { PaquiNavBadge } from '../../components/gamification/PaquiNavBadge';
import { Sparkles, MapPin, Layers, CheckCircle, Users, AlertCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { FuiFooter } from '../../figma-ui/components/FuiFooter';
import { useAuthSessionQuery } from '@/features/auth/hooks/use-auth-queries';

export const CreateRouteWizard: React.FC = () => {
  const { i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage || i18n.language || 'es').startsWith('en');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionQuery = useAuthSessionQuery();
  const isAuthenticated = sessionQuery.data?.meta?.is_authenticated === true;

  useEffect(() => {
    if (sessionQuery.isSuccess && !isAuthenticated) {
      navigate('/login?next=/rutas/crear', { replace: true });
    }
  }, [sessionQuery.isSuccess, isAuthenticated, navigate]);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai');
  const [isGroupRoute, setIsGroupRoute] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // User AI & Membership state
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);

  // Data state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Granada');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Gastronomía',
    'Cultura e Historia',
  ]);

  // Manual places state
  const [manualPlaces, setManualPlaces] = useState<RecommendedPlace[]>([]);
  const [selectedManualPlaceIds, setSelectedManualPlaceIds] = useState<number[]>([]);
  const [isLoadingManualPlaces, setIsLoadingManualPlaces] = useState<boolean>(false);

  // AI Generation state
  const [generationResult, setGenerationResult] = useState<RouteGenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Places selection state (used in Step 2 / Step 3)
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<number[]>([]);

  // Route saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [savedRoute, setSavedRoute] = useState<SavedRoute | null>(null);
  const [existingActiveRoute, setExistingActiveRoute] = useState<SavedRoute | null>(null);

  // Load initial departments, interests, and AI status
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [deptsData, interestsData, aiStatusData, activeRouteResp] = await Promise.all([
          api.getDepartments(),
          api.getInterests(),
          api.getAIStatus().catch(() => null),
          api.getActiveRoute().catch(() => null),
        ]);
        if (active) {
          setDepartments(deptsData);
          setInterests(interestsData);
          if (activeRouteResp?.has_active_route && activeRouteResp.route) {
            setExistingActiveRoute(activeRouteResp.route);
          }
          if (aiStatusData) {
            setAiStatus(aiStatusData);
            // If user cannot use AI (free trial spent), default to manual mode
            if (!aiStatusData.can_use_ai) {
              setCreationMode('manual');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load initial wizard data:', err);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  // Fetch recommended places for manual mode whenever department changes
  useEffect(() => {
    let active = true;

    async function loadRecommendedPlaces() {
      setIsLoadingManualPlaces(true);
      try {
        const places = await api.getRecommendedPlaces(selectedDepartment);
        if (active) {
          setManualPlaces(places);
          // By default, select all places (up to top 5)
          const defaultSelected = places.slice(0, 5).map((p) => p.id);
          setSelectedManualPlaceIds(defaultSelected);
        }
      } catch (err) {
        console.error('Error loading manual recommended places:', err);
      } finally {
        if (active) setIsLoadingManualPlaces(false);
      }
    }

    loadRecommendedPlaces();
    return () => {
      active = false;
    };
  }, [selectedDepartment]);

  const handleToggleInterest = (interestName: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestName)
        ? prev.filter((i) => i !== interestName)
        : [...prev, interestName]
    );
  };

  const handleToggleManualPlace = (placeId: number) => {
    setSelectedManualPlaceIds((prev) =>
      prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId]
    );
  };

  const handleSelectAllManualPlaces = () => {
    setSelectedManualPlaceIds(manualPlaces.map((p) => p.id));
  };

  const handleDeselectAllManualPlaces = () => {
    setSelectedManualPlaceIds([]);
  };

  // Proceed from Step 1 to Step 2
  const handleProceedToStep2 = async () => {
    if (creationMode === 'ai') {
      // AI Mode: call DeepSeek
      setCurrentStep(2);
      setIsGenerating(true);
      setGenerationError(null);

      try {
        const result = await api.generateRoute(selectedDepartment, selectedInterests);
        setGenerationResult(result);
        const allIds = (result.places || []).map((p: Place) => p.id);
        setSelectedPlaceIds(allIds);
      } catch (err: any) {
        setGenerationError(err.message || 'Error al comunicarse con la IA de DeepSeek');
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Manual Mode: Build route result from selected manual places
      const pickedPlaces = manualPlaces.filter((p) => selectedManualPlaceIds.includes(p.id));
      if (pickedPlaces.length === 0) return;

      const totalDuration = pickedPlaces.reduce(
        (acc, p) => acc + (p.estimated_duration_minutes || 60),
        0
      );

      const manualResult: RouteGenerationResult = {
        title: `Ruta en ${selectedDepartment}`,
        summary: `Itinerario personalizado con ${pickedPlaces.length} destinos destacados seleccionados en ${selectedDepartment}.`,
        estimated_total_hours: Math.round((totalDuration / 60) * 10) / 10 || 3.5,
        places: pickedPlaces.map((p, idx) => ({
          ...p,
          order: idx + 1,
          ai_recommendation_reason:
            p.recommendation_reason || 'Parada seleccionada para tu recorrido.',
        })),
      };

      setGenerationResult(manualResult);
      setSelectedPlaceIds(pickedPlaces.map((p) => p.id));
      setCurrentStep(2);
    }
  };

  const handleTogglePlace = (placeId: number) => {
    setSelectedPlaceIds((prev) =>
      prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId]
    );
  };

  const handleProceedToStep3 = () => {
    if (selectedPlaceIds.length === 0) return;
    setCurrentStep(3);
  };

  // Filter selected places in their suggested order
  const orderedSelectedPlaces = (generationResult?.places || []).filter((p) =>
    selectedPlaceIds.includes(p.id)
  );

  // Save and start route
  const handleStartRoute = async () => {
    if (!generationResult) return;
    setIsSaving(true);

    try {
      const payload = {
        title: generationResult.title,
        department: selectedDepartment,
        selected_interests: creationMode === 'ai' ? selectedInterests : [],
        is_group: isGroupRoute,
        is_ai_generated: creationMode === 'ai',
        items: orderedSelectedPlaces.map((place, index) => ({
          place_id: place.id,
          order: index + 1,
          ai_recommendation_reason: place.ai_recommendation_reason || '',
        })),
      };

      const routeData = await api.saveRoute(payload);
      setSavedRoute(routeData);
      queryClient.invalidateQueries({ queryKey: ['active-route'] });

      if (isGroupRoute) {
        setSaveSuccessMessage(
          isEn
            ? `Group itinerary created successfully! Invite code: ${routeData.invite_code}`
            : `¡Itinerario grupal creado exitosamente! Código de invitación: ${routeData.invite_code}`
        );
      } else {
        setSaveSuccessMessage(
          isEn
            ? 'Your route has started successfully! Enjoy exploring and earning paquipuntos.'
            : '¡Tu ruta ha comenzado exitosamente! Disfruta explorando y ganando paquipuntos.'
        );
      }
    } catch (err: any) {
      console.error('Error saving route:', err);
      toast.error(err.message || (isEn ? 'Could not start route.' : 'No se pudo iniciar la ruta.'));
      setSaveErrorMessage(err.message || (isEn ? 'Could not start route.' : 'No se pudo iniciar la ruta.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelExistingActiveRoute = async () => {
    if (!existingActiveRoute) return;
    if (
      !window.confirm(
        isEn
          ? `Are you sure you want to cancel or leave your active route "${existingActiveRoute.title}"?`
          : `¿Estás seguro de que deseas cancelar o abandonar tu ruta activa "${existingActiveRoute.title}"?`
      )
    ) {
      return;
    }
    setIsCancelling(true);
    try {
      try {
        const resp = await api.cancelRoute(existingActiveRoute.id);
        toast.success(resp.message || (isEn ? 'Route canceled successfully.' : 'Ruta cancelada exitosamente.'));
      } catch {
        const cleanResp = await api.cleanupActiveRoute({ route_id: existingActiveRoute.id });
        toast.success(cleanResp.message || (isEn ? 'Route unlinked successfully.' : 'Ruta liberada exitosamente.'));
      }
      setExistingActiveRoute(null);
      queryClient.invalidateQueries({ queryKey: ['active-route'] });
    } catch (err: any) {
      toast.error(err.message || (isEn ? 'Error canceling active route.' : 'Error al cancelar la ruta activa.'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(
        isEn
          ? 'Do you want to cancel route creation and return to the main page?'
          : '¿Deseas cancelar la creación de la ruta y regresar a la página principal?'
      )
    ) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#fff9ef] text-neutral-900 font-sans selection:bg-[#ffc900] selection:text-neutral-900 flex flex-col justify-between">
      {/* Main Wizard Container */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-8 flex-1">
        {/* Contextual Sub-Header with Stepper */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={handleCancel}
              className="text-xs font-bold text-neutral-700 hover:text-[#e51422] px-4 py-2 rounded-full border-2 border-[#e5bdaa] bg-white hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs"
            >
              {isEn ? 'Exit to Home' : 'Salir al Inicio'}
            </button>
            <PaquiNavBadge />
          </div>

          {/* Stepper Pill */}
          <div className="flex items-center gap-3 bg-white border-2 border-[#e5bdaa] px-5 py-2 rounded-full text-xs font-bold text-neutral-700 shadow-sm">
            <span
              className={`flex items-center gap-1.5 ${
                currentStep >= 1 ? 'text-[#e51422]' : 'text-neutral-400'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              {isEn ? '1. Destination & Mode' : '1. Destino & Modalidad'}
            </span>
            <span className="text-neutral-300">&rarr;</span>
            <span
              className={`flex items-center gap-1.5 ${
                currentStep >= 2 ? 'text-[#e51422]' : 'text-neutral-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c98224]" />
              {isEn ? '2. Stops' : '2. Paradas'}
            </span>
            <span className="text-neutral-300">&rarr;</span>
            <span
              className={`flex items-center gap-1.5 ${
                currentStep >= 3 ? 'text-[#e51422]' : 'text-neutral-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {isEn ? '3. Map' : '3. Mapa'}
            </span>
          </div>
        </div>

        {saveSuccessMessage && (
          <div className="p-5 rounded-3xl bg-white border-2 border-emerald-400 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <span className="text-sm font-bold block">{saveSuccessMessage}</span>
                {savedRoute?.is_group && savedRoute.invite_code && (
                  <span className="text-xs text-emerald-700">
                    {isEn
                      ? 'Other travelers can join using this code in the routes section.'
                      : 'Los demás viajeros pueden unirse usando este código en la sección de rutas.'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {savedRoute?.is_group && savedRoute.invite_code && (
                <Link
                  to={`/rutas/grupal/${savedRoute.invite_code}`}
                  className="px-5 py-2 rounded-full bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  <span>{isEn ? 'Go to Group Room' : 'Ir a Sala de Grupo'}</span>
                </Link>
              )}
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2 rounded-full bg-[#e51422] text-white font-bold text-xs hover:bg-[#cf101c] transition-colors shadow-sm cursor-pointer"
              >
                {isEn ? 'Go to Home' : 'Ir al Inicio'}
              </button>
            </div>
          </div>
        )}

        {/* Error message if saving failed */}
        {saveErrorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-center gap-3 animate-fade-in">
            <AlertCircle className="size-5 text-rose-600 shrink-0" />
            <p className="text-xs font-bold">{saveErrorMessage}</p>
          </div>
        )}

        {/* Existing Active Route Blocking Card */}
        {existingActiveRoute && !savedRoute ? (
          <div className="p-6 sm:p-8 rounded-3xl bg-amber-50 border-2 border-amber-400 text-amber-950 space-y-5 shadow-sm animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl bg-amber-200/90 flex items-center justify-center shrink-0 text-amber-800 shadow-2xs">
                <AlertTriangle className="size-6 text-amber-700" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-neutral-950">
                    Ruta Activa en Curso
                  </span>
                  {existingActiveRoute.is_group && existingActiveRoute.invite_code && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-200 text-purple-900 border border-purple-300">
                      Grupo {existingActiveRoute.invite_code}
                    </span>
                  )}
                  {existingActiveRoute.is_host && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-300 text-neutral-900">
                      Host 👑
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-neutral-900">
                  Ya eres parte de la ruta &ldquo;{existingActiveRoute.title}&rdquo;
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  No puedes crear un nuevo itinerario mientras tengas una ruta activa en curso. Para comenzar una nueva, debes completar o cancelar tu recorrido actual primero.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-amber-200">
              <Link
                to={
                  existingActiveRoute.is_group && existingActiveRoute.invite_code
                    ? `/rutas/grupal/${existingActiveRoute.invite_code}?tab=map`
                    : `/rutas/grupal/${existingActiveRoute.id}?tab=map`
                }
                className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="size-3.5" />
                <span>Continuar en el Mapa</span>
              </Link>

              {existingActiveRoute.is_group && existingActiveRoute.invite_code && (
                <Link
                  to={`/rutas/grupal/${existingActiveRoute.invite_code}?tab=voting`}
                  className="px-4 py-2.5 rounded-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="size-3.5" />
                  <span>Sala de Grupo</span>
                </Link>
              )}

              <button
                type="button"
                onClick={handleCancelExistingActiveRoute}
                disabled={isCancelling}
                className="px-4 py-2.5 rounded-full bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 ml-auto"
              >
                {isCancelling ? 'Cancelando...' : '🚫 Cancelar Ruta Actual'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1 */}
            {currentStep === 1 && (
              <Step1DepartmentSelection
                departments={departments}
                interests={interests}
                selectedDepartment={selectedDepartment}
                onSelectDepartment={setSelectedDepartment}
                creationMode={creationMode}
                onChangeCreationMode={setCreationMode}
                aiStatus={aiStatus}
                selectedInterests={selectedInterests}
                onToggleInterest={handleToggleInterest}
                manualPlaces={manualPlaces}
                selectedManualPlaceIds={selectedManualPlaceIds}
                onToggleManualPlace={handleToggleManualPlace}
                onSelectAllManualPlaces={handleSelectAllManualPlaces}
                onDeselectAllManualPlaces={handleDeselectAllManualPlaces}
                isLoadingManualPlaces={isLoadingManualPlaces}
                isGroupRoute={isGroupRoute}
                onToggleGroupRoute={setIsGroupRoute}
                onNext={handleProceedToStep2}
                onBack={() => navigate('/')}
                isLoading={isGenerating}
              />
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <Step2AISuggestions
                generationResult={generationResult}
                isLoading={isGenerating}
                error={generationError}
                selectedPlaceIds={selectedPlaceIds}
                onTogglePlace={handleTogglePlace}
                onSelectAll={() =>
                  setSelectedPlaceIds((generationResult?.places || []).map((p) => p.id))
                }
                onDeselectAll={() => setSelectedPlaceIds([])}
                onNext={handleProceedToStep3}
                onBack={() => setCurrentStep(1)}
                onRetry={handleProceedToStep2}
              />
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <Step3RouteMap
                routeTitle={generationResult?.title || `Ruta en ${selectedDepartment}`}
                department={selectedDepartment}
                selectedPlaces={orderedSelectedPlaces}
                onBack={() => setCurrentStep(2)}
                onCancel={handleCancel}
                onStartRoute={handleStartRoute}
                isSaving={isSaving}
                savedRoute={savedRoute}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <FuiFooter className="mt-12" />
    </div>
  );
};
