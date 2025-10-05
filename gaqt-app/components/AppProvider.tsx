'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import WebApp from '@twa-dev/sdk';

interface User {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  ton_wallet?: string;
  energy: number;
  points: number;
  level: number;
  referral_code?: string;
  referral_count?: number;
}

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  updateUser: (updates: Partial<User>) => void;
  syncProgress: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<number>(Date.now());

  // Initialize Telegram Web App
  useEffect(() => {
    if (typeof window !== 'undefined') {
      WebApp.ready();
      WebApp.expand();
      WebApp.enableClosingConfirmation();
      
      // Set theme colors
      WebApp.setHeaderColor('#1a1a1a');
      WebApp.setBackgroundColor('#0a0a0a');
    }
  }, []);

  // Authenticate user on mount
  useEffect(() => {
    const initUser = async () => {
      try {
        setIsLoading(true);
        
        // Get Telegram initData
        const initData = WebApp.initData;
        
        if (!initData) {
          throw new Error('No Telegram initData available');
        }

        // Get start parameter (referral code) from Telegram
        const startParam = WebApp.initDataUnsafe?.start_param;

        // Call auth API
        const response = await fetch('/api/auth/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData, startParam })
        });

        if (!response.ok) {
          throw new Error('Authentication failed');
        }

        const data = await response.json();
        setUser(data.user);
        setError(null);
        
        // Show referral bonus notification if applicable
        if (data.referralBonus) {
          WebApp.showAlert('🎁 Welcome! You and your friend received 1000 points + 100 energy!');
        }
      } catch (err) {
        console.error('Init error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setIsLoading(false);
      }
    };

    initUser();
  }, []);

  // Auto-sync progress every 5 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      syncProgress();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...updates });
  };

  const syncProgress = async () => {
    if (!user) return;

    // Only sync if 5 minutes have passed
    const now = Date.now();
    if (now - lastSync < 5 * 60 * 1000) {
      return;
    }

    try {
      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          energy: user.energy,
          points: user.points,
          level: user.level
        })
      });

      if (response.ok) {
        setLastSync(now);
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
  };

  return (
    <AppContext.Provider value={{ user, isLoading, error, updateUser, syncProgress }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
