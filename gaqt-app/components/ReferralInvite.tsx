'use client';

import React, { useState } from 'react';
import { useApp } from './AppProvider';
import WebApp from '@twa-dev/sdk';

export default function ReferralInvite() {
  const { user } = useApp();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [showReferrals, setShowReferrals] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const referralLink = `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME || 'your_bot'}?start=${user.referral_code || 'XXXXXXXX'}`;

  const handleInviteFriend = () => {
    const shareText = `🎮 Join me on G.A.Q.T.! Complete quests, earn rewards, and climb the leaderboard!\n\n🎁 Use my referral code and we both get 1000 points + 100 energy!\n\n`;
    
    try {
      // Use Telegram's share functionality
      WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`);
    } catch (error) {
      console.error('Share error:', error);
      // Fallback: copy to clipboard
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const loadReferrals = async () => {
    try {
      const response = await fetch(`/api/referral?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setReferrals(data.referrals);
        setShowReferrals(true);
      }
    } catch (error) {
      console.error('Load referrals error:', error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">👥</div>
        <h2 className="text-2xl font-bold text-white mb-2">Invite Friends</h2>
        <p className="text-sm text-gray-300">
          Share your referral code and earn rewards together!
        </p>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{user.referral_count || 0}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">Referrals</div>
        </div>
        <div className="bg-black/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{(user.referral_count || 0) * 1000}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">Bonus Points</div>
        </div>
      </div>

      {/* Referral Code Display */}
      <div className="bg-black/40 rounded-lg p-4 mb-4">
        <div className="text-xs text-gray-400 mb-1">Your Referral Code</div>
        <div className="flex items-center justify-between">
          <code className="text-2xl font-mono font-bold text-purple-300">
            {user.referral_code || 'XXXXXXXX'}
          </code>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 rounded text-xs text-white transition-all"
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleInviteFriend}
          className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
        >
          🚀 Invite Friend via Telegram
        </button>

        <button
          onClick={loadReferrals}
          className="w-full py-2 px-4 rounded-lg border border-purple-500/50 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-medium text-sm transition-all duration-200"
        >
          {showReferrals ? '▼ Hide My Referrals' : '▶ View My Referrals'}
        </button>
      </div>

      {/* Referrals List */}
      {showReferrals && (
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {referrals.length > 0 ? (
            referrals.map((referral: any, index: number) => (
              <div
                key={referral.id}
                className="flex items-center justify-between bg-black/30 rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-600/30 rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {referral.first_name || referral.username || 'Anonymous'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-400">+1000</div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-4">
              No referrals yet. Start inviting friends!
            </div>
          )}
        </div>
      )}

      {/* Bonus Info */}
      <div className="mt-4 bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
        <div className="text-xs text-purple-300">
          <strong>🎁 Referral Bonus:</strong> You and your friend both receive 1000 points + 100 energy when they join!
        </div>
      </div>
    </div>
  );
}
