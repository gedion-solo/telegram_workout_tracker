import React from 'react';
import { Trophy, Clock, Flame, Dumbbell, Award, ArrowRight } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

export const WorkoutSummaryModal: React.FC = () => {
  const { finishedSummary, clearFinishedSummary } = useWorkout();

  if (!finishedSummary) return null;

  const { workout, newPRsCount, prsList } = finishedSummary;
  const minutes = Math.floor(workout.durationSeconds / 60);
  const seconds = workout.durationSeconds % 60;

  const formatVolume = (vol: number) => {
    if (vol >= 1000) {
      return `${(vol / 1000).toFixed(2)} tons (${vol.toLocaleString()} kg)`;
    }
    return `${vol.toLocaleString()} kg`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="w-full max-w-sm liquid-glass-panel border border-[#8EB69B]/30 rounded-3xl p-6 shadow-xl relative overflow-hidden text-center">

        {/* Trophy icon header */}
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-emerald-400/10 border border-emerald-500/40 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/20">
          <Trophy className="w-8 h-8" />
          {newPRsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow">
              +{newPRsCount} PR
            </span>
          )}
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">Workout Crushed!</h2>
        <p className="text-sm text-slate-400 mt-1 mb-6 font-medium">{workout.name}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 text-left">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Duration</span>
            </div>
            <p className="text-base font-bold text-slate-100 font-mono">
              {minutes}m {seconds > 0 ? `${seconds}s` : ''}
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Volume</span>
            </div>
            <p className="text-base font-bold text-slate-100 truncate" title={`${workout.totalVolume} kg`}>
              {workout.totalVolume.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg</span>
            </p>
          </div>
        </div>

        {/* PR Highlights */}
        {prsList && prsList.length > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3.5 mb-6 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>New Personal Records ({prsList.length})</span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {prsList.map((pr, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium truncate max-w-[150px]">
                    {pr.exerciseName}
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {pr.weight} kg × {pr.reps}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={clearFinishedSummary}
          className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

