import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { PaquiWallet } from '../types/gamification';

interface PaquiContextType {
  wallet: PaquiWallet | null;
  balance: number;
  lifetimeEarned: number;
  membershipMultiplier: number;
  hasActiveMembership: boolean;
  isLoading: boolean;
  refreshWallet: () => Promise<void>;
  updateBalanceLocally: (newBalance: number) => void;
}

const PaquiContext = createContext<PaquiContextType | undefined>(undefined);

export const PaquiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<PaquiWallet | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchWallet = useCallback(async () => {
    try {
      const data = await api.getPaquiWallet();
      setWallet(data);
    } catch {
      // Si el usuario no ha iniciado sesión o no tiene wallet aún, se mantiene en null
      setWallet(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const updateBalanceLocally = useCallback((newBalance: number) => {
    setWallet((prev) => (prev ? { ...prev, balance: newBalance } : null));
  }, []);

  const value: PaquiContextType = {
    wallet,
    balance: wallet?.balance ?? 0,
    lifetimeEarned: wallet?.lifetime_earned ?? 0,
    membershipMultiplier: wallet?.membership_multiplier ?? 1.0,
    hasActiveMembership: wallet?.has_active_membership ?? false,
    isLoading,
    refreshWallet: fetchWallet,
    updateBalanceLocally,
  };

  return <PaquiContext.Provider value={value}>{children}</PaquiContext.Provider>;
};

export const usePaqui = (): PaquiContextType => {
  const context = useContext(PaquiContext);
  if (!context) {
    throw new Error('usePaqui must be used within a PaquiProvider');
  }
  return context;
};
