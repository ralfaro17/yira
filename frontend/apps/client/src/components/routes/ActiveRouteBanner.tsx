import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import { Compass, MapPin, Users, X, ChevronRight } from 'lucide-react';

export const ActiveRouteBanner: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);

  const activeRouteQuery = useQuery({
    queryKey: ['active-route'],
    queryFn: () => api.getActiveRoute(),
    refetchInterval: 10000,
  });

  const activeRoute = activeRouteQuery.data?.has_active_route ? activeRouteQuery.data.route : null;

  // Don't render banner if there is no active route or if user dismissed it
  if (!activeRoute || isDismissed) {
    return null;
  }

  // Don't render banner if user is currently inside this route's group page or map page
  const currentPath = location.pathname;
  if (
    currentPath.startsWith(`/rutas/grupal/${activeRoute.invite_code}`) ||
    currentPath.startsWith(`/rutas/grupal/${activeRoute.id}`) ||
    currentPath.startsWith(`/rutas/mapa/${activeRoute.invite_code}`) ||
    currentPath.startsWith(`/rutas/mapa/${activeRoute.id}`)
  ) {
    return null;
  }

  const targetMapUrl = activeRoute.is_group && activeRoute.invite_code
    ? `/rutas/grupal/${activeRoute.invite_code}?tab=map`
    : `/rutas/grupal/${activeRoute.id}?tab=map`;

  const targetVotingUrl = activeRoute.is_group && activeRoute.invite_code
    ? `/rutas/grupal/${activeRoute.invite_code}?tab=voting`
    : `/rutas/grupal/${activeRoute.id}?tab=voting`;

  const completedCount = activeRoute.items?.filter((it) => it.is_completed).length || 0;
  const totalCount = activeRoute.items?.length || 0;

  return (
    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white border-b-2 border-purple-400/40 shadow-lg px-4 py-2.5 sm:py-3 sticky top-16 z-30 transition-all animate-fade-in">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-8 rounded-xl bg-purple-500/30 border border-purple-300/40 flex items-center justify-center shrink-0 text-amber-300">
            <Compass className="size-4 animate-spin" />
          </div>

          <div className="flex items-center gap-2 flex-wrap min-w-0 text-xs sm:text-sm">
            <span className="font-extrabold text-amber-300 tracking-wide flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              {t('activeBanner.activeRoute', 'Ruta Activa')}:{' '}
              {activeRoute.is_group && activeRoute.invite_code
                ? `${t('activeBanner.group', 'Grupo')} ${activeRoute.invite_code}`
                : t('activeBanner.inProgress', 'En Curso')}
            </span>
            <span className="text-white/60 hidden sm:inline">•</span>
            <span className="font-bold truncate text-white">
              &ldquo;{activeRoute.title}&rdquo;
            </span>
            {activeRoute.is_host && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-neutral-950 shrink-0">
                Host 👑
              </span>
            )}
            <span className="text-purple-200 text-xs hidden md:inline">
              ({completedCount}/{totalCount} {t('activeBanner.stopsCompleted', 'paradas completadas')} en {activeRoute.department})
            </span>
          </div>
        </div>

        {/* Right action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
          <Link
            to={targetMapUrl}
            className="px-3.5 py-1.5 rounded-full bg-[#ffc900] hover:bg-[#ffd633] text-neutral-950 font-bold text-xs shadow-sm transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer"
          >
            <MapPin className="size-3.5 text-neutral-950" />
            <span>{t('activeBanner.continueMap', 'Continuar en Mapa')}</span>
            <ChevronRight className="size-3" />
          </Link>

          {activeRoute.is_group && activeRoute.invite_code && (
            <Link
              to={targetVotingUrl}
              className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/30 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="size-3.5" />
              <span>{t('activeBanner.groupRoom', 'Sala de Grupo')}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            title={t('activeBanner.dismiss', 'Ocultar aviso temporalmente')}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
