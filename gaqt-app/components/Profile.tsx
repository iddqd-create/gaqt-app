'use client';

import React from 'react';
import { useApp } from './AppProvider';

export default function Profile() {
  const { user } = useApp();

  if (!user) return null;

  const displayName = user.first_name || user.username || `User ${user.telegram_id}`;
  const energyPercent = (user.energy / 1000) * 100;
  const levelProgress = (user.points % 10000) / 10000 * 100;

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{displayName}</h2>
          <p className="text-gray-400 text-sm">@{user.username || 'anonymous'}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            {user.points.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">Points</div>
        </div>
      </div>

      {/* Level */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">Level {user.level}</span>
          <span className="text-xs text-gray-500">{user.points % 10000} / 10,000 XP</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
      </div>

      {/* Energy */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">⚡ Energy</span>
          <span className="text-xs text-gray-500">{user.energy} / 1,000</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${energyPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
