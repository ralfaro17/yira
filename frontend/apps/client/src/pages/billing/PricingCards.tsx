import { useState, useEffect } from 'react';
import { Check, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'sonner';

// IDs generados en Stripe para los 3 planes de Taguer
const PRICING_PLANS = [
  {
    name: 'Viajero',
    price: 5,
    stripePriceId: 'price_1UBOoALYMZb0AsEcQayO90UC',
    target: 'Turista habitual que ya usa la app gratis para explorar',
    freeFeatures: 'Descubrir sitios, crear itinerarios básicos, dejar reseñas',
    premiumFeatures: [
      'Itinerarios con IA ilimitados',
      'Host de itinerarios grupales colaborativos',
      'Alertas anticipadas de promociones',
      'Descuentos exclusivos en negocios afiliados',
      'Perfil destacado e insignias en reseñas',
      'Multiplicador de paquipuntos',
    ],
    whyPay: 'Mejora la experiencia de quien viaja seguido, no la habilita',
    popular: false,
  },
  {
    name: 'Emprendedores',
    price: 10,
    stripePriceId: 'price_1UBcQeLYMZb0AsEcxFHsOulj',
    target: 'Negocio pequeño/individual que ya se anuncia gratis',
    freeFeatures: 'Perfil de negocio básico: nombre, descripción, ubicación, 1-2 fotos',
    premiumFeatures: [
      'Estadísticas de visitas/interacciones',
      'Prioridad en resultados de búsqueda',
      'Publicar promociones por tiempo limitado',
      'Galería ampliada de fotos',
      'Mensajería directa con clientes',
      'Destacado prioritario en rutas e itinerarios',
    ],
    whyPay: 'Convierte visibilidad gratuita en más ventas reales',
    popular: true,
  },
  {
    name: 'Empresas',
    price: 30,
    stripePriceId: 'price_1UBduBLYMZb0AsEc9mgV0dQZ',
    target: 'Empresa turística consolidada (hotel, tour operador, cadena)',
    freeFeatures: 'Nada distinto — este tier es 100% para escalar marketing',
    premiumFeatures: [
      'Banners destacados en home/búsqueda',
      'Múltiples usuarios administradores',
      'Analítica avanzada (alcance, conversión, demografía)',
      'Campañas segmentadas push',
      'Prioridad máxima en listados',
      'Soporte dedicado',
    ],
    whyPay: 'Necesita alcance masivo y datos, no solo un perfil',
    popular: false,
  },
];

// Función para obtener la cookie CSRF (requerida por Django SessionAuthentication)
function getCookie(name: string) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default function PricingCards() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [checkingSub, setCheckingSub] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchActiveSubscription() {
      try {
        const response = await axios.get('/api/billing/active-subscription/', {
          withCredentials: true,
        });
        if (isMounted) {
          if (response.data?.has_active_subscription && response.data?.subscription) {
            setActiveSub(response.data.subscription);
          } else {
            setActiveSub(null);
          }
        }
      } catch (error) {
        console.error('Error fetching active subscription:', error);
      } finally {
        if (isMounted) {
          setCheckingSub(false);
        }
      }
    }

    fetchActiveSubscription();

    return () => {
      isMounted = false;
    };
  }, []);

  const getPlanDetails = (plan: (typeof PRICING_PLANS)[0]) => {
    let key = 'traveler';
    if (plan.name.toLowerCase().includes('emprended')) {
      key = 'entrepreneurs';
    } else if (plan.name.toLowerCase().includes('empresa')) {
      key = 'enterprises';
    }

    const name = t(`pricing.plans.${key}.name`, plan.name);
    const target = t(`pricing.plans.${key}.target`, plan.target);
    const freeFeatures = t(`pricing.plans.${key}.freeFeatures`, plan.freeFeatures);
    const translatedFeatures = t(`pricing.plans.${key}.premiumFeatures`, { returnObjects: true });
    const premiumFeatures = Array.isArray(translatedFeatures) ? (translatedFeatures as string[]) : plan.premiumFeatures;
    const whyPay = t(`pricing.plans.${key}.whyPay`, plan.whyPay);

    return { name, target, freeFeatures, premiumFeatures, whyPay };
  };

  const handleSubscribe = async (priceId: string) => {
    // Si ya cuenta con suscripción activa, prevenir compra
    if (activeSub) {
      toast.error(
        'Ya cuentas con una membresía activa en Taguer. No puedes comprar otra mientras esté activa.'
      );
      return;
    }

    try {
      setLoading(priceId);

      const csrftoken = getCookie('csrftoken');

      const response = await axios.post(
        '/api/billing/create-checkout-session/',
        { stripe_price_id: priceId },
        {
          withCredentials: true, // Importante para enviar la cookie de sesión a Django
          headers: {
            'Content-Type': 'application/json',
            ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
          },
        }
      );

      // Redirigir a Stripe Checkout
      if (response.data.url) {
        window.location.assign(response.data.url);
      }
    } catch (error: any) {
      console.error('Error creating checkout session', error);
      const serverMsg = error.response?.data?.error;
      if (serverMsg) {
        toast.error(serverMsg);
        if (error.response?.data?.has_active_subscription) {
          setActiveSub(error.response.data.active_subscription || { status: 'active' });
        }
      } else {
        toast.error(
          'Hubo un error al iniciar el pago. Verifica que tengas una sesión activa e intenta nuevamente.'
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const hasAnyActive = !!activeSub;

  return (
    <div className="min-h-screen bg-[#fff9ef] text-neutral-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 border-2 border-[#1457b8] rounded-full text-[#1457b8] font-bold text-xs sm:text-sm px-4 py-1.5 uppercase tracking-wider">
            <Sparkles className="size-4 text-[#ffc900]" />
            <span>Taguer</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading text-neutral-900 tracking-tight">
            {t('pricing.title', 'Planes y Membresías')}
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto">
            {t('pricing.subtitle', 'Elige el plan perfecto para potenciar tu experiencia en Taguer y descubrir Nicaragua a otro nivel.')}
          </p>
        </div>

        {/* Banner de Membresía Activa */}
        {hasAnyActive && (
          <div className="mb-10 p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 max-w-2xl mx-auto shadow-sm flex items-center gap-3.5 text-left">
            <ShieldCheck className="size-7 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-950 text-sm sm:text-base">
                Membresía activa en tu cuenta
              </p>
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                Ya cuentas con una membresía activa en Taguer. Tienes habilitadas todas las funciones premium y no es necesario comprar otra suscripción.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PRICING_PLANS.map((plan) => {
            const details = getPlanDetails(plan);
            // Determinar si este plan específico está adquirido
            const isThisPlanPurchased =
              hasAnyActive &&
              (activeSub.stripe_price_id === plan.stripePriceId ||
                (PRICING_PLANS.every((p) => p.stripePriceId !== activeSub.stripe_price_id) &&
                  plan.name === 'Viajero'));

            return (
              <div
                key={plan.name}
                className={`border-2 rounded-3xl bg-white p-6 sm:p-8 flex flex-col h-full shadow-md hover:shadow-xl transition-all duration-200 relative ${
                  isThisPlanPurchased
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : plan.popular
                    ? 'border-[#e51422] ring-2 ring-[#e51422]/20'
                    : 'border-[#e5bdaa]'
                }`}
              >
                {/* Badge de Plan Actual o Más Popular */}
                {isThisPlanPurchased ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Check className="size-3.5 stroke-[2.5]" />
                    <span>{t('pricing.currentPlan', 'Tu Plan Actual')}</span>
                  </div>
                ) : plan.popular ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#e51422] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="size-3 text-[#ffc900]" />
                    <span>{t('pricing.popularBadge', 'Más Popular')}</span>
                  </div>
                ) : null}

                {/* Header */}
                <div className="mb-6 pt-2">
                  <h2 className="text-3xl font-heading font-normal text-neutral-900 mb-2">
                    {details.name}
                  </h2>
                  <div className="flex items-baseline gap-1 text-neutral-500">
                    <span className="text-4xl font-extrabold text-[#e51422] font-sans">
                      ${plan.price}
                    </span>
                    <span className="text-sm font-semibold">{t('pricing.monthly', '/mes')}</span>
                  </div>
                </div>

                {/* Público Objetivo */}
                <div className="mb-5 border-t border-[#f5cfb9] pt-4">
                  <h3 className="text-xs text-[#1457b8] uppercase tracking-wider mb-1.5 font-bold">
                    {t('pricing.targetAudienceLabel', 'Público objetivo')}
                  </h3>
                  <p className="text-neutral-700 text-sm leading-relaxed">{details.target}</p>
                </div>

                {/* Qué sigue siendo gratis */}
                <div className="mb-5 border-t border-[#f5cfb9] pt-4">
                  <h3 className="text-xs text-[#1457b8] uppercase tracking-wider mb-1.5 font-bold">
                    {t('pricing.freeFeaturesLabel', 'Qué sigue siendo gratis')}
                  </h3>
                  <p className="text-neutral-700 text-sm leading-relaxed">{details.freeFeatures}</p>
                </div>

                {/* Funcionalidades premium */}
                <div className="mb-6 border-t border-[#f5cfb9] pt-4 flex-grow">
                  <h3 className="text-xs text-[#1457b8] uppercase tracking-wider mb-3 font-bold">
                    {t('pricing.premiumFeaturesLabel', 'Funcionalidades premium')}
                  </h3>
                  <ul className="space-y-2.5">
                    {details.premiumFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start text-sm text-neutral-800">
                        <Check className="h-4 w-4 mr-2 mt-0.5 text-[#e51422] shrink-0 stroke-[2.5]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Por qué pagaría */}
                <div className="mb-6 border-t border-[#f5cfb9] pt-4">
                  <h3 className="text-xs text-[#1457b8] uppercase tracking-wider mb-1.5 font-bold">
                    {t('pricing.whyPayLabel', 'Por qué pagaría')}
                  </h3>
                  <p className="text-neutral-700 text-sm leading-relaxed">{details.whyPay}</p>
                </div>

                {/* Botón de Acción: Comprar vs Comprado */}
                <button
                  onClick={() => handleSubscribe(plan.stripePriceId)}
                  disabled={
                    loading === plan.stripePriceId ||
                    checkingSub ||
                    isThisPlanPurchased ||
                    hasAnyActive
                  }
                  className={`w-full min-h-12 py-3 px-6 rounded-full font-bold text-base shadow-md transition-all flex justify-center items-center mt-auto ${
                    isThisPlanPurchased
                      ? 'bg-emerald-600 text-white cursor-default ring-2 ring-emerald-600/30'
                      : hasAnyActive
                      ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed border border-neutral-300'
                      : 'bg-[#e51422] text-white hover:bg-[#cf101c] hover:-translate-y-0.5 cursor-pointer disabled:opacity-50'
                  }`}
                  title={
                    isThisPlanPurchased
                      ? t('pricing.activeMembershipTitle', 'Membresía actualmente activa')
                      : hasAnyActive
                      ? t('pricing.alreadyHaveActive', 'Ya cuentas con una membresía activa en Taguer.')
                      : t('pricing.buyMembership', 'Comprar membresía')
                  }
                >
                  {loading === plan.stripePriceId ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isThisPlanPurchased ? (
                    <span className="flex items-center gap-1.5">
                      <Check className="size-5 stroke-[2.5]" />
                      <span>{t('pricing.purchased', 'Comprado')}</span>
                    </span>
                  ) : hasAnyActive ? (
                    <span>{t('pricing.unavailable', 'No disponible')}</span>
                  ) : (
                    <span>{t('pricing.buy', 'Comprar')}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
