import React, { useState } from 'react';
import { WorkoutProvider } from './context/WorkoutContext';
import { Navigation, TabType } from './components/Navigation';
import { WorkoutView } from './components/WorkoutView';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { ExercisesView } from './components/ExercisesView';
import { RestTimer } from './components/RestTimer';
import { WorkoutSummaryModal } from './components/WorkoutSummaryModal';
import { Dumbbell, Activity, ShieldCheck } from 'lucide-react';

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('workout');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none sm:select-auto relative overflow-x-hidden">
      {/* Liquid Glass Ambient Backdrops (Soft organic refractive lights) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-[#163832]/45 blur-[100px] animate-float-slow pointer-events-none" />
        <div className="absolute top-1/3 -right-28 w-[420px] h-[420px] rounded-full bg-[#235347]/35 blur-[120px] animate-float-delayed pointer-events-none" />
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#0B2B26]/70 blur-[90px] pointer-events-none" />
      </div>

      {/* Container constrained to mobile max-w-md mx-auto */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-4 pt-safe relative z-10">
        {/* Top App Header (Liquid Glass Capsule) */}
        <header className="liquid-glass-pill glass-specular px-3.5 py-2.5 rounded-2xl flex items-center justify-between mb-3.5 mt-1 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
              <Activity className="w-4 h-4 stroke-[2.8]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">Duo Fit</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-emerald-500/15 text-emerald-400 rounded-md border border-emerald-500/30">
                  TMA
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 liquid-glass-input px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-400"></span>
            <span className="font-medium text-slate-200">Offline-Ready</span>
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

