import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'
import {
  Menu,
  Home,
  UserPlus,
  ArrowRight,
  LogIn,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Edit3,
  Compass,
  Crown,
  CreditCard,
  Users,
} from 'lucide-react'
import {
  useAuthSessionQuery,
  useLogoutMutation,
  useCurrentUserProfileQuery,
} from '@/features/auth/hooks/use-auth-queries'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { PaquiNavBadge } from '@/components/gamification/PaquiNavBadge'

const PaquiPointsNavIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src="/paqui puntos-03.svg"
    alt="Paquipuntos"
    className={cn('size-4 object-contain shrink-0', className)}
  />
)

interface NavRoute {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  end?: boolean
  matchPrefixes?: string[]
  requiresAuth?: boolean
}

export function Navbar() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const sessionQuery = useAuthSessionQuery()
  const logoutMutation = useLogoutMutation()

  const navRoutes: NavRoute[] = [
    {
      title: t('nav.home', 'Inicio'),
      href: '/',
      icon: Home,
      description: t('nav.homeDesc', 'Página principal de Taguer'),
      end: true,
    },
    {
      title: t('nav.createRoute', 'Crear Ruta'),
      href: '/rutas/crear',
      icon: Compass,
      description: t('nav.createRouteDesc', 'Generador de rutas IA o manuales'),
      matchPrefixes: ['/rutas/crear'],
      requiresAuth: true,
    },
    {
      title: t('nav.joinGroup', 'Unirse a Grupo'),
      href: '/rutas/unirse',
      icon: Users,
      description: t('nav.joinGroupDesc', 'Únete a un itinerario grupal con tu código'),
      matchPrefixes: ['/rutas/unirse', '/rutas/grupal'],
      requiresAuth: true,
    },
    {
      title: t('nav.paquiPoints', 'Paqui Puntos'),
      href: '/paquipoints',
      icon: PaquiPointsNavIcon,
      description: t('nav.paquiPointsDesc', 'Tienda de recompensas y puntos de viaje'),
      matchPrefixes: ['/paquipoints', '/tienda'],
      requiresAuth: true,
    },
    {
      title: t('nav.memberships', 'Membresías'),
      href: '/memberships',
      icon: Crown,
      description: t('nav.membershipsDesc', 'Planes y beneficios exclusivos para viajeros'),
      matchPrefixes: ['/memberships', '/figma-ui/memberships'],
    },
    {
      title: t('nav.pricing', 'Precios'),
      href: '/billing/pricing',
      icon: CreditCard,
      description: t('nav.pricingDesc', 'Suscripciones y planes disponibles'),
      matchPrefixes: ['/billing'],
    },
  ]

  const isAuthenticated = sessionQuery.data?.meta?.is_authenticated === true
  const sessionUser = sessionQuery.data?.data?.user

  // Fetch current user extended profile from /api/users/me/ when authenticated
  const currentUserQuery = useCurrentUserProfileQuery({
    enabled: isAuthenticated,
  })
  const userProfile = currentUserQuery.data

  // Fetch active route to inform user if they have an ongoing itinerary
  const activeRouteQuery = useQuery({
    queryKey: ['active-route'],
    queryFn: () => api.getActiveRoute(),
    refetchInterval: 20000,
  })
  const activeRoute = activeRouteQuery.data?.has_active_route ? activeRouteQuery.data.route : null

  const displayName =
    userProfile?.display ||
    sessionUser?.display ||
    userProfile?.username ||
    sessionUser?.username ||
    sessionUser?.email ||
    'Usuario'

  const hasProfilePic = Boolean(
    userProfile?.has_profile_picture && userProfile?.profile_picture_url
  )
  const profilePicUrl = userProfile?.profile_picture_url

  const initials =
    displayName
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('') || 'U'

  // Helper to check if a route or any of its route aliases is active
  const isRouteActive = (route: NavRoute) => {
    if (route.end) {
      return location.pathname === route.href
    }
    if (route.matchPrefixes) {
      return route.matchPrefixes.some(
        (prefix) =>
          location.pathname === prefix ||
          location.pathname.startsWith(`${prefix}/`)
      )
    }
    return (
      location.pathname === route.href ||
      location.pathname.startsWith(`${route.href}/`)
    )
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        toast.add({
          type: 'info',
          title: t('nav.loggedOutTitle', 'Sesión cerrada'),
          description: t('nav.loggedOutDesc', 'Has cerrado sesión correctamente.'),
          timeout: 4000,
        })
        navigate('/login', { replace: true })
      },
    })
  }

  const filteredNavRoutes = navRoutes.filter(
    (route) => !route.requiresAuth || isAuthenticated
  )
  const desktopNavRoutes = filteredNavRoutes
  const mobileNavRoutes = filteredNavRoutes

  const isSignupActive = isRouteActive({
    title: t('nav.signup', 'Registro'),
    href: '/signup',
    icon: UserPlus,
    description: '',
    matchPrefixes: ['/signup', '/account/signup'],
  })

  const isLoginActive = isRouteActive({
    title: t('nav.login', 'Iniciar Sesión'),
    href: '/login',
    icon: LogIn,
    description: '',
    matchPrefixes: ['/login', '/account/login'],
  })

  return (
    <header className="sticky top-0 z-40 w-full bg-[#da1311] bg-[url('/banner-figma-red-navs.png')] bg-cover bg-center text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-transform hover:scale-105"
          >
            <img src="/logo-blanco-negro.svg" alt="taguer-logo" className='size-8' />
            <div className="flex items-center gap-2">
              <span className="font-heading text-xl font-bold tracking-tight text-white drop-shadow-xs">
                Taguer
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex md:items-center md:gap-1.5" aria-label={t('nav.mainNavLabel', 'Navegación principal')}>
            {desktopNavRoutes.map((route) => {
              const active = isRouteActive(route)
              const Icon = route.icon
              return (
                <NavLink
                  key={route.href}
                  to={route.href}
                  end={route.end}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
                    active
                      ? 'bg-white/20 text-white font-bold shadow-inner'
                      : 'text-white/85 hover:text-[#ffc900] hover:bg-white/10'
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{route.title}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Desktop Header Actions / Account Menu */}
        <div className="hidden md:flex md:items-center md:gap-3">
          {/* Active Route Pill (Desktop) */}
          {activeRoute && (
            <Link
              to={
                activeRoute.is_group && activeRoute.invite_code
                  ? `/rutas/grupal/${activeRoute.invite_code}?tab=map`
                  : `/rutas/grupal/${activeRoute.id}?tab=map`
              }
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all hover:scale-105 cursor-pointer border border-white/40 ring-2 ring-emerald-400/30"
              title={`Ruta Activa: ${activeRoute.title}`}
            >
              <span className="size-2 rounded-full bg-white animate-ping shrink-0" />
              <Compass className="size-3.5 text-white shrink-0" />
              <span className="whitespace-nowrap">
                Ruta Activa: {activeRoute.is_group && activeRoute.invite_code ? `Grupo ${activeRoute.invite_code}` : activeRoute.title}
              </span>
            </Link>
          )}

          {isAuthenticated && <PaquiNavBadge />}

          <LanguageSwitcher />

          {isAuthenticated ? (
            /* Logged In: Badge with Avatar & Account Menu */
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/30 bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label={t('nav.userMenu', 'Menú de usuario')}
                  />
                }
              >
                <Avatar size="sm" className="size-7 border border-white/40 ring-1 ring-white/20">
                  {hasProfilePic ? (
                    <AvatarImage
                      src={profilePicUrl!}
                      alt={displayName}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-white text-[#e51422] text-[11px] font-bold">
                    {initials ? initials : <UserIcon className="size-3.5" />}
                  </AvatarFallback>
                </Avatar>

                <span className="text-xs font-semibold max-w-[120px] truncate text-white">
                  {displayName}
                </span>

                <ChevronDown className="size-3.5 text-white/70" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl border border-neutral-200 bg-white text-neutral-900 rounded-xl">
                <div className="px-2.5 py-2 mb-1 border-b border-neutral-100">
                  <p className="text-xs font-bold text-neutral-900 truncate">{displayName}</p>
                  {userProfile?.username && (
                    <p className="text-[11px] text-neutral-500 truncate">@{userProfile.username}</p>
                  )}
                  {userProfile?.email && (
                    <p className="text-[10px] text-neutral-400 truncate">{userProfile.email}</p>
                  )}
                </div>

                <DropdownMenuItem
                  onClick={() => navigate('/account')}
                  className="gap-2.5 text-xs cursor-pointer py-1.5 rounded-lg hover:bg-red-50 hover:text-[#e51422]"
                >
                  <UserIcon className="size-4 text-[#e51422]" />
                  <span>{t('nav.myProfile', 'Mi Perfil')}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate('/account?edit=true')}
                  className="gap-2.5 text-xs cursor-pointer py-1.5 rounded-lg hover:bg-red-50 hover:text-[#e51422]"
                >
                  <Edit3 className="size-4 text-[#e51422]" />
                  <span>{t('nav.editProfile', 'Editar Perfil')}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleLogout}
                  className="gap-2.5 text-xs cursor-pointer py-1.5 rounded-lg text-red-600 focus:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="size-4" />
                  <span>{t('nav.logout', 'Cerrar Sesión')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Logged Out: Login & Signup CTA buttons */
            <>
              <NavLink
                to="/login"
                className={cn(
                  'gap-1.5 cursor-pointer font-semibold text-xs sm:text-sm px-4 py-1.5 rounded-full border-2 border-white/80 text-white hover:bg-white hover:text-[#e51422] transition-all',
                  isLoginActive && 'bg-white text-[#e51422]'
                )}
              >
                <span>{t('nav.login', 'Iniciar sesión')}</span>
              </NavLink>

              <NavLink
                to="/signup"
                className={cn(
                  'gap-1.5 cursor-pointer font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full bg-white text-[#e51422] hover:bg-neutral-100 shadow-sm transition-all hover:scale-105 active:scale-95',
                  isSignupActive && 'ring-2 ring-white/50'
                )}
              >
                <span>{t('nav.signup', 'Crear cuenta')}</span>
              </NavLink>
            </>
          )}
        </div>

        {/* Mobile Hamburger Menu */}
        <div className="flex items-center gap-2 md:hidden">
          {activeRoute && (
            <Link
              to={
                activeRoute.is_group && activeRoute.invite_code
                  ? `/rutas/grupal/${activeRoute.invite_code}?tab=map`
                  : `/rutas/grupal/${activeRoute.id}?tab=map`
              }
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xs border border-white/40 animate-pulse"
              title={`Ruta Activa: ${activeRoute.title}`}
            >
              <Compass className="size-3 text-white" />
              <span>{activeRoute.is_group && activeRoute.invite_code ? `TAG ${activeRoute.invite_code}` : 'Ruta Activa'}</span>
            </Link>
          )}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 text-white hover:bg-white/20 rounded-full cursor-pointer"
                  aria-label="Abrir menú de navegación"
                />
              }
            >
              <Menu className="size-5 text-white" />
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-[300px] sm:w-[350px] p-6 flex flex-col justify-between bg-[#da1311] bg-[url('/banner-figma-red-navs.png')] bg-cover bg-center text-white border-0 shadow-2xl"
            >
              <div>
                <SheetHeader className="p-0 pb-4 text-left">
                  <div className="flex items-center gap-2.5">
                    
                    <SheetTitle className="font-heading text-lg font-bold text-white drop-shadow-xs">
                      Taguer
                    </SheetTitle>
                  </div>
                </SheetHeader>

                <Separator className="my-2 bg-white/20" />

                {/* Active Route Card (Mobile) */}
                {activeRoute && (
                  <div className="my-2 p-3 rounded-2xl bg-white/20 border border-white/30 text-white space-y-2 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-emerald-300">
                        <Compass className="size-3.5 animate-spin" />
                        <span>Ruta en curso</span>
                      </span>
                      {activeRoute.is_group && activeRoute.invite_code && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-mono font-bold">
                          {activeRoute.invite_code}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold truncate text-white">
                      {activeRoute.title}
                    </p>
                    <Link
                      to={
                        activeRoute.is_group && activeRoute.invite_code
                          ? `/rutas/grupal/${activeRoute.invite_code}?tab=map`
                          : `/rutas/grupal/${activeRoute.id}?tab=map`
                      }
                      onClick={() => setIsOpen(false)}
                      className="block text-center py-1.5 px-3 rounded-xl bg-white text-[#da1311] font-bold text-xs hover:bg-neutral-100 transition-colors shadow-xs"
                    >
                      Continuar en el Mapa &rarr;
                    </Link>
                  </div>
                )}

                {/* Mobile Navigation Links */}
                <div className="py-2">
                  <div className="flex items-center justify-between px-2 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      {t('nav.navigationTitle', 'Navegación')}
                    </span>
                    <LanguageSwitcher />
                  </div>
                  <nav className="mt-2 flex flex-col gap-1.5" aria-label={t('nav.mobileNavLabel', 'Navegación móvil')}>
                    {mobileNavRoutes.map((route) => {
                      const active = isRouteActive(route)
                      const Icon = route.icon
                      return (
                        <NavLink
                          key={route.href}
                          to={route.href}
                          end={route.end}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                            active
                              ? 'bg-white/25 text-white font-bold shadow-inner'
                              : 'text-white/85 hover:bg-white/10 hover:text-[#ffc900]'
                          )}
                        >
                          <div
                            className={cn(
                              'flex size-8 shrink-0 items-center justify-center rounded-lg border',
                              active
                                ? 'border-white/40 bg-white/20 text-white'
                                : 'border-white/20 bg-white/10 text-white/80'
                            )}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div className="flex flex-col flex-1 overflow-hidden">
                            <span className="truncate">{route.title}</span>
                            <span className="text-xs font-normal text-white/70 truncate">
                              {route.description}
                            </span>
                          </div>
                          <ArrowRight className="size-3.5 opacity-60 shrink-0" />
                        </NavLink>
                      )
                    })}
                  </nav>
                </div>
              </div>

              {/* Mobile Drawer Footer */}
              <div className="pt-4 border-t border-white/20 space-y-2.5">
                {isAuthenticated ? (
                  <>
                    {/* Logged in User Information */}
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/15 border border-white/20 text-white">
                      <Avatar size="sm" className="size-9 border border-white/40 ring-1 ring-white/20 shrink-0">
                        {hasProfilePic ? (
                          <AvatarImage
                            src={profilePicUrl!}
                            alt={displayName}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="bg-white text-[#e51422] text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden flex-1">
                        <span className="text-xs font-bold text-white truncate">
                          {displayName}
                        </span>
                        {userProfile?.username && (
                          <span className="text-[11px] text-white/70 truncate">
                            @{userProfile.username}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <PaquiNavBadge />
                    </div>

                    {/* Quick Account Links */}
                    <div className="grid grid-cols-2 gap-2">
                      <NavLink
                        to="/account"
                        onClick={() => setIsOpen(false)}
                        className="w-full gap-1.5 text-xs py-2 rounded-full font-semibold border-2 border-white/80 text-white hover:bg-white hover:text-[#e51422] transition-colors flex items-center justify-center"
                      >
                        <UserIcon className="size-3.5" />
                        <span>{t('nav.myProfile', 'Mi Perfil')}</span>
                      </NavLink>
                      <NavLink
                        to="/account?edit=true"
                        onClick={() => setIsOpen(false)}
                        className="w-full gap-1.5 text-xs py-2 rounded-full font-semibold border-2 border-white/80 text-white hover:bg-white hover:text-[#e51422] transition-colors flex items-center justify-center"
                      >
                        <Edit3 className="size-3.5" />
                        <span>{t('nav.editProfile', 'Editar')}</span>
                      </NavLink>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsOpen(false)
                        handleLogout()
                      }}
                      disabled={logoutMutation.isPending}
                      className="w-full gap-2 text-white bg-white/10 hover:bg-white/20 hover:text-white rounded-full cursor-pointer"
                    >
                      <LogOut className="size-4" />
                      <span>{t('nav.logout', 'Cerrar Sesión')}</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="w-full py-2.5 rounded-full border-2 border-white text-white font-bold text-sm text-center flex items-center justify-center gap-2 hover:bg-white hover:text-[#e51422] transition-all"
                    >
                      <LogIn className="size-4" />
                      <span>{t('nav.login', 'Iniciar Sesión')}</span>
                    </NavLink>
                    <NavLink
                      to="/signup"
                      onClick={() => setIsOpen(false)}
                      className="w-full py-2.5 rounded-full bg-white text-[#e51422] font-bold text-sm text-center flex items-center justify-center gap-2 hover:bg-neutral-100 shadow-md transition-all"
                    >
                      <UserPlus className="size-4" />
                      <span>{t('nav.signup', 'Crear Cuenta')}</span>
                    </NavLink>
                    <NavLink
                      to="/forgot-password"
                      onClick={() => setIsOpen(false)}
                      className="text-center text-xs text-white/80 hover:text-[#ffc900] underline underline-offset-4 py-1 transition-colors block"
                    >
                      {t('nav.forgotPassword', '¿Olvidaste tu contraseña?')}
                    </NavLink>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
