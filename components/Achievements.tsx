'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from './AppProvider';

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  icon_emoji: string;
  earned_at: Date;
}

export default function Achievements() {
  const { user } = useApp();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/achievements?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setAchievements(data.achievements);
      }
    } catch (error) {
      console.error('Fetch achievements error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const allAchievements = [
    { type: 'first_quest', name: 'First Steps', emoji: '🎯', description: 'Complete your first quest' },
    { type: 'wallet_connected', name: 'Web3 Pioneer', emoji: '💎', description: 'Connect your TON wallet' },
    { type: 'referral_master', name: 'Social Butterfly', emoji: '👥', description: 'Invite 5 friends' },
    { type: 'daily_streak', name: 'Daily Grinder', emoji: '🔥', description: 'Complete 7 daily quests in a row' },
    { type: 'top_10', name: 'Elite Player', emoji: '🏆', description: 'Reach top 10 on leaderboard' }
  ];

  const isEarned = (type: string) => {
    return achievements.some(a => a.achievement_type === type);
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">🏆 Achievements</h2>
        <div className="text-center text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">🏆 Achievements</h2>
        <div className="text-sm text-gray-400">
          {achievements.length} / {allAchievements.length} Unlocked
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {allAchievements.map((achievement) => {
          const earned = isEarned(achievement.type);
          const earnedData = achievements.find(a => a.achievement_type === achievement.type);

          return (
            <div
              key={achievement.type}
              className={`relative rounded-lg p-4 transition-all duration-300 ${
                earned
                  ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/50'
                  : 'bg-gray-800/30 border border-gray-700/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`text-4xl ${earned ? 'animate-bounce' : 'grayscale'}`}>
                  {achievement.emoji}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold ${earned ? 'text-yellow-300' : 'text-gray-500'}`}>
                      {achievement.name}
                    </h3>
                    {earned && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                        ✓ Unlocked
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${earned ? 'text-gray-300' : 'text-gray-600'}`}>
                    {achievement.description}
                  </p>
                  {earned && earnedData && (
                    <div className="text-xs text-gray-500 mt-1">
                      Earned on {new Date(earnedData.earned_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {earned && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">+500</div>
                    <div className="text-xs text-gray-500">bonus</div>
                  </div>
                )}
              </div>

              {!earned && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
                  <div className="text-4xl opacity-30">🔒</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">Collection Progress</span>
          <span className="text-sm text-gray-500">
            {Math.round((achievements.length / allAchievements.length) * 100)}%
          </span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
            style={{ width: `${(achievements.length / allAchievements.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
