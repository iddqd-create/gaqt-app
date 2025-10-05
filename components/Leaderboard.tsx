'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from './AppProvider';

interface LeaderboardUser {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  points: number;
  level: number;
}

export default function Leaderboard() {
  const { user } = useApp();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/leaderboard?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Fetch leaderboard error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">🏆 Leaderboard</h2>
        <div className="text-center text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <h2 className="text-xl font-bold text-white mb-4">🏆 Leaderboard</h2>
      
      <div className="space-y-2">
        {leaderboard.map((lbUser, index) => {
          const isCurrentUser = user && lbUser.telegram_id === user.telegram_id;
          const displayName = lbUser.first_name || lbUser.username || `User ${lbUser.telegram_id}`;
          
          return (
            <div
              key={lbUser.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                isCurrentUser 
                  ? 'bg-purple-600/30 border border-purple-500/50' 
                  : 'bg-gray-800/30 hover:bg-gray-800/50'
              }`}
            >
              <div className="w-12 text-center font-bold text-lg">
                {getRankEmoji(index)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">
                  {displayName}
                  {isCurrentUser && <span className="ml-2 text-xs text-purple-400">(You)</span>}
                </div>
                <div className="text-xs text-gray-500">Level {lbUser.level}</div>
              </div>
              
              <div className="text-right">
                <div className="font-bold text-yellow-400">
                  {lbUser.points.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          );
        })}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No users yet. Be the first!
        </div>
      )}
    </div>
  );
}
