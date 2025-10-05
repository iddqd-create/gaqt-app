'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';

interface DailyQuest {
  id: string;
  multiplier: number;
  quest: {
    id: string;
    type: string;
    title: string;
    description: string;
    reward_points: number;
    reward_energy: number;
    affiliate_url?: string;
    icon_emoji: string;
  };
}

interface DailyQuestCardProps {
  dailyQuest: DailyQuest;
  onComplete?: () => void;
}

export default function DailyQuestCard({ dailyQuest, onComplete }: DailyQuestCardProps) {
  const { user, updateUser } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Calculate time until midnight
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartQuest = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);
    try {
      // Start quest
      await fetch('/api/quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          questId: dailyQuest.quest.id
        })
      });

      // Open affiliate link if exists
      if (dailyQuest.quest.affiliate_url) {
        window.open(dailyQuest.quest.affiliate_url, '_blank');
        
        // Auto-complete after 3 seconds
        setTimeout(() => {
          handleCompleteQuest();
        }, 3000);
      }
    } catch (error) {
      console.error('Start daily quest error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteQuest = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/quest', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          questId: dailyQuest.quest.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Apply daily multiplier
        const bonusPoints = Math.floor(dailyQuest.quest.reward_points * (dailyQuest.multiplier - 1));
        
        updateUser({
          points: data.user.points + bonusPoints,
          energy: data.user.energy,
          level: data.user.level
        });

        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Complete daily quest error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalReward = Math.floor(dailyQuest.quest.reward_points * dailyQuest.multiplier);

  return (
    <div className="relative bg-gradient-to-br from-orange-900/30 to-red-900/30 backdrop-blur-sm rounded-xl p-5 border-2 border-orange-500/50 hover:border-orange-400/70 transition-all duration-300 overflow-hidden">
      {/* Daily Quest Badge */}
      <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
        DAILY {dailyQuest.multiplier}X
      </div>

      {/* Countdown Timer */}
      <div className="absolute top-3 left-3 bg-black/50 text-orange-300 text-xs font-mono px-2 py-1 rounded">
        ⏰ {timeLeft}
      </div>

      <div className="flex items-start gap-4 mt-8">
        <div className="text-5xl">{dailyQuest.quest.icon_emoji}</div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{dailyQuest.quest.title}</h3>
          <p className="text-sm text-gray-300 mb-3">{dailyQuest.quest.description}</p>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <span className="text-orange-400 font-bold text-lg">+{totalReward.toLocaleString()}</span>
              <span className="text-xs text-gray-400">points</span>
              {dailyQuest.multiplier > 1 && (
                <span className="text-xs text-orange-400 font-bold ml-1">({dailyQuest.multiplier}X BONUS!)</span>
              )}
            </div>
            {dailyQuest.quest.reward_energy > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-green-400 font-bold">+{dailyQuest.quest.reward_energy}</span>
                <span className="text-xs text-gray-400">energy</span>
              </div>
            )}
          </div>

          <button
            onClick={handleStartQuest}
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-lg border-2 border-orange-500 bg-orange-600/30 hover:bg-orange-600/50 text-white font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-500/50"
          >
            {isProcessing ? 'Processing...' : '🔥 Complete Daily Quest'}
          </button>
        </div>
      </div>
    </div>
  );
}
