import React from 'react';
import { Timer, X, Plus, Minus } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

export const RestTimer: React.FC = () => {
  const { restTimer, adjustRestTimer, skipRestTimer } = useWorkout();

  if (!restTimer.active || restTimer.secondsRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(restTimer.secondsRemaining / 60);
  const seconds = restTimer.secondsRemaining % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const progressPercent = Math.min(
    100,
    Math.max(0, (restTimer.secondsRemaining / Math.max(1, restTimer.totalSeconds)) * 100)
  );

  return (
    <div className="fixed bottom-[68px] left-0 right-0 z-30 px-3 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="relative overflow-hidden liquid-glass-panel glass-specular border border-emerald-500/35 shadow-2xl backdrop-blur-xl rounded-2xl p-3 text-slate-100 transition-all duration-300">
          {/* Progress bar background fill */}
          <div
            className="absolute left-0 bottom-0 top-0 bg-emerald-500/10 pointer-events-none transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />

          <div className="relative flex items-center justify-between gap-2">
            {/* Timer Left Display */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Timer className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-xl font-bold text-emerald-400 tracking-tight">
                    {formattedTime}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Rest
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-[140px]">
                  {restTimer.exerciseName || 'Next set ready soon'}
                </p>
              </div>
            </div>

            {/* Quick action controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => adjustRestTimer(-15)}
                title="Subtract 15 seconds"
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium flex items-center gap-0.5 transition"
              >
                <Minus className="w-3 h-3" />
                15s
              </button>

              <button
                onClick={() => adjustRestTimer(30)}
                title="Add 30 seconds"
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-400 hover:text-emerald-300 border border-slate-700/60 text-xs font-semibold flex items-center gap-0.5 transition"
              >
                <Plus className="w-3 h-3" />
                30s
              </button>

              <button
                onClick={skipRestTimer}
                title="Skip rest timer"
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 active:scale-95 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Micro progress line at very bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

