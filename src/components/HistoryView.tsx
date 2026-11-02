import React, { useState } from 'react';
import {
  Trophy,
  ChevronDown,
  Trash2,
  Dumbbell,
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { SetTag } from '../types/workout';

export const HistoryView: React.FC = () => {
  const { history, getExerciseById, deleteWorkoutFromHistory } = useWorkout();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getTagBadgeStyle = (tag: SetTag) => {
    switch (tag) {
      case 'W':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'D':
        return 'bg-slate-800 text-emerald-400 border-slate-700';
      case 'F':
        return 'bg-slate-700 text-emerald-300 border-slate-600';
      case 'N':
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hrs}h ${remainMins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-3 pb-28 pt-1">
      {/* Clean, Uncluttered Header */}
      <div className="flex items-center justify-between px-1 mb-2">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Workout History</h1>
          <p className="text-xs text-slate-400 font-medium">
            {history.length} completed session{history.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Chronological Workout Feed */}
      <div className="space-y-2.5">
        {history.length === 0 ? (
          <div className="text-center py-14 px-4 liquid-glass-panel rounded-3xl text-slate-400 text-xs">
            <Dumbbell className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-60" />
            <p className="font-semibold text-slate-300">No logged workouts yet</p>
            <p className="text-[11px] text-slate-500 mt-1">Completed workouts will appear here</p>
          </div>
        ) : (
          history.map((workout) => {
            const isExpanded = expandedId === workout.id;
            const dateObj = new Date(workout.endTime);
            const dateFormatted = dateObj.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={workout.id}
                className="liquid-glass-card glass-specular hover:border-emerald-500/40 rounded-2xl overflow-hidden shadow-md transition-all duration-200"
              >
                {/* Main Card Header (Streamlined & Minimal) */}
                <div
                  onClick={() => toggleExpand(workout.id)}
                  className="p-3.5 cursor-pointer select-none flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white tracking-tight truncate">
                        {workout.name}
                      </h2>
                      {workout.prsHit > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold shrink-0">
                          <Trophy className="w-3 h-3" />
                          +{workout.prsHit} PR
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 font-medium">
                      <span>{dateFormatted}</span>
                      <span className="text-slate-600">•</span>
                      <span>{formatDuration(workout.durationSeconds)}</span>
                      <span className="text-slate-600">•</span>
                      <span>{workout.exercises.length} exercise{workout.exercises.length === 1 ? '' : 's'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-emerald-400' : 'text-slate-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Detailed Breakdown */}
                {isExpanded && (
                  <div className="p-3.5 pt-2 border-t border-slate-800/60 bg-slate-950/40 space-y-3 animate-fade-in">
                    {workout.exercises.map((compEx, exIdx) => {
                      const exDef = getExerciseById(compEx.exerciseId);

                      return (
                        <div key={exIdx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                            <span className="truncate">{exDef ? exDef.name : compEx.exerciseId}</span>
                            <span className="text-[10px] text-emerald-400 font-normal">
                              {exDef?.muscleGroup}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-1">
                            {compEx.sets.map((set, sIdx) => (
                              <div
                                key={sIdx}
                                className={`flex items-center justify-between py-1 px-2.5 rounded-lg text-xs font-mono ${
                                  set.isPR
                                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold'
                                    : 'bg-slate-900/80 border border-slate-800/80 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-500 text-[10px] w-3">#{sIdx + 1}</span>
                                  <span
                                    className={`text-[9px] font-black px-1 rounded border ${getTagBadgeStyle(
                                      set.tag
                                    )}`}
                                  >
                                    {set.tag}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span>
                                    {set.weight} kg × {set.reps}
                                  </span>
                                  {set.isPR && (
                                    <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                                      PR
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Delete workout action */}
                    <div className="pt-2 border-t border-slate-800/60 flex justify-end">
                      {deleteConfirmId === workout.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-medium">Delete session?</span>
                          <button
                            onClick={() => deleteWorkoutFromHistory(workout.id)}
                            className="px-2.5 py-1 bg-slate-700 text-slate-100 rounded-lg text-xs font-semibold hover:bg-slate-600 transition"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs hover:bg-slate-700 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(workout.id)}
                          className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
