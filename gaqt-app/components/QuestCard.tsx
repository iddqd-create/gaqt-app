'use client';

import React, { useState } from 'react';
import { useApp } from './AppProvider';

interface Quest {
  id: string;
  type: 'affiliate' | 'iap' | 'social' | 'ton';
  title: string;
  description: string;
  reward_points: number;
  reward_energy: number;
  affiliate_url?: string;
  stars_price?: number;
  icon_emoji: string;
  status?: 'pending' | 'in_progress' | 'completed';
}

interface QuestCardProps {
  quest: Quest;
  onComplete?: () => void;
}

export default function QuestCard({ quest, onComplete }: QuestCardProps) {
  const { user, updateUser } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(quest.status || 'pending');

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
          questId: quest.id
        })
      });

      setStatus('in_progress');

      // Open affiliate link if exists
      if (quest.affiliate_url) {
        window.open(quest.affiliate_url, '_blank');
        
        // Auto-complete after 3 seconds (simulating user action)
        setTimeout(() => {
          handleCompleteQuest();
        }, 3000);
      }
    } catch (error) {
      console.error('Start quest error:', error);
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
          questId: quest.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setStatus('completed');
        
        // Update user state
        updateUser({
          points: data.user.points,
          energy: data.user.energy,
          level: data.user.level
        });

        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Complete quest error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    if (status === 'completed') return '✓ Completed';
    if (status === 'in_progress') return 'Complete Quest';
    return 'Start Quest';
  };

  const getButtonColor = () => {
    if (status === 'completed') return 'bg-green-600/30 border-green-500/50 text-green-400';
    if (status === 'in_progress') return 'bg-blue-600/30 border-blue-500/50 text-blue-400 hover:bg-blue-600/40';
    return 'bg-purple-600/30 border-purple-500/50 text-purple-300 hover:bg-purple-600/40';
  };

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="text-4xl">{quest.icon_emoji}</div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{quest.title}</h3>
          <p className="text-sm text-gray-400 mb-3">{quest.description}</p>
          
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 font-bold">+{quest.reward_points.toLocaleString()}</span>
              <span className="text-xs text-gray-500">points</span>
            </div>
            {quest.reward_energy > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-green-400 font-bold">+{quest.reward_energy}</span>
                <span className="text-xs text-gray-500">energy</span>
              </div>
            )}
          </div>

          <button
            onClick={status === 'in_progress' ? handleCompleteQuest : handleStartQuest}
            disabled={status === 'completed' || isProcessing}
            className={`w-full py-2 px-4 rounded-lg border font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonColor()}`}
          >
            {isProcessing ? 'Processing...' : getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}
