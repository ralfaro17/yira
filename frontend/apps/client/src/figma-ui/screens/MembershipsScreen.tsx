import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { FuiButton } from '../components/FuiButton';
import { FuiFooter } from '../components/FuiFooter';
import { imageAssets, membershipPlans, type Screen } from '../types';

interface MembershipsScreenProps {
  navigate?: (screen: Screen) => void;
}

const PLAN_PRICE_MAP: Record<string, string> = {
  Deacachimba: 'price_1UBOoALYMZb0AsEcQayO90UC',
  'Date Color': 'price_1UBcQeLYMZb0AsEcxFHsOulj',
  'Otro Mate': 'price_1UBduBLYMZb0AsEc9mgV0dQZ',
};

export const MembershipsScreen: React.FC<MembershipsScreenProps> = () => {
  const routerNavigate = useNavigate();
  const [activeSub, setActiveSub] = useState<any>(null);
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;
    async function fetchActiveSub() {
      try {
        const res = await axios.get('/api/billing/active-subscription/', {
          withCredentials: true,
        });
        if (isMounted && res.data?.has_active_subscription && res.data?.subscription) {
          setActiveSub(res.data.subscription);
        }
      } catch {
        // Silenciosamente ignorar si no está autenticado
      }
    }
    fetchActiveSub();
    return () => {
      isMounted = false;
    };
  }, []);

  const getPlanFeatures = (name: string, fallbackDesc: string) => {
    let key = '';
    if (name.toLowerCase().includes('deacachimba')) key = 'planDeacachimba';
    else if (name.toLowerCase().includes('color')) key = 'planDateColor';
    else if (name.toLowerCase().includes('mate')) key = 'planOtroMate';

    if (key) {
      const translated = t(`memberships.${key}.features`, { returnObjects: true });
      if (Array.isArray(translated)) return translated;
    }
    return fallbackDesc.split('\n');
  };

  return (
    <div className="min-h-screen bg-[#fff9ef] text-neutral-900 font-sans flex flex-col justify-between selection:bg-[#ffc900]">
      <div>
        {/* Yellow Figma Memberships Banner */}
        <div className="w-full bg-[#f4b80a] flex justify-center overflow-hidden">
          <img
            src={imageAssets.membershipsBanner}
            alt={t('memberships.bannerAlt', 'Membresías: experiencias a otro nivel')}
            className="w-full h-auto max-h-[420px] object-cover object-center"
          />
        </div>

        {/* Membership Plans List */}
        <main className="max-w-[1200px] mx-auto px-6 sm:px-12 py-10 space-y-12">
          {membershipPlans.map(({ name, description, image, color }) => {
            const isPlanPurchased =
              activeSub &&
              (activeSub.stripe_price_id === PLAN_PRICE_MAP[name] ||
                (name === 'Deacachimba' &&
                  !Object.values(PLAN_PRICE_MAP).includes(activeSub.stripe_price_id)));
            const features = getPlanFeatures(name, description);

            return (
              <section
                key={name}
                className={`grid grid-cols-1 md:grid-cols-[380px_1fr] gap-8 md:gap-12 items-center bg-white border-2 rounded-3xl p-6 sm:p-10 shadow-sm hover:shadow-md transition-shadow relative ${
                  isPlanPurchased ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-[#e5bdaa]'
                }`}
                style={{ '--plan-color': color } as React.CSSProperties}
              >
                {isPlanPurchased && (
                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                    <Check size={14} className="stroke-[2.5]" />
                    <span>Comprado</span>
                  </div>
                )}
                <img
                  src={image}
                  alt={`Plan ${name}`}
                  className="w-full max-w-[380px] aspect-square rounded-2xl object-cover shadow-xs mx-auto"
                />
                <div className="flex flex-col items-start" style={{ color }}>
                  <h2 className="font-heading text-4xl sm:text-6xl leading-tight mb-4 font-normal">
                    Plan {name}
                  </h2>
                  <ul className="space-y-3 mb-8 text-base sm:text-xl font-medium text-neutral-800 list-disc pl-6 marker:text-[var(--plan-color)]">
                    {features.map((line, idx) => (
                      <li key={idx} className="leading-relaxed pl-1">
                        {line}
                      </li>
                    ))}
                  </ul>

                  {isPlanPurchased ? (
                    <div className="inline-flex items-center gap-2 px-8 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-lg shadow-xs cursor-default">
                      <Check size={20} className="stroke-[2.5]" />
                      <span>Comprado</span>
                    </div>
                  ) : (
                    <FuiButton
                      className="text-lg px-8 py-2 rounded-full border-3 shadow-none transition-all cursor-pointer font-bold"
                      style={{
                        borderColor: color,
                        color: color,
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = color;
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = color;
                      }}
                      onClick={() => routerNavigate('/billing/pricing')}
                    >
                      Comprar
                    </FuiButton>
                  )}
                </div>
              </section>
            );
          })}
        </main>
      </div>

      <FuiFooter />
    </div>
  );
};
