import React, { useState } from 'react';
import { X, Search, Plus, Check, Dumbbell, Sparkles, ArrowLeft } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { MuscleGroup, SplitCategory } from '../types/workout';

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  alreadySelectedIds?: string[];
}

export const ExerciseModal: React.FC<ExerciseModalProps> = ({
  isOpen,
  onClose,
  alreadySelectedIds = [],
}) => {
  const { exercises, addExerciseToActiveWorkout, addCustomExercise } = useWorkout();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>('All');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  // Custom exercise form state
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('Chest');
  const [customCategory, setCustomCategory] = useState<SplitCategory>('Upper');
  const [customEquipment, setCustomEquipment] = useState<
    'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight'
  >('Barbell');

  if (!isOpen) return null;

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

  const handleSelect = (exerciseId: string) => {
    addExerciseToActiveWorkout(exerciseId);
    onClose();
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newEx = addCustomExercise({
      name: customName.trim(),
      muscleGroup: customMuscle,
      category: customCategory,
      equipment: customEquipment,
    });

    // Automatically add to active workout!
    addExerciseToActiveWorkout(newEx.id);
    setCustomName('');
    setIsCreatingCustom(false);
    onClose();
  };

  const handleStartCustomWithSearch = () => {
    setCustomName(searchTerm.trim());
    setIsCreatingCustom(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md liquid-glass-panel glass-specular rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCreatingCustom ? (
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 mr-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Dumbbell className="w-4 h-4" />
              </div>
            )}
            <h2 className="text-base font-bold text-white tracking-tight">
              {isCreatingCustom ? 'Create New Exercise' : 'Select Exercise'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Exercise Form View */}
        {isCreatingCustom ? (
          <form onSubmit={handleSaveCustom} className="p-4 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Exercise Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bulgarian Split Squat, Hammer Chest Press"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Muscle Group
                </label>
                <select
                  value={customMuscle}
                  onChange={(e) => setCustomMuscle(e.target.value as MuscleGroup)}
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
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value as any)}
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

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Split Category
              </label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as SplitCategory)}
                className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="Upper">Upper Body</option>
                <option value="Lower">Lower Body</option>
                <option value="Full Body">Full Body</option>
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-750 transition"
              >
                Back to List
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save & Add</span>
              </button>
            </div>
          </form>
        ) : (
          /* Normal Exercise Browser View */
          <>
            {/* Search & Create Bar */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-900/50 space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search exercise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomName(searchTerm.trim());
                    setIsCreatingCustom(true);
                  }}
                  title="Create your own custom exercise"
                  className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1 shrink-0 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>

              {/* Muscle Category Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {muscleGroups.map((muscle) => (
                  <button
                    key={muscle}
                    onClick={() => setSelectedMuscle(muscle)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedMuscle === muscle
                        ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                    }`}
                  >
                    {muscle}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-850">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-10 px-4 text-slate-400 space-y-3">
                  <p className="text-xs">No movements found matching "{searchTerm}"</p>
                  <button
                    type="button"
                    onClick={handleStartCustomWithSearch}
                    className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create "{searchTerm || 'Custom Exercise'}"
                  </button>
                </div>
              ) : (
                filteredExercises.map((ex) => {
                  const isAlreadyAdded = alreadySelectedIds.includes(ex.id);

                  return (
                    <div
                      key={ex.id}
                      className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-850/60 rounded-xl transition"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-100 truncate">{ex.name}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {ex.muscleGroup}
                          </span>
                          <span className="text-[11px] text-slate-400">{ex.equipment}</span>
                          <span className="text-[11px] text-slate-500">• {ex.category}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelect(ex.id)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          isAlreadyAdded
                            ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/15'
                        }`}
                      >
                        {isAlreadyAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            In Workout
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
