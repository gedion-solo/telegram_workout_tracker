import React, { useState } from 'react';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { Navigation, TabType } from './components/Navigation';
import { WorkoutView } from './components/WorkoutView';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { ExercisesView } from './components/ExercisesView';
import { RestTimer } from './components/RestTimer';
import { WorkoutSummaryModal } from './components/WorkoutSummaryModal';
import { Dumbbell, Activity, ShieldCheck, Cloud, Wifi } from 'lucide-react';

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('workout');
  const { telegramUser, cloudSyncStatus } = useWorkout();

  return (
    <div className="min-h-screen bg-[#051F20] text-[#DAF1DE] flex flex-col font-sans select-none sm:select-auto relative overflow-x-hidden">
      {/* Container constrained to mobile max-w-md mx-auto */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-4 pt-safe relative z-10 pb-6">
        {/* Top App Header */}
        <header className="liquid-glass-pill px-3.5 py-2.5 rounded-2xl flex items-center justify-between mb-3.5 mt-1 border border-[#8EB69B]/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-sm">
              <Activity className="w-4 h-4 stroke-[2.8]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">Duo Fit</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-emerald-500/15 text-emerald-400 rounded-md border border-emerald-500/30">
                  {telegramUser.isTelegram ? 'TMA' : 'PREVIEW'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px] leading-tight">
                {telegramUser.username ? `@${telegramUser.username}` : telegramUser.firstName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 liquid-glass-input px-2.5 py-1 rounded-full">
            <span
              className={`w-2 h-2 rounded-full ${
                cloudSyncStatus === 'synced'
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse'
                  : cloudSyncStatus === 'syncing'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="font-medium text-slate-200">
              {cloudSyncStatus === 'synced'
                ? 'Cloud Synced'
                : cloudSyncStatus === 'syncing'
                ? 'Syncing...'
                : 'Offline-Ready'}
            </span>
          </div>
        </header>

        {/* Tab View Content */}
        <main className="flex-1">
          {currentTab === 'workout' && <WorkoutView />}
          {currentTab === 'dashboard' && <DashboardView />}
          {currentTab === 'history' && <HistoryView />}
          {currentTab === 'exercises' && <ExercisesView />}
        </main>

        {/* Floating Rest Timer */}
        <RestTimer />

        {/* Sticky Bottom Navigation Bar */}
        <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Celebration / PR Summary Modal */}
        <WorkoutSummaryModal />
      </div>
    </div>
  );
};

export function App() {
  return (
    <WorkoutProvider>
      <AppContent />
    </WorkoutProvider>
  );
}

export default App;

