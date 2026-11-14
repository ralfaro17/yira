import React from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Compass, MapPin, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FuiFooter } from '../components/FuiFooter';
import { FuiButton } from '../components/FuiButton';
import { DestinationCard } from '../components/DestinationCard';
import { PlanCard } from '../components/PlanCard';
import { imageAssets, destinations, type Screen } from '../types';

interface HomeScreenProps {
  navigate?: (screen: Screen) => void;
}

const MINI_PLACES = [
  { name: '', url: imageAssets.miniGranada },
  { name: '', url: imageAssets.miniCornIsland },
  { name: '', url: imageAssets.miniMombacho },
  { name: '', url: imageAssets.miniVolcanMasaya },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigate }) => {
  const routerNavigate = useNavigate();
  const { t } = useTranslation();

  const activeRouteQuery = useQuery({
    queryKey: ['active-route'],
    queryFn: () => api.getActiveRoute(),
    refetchInterval: 15000,
  });
  const activeRoute = activeRouteQuery.data?.has_active_route ? activeRouteQuery.data.route : null;

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      {/* Hero Section */}
      <section
        className="min-h-[640px] h-[clamp(620px,75vh,880px)] bg-cover bg-center relative overflow-hidden bg-[#ee1b2b] flex items-center shadow-inner"
        style={{ backgroundImage: `url(${imageAssets.hero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(229,20,34,0.95)] via-[rgba(229,20,34,0.55)] via-44% to-transparent" />
        <div className="relative z-10 px-6 sm :px-14 lg:px-24 text-white max-w-4xl flex flex-col gap-22">
          <div>
            <p className="font-['Tropika'] relative top-5 lg:top-8 left-5 lg:left-10 text-5xl sm:text-[82px] leading-[0.75] m-0 drop-shadow-sm">
              {t('home.heroTag', 'Somos')}
            </p>
            <h1 className="font-heading text-6xl sm:text-[162px] leading-[0.88] my-3 sm:mb-5 tracking-tight drop-shadow-md">
              {t('home.heroBrand', 'Taguer')}
            </h1>
          </div>
          <p className="inline-block border-2 border-white rounded-full px-4 py-1.5 font-bold text-sm sm:text-base tracking-wide bg-white/10 backdrop-blur-xs">
            {t('home.heroTagline', 'Transformamos la forma de viajar')}
          </p>
        </div>
      </section>

      <main className="max-w-[1440px] mx-auto">
        {/* Active Route Ongoing Banner */}
        {activeRoute && (
          <div className="mx-6 sm:mx-8 my-5 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 border-2 border-purple-400/40 animate-fade-in">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 text-amber-300">
                <Compass className="w-7 h-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Ruta Activa: {activeRoute.is_group && activeRoute.invite_code ? `Grupo ${activeRoute.invite_code}` : 'En Curso'}
                  </span>
                  {activeRoute.is_group && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/80 text-white flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Colaborativo
                    </span>
                  )}
                  {activeRoute.is_host && (
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-300 text-neutral-900">
                      Host 👑
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-heading font-bold text-white">
                  {activeRoute.title} ({activeRoute.department})
                </h3>
                <p className="text-xs text-purple-200">
                  {activeRoute.items?.length || 0} paradas planificadas. Tu progreso sigue guardado.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
              <Link
                to={
                  activeRoute.is_group && activeRoute.invite_code
                    ? `/rutas/grupal/${activeRoute.invite_code}?tab=map`
                    : `/rutas/grupal/${activeRoute.id}?tab=map`
                }
                className="px-5 py-2.5 rounded-full bg-[#ffc900] hover:bg-[#ffd633] text-neutral-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
              >
                <MapPin className="w-4 h-4 text-neutral-950" />
                <span>Continuar en el Mapa</span>
              </Link>

              {activeRoute.is_group && activeRoute.invite_code && (
                <Link
                  to={`/rutas/grupal/${activeRoute.invite_code}?tab=voting`}
                  className="px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm border border-white/40 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Sala de Grupo</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Ribbon Notice */}
        <div className="bg-[#e51422] text-white rounded-lg mx-6 sm:mx-8 my-4 py-2.5 px-4 font-bold text-xs sm:text-sm text-center shadow-xs">
          {t('home.ribbon', 'Conoce Nicaragua con experiencias inigualables')}
        </div>

        {/* Destinations Strip */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 px-6 sm:px-14 pb-6">
          {MINI_PLACES.map(({ name, url }) => (
            <button
              key={url}
              type="button"
              onClick={() => routerNavigate('/rutas/crear')}
              className={`h-32 lg:h-64 w-auto bg-no-repeat bg-[url('${url}')] bg-cover bg-center rounded-lg text-white text-left p-3 flex flex-col justify-end  shadow-xs hover:-translate-y-0.5 transition-transform cursor-pointer border-0`}
            >
              <span className="font-heading text-lg sm:text-xl leading-tight drop-shadow-xs">{name}</span>
            </button>
          ))}
        </section>

        {/* Discover Nicaragua Section */}
        <section
          id="fui-about"
          className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 md:gap-12 items-center px-6 sm:px-14 py-6 sm:py-10"
        >
          <div className="w-full">
            <img
              src={imageAssets.map}
              alt={t('home.mapAlt', 'Mapa turístico de Nicaragua')}
              className="w-full h-auto max-h-[480px] object-contain border-4 sm:border-5 border-[#b8d1e8] rounded-xl shadow-sm bg-slate-50 block"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h2 className="font-heading text-[#2365b7] text-4xl sm:text-6xl lg:text-[66px] leading-[0.8] m-0 mb-3 whitespace-pre-line">
              {t('home.discoverTitle', 'Descubre Nicaragua')}
            </h2>
            <p className="text-base sm:text-lg border-2 sm:border-3 border-[#1e65b9] rounded-lg p-3 text-center text-[#1e65b9] font-medium mb-6 w-full max-w-md">
              {t('home.discoverDesc', 'Explora sus diferentes lugares turísticos con nuestro mapa interactivo')}
            </p>
            <FuiButton onClick={() => routerNavigate('/rutas/crear')}>
              {t('home.exploreBtn', 'Explorar')}
            </FuiButton>
          </div>
        </section>

        {/* Blue Band CTA */}
        <section className="min-h-[105px] px-6 sm:px-14 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-white bg-[#1258b4] bg-[url('/landing-page/mini-banner-azul.png')] bg-cover shadow-sm">
          <div className="text-center sm:text-left">
            <p className="font-['Tropika'] text-4xl sm:text-[48px] leading-tight m-0 ">
              {t('home.ctaLoginTitle', 'Inicia Sesión')}
            </p>
            <span className="block font-semibold text-sm sm:text-base opacity-95">
              {t('home.ctaLoginSubtitle', 'y conoce Nicaragua a otro nivel')}
            </span>
          </div>
          <FuiButton onClick={() => routerNavigate('/login')}>
            {t('nav.login', 'Inicia Sesión')}
          </FuiButton>
        </section>

        {/* Destinations Grid Section */}
        <section className="px-6 sm:px-14 py-10 sm:py-14 text-center">
          <div className="inline-block border-2 border-[#1457b8] rounded-lg text-[#1457b8] font-bold text-sm sm:text-base px-4 py-2 mb-8">
            {t('home.destinationsTitle', 'Nuestros destinos que no te podes perder')}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-9">
            {destinations.map(({ key, name, image, description }) => (
              <DestinationCard
                key={name}
                name={key ? t(`destinations.${key}.name`, name) : name}
                image={image}
                description={key ? t(`destinations.${key}.description`, description) : description}
              />
            ))}
          </div>
          <div className="mt-9 ">
            <FuiButton outline onClick={() => routerNavigate('/rutas/crear')}>
              {t('home.seeMorePlaces', 'Conocé más lugares')}
            </FuiButton>
          </div>
        </section>

        {/* Membership Banner CTA */}
        <section className="min-h-[105px] px-6 sm:px-14 py-5 flex flex-col sm:flex-row justify-center items-center gap-4 text-white bg-[#e51422] bg-cover shadow-sm bg-[url('/landing-page/mini-banner-rojo.png')] bg-cover">
          <div className="text-center sm:text-left justify-center">
            <p className="font-['Tropika'] text-4xl sm:text-[48px] leading-tight m-0">
              {t('home.elevateTitle', 'Eleva tu experiencia')}
            </p>
            <span className="block font-semibold text-sm sm:text-base opacity-95">
              {t('home.elevateSubtitle', 'Contrata una de nuestras membresías')}
            </span>
          </div>
        </section>

        {/* Plans Preview */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-7 px-6 sm:px-14 py-8 sm:py-12 pb-16">
          {['deacachimba', 'date-color', 'otro-mate'].map((plan, i) => (
            <PlanCard key={plan} plan={plan} index={i} />
          ))}
        </section>
        <FuiButton onClick={() => (navigate ? navigate('memberships') : routerNavigate('/memberships'))} className='mb-8'>
          {t('home.moreInfo', 'Más información')}
        </FuiButton>
      </main>

      <FuiFooter />
    </div>
  );
};
