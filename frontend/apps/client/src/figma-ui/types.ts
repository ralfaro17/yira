export type Screen =
  | 'home'
  | 'login'
  | 'signup-type'
  | 'signup-profile'
  | 'signup-account'
  | 'signup-experience'
  | 'signup-business'
  | 'signup-health'
  | 'signup-done'
  | 'forgot'
  | 'forgot-code'
  | 'reset'
  | 'memberships';

export interface DestinationItem {
  key?: string;
  name: string;
  image: string;
  description: string;
}

export interface PlanItem {
  name: string;
  description: string;
  image: string;
  color: string;
}

export const imageAssets = {
  hero: '/hero-banner.png',
  map: '/landing-page/mapa.png',
  granada: '/landing-page/hotel-la-gran-francia.png',
  chocolate: '/landing-page/bate-bate-chocolate.png',
  gallery: '/landing-page/castillo-art-gallery.png',
  guadalupe: '/landing-page/plaza-guadalupe.png',
  art: '/landing-page/cafe-de-arte.png',
  membershipsBanner: 'banner-membresias.png',
  membershipDeacachimba: '/landing-page/plan-deacachimba.png',
  membershipDateColor: '/landing-page/plan-date-color.png',
  membershipOtroMate: '/landing-page/plan-otro-mate.png',
  membershipLogo: 'taguer-logo.png',
  puestosVigoron: '/landing-page/puestos-de-vigoron-del-mercado-municipal.png',
  miniGranada: '/landing-page/granada-unica-y-cultural.png',
  miniCornIsland: '/landing-page/corn-island-paraiso-tropical.png',
  miniMombacho: '/landing-page/volcan-mombacho-respiro-natural.png',
  miniVolcanMasaya: '/landing-page/volcan-masaya.png',
};

export const destinations: DestinationItem[] = [
  {
    key: 'granada',
    name: 'Hotel La Gran Francia',
    image: imageAssets.granada,
    description: 'Esquina sureste del Parque Central, Granada',
  },
  {
    key: 'chocolate',
    name: 'Boca Bate Chocolate',
    image: imageAssets.chocolate,
    description: 'Boca 3a. calle Noroeste, Granada',
  },
  {
    key: 'gallery',
    name: 'Castillo Art Gallery',
    image: imageAssets.gallery,
    description: 'Frente al Teatro Plaza, Calle El Arsenal',
  },
  {
    key: 'guadalupe',
    name: 'Iglesia Guadalupe',
    image: imageAssets.guadalupe,
    description: 'Calle La Calzada, Granada',
  },
  {
    key: 'art',
    name: 'Café de Arte',
    image: imageAssets.art,
    description: 'Avenida Cervantes, Granada',
  },
  {
    key: 'vigoron',
    name: 'Puestos de Vigorón',
    image: imageAssets.puestosVigoron,
    description: 'Entre la Calle la Concepción y la Calle Arroyo',
  },
];

export const membershipPlans: PlanItem[] = [
  {
    name: 'Deacachimba',
    description: 'Acceso a cupones de descuento\nCreación de rutas automáticas optimizadas por tiempo, presupuesto y estilo de viaje',
    image: imageAssets.membershipDeacachimba,
    color: '#ed6b1c',
  },
  {
    name: 'Date Color',
    description: 'Aparición prioritaria en búsquedas de su categoría\nGalería con fotos y videos\nEnlaces a redes sociales, menú o catálogo interactivo',
    image: imageAssets.membershipDateColor,
    color: '#e51422',
  },
  {
    name: 'Otro Mate',
    description: 'Banners destacados en la pantalla principal y primer lugar en recomendaciones de la zona\nSello de "Comercio Verificado"\nReportes de perfil demográfico de los visitantes\nTodas las funciones del plan anterior incluidas',
    image: imageAssets.membershipOtroMate,
    color: '#f4b80a',
  },
];

