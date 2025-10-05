'use client';

import React from 'react';
import { TonConnectButton as TonConnectUIButton } from '@tonconnect/ui-react';
import { useApp } from './AppProvider';

export default function TonConnectButton() {
  const { user, updateUser } = useApp();

  const handleWalletConnect = async (wallet: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          walletAddress: wallet
        })
      });

      if (response.ok) {
        updateUser({ ton_wallet: wallet });
      }
    } catch (error) {
      console.error('Wallet connect error:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {!user?.ton_wallet && (
        <div className="text-sm text-gray-400 text-center mb-2">
          Connect your TON wallet to unlock Web3 features
        </div>
      )}
      
      <TonConnectUIButton />
      
      {user?.ton_wallet && (
        <div className="text-xs text-green-400 text-center">
          ✓ Wallet connected: {user.ton_wallet.slice(0, 6)}...{user.ton_wallet.slice(-4)}
        </div>
      )}
    </div>
  );
}
