import React from 'react';
import { useNavigate } from 'react-router';
import {
  Sparkles,
  MapPin,
  ArrowRight,
  Compass,
  Navigation,
} from 'lucide-react';
import { FuiButton } from '../figma-ui/components/FuiButton';
import { FuiFooter } from '../figma-ui/components/FuiFooter';
import { imageAssets } from '../figma-ui/types';
import { useTranslation } from 'react-i18next';
import { useAuthSessionQuery } from '@/features/auth/hooks/use-auth-queries';

const MINI_PLACES = [
  { name: 'Granada', gradient: 'from-[#c98224] to-[#f5c329]' },
  { name: 'Corn Island', gradient: 'from-[#1478a3] to-[#0c4d8e]' },
  { name: 'Mombacho', gradient: 'from-[#247d43] to-[#0b4d29]' },
  { name: 'Volcán Masaya', gradient: 'from-[#9f2d58] to-[#40205b]' },
];

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sessionQuery = useAuthSessionQuery();
  const isAuthenticated = sessionQuery.data?.meta?.is_authenticated === true;

  return (
    <div className="min-h-screen bg-[#fff9ef] text-neutral-900 font-sans flex flex-col justify-between selection:bg-[#ffc900] selection:text-neutral-900">
      {/* Hero Section */}
      <section
        className="min-h-[580px] h-[clamp(560px,70vh,800px)] bg-cover bg-center relative overflow-hidden bg-[#ee1b2b] flex items-center shadow-inner"
        style={{ backgroundImage: `url(${imageAssets.hero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(229,20,34,0.96)] via-[rgba(229,20,34,0.65)] via-48% to-transparent" />
        <div className="relative z-10 px-6 sm:px-14 lg:px-24 text-white max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-white/20 backdrop-blur-xs border border-white/40 shadow-xs">
            <Sparkles className="w-4 h-4 text-[#ffc900]" />
            <span>Rutas Turísticas impulsadas por IA</span>
          </div>

          <div>
            <p className="font-['Tropika_Script','Tropika',cursive] text-5xl sm:text-[72px] leading-[0.8] m-0 drop-shadow-sm">
              {t('home.heroTag', 'Somos')}
            </p>
            <h1 className="font-heading text-6xl sm:text-[100px] leading-[0.85] my-2 tracking-tight drop-shadow-md">
              {t('home.heroBrand', 'Taguer')}
            </h1>
          </div>

          <p className="text-base sm:text-xl text-white/95 max-w-2xl leading-relaxed font-medium">
            Descubre Nicaragua a tu propio ritmo. Conectamos a viajeros con sitios turísticos emblemáticos y negocios locales destacados con itinerarios inteligentes.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {isAuthenticated ? (
              <FuiButton
                onClick={() => navigate('/rutas/crear')}
                className="bg-white text-[#e51422] hover:bg-neutral-100 hover:text-[#c90f1b] shadow-xl text-base sm:text-lg min-h-12 px-8 group"
              >
                <Navigation className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                <span>{t('nav.createRoute', 'Crear Ruta')}</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </FuiButton>
            ) : null}

            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 rounded-full min-h-12 px-6 py-2.5 font-bold text-base sm:text-lg border-2 border-white/90 text-white hover:bg-white/15 transition-all text-center"
            >
              <span>Ver cómo funciona</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-10 sm:py-16 space-y-16">
        {/* Ribbon Notice */}
        <div className="bg-[#e51422] text-white rounded-xl py-3 px-6 font-bold text-sm sm:text-base text-center shadow-md flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-[#ffc900]" />
          <span>Conoce Nicaragua con experiencias inigualables e itinerarios a tu medida</span>
        </div>

        {/* Quick Destinations Strip */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl sm:text-3xl text-neutral-800">
              Destinos Populares
            </h3>
            <span className="text-xs sm:text-sm font-semibold text-neutral-500">
              Elige un punto de partida
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {MINI_PLACES.map(({ name, gradient }) => (
              <button
                key={name}
                type="button"
                onClick={() => navigate('/rutas/crear')}
                className={`h-24 rounded-2xl text-white text-left p-4 flex flex-col justify-end bg-gradient-to-br ${gradient} shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer border-0`}
              >
                <span className="font-heading text-xl sm:text-2xl leading-tight drop-shadow-xs">
                  {name}
                </span>
                <small className="text-xs opacity-95 font-medium flex items-center gap-1 mt-1">
                  Crear itinerario &rarr;
                </small>
              </button>
            ))}
          </div>
        </section>

        {/* Feature Cards / Workflow Preview */}
        <section id="como-funciona" className="scroll-mt-24 space-y-8 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-block border-2 border-[#1457b8] rounded-full text-[#1457b8] font-bold text-xs sm:text-sm px-4 py-1.5 uppercase tracking-wider">
              ¿Cómo funciona?
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl text-neutral-900 leading-tight">
              Diseña tu aventura en 3 simples pasos
            </h2>
            <p className="text-sm sm:text-base text-neutral-600">
              Nuestra tecnología une inteligencia artificial con los mejores comercios locales afiliados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-white border-2 border-[#e5bdaa] space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#ffc900]/20 border border-[#ffc900] flex items-center justify-center text-[#c98224] shadow-xs">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 font-heading">
                1. Elige tu destino e intereses
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed font-sans">
                Comienza en Granada conociendo la arquitectura colonial, islas o el volcán. Escoge tus preferencias como gastronomía, naturaleza o cultura.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border-2 border-[#e5bdaa] space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#e51422]/15 border border-[#e51422]/30 flex items-center justify-center text-[#e51422] shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 font-heading">
                2. Sugerencias con IA DeepSeek
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed font-sans">
                Nuestro motor de IA analiza los atractivos y prioriza los negocios locales con membresía Taguer, estructurando un itinerario cronológico óptimo.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border-2 border-[#e5bdaa] space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#1457b8]/15 border border-[#1457b8]/30 flex items-center justify-center text-[#1457b8] shadow-xs">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 font-heading">
                3. Mapa interactivo y navegación
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed font-sans">
                Visualiza en Google Maps cada punto secuenciado con tiempos estimados. ¡Inicia tu recorrido y vive una experiencia inolvidable!
              </p>
            </div>
          </div>
        </section>

        {/* Highlight Banner: Granada v1 */}
        <section className="relative rounded-3xl overflow-hidden border-2 border-[#e5bdaa] shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1200&auto=format&fit=crop&q=80"
            alt="Granada colonial"
            className="w-full h-80 sm:h-96 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/75 to-transparent" />
          <div className="absolute bottom-8 left-6 right-6 sm:left-10 sm:right-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#ffc900] text-neutral-950">
                Destino Destacado
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white font-heading">
                Granada, Nicaragua
              </h2>
              <p className="text-sm sm:text-base text-neutral-200 leading-relaxed font-sans">
                Cuna de historia, la Gran Sultana ofrece más de 10 puntos clave con restaurantes emblemáticos, talleres artesanales y paseos en lancha.
              </p>
            </div>
            <FuiButton
              onClick={() => navigate('/rutas/crear')}
              className="bg-[#e51422] text-white hover:bg-[#cf101c] shrink-0 text-base"
            >
              Explorar Granada Ahora
            </FuiButton>
          </div>
        </section>
      </main>

      {/* Taguer Red Footer */}
      <FuiFooter className="mt-16" />
    </div>
  );
};
