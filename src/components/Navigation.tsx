import React from 'react';
import { Dumbbell, TrendingUp, History, Library } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

export type TabType = 'workout' | 'dashboard' | 'history' | 'exercises';

interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const { activeSession } = useWorkout();

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'history', label: 'History', icon: History },
    { id: 'exercises', label: 'Exercises', icon: Library },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-safe">
      <div className="max-w-md mx-auto px-3.5 pb-2.5 pt-1 pointer-events-auto">
        <div className="liquid-glass-panel rounded-3xl py-1.5 px-2 flex items-center justify-around shadow-lg border border-[#8EB69B]/20">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isWorkoutTab = item.id === 'workout';
            const hasActiveWorkout = isWorkoutTab && activeSession !== null;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 select-none ${
                  isActive
                    ? 'text-emerald-500 bg-white/10 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 transition-transform duration-150 ${
                      isActive ? 'scale-110 stroke-[2.3]' : 'stroke-[1.8]'
                    }`}
                  />
                  {/* Active workout indicator dot */}
                  {hasActiveWorkout && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-sm shadow-emerald-400"></span>
                    </span>
                  )}
                </div>
                <span className={`text-[11px] mt-1 font-medium tracking-tight ${isActive ? 'text-emerald-500 font-bold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

