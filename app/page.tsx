'use client';

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/components/AppProvider';
import Profile from '@/components/Profile';
import QuestCard from '@/components/QuestCard';
import DailyQuestCard from '@/components/DailyQuestCard';
import Leaderboard from '@/components/Leaderboard';
import ReferralInvite from '@/components/ReferralInvite';
import Achievements from '@/components/Achievements';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

function MainApp() {
  const { user, isLoading, error } = useApp();
  const [activeTab, setActiveTab] = useState<'quests' | 'leaderboard' | 'referral' | 'achievements'>('quests');
  const [quests, setQuests] = useState<any[]>([]);
  const [dailyQuests, setDailyQuests] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchQuests();
      fetchDailyQuests();
    }
  }, [user]);

  const fetchQuests = async () => {
    try {
      const response = await fetch('/api/quest');
      const data = await response.json();
      
      if (data.success) {
        setQuests(data.quests);
      }
    } catch (error) {
      console.error('Fetch quests error:', error);
    }
  };

  const fetchDailyQuests = async () => {
    try {
      const response = await fetch('/api/quest/daily');
      const data = await response.json();
      
      if (data.success) {
        setDailyQuests(data.dailyQuests);
      }
    } catch (error) {
      console.error('Fetch daily quests error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading G.A.Q.T...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4">
        <div className="text-center bg-red-900/20 border border-red-500/50 rounded-xl p-6 max-w-md">
          <p className="text-red-400 text-lg mb-2">⚠️ Error</p>
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4">
        <div className="text-center">
          <p className="text-white text-lg">Please open this app from Telegram</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            G.A.Q.T.
          </h1>
          <p className="text-xs text-gray-400">Gamified Affiliate Quest Tracker</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <Profile />

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-2 bg-gray-900/50 backdrop-blur-sm rounded-xl p-1 border border-white/10">
          <button
            onClick={() => setActiveTab('quests')}
            className={`py-3 px-2 rounded-lg font-medium text-xs transition-all duration-200 ${
              activeTab === 'quests'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🎯 Quests
          </button>
          <button
            onClick={() => setActiveTab('referral')}
            className={`py-3 px-2 rounded-lg font-medium text-xs transition-all duration-200 ${
              activeTab === 'referral'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            👥 Invite
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`py-3 px-2 rounded-lg font-medium text-xs transition-all duration-200 ${
              activeTab === 'achievements'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🏆 Badges
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-3 px-2 rounded-lg font-medium text-xs transition-all duration-200 ${
              activeTab === 'leaderboard'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Ranks
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'quests' && (
          <div className="space-y-6">
            {/* Daily Quests Section */}
            {dailyQuests.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">🔥 Daily Quests</h2>
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                    Limited Time!
                  </span>
                </div>
                {dailyQuests.map((dailyQuest) => (
                  <DailyQuestCard 
                    key={dailyQuest.id} 
                    dailyQuest={dailyQuest} 
                    onComplete={fetchDailyQuests} 
                  />
                ))}
              </div>
            )}

            {/* Regular Quests Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Available Quests</h2>
              {quests.length > 0 ? (
                quests.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} onComplete={fetchQuests} />
                ))
              ) : (
                <div className="text-center text-gray-400 py-8 bg-gray-900/30 rounded-xl border border-white/10">
                  No quests available at the moment
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'referral' && <ReferralInvite />}
        
        {activeTab === 'achievements' && <Achievements />}

        {activeTab === 'leaderboard' && <Leaderboard />}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <TonConnectUIProvider manifestUrl="https://raw.githubusercontent.com/ton-community/tutorials/main/03-client/test/public/tonconnect-manifest.json">
      <AppProvider>
        <MainApp />
      </AppProvider>
    </TonConnectUIProvider>
  );
}
