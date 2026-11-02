import React, { useState } from 'react';
import { Search, Plus, Dumbbell, Trophy, X, Check, Sparkles } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { MuscleGroup, SplitCategory } from '../types/workout';

export const ExercisesView: React.FC = () => {
  const { exercises, addCustomExercise, getExercisePRs } = useWorkout();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Custom exercise form state
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState<MuscleGroup>('Chest');
  const [newExCategory, setNewExCategory] = useState<SplitCategory>('Upper');
  const [newExEquipment, setNewExEquipment] = useState<
    'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight'
  >('Barbell');
  const muscleGroups: ('All' | MuscleGroup)[] = [
    'All',
    'Chest',
    'Back',
    'Shoulders',
    'Legs',
    'Arms',
  ];

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscle = selectedMuscle === 'All' || ex.muscleGroup === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    addCustomExercise({
      name: newExName.trim(),
      muscleGroup: newExMuscle,
      category: newExCategory,
      equipment: newExEquipment,
    });

    setNewExName('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Exercise Library</h1>
          <p className="text-xs text-slate-400">
            {exercises.length} total movements available
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by movement name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full liquid-glass-input rounded-2xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-inner"
        />
      </div>

      {/* Muscle Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {muscleGroups.map((muscle) => (
          <button
            key={muscle}
            onClick={() => setSelectedMuscle(muscle)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedMuscle === muscle
                ? 'liquid-glass-cta font-bold shadow-md'
                : 'liquid-glass-pill text-slate-300 hover:text-white'
            }`}
          >
            {muscle}
          </button>
        ))}
      </div>

      {/* Exercises List */}
      <div className="space-y-2.5">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12 liquid-glass-panel rounded-2xl text-slate-400 text-xs">
            No movements match your filter.
          </div>
        ) : (
          filteredExercises.map((ex) => {
            const prs = getExercisePRs(ex.id);

            return (
              <div
                key={ex.id}
                className="liquid-glass-card glass-specular hover:border-emerald-500/40 rounded-2xl p-3.5 shadow-md transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-white truncate">{ex.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className="font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px]">
                        {ex.muscleGroup}
                      </span>
                      <span>•</span>
                      <span>{ex.equipment}</span>
                    </div>
                  </div>

                  {/* PRs preview */}
                  <div className="shrink-0 text-right">
                    {prs.heaviestWeight > 0 ? (
                      <div className="inline-flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-medium">Record</span>
                        <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                          <Trophy className="w-3 h-3 text-emerald-400" />
                          <span>{prs.heaviestWeight} kg</span>
                        </div>
                        {prs.estimated1RM > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            e1RM: {prs.estimated1RM} kg
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-600 font-mono">No PRs</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Exercise Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                Add Custom Exercise
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExercise} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Exercise Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bulgarian Split Squat"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Muscle Group
                  </label>
                  <select
                    value={newExMuscle}
                    onChange={(e) => setNewExMuscle(e.target.value as MuscleGroup)}
                    className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="Chest">Chest</option>
                    <option value="Back">Back</option>
                    <option value="Shoulders">Shoulders</option>
                    <option value="Legs">Legs</option>
                    <option value="Arms">Arms</option>
                    <option value="Core">Core</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Equipment
                  </label>
                  <select
                    value={newExEquipment}
                    onChange={(e) => setNewExEquipment(e.target.value as any)}
                    className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="Barbell">Barbell</option>
                    <option value="Dumbbell">Dumbbell</option>
                    <option value="Cable">Cable</option>
                    <option value="Machine">Machine</option>
                    <option value="Bodyweight">Bodyweight</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-750 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition"
                >
                  Create Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

