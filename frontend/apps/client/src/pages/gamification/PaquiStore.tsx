import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Trophy,
  Zap,
  Sparkles,
  ArrowLeft,
  Check,
  Lock,
  ShoppingBag,
  History,
  Tag,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { api } from '../../services/api';
import { usePaqui } from '../../context/PaquiContext';
import type { RewardItem, UserReward, RewardType } from '../../types/gamification';
import { toast } from 'sonner';
import { FuiFooter } from '../../figma-ui/components/FuiFooter';
import { cn } from '@/lib/utils';
import { useAuthSessionQuery } from '@/features/auth/hooks/use-auth-queries';

export const PaquiStore: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sessionQuery = useAuthSessionQuery();
  const isAuthenticated = sessionQuery.data?.meta?.is_authenticated === true;

  useEffect(() => {
    if (sessionQuery.isSuccess && !isAuthenticated) {
      navigate('/login?next=/paquipoints', { replace: true });
    }
  }, [sessionQuery.isSuccess, isAuthenticated, navigate]);
  const {
    balance,
    lifetimeEarned,
    hasActiveMembership,
    membershipMultiplier,
    refreshWallet,
    wallet,
  } = usePaqui();

  const [activeTab, setActiveTab] = useState<'shop' | 'inventory' | 'history'>('shop');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [myRewards, setMyRewards] = useState<UserReward[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [equippingId, setEquippingId] = useState<number | null>(null);

  const loadStoreData = async () => {
    setIsLoadingData(true);
    try {
      const [catalogData, ownedData] = await Promise.all([
        api.getRewardsCatalog().catch(() => []),
        api.getMyRewards().catch(() => []),
      ]);
      setRewards(catalogData);
      setMyRewards(ownedData);
    } catch (err) {
      console.error('Error cargando tienda de Paquis:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  const handlePurchase = async (reward: RewardItem) => {
    if (balance < reward.cost_paquis) {
      toast.error(`Te faltan ${reward.cost_paquis - balance} paquipuntos para canjear este artículo.`);
      return;
    }

    setPurchasingId(reward.id);
    try {
      const result = await api.purchaseReward(reward.id);
      toast.success(result.message || `¡Felicidades! Has canjeado '${reward.name}'.`);
      await Promise.all([refreshWallet(), loadStoreData()]);
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el canje.');
    } finally {
      setPurchasingId(null);
    }
  };

  const handleEquipToggle = async (rewardId: number) => {
    setEquippingId(rewardId);
    try {
      const result = await api.equipReward(rewardId);
      toast.success(result.message || 'Estado actualizado.');
      await loadStoreData();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar equipamiento.');
    } finally {
      setEquippingId(null);
    }
  };

  const getRewardTypeLabel = (type: RewardType) => {
    switch (type) {
      case 'MERCH':
        return 'Merch Oficial';
      case 'AVATAR_ITEM':
        return 'Accesorio de Avatar';
      case 'BADGE':
        return 'Insignia';
      case 'PROFILE_TITLE':
        return 'Título Honorífico';
      case 'MAP_PIN':
        return 'Pin de Mapa';
      default:
        return 'Recompensa';
    }
  };

  const presentTypes = Array.from(new Set(rewards.map((r) => r.reward_type)));
  const categories = [
    { id: 'ALL', name: 'Todos los Artículos' },
    ...presentTypes.map((type) => ({
      id: type,
      name: getRewardTypeLabel(type),
    })),
  ];

  const filteredRewards = rewards.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.reward_type === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-[#fff9ef] text-neutral-900 font-sans selection:bg-[#ffc900] selection:text-neutral-900 flex flex-col justify-between">
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-8 flex-1">
        {/* Navigation Breadcrumbs / Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-[#e51422] transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>{t('common.back', 'Volver')}</span>
          </button>

          <div className="inline-flex items-center gap-2 border-2 border-[#1457b8] rounded-full text-[#1457b8] font-bold text-xs px-4 py-1.5 uppercase tracking-wider">
            <img src="/paqui puntos-01.svg" alt="Paquipuntos" className="size-4 object-contain" />
            <span>{t('paqui.title', 'Paqui Puntos')}</span>
          </div>
        </div>

        {/* Hero & Wallet Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-[#da1311] bg-[url('/banner-figma-red-navs.png')] bg-cover bg-center text-white p-6 sm:p-10 shadow-xl border-2 border-[#e5bdaa]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Balance */}
            <div className="md:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-xs text-white border border-white/40 shadow-xs">
                <img src="/paqui puntos-01.svg" alt="Paquipuntos" className="size-4 object-contain" />
                <span>{t('paqui.subtitle', 'Tienda y Recompensas')}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-white/85 uppercase tracking-wider font-bold block">
                  {t('paqui.balance', 'Tu Saldo Disponible')}
                </span>
                <div className="flex items-center gap-3.5">
                  <img
                    src="/paqui puntos-01.svg"
                    alt="paquipuntos"
                    className="size-12 sm:size-14 object-contain drop-shadow-md shrink-0"
                  />
                  <div className="flex items-baseline gap-2">
                    <h1 className="text-5xl sm:text-6xl font-black text-[#ffc900] tracking-tight drop-shadow-sm font-sans">
                      {balance.toLocaleString()}
                    </h1>
                    <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {t('paqui.points', 'paquipuntos')}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-white/95 max-w-lg leading-relaxed font-medium">
                {t('paqui.howToEarnDesc', 'Gana paquipuntos explorando rutas turísticas en Nicaragua, visitando reservas naturales y apoyando a negocios locales.')}
              </p>
            </div>

            {/* Right: Stats & Multiplier */}
            <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Total Earned */}
              <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/30 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs text-white/90 font-semibold">
                  <Trophy className="w-3.5 h-3.5 text-[#ffc900]" />
                  <span>{t('paqui.lifetimeEarned', 'Histórico Ganado')}</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {lifetimeEarned.toLocaleString()}{' '}
                  <span className="text-xs text-[#ffc900] font-bold">pts</span>
                </div>
              </div>

              {/* Membership Multiplier Card */}
              <div
                onClick={() => !hasActiveMembership && navigate('/billing/pricing')}
                className={`p-4 rounded-2xl border transition-all ${
                  hasActiveMembership
                    ? 'bg-[#ffc900]/25 border-[#ffc900] text-white shadow-md'
                    : 'bg-white/15 backdrop-blur-xs border-white/30 hover:bg-white/25 cursor-pointer group shadow-sm'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                  <Zap className={`w-3.5 h-3.5 ${hasActiveMembership ? 'text-[#ffc900]' : 'text-white'}`} />
                  <span>{t('paqui.multiplier', 'Multiplicador')}</span>
                </div>

                <div className="text-2xl font-black text-white flex items-center gap-2 mt-1">
                  <span>{membershipMultiplier}x</span>
                  {hasActiveMembership ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffc900] text-neutral-950 font-black uppercase">
                      Activo
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#ffc900] font-bold group-hover:underline block">
                      Subir a 1.5x &rarr;
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-[#f5cfb9] pb-4">
          <button
            onClick={() => setActiveTab('shop')}
            className={cn(
              'px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs',
              activeTab === 'shop'
                ? 'bg-[#e51422] text-white shadow-md'
                : 'bg-white text-neutral-700 border-2 border-[#e5bdaa] hover:bg-neutral-50'
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t('paqui.shopTab', 'Tienda de Recompensas')}</span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-extrabold',
                activeTab === 'shop'
                  ? 'bg-white text-[#e51422]'
                  : 'bg-[#fff9ef] text-neutral-800'
              )}
            >
              {rewards.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={cn(
              'px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs',
              activeTab === 'inventory'
                ? 'bg-[#e51422] text-white shadow-md'
                : 'bg-white text-neutral-700 border-2 border-[#e5bdaa] hover:bg-neutral-50'
            )}
          >
            <Layers className="w-4 h-4" />
            <span>{t('paqui.inventoryTab', 'Mis Recompensas')}</span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-extrabold',
                activeTab === 'inventory'
                  ? 'bg-white text-[#e51422]'
                  : 'bg-[#fff9ef] text-neutral-800'
              )}
            >
              {myRewards.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs',
              activeTab === 'history'
                ? 'bg-[#e51422] text-white shadow-md'
                : 'bg-white text-neutral-700 border-2 border-[#e5bdaa] hover:bg-neutral-50'
            )}
          >
            <History className="w-4 h-4" />
            <span>{t('paqui.historyTab', 'Historial')}</span>
          </button>
        </div>

        {/* TAB 1: SHOP CATALOG */}
        {activeTab === 'shop' && (
          <div className="space-y-6">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs',
                    selectedCategory === cat.id
                      ? 'bg-[#ffc900] text-neutral-950 border-2 border-[#ffc900] shadow-sm'
                      : 'bg-white text-neutral-700 border-2 border-[#e5bdaa] hover:border-neutral-400'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Grid of Rewards */}
            {isLoadingData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-72 rounded-3xl bg-white border-2 border-[#e5bdaa] animate-pulse"
                  />
                ))}
              </div>
            ) : filteredRewards.length === 0 ? (
              <div className="text-center py-16 bg-white border-2 border-[#e5bdaa] rounded-3xl p-8 space-y-2">
                <Tag className="w-10 h-10 mx-auto text-[#c98224]" />
                <p className="text-lg font-bold text-neutral-800">
                  No hay recompensas en esta categoría
                </p>
                <p className="text-xs text-neutral-500">
                  Pronto agregaremos más cosméticos inspirados en la cultura nicaragüense.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRewards.map((reward) => {
                  const canAfford = balance >= reward.cost_paquis;
                  const isPurchasing = purchasingId === reward.id;
                  const isEquipping = equippingId === reward.id;

                  return (
                    <div
                      key={reward.id}
                      className="group rounded-3xl bg-white border-2 border-[#e5bdaa] hover:border-[#e51422] transition-all p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md relative overflow-hidden"
                    >
                      {reward.icon_or_image_url ? (
                        <div className="w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-b from-[#fffbf4] to-[#fdefdf] border border-[#e5bdaa] relative flex items-center justify-center p-3 group-hover:border-[#e51422]/40 transition-colors">
                          <img
                            src={reward.icon_or_image_url}
                            alt={reward.name}
                            className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-neutral-900/80 backdrop-blur-xs text-[10px] font-bold text-[#ffc900] shadow-2xs">
                            {getRewardTypeLabel(reward.reward_type)}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-44 rounded-2xl bg-gradient-to-tr from-[#fff9ef] to-[#ffe8df] border-2 border-[#e5bdaa] flex flex-col items-center justify-center p-4 text-center">
                          <ShieldCheck className="w-12 h-12 text-[#e51422] mb-2" />
                          <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                            {getRewardTypeLabel(reward.reward_type)}
                          </span>
                        </div>
                      )}

                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-lg font-bold font-heading text-neutral-900 group-hover:text-[#e51422] transition-colors">
                            {reward.name}
                          </h3>
                        </div>

                        <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed font-sans">
                          {reward.description}
                        </p>
                      </div>

                      {/* Price & Action */}
                      <div className="pt-3 border-t border-[#f5cfb9] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-neutral-900 font-extrabold text-sm">
                          <img
                            src="/paqui puntos-01.svg"
                            alt="paquipuntos"
                            className="size-4 object-contain inline-block shrink-0"
                          />
                          <span>{reward.cost_paquis} paquipuntos</span>
                        </div>

                        {reward.already_owned ? (
                          reward.reward_type === 'MERCH' ? (
                            <div className="px-4 py-2 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                              <Check className="w-3.5 h-3.5" />
                              <span>Canjeado</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEquipToggle(reward.id)}
                              disabled={isEquipping}
                              className={cn(
                                'px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs',
                                reward.is_equipped
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-[#ffc900] hover:bg-[#ffd633] text-neutral-950'
                              )}
                            >
                              {reward.is_equipped ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Equipado</span>
                                </>
                              ) : (
                                <span>Equipar</span>
                              )}
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handlePurchase(reward)}
                            disabled={!canAfford || isPurchasing}
                            className={cn(
                              'px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs',
                              canAfford
                                ? 'bg-[#e51422] hover:bg-[#cf101c] text-white hover:-translate-y-0.5'
                                : 'bg-neutral-100 border border-neutral-300 text-neutral-400'
                            )}
                          >
                            {isPurchasing ? (
                              <span>Canjeando...</span>
                            ) : canAfford ? (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Canjear</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Faltan {reward.cost_paquis - balance}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVENTORY (MY REWARDS) */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {myRewards.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-[#e5bdaa] p-8 space-y-3 shadow-sm">
                <ShoppingBag className="w-12 h-12 mx-auto text-[#c98224]" />
                <h3 className="text-lg font-bold font-heading text-neutral-900">
                  Aún no tienes recompensas adquiridas
                </h3>
                <p className="text-xs text-neutral-600 max-w-sm mx-auto font-sans">
                  Explora el catálogo de la tienda y canjea tus paquipuntos por merch oficial como camisas, gorras, carcasas y artículos coleccionables.
                </p>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="px-6 py-2.5 rounded-full bg-[#e51422] text-white font-bold text-xs hover:bg-[#cf101c] transition-colors shadow-md cursor-pointer"
                >
                  Explorar Tienda
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myRewards.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-3xl bg-white border-2 border-[#e5bdaa] space-y-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {item.reward.icon_or_image_url && (
                      <div className="w-full h-36 rounded-2xl bg-gradient-to-b from-[#fffbf4] to-[#fdefdf] border border-[#e5bdaa] p-2 flex items-center justify-center overflow-hidden">
                        <img
                          src={item.reward.icon_or_image_url}
                          alt={item.reward.name}
                          className="w-full h-full object-contain drop-shadow-xs"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold font-heading text-neutral-900 text-lg">
                          {item.reward.name}
                        </h4>
                        <span className="text-[10px] text-[#1457b8] font-bold bg-[#1457b8]/10 px-2.5 py-0.5 rounded-full">
                          {getRewardTypeLabel(item.reward.reward_type)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-1 font-sans">
                        {item.reward.description}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[#f5cfb9] flex items-center justify-between">
                      <span className="text-[11px] text-neutral-500 font-medium">
                        Adquirido: {new Date(item.purchased_at).toLocaleDateString()}
                      </span>

                      {item.reward.reward_type === 'MERCH' ? (
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                          <Check className="w-3.5 h-3.5" />
                          <span>Canjeado</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEquipToggle(item.reward.id)}
                          disabled={equippingId === item.reward.id}
                          className={cn(
                            'px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs',
                            item.is_equipped
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-[#ffc900] hover:bg-[#ffd633] text-neutral-950'
                          )}
                        >
                          {item.is_equipped ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Equipado</span>
                            </>
                          ) : (
                            <span>Equipar</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TRANSACTION HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white border-2 border-[#e5bdaa] rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#f5cfb9] bg-[#fff9ef]/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <History className="w-4 h-4 text-[#c98224]" />
                <span>Movimientos Recientes de Paquipuntos</span>
              </h3>
            </div>

            {!wallet || !wallet.recent_transactions || wallet.recent_transactions.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-xs font-sans">
                No hay movimientos registrados en tu billetera.
              </div>
            ) : (
              <div className="divide-y divide-[#f5cfb9]">
                {wallet.recent_transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <div
                      key={tx.id}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#fff9ef]/40 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs sm:text-sm font-bold text-neutral-800">
                          {tx.message}
                        </p>
                        <span className="text-[11px] text-neutral-500">
                          {new Date(tx.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div
                        className={cn(
                          'text-sm font-black whitespace-nowrap px-3.5 py-1 rounded-full',
                          isPositive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        )}
                      >
                        {isPositive ? `+${tx.amount}` : tx.amount} paquipuntos
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <FuiFooter className="mt-12" />
    </div>
  );
};
