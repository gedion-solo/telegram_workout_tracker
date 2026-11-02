import React, { useState, useEffect } from 'react';
import {
  Play,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  Dumbbell,
  AlertCircle,
  X,
  Sparkles,
  Zap,
  Flame,
  Pencil,
  Bookmark,
  BookmarkCheck,
  Save,
  Search,
  FolderPlus,
} from 'lucide-react';
import { useWorkout, calculateWarmupSuggestions, WarmupSetPlan } from '../context/WorkoutContext';
import { ExerciseModal } from './ExerciseModal';
import { SetTag, WorkoutSet, SplitCategory, MuscleGroup } from '../types/workout';

export const WorkoutView: React.FC = () => {
  const {
    exercises,
    templates,
    activeSession,
    startWorkout,
    renameActiveWorkout,
    saveActiveWorkoutAsTemplate,
    createCustomTemplate,
    deleteTemplate,
    cancelWorkout,
    finishWorkout,
    removeExerciseFromActiveWorkout,
    addSet,
    removeSet,
    updateSet,
    toggleSetCompleted,
    cycleSetTag,
    insertWarmupSets,
    getExerciseById,
    addCustomExercise,
  } = useWorkout();

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Dedicated Routine Builder Page State
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);
  const [workoutInputName, setWorkoutInputName] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [builderSearch, setBuilderSearch] = useState('');
  const [builderMuscleFilter, setBuilderMuscleFilter] = useState<MuscleGroup | 'All'>('All');

  // Telegram WebApp BackButton integration when in Create Routine page
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.BackButton) {
      const backButton = (window as any).Telegram.WebApp.BackButton;
      if (isCreatingRoutine) {
        backButton.show();
        const handleBack = () => {
          setIsCreatingRoutine(false);
          resetBuilderForm();
        };
        backButton.onClick(handleBack);
        return () => {
          backButton.offClick(handleBack);
          backButton.hide();
        };
      } else {
        backButton.hide();
      }
    }
  }, [isCreatingRoutine]);

  // Inline exercise creator within routine builder
  const [showInlineExerciseForm, setShowInlineExerciseForm] = useState(false);
  const [inlineName, setInlineName] = useState('');
  const [inlineMuscle, setInlineMuscle] = useState<MuscleGroup>('Chest');
  const [inlineEquipment, setInlineEquipment] = useState<'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight'>('Barbell');

  // Success toast for created routine (persisted on idle view)
  const [createdToastMessage, setCreatedToastMessage] = useState<string | null>(null);

  // In-workout rename state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameEditValue, setNameEditValue] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Dismissed warmup banners per active exercise ID
  const [dismissedWarmups, setDismissedWarmups] = useState<Record<string, boolean>>({});

  // Manual Warmup Calculator Modal
  const [warmupCalcExId, setWarmupCalcExId] = useState<string | null>(null);
  const [calcInputWeight, setCalcInputWeight] = useState<string>('');

  // Live workout timer
  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0);
      return;
    }
    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeSession.startTime) / 1000)));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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

  const handleApplyWarmup = (activeExId: string, plans: WarmupSetPlan[]) => {
    insertWarmupSets(activeExId, plans);
    setDismissedWarmups((prev) => ({ ...prev, [activeExId]: true }));
    setWarmupCalcExId(null);
  };

  const resetBuilderForm = () => {
    setWorkoutInputName('');
    setSelectedExerciseIds([]);
    setBuilderSearch('');
    setBuilderMuscleFilter('All');
    setShowInlineExerciseForm(false);
    setInlineName('');
    setInlineMuscle('Chest');
    setInlineEquipment('Barbell');
  };

  const handleToggleExerciseInBuilder = (exId: string) => {
    setSelectedExerciseIds((prev) =>
      prev.includes(exId) ? prev.filter((id) => id !== exId) : [...prev, exId]
    );
  };

  const handleRemoveExerciseFromBuilder = (exId: string) => {
    setSelectedExerciseIds((prev) => prev.filter((id) => id !== exId));
  };

  const handleCreateInlineExerciseInBuilder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inlineName.trim()) return;

    const newEx = addCustomExercise({
      name: inlineName.trim(),
      muscleGroup: inlineMuscle,
      category: 'Full Body',
      equipment: inlineEquipment,
    });

    setSelectedExerciseIds((prev) => [...prev, newEx.id]);
    setInlineName('');
    setShowInlineExerciseForm(false);
  };

  const handleSaveRoutineOnly = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = workoutInputName.trim() || 'My Workout';
    createCustomTemplate(
      finalName,
      'Full Body',
      selectedExerciseIds
    );

    setIsCreatingRoutine(false);
    resetBuilderForm();
    setCreatedToastMessage(`Workout routine "${finalName}" saved! Tap Start below whenever you're ready.`);
    setTimeout(() => {
      setCreatedToastMessage(null);
    }, 4500);
  };

  const handleSaveAndStartRoutine = () => {
    const finalName = workoutInputName.trim() || 'My Workout';
    const newTpl = createCustomTemplate(
      finalName,
      'Full Body',
      selectedExerciseIds
    );

    setIsCreatingRoutine(false);
    resetBuilderForm();
    startWorkout(newTpl.id, newTpl.name);
  };

  const handleSaveRename = () => {
    if (nameEditValue.trim()) {
      renameActiveWorkout(nameEditValue.trim());
    }
    setIsEditingName(false);
  };

  const filteredBuilderExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(builderSearch.toLowerCase());
    const matchesMuscle = builderMuscleFilter === 'All' || ex.muscleGroup === builderMuscleFilter;
    return matchesSearch && matchesMuscle;
  });

  // ----------------------------------------------------
  // IDLE STATE (NO ACTIVE WORKOUT)
  // ----------------------------------------------------
  if (!activeSession) {
    // Dedicated Full-Page Routine Builder View
    if (isCreatingRoutine) {
      return (
        <div className="space-y-4 pb-32 pt-2 animate-fade-in">
          {/* Top Header with Back button, Title, and Save action */}
          <div className="flex items-center justify-between py-1 border-b border-slate-850/80 pb-3">
            <button
              type="button"
              onClick={() => {
                setIsCreatingRoutine(false);
                resetBuilderForm();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 active:scale-95 transition"
            >
              <ChevronLeft className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold">Back</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <FolderPlus className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-bold text-white tracking-tight">Create Workout</h1>
            </div>

            <button
              type="button"
              onClick={handleSaveRoutineOnly}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition"
            >
              Save
            </button>
          </div>

          {/* Workout Name Input Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <label className="text-xs font-bold text-slate-200 block mb-1.5">
              Workout Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chest & Triceps, Leg Power, Pull Day"
              value={workoutInputName}
              onChange={(e) => setWorkoutInputName(e.target.value)}
              className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Selected Exercises Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <span>Selected Exercises ({selectedExerciseIds.length})</span>
              </span>
              {selectedExerciseIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedExerciseIds([])}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition"
                >
                  Clear all
                </button>
              )}
            </div>

            {selectedExerciseIds.length === 0 ? (
              <div className="p-4 bg-slate-950/60 border border-dashed border-slate-800/80 rounded-xl text-center text-slate-500 text-xs">
                No exercises added yet. Tap (+) on movements from the library below.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {selectedExerciseIds.map((exId, idx) => {
                  const ex = getExerciseById(exId);
                  return (
                    <div key={exId} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-400 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            {ex ? ex.name : exId}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {ex?.muscleGroup} • {ex?.equipment}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExerciseFromBuilder(exId)}
                        className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Exercise Picker Library - Full Page Native Flow */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Exercise Library</span>
              <button
                type="button"
                onClick={() => setShowInlineExerciseForm(!showInlineExerciseForm)}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showInlineExerciseForm ? 'Hide Form' : 'New Custom Exercise'}</span>
              </button>
            </div>

            {/* Inline Exercise Creator Form if expanded */}
            {showInlineExerciseForm && (
              <div className="p-3.5 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-emerald-400 block">Create & Add Exercise</span>
                <input
                  type="text"
                  placeholder="Exercise name (e.g. Incline DB Fly)"
                  value={inlineName}
                  onChange={(e) => setInlineName(e.target.value)}
                  className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl px-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Muscle Group</label>
                    <select
                      value={inlineMuscle}
                      onChange={(e) => setInlineMuscle(e.target.value as MuscleGroup)}
                      className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl px-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Chest">Chest</option>
                      <option value="Back">Back</option>
                      <option value="Legs">Legs</option>
                      <option value="Shoulders">Shoulders</option>
                      <option value="Arms">Arms</option>
                      <option value="Core">Core</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Equipment</label>
                    <select
                      value={inlineEquipment}
                      onChange={(e) => setInlineEquipment(e.target.value as any)}
                      className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl px-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Barbell">Barbell</option>
                      <option value="Dumbbell">Dumbbell</option>
                      <option value="Cable">Cable</option>
                      <option value="Machine">Machine</option>
                      <option value="Bodyweight">Bodyweight</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCreateInlineExerciseInBuilder}
                  disabled={!inlineName.trim()}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition"
                >
                  Add to Library & Routine
                </button>
              </div>
            )}

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={builderSearch}
                onChange={(e) => setBuilderSearch(e.target.value)}
                className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
              />
              {builderSearch && (
                <button
                  type="button"
                  onClick={() => setBuilderSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Muscle Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
              {(['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'] as ('All' | MuscleGroup)[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBuilderMuscleFilter(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition select-none ${
                    builderMuscleFilter === m
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-950/80 text-slate-400 border border-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Exercise Items List - naturally flows on the page! */}
            <div className="space-y-1.5 pt-1">
              {filteredBuilderExercises.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No matching exercises found.
                </div>
              ) : (
                filteredBuilderExercises.map((ex) => {
                  const isSelected = selectedExerciseIds.includes(ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => handleToggleExerciseInBuilder(ex.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition select-none ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-semibold text-xs truncate">{ex.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{ex.muscleGroup}</span>
                          <span>•</span>
                          <span>{ex.equipment}</span>
                        </div>
                      </div>

                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-750'
                        }`}
                      >
                        {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleSaveRoutineOnly}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2"
            >
              <BookmarkCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Save Workout (Start Later)</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndStartRoutine}
              className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-850 active:scale-[0.99] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Save & Start Workout Now</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5 pb-24 pt-1">
        {/* Success notification if a routine was just created */}
        {createdToastMessage && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 animate-fade-in text-emerald-300 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold truncate">{createdToastMessage}</span>
            </div>
            <button
              onClick={() => setCreatedToastMessage(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 1. Saved Routines & Templates Section (FIRST) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-tight">Saved Templates</h1>
                <p className="text-[11px] text-slate-400 font-medium">Select a routine to start training</p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold px-2.5 py-0.5 rounded-full liquid-glass-input">
              {templates.length} available
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="liquid-glass-card glass-specular hover:border-emerald-500/40 rounded-2xl p-4 transition-all duration-200 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-slate-100">{tpl.name}</h3>
                    {/* Delete button if user added custom template */}
                    {!['template-upper-a', 'template-lower-a', 'template-upper-b', 'template-lower-b'].includes(tpl.id) && (
                      <button
                        type="button"
                        onClick={() => deleteTemplate(tpl.id)}
                        title="Delete routine"
                        className="p-1 text-slate-500 hover:text-slate-300 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Exercise badges preview */}
                  <div className="flex flex-wrap gap-1 mb-3.5">
                    {tpl.exerciseIds.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic">No exercises added yet</span>
                    ) : (
                      tpl.exerciseIds.map((exId: string) => {
                        const ex = getExerciseById(exId);
                        return (
                          <span
                            key={exId}
                            className="text-[10px] bg-slate-950/80 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md"
                          >
                            {ex ? ex.name : exId}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                <button
                  onClick={() => startWorkout(tpl.id, tpl.name)}
                  className="w-full py-2.5 px-3 liquid-glass-pill hover:bg-white/10 active:scale-[0.99] text-slate-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                  <span>Start {tpl.name}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. New Workout & Quick Start Options (BELOW TEMPLATES) */}
        <div className="liquid-glass-panel glass-specular rounded-3xl p-4 shadow-xl relative space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Other Options</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                resetBuilderForm();
                setIsCreatingRoutine(true);
              }}
              className="flex-1 py-3 px-4 liquid-glass-cta active:scale-[0.98] text-slate-950 font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 transition text-xs"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create New Workout</span>
            </button>

            <button
              onClick={() => startWorkout(undefined, 'Quick Workout')}
              title="Start an empty session immediately"
              className="py-3 px-4 liquid-glass-pill active:scale-[0.98] text-slate-200 font-semibold rounded-2xl flex items-center justify-center gap-1.5 transition text-xs shrink-0 shadow-md"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
              <span>Quick Start</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ACTIVE WORKOUT STATE
  // ----------------------------------------------------
  const alreadySelectedIds = activeSession.exercises.map((e) => e.exerciseId);

  return (
    <div className="space-y-4 pb-32 pt-2">
      {/* Sticky Active Workout Header */}
      <div className="sticky top-0 z-20 liquid-glass-panel glass-specular pt-2 pb-3.5 border-b border-slate-800/80 -mx-4 px-4 rounded-b-2xl shadow-xl">
        <div className="flex items-center justify-between gap-2">
          {/* Workout Title & Rename */}
          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={nameEditValue}
                  onChange={(e) => setNameEditValue(e.target.value)}
                  onBlur={handleSaveRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                  }}
                  className="bg-slate-900 border border-emerald-500 rounded-lg px-2 py-1 text-sm font-bold text-white focus:outline-none w-full"
                  autoFocus
                />
                <button
                  onClick={handleSaveRename}
                  className="p-1 text-emerald-400 hover:text-emerald-300 shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group cursor-pointer"
                onClick={() => {
                  setNameEditValue(activeSession.name);
                  setIsEditingName(true);
                }}
              >
                <h1 className="text-base font-bold text-white truncate tracking-tight">
                  {activeSession.name}
                </h1>
                <button
                  type="button"
                  title="Rename workout"
                  className="p-1 text-slate-500 group-hover:text-slate-300 transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1 text-xs font-mono font-semibold text-emerald-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(elapsedSeconds)}</span>
              </div>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">
                {activeSession.exercises.length} movement{activeSession.exercises.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Save as Routine Button */}
            <button
              onClick={() => {
                saveActiveWorkoutAsTemplate();
                setShowSavedToast(true);
                setTimeout(() => setShowSavedToast(false), 2200);
              }}
              title="Save this routine for future use"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-850 transition"
            >
              {showSavedToast ? (
                <BookmarkCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => setShowDiscardConfirm(true)}
              title="Discard workout"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={finishWorkout}
              className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 transition"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Finish</span>
            </button>
          </div>
        </div>

        {/* Saved to Routines Toast */}
        {showSavedToast && (
          <div className="mt-2 py-1 px-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center text-xs font-semibold text-emerald-300 animate-fade-in flex items-center justify-center gap-1.5">
            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Saved as a routine for future workouts!</span>
          </div>
        )}
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Discard Workout?</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              This will cancel the current session and discard all unrecorded sets.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition"
              >
                Keep Going
              </button>
              <button
                onClick={() => {
                  setShowDiscardConfirm(false);
                  cancelWorkout();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs transition"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Exercises Cards */}
      {activeSession.exercises.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-900 border border-slate-800 rounded-3xl">
          <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No exercises added yet</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Tap below to select movements from the library or create custom ones
          </p>
          <button
            onClick={() => setIsExerciseModalOpen(true)}
            className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            Add First Exercise
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSession.exercises.map((actEx, exIndex) => {
            const exerciseDef = getExerciseById(actEx.exerciseId);
            const isCompoundMuscle =
              exerciseDef &&
              ['Chest', 'Back', 'Legs', 'Shoulders'].includes(exerciseDef.muscleGroup);

            // Only recommend warmup for the very first exercise of the workout OR when starting a new muscle group
            const isFirstExercise = exIndex === 0;
            const isFirstExerciseOfMuscleGroup = Boolean(
              exerciseDef &&
              !activeSession.exercises.slice(0, exIndex).some((prevActEx) => {
                const prevDef = getExerciseById(prevActEx.exerciseId);
                return prevDef?.muscleGroup === exerciseDef.muscleGroup;
              })
            );
            const shouldRecommendWarmup = isFirstExercise || isFirstExerciseOfMuscleGroup;

            // Determine working weight for warmup suggestion
            const firstWorkingSet = actEx.sets.find((s) => s.tag === 'N' || s.tag === 'F');
            const detectedWorkingWeight =
              (firstWorkingSet?.weight && firstWorkingSet.weight > 0)
                ? firstWorkingSet.weight
                : null;

            const hasWarmupSets = actEx.sets.some((s) => s.tag === 'W');
            const isWarmupDismissed = dismissedWarmups[actEx.id];

            const suggestedWarmups: WarmupSetPlan[] =
              shouldRecommendWarmup &&
              isCompoundMuscle &&
              !hasWarmupSets &&
              detectedWorkingWeight &&
              detectedWorkingWeight >= 20
                ? calculateWarmupSuggestions(detectedWorkingWeight)
                : [];

            return (
              <div
                key={actEx.id}
                className="liquid-glass-card glass-specular rounded-2xl overflow-hidden shadow-lg transition-all"
              >
                {/* Exercise Card Header */}
                <div className="p-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        #{exIndex + 1}
                      </span>
                      <h2 className="text-sm font-bold text-white truncate">
                        {exerciseDef ? exerciseDef.name : 'Unknown Movement'}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {exerciseDef?.muscleGroup} • {exerciseDef?.equipment}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Warmup Calculator button for first exercise or new muscle group */}
                    {shouldRecommendWarmup && isCompoundMuscle && !hasWarmupSets && (
                      <button
                        type="button"
                        onClick={() => {
                          setWarmupCalcExId(actEx.id);
                          setCalcInputWeight(
                            detectedWorkingWeight
                              ? `${detectedWorkingWeight}`
                              : firstWorkingSet?.previousWeight
                              ? `${firstWorkingSet.previousWeight}`
                              : '60'
                          );
                        }}
                        title="Calculate progressive warmup sets"
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-[11px] font-bold flex items-center gap-1 transition"
                      >
                        <Flame className="w-3 h-3 text-emerald-400" />
                        <span>Warmup</span>
                      </button>
                    )}

                    <button
                      onClick={() => removeExerciseFromActiveWorkout(actEx.id)}
                      title="Remove Exercise"
                      className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mini Algorithm: Automated Warmup Suggestion Banner */}
                {suggestedWarmups.length > 0 && !isWarmupDismissed && (
                  <div className="mx-3 mt-3 p-3 bg-gradient-to-r from-slate-800/80 via-slate-800/50 to-slate-900 border border-slate-700 rounded-xl text-xs animate-fade-in">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                        <Flame className="w-4 h-4 text-emerald-400" />
                        <span>
                          Warmup suggestion • {isFirstExercise ? 'First exercise' : `New muscle (${exerciseDef?.muscleGroup})`} ({suggestedWarmups.length} sets)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setDismissedWarmups((prev) => ({ ...prev, [actEx.id]: true }))
                        }
                        className="p-0.5 text-slate-400 hover:text-white"
                        title="Dismiss warmup recommendation"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-300 mb-2 leading-tight">
                      Primes neuromuscular pathways before heavy working sets:
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {suggestedWarmups.map((ws, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-200 font-mono text-[11px] flex items-center gap-1"
                        >
                          <span className="text-emerald-400 font-black">W{i + 1}:</span>
                          <span className="font-bold">{ws.weight}kg</span> × {ws.reps}
                          <span className="text-[9px] text-slate-400">({ws.label.split(' ')[0]})</span>
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyWarmup(actEx.id, suggestedWarmups)}
                      className="w-full py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Add {suggestedWarmups.length} Warmup Sets Before Working Sets</span>
                    </button>
                  </div>
                )}

                {/* Set Table */}
                <div className="p-3">
                  {/* Table Column Headers */}
                  <div className="grid grid-cols-12 gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                    <span className="col-span-2 text-center" title="Tap tag to cycle Set Tag (W/N/D/F)">
                      Set
                    </span>
                    <span className="col-span-3 text-center">Previous</span>
                    <span className="col-span-3 text-center">kg</span>
                    <span className="col-span-2 text-center">Reps</span>
                    <span className="col-span-2 text-center">Done</span>
                  </div>

                  {/* Sets Rows */}
                  <div className="space-y-1.5">
                    {actEx.sets.map((set, setIdx) => {
                      const isComplete = set.completed;
                      const hasGhost =
                        set.previousWeight !== undefined || set.previousReps !== undefined;

                      return (
                        <div
                          key={set.id}
                          className={`grid grid-cols-12 gap-1.5 items-center rounded-xl p-1 transition-colors relative group ${
                            isComplete
                              ? 'bg-emerald-500/10 border border-emerald-500/25'
                              : 'bg-slate-950/60 border border-slate-800/80 hover:border-slate-750'
                          }`}
                        >
                          {/* Column 1: Set Number & Cycle Tag */}
                          <div className="col-span-2 flex items-center justify-center gap-1">
                            <span className="text-xs font-mono font-bold text-slate-400 w-3 text-center">
                              {setIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => cycleSetTag(actEx.id, set.id)}
                              title={`Tag: ${set.tag} (tap to cycle: N normal, W warmup, D drop, F failure)`}
                              className={`w-5 h-5 rounded text-[10px] font-extrabold border flex items-center justify-center transition ${getTagBadgeStyle(
                                set.tag
                              )}`}
                            >
                              {set.tag}
                            </button>
                          </div>

                          {/* Column 2: Previous Set Stats */}
                          <div className="col-span-3 text-center">
                            {hasGhost ? (
                              <span className="text-[11px] font-mono text-slate-400 truncate block">
                                {set.previousWeight ?? 0}
                                <span className="text-[10px] text-slate-500">kg</span> ×{' '}
                                {set.previousReps ?? 0}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600 font-mono">-</span>
                            )}
                          </div>

                          {/* Column 3: kg Input (inputMode="decimal") */}
                          <div className="col-span-3">
                            <input
                              type="number"
                              step="any"
                              inputMode="decimal"
                              placeholder={
                                set.previousWeight !== undefined ? `${set.previousWeight}` : '0'
                              }
                              value={set.weight !== null ? set.weight : ''}
                              onChange={(e) => {
                                const val =
                                  e.target.value === '' ? null : parseFloat(e.target.value);
                                updateSet(actEx.id, set.id, { weight: val });
                              }}
                              className={`w-full py-1.5 px-2 text-center rounded-lg font-mono text-sm font-semibold transition focus:outline-none ${
                                isComplete
                                  ? 'bg-transparent text-emerald-300'
                                  : 'bg-slate-900 border border-slate-750 text-white placeholder:text-slate-600 focus:border-emerald-500'
                              }`}
                            />
                          </div>

                          {/* Column 4: Reps Input (inputMode="decimal") */}
                          <div className="col-span-2">
                            <input
                              type="number"
                              step="1"
                              inputMode="decimal"
                              placeholder={
                                set.previousReps !== undefined ? `${set.previousReps}` : '0'
                              }
                              value={set.reps !== null ? set.reps : ''}
                              onChange={(e) => {
                                const val =
                                  e.target.value === '' ? null : parseInt(e.target.value, 10);
                                updateSet(actEx.id, set.id, { reps: val });
                              }}
                              className={`w-full py-1.5 px-2 text-center rounded-lg font-mono text-sm font-semibold transition focus:outline-none ${
                                isComplete
                                  ? 'bg-transparent text-emerald-300'
                                  : 'bg-slate-900 border border-slate-750 text-white placeholder:text-slate-600 focus:border-emerald-500'
                              }`}
                            />
                          </div>

                          {/* Column 5: Checkmark Button (Ghost Auto-fill on click) */}
                          <div className="col-span-2 flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => toggleSetCompleted(actEx.id, set.id)}
                              title={
                                isComplete
                                  ? 'Mark set incomplete'
                                  : 'Complete set (auto-fills previous if empty)'
                              }
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-90 ${
                                isComplete
                                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                                  : 'bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700'
                              }`}
                            >
                              <Check
                                className={`w-4 h-4 ${
                                  isComplete ? 'stroke-[3]' : 'stroke-[2] text-slate-500'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add / Remove Set Controls */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => addSet(actEx.id)}
                      className="py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Set</span>
                    </button>

                    {actEx.sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSet(actEx.id, actEx.sets[actEx.sets.length - 1].id)}
                        className="text-[11px] text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete Last Set</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Exercise CTA Button */}
          <button
            onClick={() => setIsExerciseModalOpen(true)}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-850 active:scale-[0.99] border border-dashed border-slate-700/80 hover:border-emerald-500/50 text-emerald-400 font-bold rounded-2xl flex items-center justify-center gap-2 transition text-sm shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exercise</span>
          </button>
        </div>
      )}

      {/* Manual Warmup Calculator Modal */}
      {warmupCalcExId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Warmup Calculator</h3>
              </div>
              <button
                type="button"
                onClick={() => setWarmupCalcExId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Enter your target working weight. The algorithm generates 2–3 progressive warmup sets without fatiguing your muscles:
            </p>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Target Working Weight (kg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={calcInputWeight}
                onChange={(e) => setCalcInputWeight(e.target.value)}
                placeholder="e.g. 80"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono text-center font-bold focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            {parseFloat(calcInputWeight) > 0 && (
              <div className="space-y-1.5 mb-4 p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
                {calculateWarmupSuggestions(parseFloat(calcInputWeight)).map((ws, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-300">
                    <span className="text-emerald-400 font-bold">Warmup {i + 1}</span>
                    <span>
                      {ws.weight} kg × {ws.reps} reps
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWarmupCalcExId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!parseFloat(calcInputWeight) || parseFloat(calcInputWeight) <= 0}
                onClick={() =>
                  handleApplyWarmup(
                    warmupCalcExId,
                    calculateWarmupSuggestions(parseFloat(calcInputWeight))
                  )
                }
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
              >
                Insert Warmup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Picker Modal */}
      <ExerciseModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        alreadySelectedIds={alreadySelectedIds}
      />
    </div>
  );
};
