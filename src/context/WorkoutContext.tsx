import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Exercise,
  WorkoutSet,
  ActiveExercise,
  ActiveWorkoutSession,
  CompletedWorkout,
  CompletedSet,
  CompletedExercise,
  SetTag,
  ExercisePRs,
  ExerciseProgressionPoint,
  WorkoutTemplate,
  SplitCategory,
} from '../types/workout';
import { DEFAULT_EXERCISES, WORKOUT_TEMPLATES, SEED_COMPLETED_WORKOUTS } from '../data/seedData';
import { TelegramUser, getTelegramUser, initTelegramApp } from '../utils/telegram';
import {
  isSupabaseConfigured,
  syncUserProfile,
  fetchUserDataFromSupabase,
  saveSessionToSupabase,
  deleteSessionFromSupabase,
  saveTemplateToSupabase,
  deleteTemplateFromSupabase,
  saveCustomExerciseToSupabase,
} from '../lib/supabase';

const STORAGE_KEYS = {
  EXERCISES: 'duofit_exercises_v2',
  HISTORY: 'duofit_history_v2',
  TEMPLATES: 'duofit_templates_v1',
  ACTIVE_SESSION: 'duofit_active_session_v1',
  TIMER: 'duofit_rest_timer_v1',
  LEGACY_EXERCISES: 'duofit_exercises_v1',
  LEGACY_HISTORY: 'duofit_history_v1',
  LEGACY_ACTIVE_SESSION: 'ironpulse_active_session_v1',
};

interface RestTimerState {
  active: boolean;
  secondsRemaining: number;
  totalSeconds: number;
  exerciseName?: string;
}

interface FinishedWorkoutSummary {
  workout: CompletedWorkout;
  newPRsCount: number;
  prsList: { exerciseName: string; weight: number; reps: number; type: string }[];
}

interface WorkoutContextType {
  telegramUser: TelegramUser;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  exercises: Exercise[];
  history: CompletedWorkout[];
  templates: WorkoutTemplate[];
  activeSession: ActiveWorkoutSession | null;
  restTimer: RestTimerState;
  finishedSummary: FinishedWorkoutSummary | null;
  clearFinishedSummary: () => void;
  // Session actions
  startWorkout: (templateId?: string, customName?: string) => void;
  renameActiveWorkout: (name: string) => void;
  createCustomTemplate: (name: string, category?: SplitCategory, exerciseIds?: string[], description?: string) => WorkoutTemplate;
  saveActiveWorkoutAsTemplate: (name?: string, category?: SplitCategory, description?: string) => WorkoutTemplate;
  deleteTemplate: (templateId: string) => void;
  cancelWorkout: () => void;
  finishWorkout: () => void;
  // Active Exercise actions
  addExerciseToActiveWorkout: (exerciseId: string) => void;
  removeExerciseFromActiveWorkout: (activeExerciseId: string) => void;
  addSet: (activeExerciseId: string) => void;
  removeSet: (activeExerciseId: string, setId: string) => void;
  updateSet: (activeExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  toggleSetCompleted: (activeExerciseId: string, setId: string) => void;
  cycleSetTag: (activeExerciseId: string, setId: string) => void;
  insertWarmupSets: (activeExerciseId: string, warmupSets: { weight: number; reps: number }[]) => void;
  // Rest Timer controls
  startRestTimer: (seconds?: number, exerciseName?: string) => void;
  adjustRestTimer: (deltaSeconds: number) => void;
  skipRestTimer: () => void;
  // Exercise CRUD & Helpers
  addCustomExercise: (exercise: Omit<Exercise, 'id'>) => Exercise;
  getExerciseById: (id: string) => Exercise | undefined;
  getLastPerformance: (exerciseId: string) => CompletedSet[] | null;
  getExercisePRs: (exerciseId: string) => ExercisePRs;
  getExerciseProgression: (exerciseId: string) => ExerciseProgressionPoint[];
  getExerciseHistoryFeed: (exerciseId: string) => { date: number; workoutName: string; sets: CompletedSet[] }[];
  deleteWorkoutFromHistory: (workoutId: string) => void;
  resetAllData: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const calculateE1RM = (weight: number, reps: number): number => {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  // Epley formula: weight * (1 + reps / 30)
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
};

export interface WarmupSetPlan {
  weight: number;
  reps: number;
  label: string;
}

export const calculateWarmupSuggestions = (workingWeight: number): WarmupSetPlan[] => {
  if (workingWeight <= 0) return [];

  const roundToPlate = (w: number) => {
    const rounded = Math.round(w / 2.5) * 2.5;
    return Math.max(10, Math.round(rounded * 10) / 10);
  };

  // If working weight is <= 45kg: suggest 2 warm-up sets
  if (workingWeight <= 45) {
    const w1 = Math.min(20, roundToPlate(workingWeight * 0.5));
    const w2 = Math.min(workingWeight - 2.5, roundToPlate(workingWeight * 0.75));
    return [
      { weight: w1, reps: 10, label: '50% Primer' },
      { weight: Math.max(w1 + 2.5, w2), reps: 5, label: '75% Prep' },
    ];
  }

  // If working weight > 45kg: suggest 3 progressive warm-up sets
  const w1 = Math.max(20, roundToPlate(workingWeight * 0.45)); // ~45%
  const w2 = roundToPlate(workingWeight * 0.65); // ~65%
  const w3 = Math.min(workingWeight - 2.5, roundToPlate(workingWeight * 0.825)); // ~82.5%

  return [
    { weight: w1, reps: 8, label: '45% Light Primer' },
    { weight: Math.max(w1 + 2.5, w2), reps: 5, label: '65% Working Groove' },
    { weight: Math.max(w2 + 2.5, w3), reps: 2, label: '82.5% Potentiation' },
  ];
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 0. Telegram User & Cloud Sync state
  const [telegramUser, setTelegramUser] = useState<TelegramUser>(() => getTelegramUser());
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>(
    () => (isSupabaseConfigured ? 'syncing' : 'offline')
  );

  // 1. Exercises state
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXERCISES) || localStorage.getItem(STORAGE_KEYS.LEGACY_EXERCISES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading exercises from localStorage', e);
    }
    return DEFAULT_EXERCISES;
  });

  // 2. History state
  const [history, setHistory] = useState<CompletedWorkout[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 8) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading history from localStorage', e);
    }
    return SEED_COMPLETED_WORKOUTS;
  });

  // 3. Templates state (seeded with default templates, user can save custom routines!)
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading templates from localStorage', e);
    }
    return WORKOUT_TEMPLATES;
  });

  // 4. Active session state
  const [activeSession, setActiveSession] = useState<ActiveWorkoutSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION) || localStorage.getItem(STORAGE_KEYS.LEGACY_ACTIVE_SESSION);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading active session from localStorage', e);
    }
    return null;
  });

  // 4. Rest Timer state
  const [restTimer, setRestTimer] = useState<RestTimerState>({
    active: false,
    secondsRemaining: 90,
    totalSeconds: 90,
  });

  // 5. Finished summary celebration modal state
  const [finishedSummary, setFinishedSummary] = useState<FinishedWorkoutSummary | null>(null);

  // Initial mount: Telegram WebApp expand + Supabase Cloud Load
  useEffect(() => {
    initTelegramApp();

    const syncUserAndData = () => {
      const user = getTelegramUser();
      setTelegramUser(user);

      if (!isSupabaseConfigured) {
        setCloudSyncStatus('offline');
        return;
      }

      setCloudSyncStatus('syncing');
      syncUserProfile(user, 'Custom');

      fetchUserDataFromSupabase(user.id)
        .then((remoteData) => {
          if (!remoteData) {
            setCloudSyncStatus('offline');
            return;
          }
          setCloudSyncStatus('synced');

          // 1. History
          if (remoteData.sessions && remoteData.sessions.length > 0) {
            setHistory(remoteData.sessions);
          }

          // 2. Custom Templates
          if (remoteData.templates && remoteData.templates.length > 0) {
            setTemplates((prev) => {
              const remoteIds = new Set(remoteData.templates!.map((t) => t.id));
              const filteredDefaults = prev.filter((p) => !remoteIds.has(p.id));
              return [...remoteData.templates!, ...filteredDefaults];
            });
          }

          // 3. Custom Exercises
          if (remoteData.customExercises && remoteData.customExercises.length > 0) {
            setExercises((prev) => {
              const remoteIds = new Set(remoteData.customExercises!.map((e) => e.id));
              const base = prev.filter((e) => !remoteIds.has(e.id));
              return [...base, ...remoteData.customExercises!];
            });
          }
        })
        .catch((err) => {
          console.warn('Supabase initial fetch failed:', err);
          setCloudSyncStatus('error');
        });
    };

    syncUserAndData();

    // Secondary pass in case window.Telegram.WebApp was injected asynchronously by Telegram
    const timer = setTimeout(() => {
      initTelegramApp();
      syncUserAndData();
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
    } catch (e) {
      console.error('Failed to save exercises', e);
    }
  }, [exercises]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    } catch (e) {
      console.error('Failed to save templates', e);
    }
  }, [templates]);

  useEffect(() => {
    try {
      if (activeSession) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(activeSession));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      }
    } catch (e) {
      console.error('Failed to save active session', e);
    }
  }, [activeSession]);

  // Rest Timer ticking effect
  useEffect(() => {
    if (!restTimer.active || restTimer.secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (!prev.active || prev.secondsRemaining <= 1) {
          // Play subtle audio vibration if supported
          if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
            try {
              navigator.vibrate([100, 50, 100]);
            } catch (_) { }
          }
          return { ...prev, active: false, secondsRemaining: 0 };
        }
        return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer.active, restTimer.secondsRemaining]);

  const getExerciseById = useCallback(
    (id: string) => exercises.find((ex) => ex.id === id),
    [exercises]
  );

  // Retrieve last completed sets for a specific exercise from history
  const getLastPerformance = useCallback(
    (exerciseId: string): CompletedSet[] | null => {
      // Sort history descending by endTime
      const sorted = [...history].sort((a, b) => b.endTime - a.endTime);
      for (const workout of sorted) {
        const found = workout.exercises.find((e) => e.exerciseId === exerciseId);
        if (found && found.sets.length > 0) {
          // filter to completed sets only
          const completed = found.sets.filter((s) => s.completed);
          if (completed.length > 0) return completed;
        }
      }
      return null;
    },
    [history]
  );

  // Generate initial sets for an exercise based on previous session ghost values
  // By default, start with 1 set so the user controls the number of sets on their own!
  const createInitialSetsForExercise = useCallback(
    (exerciseId: string): WorkoutSet[] => {
      const prev = getLastPerformance(exerciseId);
      const prevSet = prev && prev[0] ? prev[0] : null;

      return [
        {
          id: `set-${Date.now()}-0-${Math.random().toString(36).substring(2, 6)}`,
          tag: 'N',
          weight: null,
          reps: null,
          completed: false,
          previousWeight: prevSet ? prevSet.weight : undefined,
          previousReps: prevSet ? prevSet.reps : undefined,
        },
      ];
    },
    [getLastPerformance]
  );

  // Start Workout
  const startWorkout = useCallback(
    (templateId?: string, customName?: string) => {
      let name = customName || 'Custom Workout';
      let exerciseIds: string[] = [];

      if (templateId) {
        const template = templates.find((t) => t.id === templateId) || WORKOUT_TEMPLATES.find((t) => t.id === templateId);
        if (template) {
          name = template.name;
          exerciseIds = template.exerciseIds;
        }
      }

      const activeExercises: ActiveExercise[] = exerciseIds.map((exId, idx) => ({
        id: `act-ex-${Date.now()}-${idx}`,
        exerciseId: exId,
        sets: createInitialSetsForExercise(exId),
      }));

      const newSession: ActiveWorkoutSession = {
        id: `session-${Date.now()}`,
        name,
        templateId,
        startTime: Date.now(),
        exercises: activeExercises,
      };

      setActiveSession(newSession);
    },
    [templates, createInitialSetsForExercise]
  );

  const renameActiveWorkout = useCallback((newName: string) => {
    if (!activeSession) return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    setActiveSession((prev) => (prev ? { ...prev, name: trimmed } : null));
  }, [activeSession]);

  const createCustomTemplate = useCallback(
    (name: string, category: SplitCategory = 'Full Body', exerciseIds: string[] = [], description?: string) => {
      const trimmedName = name.trim() || 'My Routine';
      const newTemplate: WorkoutTemplate = {
        id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: trimmedName,
        category,
        description: description?.trim() || `${category} routine with ${exerciseIds.length} movements`,
        exerciseIds,
      };

      setTemplates((prev) => [newTemplate, ...prev]);
      saveTemplateToSupabase(telegramUser.id, newTemplate);
      return newTemplate;
    },
    [telegramUser.id]
  );

  const saveActiveWorkoutAsTemplate = useCallback(
    (customName?: string, category: SplitCategory = 'Full Body', description?: string) => {
      if (!activeSession) throw new Error('No active workout to save');
      const name = (customName && customName.trim()) || activeSession.name || 'My Routine';
      const exerciseIds = activeSession.exercises.map((e) => e.exerciseId);

      const existing = templates.find(
        (t) => t.id === activeSession.templateId || t.name.toLowerCase() === name.toLowerCase()
      );

      const templateToSave: WorkoutTemplate = {
        id: existing?.id || `template-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        category,
        description: description || `Custom routine with ${exerciseIds.length} exercises`,
        exerciseIds,
      };

      setTemplates((prev) => {
        const existingIdx = prev.findIndex((t) => t.id === templateToSave.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = templateToSave;
          return updated;
        }
        return [templateToSave, ...prev];
      });

      saveTemplateToSupabase(telegramUser.id, templateToSave);
      return templateToSave;
    },
    [activeSession, templates, telegramUser.id]
  );

  const deleteTemplate = useCallback(
    (templateId: string) => {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      deleteTemplateFromSupabase(telegramUser.id, templateId);
    },
    [telegramUser.id]
  );

  const cancelWorkout = useCallback(() => {
    setActiveSession(null);
    setRestTimer({ active: false, secondsRemaining: 90, totalSeconds: 90 });
  }, []);

  const addExerciseToActiveWorkout = useCallback(
    (exerciseId: string) => {
      if (!activeSession) return;
      const newActiveExercise: ActiveExercise = {
        id: `act-ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        exerciseId,
        sets: createInitialSetsForExercise(exerciseId),
      };
      setActiveSession({
        ...activeSession,
        exercises: [...activeSession.exercises, newActiveExercise],
      });
    },
    [activeSession, createInitialSetsForExercise]
  );

  const removeExerciseFromActiveWorkout = useCallback(
    (activeExerciseId: string) => {
      if (!activeSession) return;
      setActiveSession({
        ...activeSession,
        exercises: activeSession.exercises.filter((e) => e.id !== activeExerciseId),
      });
    },
    [activeSession]
  );

  const addSet = useCallback(
    (activeExerciseId: string) => {
      if (!activeSession) return;
      setActiveSession({
        ...activeSession,
        exercises: activeSession.exercises.map((ex) => {
          if (ex.id !== activeExerciseId) return ex;
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet: WorkoutSet = {
            id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            tag: lastSet ? (lastSet.tag === 'W' ? 'N' : lastSet.tag) : 'N',
            weight: null,
            reps: null,
            completed: false,
            previousWeight: lastSet?.weight ?? lastSet?.previousWeight,
            previousReps: lastSet?.reps ?? lastSet?.previousReps,
          };
          return {
            ...ex,
            sets: [...ex.sets, newSet],
          };
        }),
      });
    },
    [activeSession]
  );

  const removeSet = useCallback(
    (activeExerciseId: string, setId: string) => {
      if (!activeSession) return;
      setActiveSession({
        ...activeSession,
        exercises: activeSession.exercises.map((ex) => {
          if (ex.id !== activeExerciseId) return ex;
          if (ex.sets.length <= 1) return ex; // maintain at least one set
          return {
            ...ex,
            sets: ex.sets.filter((s) => s.id !== setId),
          };
        }),
      });
    },
    [activeSession]
  );

  const updateSet = useCallback(
    (activeExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
      if (!activeSession) return;
      setActiveSession({
        ...activeSession,
        exercises: activeSession.exercises.map((ex) => {
          if (ex.id !== activeExerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)),
          };
        }),
      });
    },
    [activeSession]
  );

  const cycleSetTag = useCallback(
    (activeExerciseId: string, setId: string) => {
      const tagCycle: SetTag[] = ['N', 'W', 'D', 'F'];
      if (!activeSession) return;
      setActiveSession({
        ...activeSession,
        exercises: activeSession.exercises.map((ex) => {
          if (ex.id !== activeExerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id !== setId) return s;
              const nextIndex = (tagCycle.indexOf(s.tag) + 1) % tagCycle.length;
              return { ...s, tag: tagCycle[nextIndex] };
            }),
          };
        }),
      });
    },
    [activeSession]
  );

  const insertWarmupSets = useCallback(
    (activeExerciseId: string, warmupSets: { weight: number; reps: number }[]) => {
      if (!activeSession) return;
      setActiveSession({
        ...activeSession,
        exercises: activeSession.exercises.map((ex) => {
          if (ex.id !== activeExerciseId) return ex;
          const newSets: WorkoutSet[] = warmupSets.map((ws, i) => ({
            id: `set-warmup-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            tag: 'W' as SetTag,
            weight: ws.weight,
            reps: ws.reps,
            completed: false,
          }));
          return {
            ...ex,
            sets: [...newSets, ...ex.sets],
          };
        }),
      });
    },
    [activeSession]
  );

  // Rest Timer Controls
  const startRestTimer = useCallback((seconds: number = 90, exerciseName?: string) => {
    setRestTimer({
      active: true,
      secondsRemaining: seconds,
      totalSeconds: seconds,
      exerciseName,
    });
  }, []);

  const adjustRestTimer = useCallback((deltaSeconds: number) => {
    setRestTimer((prev) => {
      const nextRemaining = Math.max(5, prev.secondsRemaining + deltaSeconds);
      const nextTotal = Math.max(nextRemaining, prev.totalSeconds + (deltaSeconds > 0 ? deltaSeconds : 0));
      return {
        ...prev,
        active: true,
        secondsRemaining: nextRemaining,
        totalSeconds: nextTotal,
      };
    });
  }, []);

  const skipRestTimer = useCallback(() => {
    setRestTimer((prev) => ({ ...prev, active: false, secondsRemaining: 0 }));
  }, []);

  // Checkmark toggle: with ghost auto-fill feature & auto-starting rest timer!
  const toggleSetCompleted = useCallback(
    (activeExerciseId: string, setId: string) => {
      if (!activeSession) return;

      const currentEx = activeSession.exercises.find((e) => e.id === activeExerciseId);
      const exerciseDef = currentEx ? getExerciseById(currentEx.exerciseId) : undefined;
      const targetSet = currentEx?.sets.find((s) => s.id === setId);

      if (!targetSet) return;

      const willBeCompleted = !targetSet.completed;

      // Ghost Auto-Fill logic:
      // If user marks set complete and weight or reps is empty/null, auto-accept placeholder previous values!
      let resolvedWeight = targetSet.weight;
      let resolvedReps = targetSet.reps;

      if (willBeCompleted) {
        if ((resolvedWeight === null || resolvedWeight === undefined || isNaN(resolvedWeight)) && targetSet.previousWeight) {
          resolvedWeight = targetSet.previousWeight;
        } else if (resolvedWeight === null || resolvedWeight === undefined) {
          resolvedWeight = 0;
        }

        if ((resolvedReps === null || resolvedReps === undefined || isNaN(resolvedReps)) && targetSet.previousReps) {
          resolvedReps = targetSet.previousReps;
        } else if (resolvedReps === null || resolvedReps === undefined) {
          resolvedReps = 0;
        }

        // Trigger rest timer 90s on completion
        startRestTimer(90, exerciseDef?.name);
      }

      setActiveSession({
        ...activeSession,
        exercises: activeSession.exercises.map((ex) => {
          if (ex.id !== activeExerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id !== setId) return s;
              return {
                ...s,
                weight: resolvedWeight,
                reps: resolvedReps,
                completed: willBeCompleted,
              };
            }),
          };
        }),
      });
    },
    [activeSession, getExerciseById, startRestTimer]
  );

  // Compute all-time PRs for an exercise
  const getExercisePRs = useCallback(
    (exerciseId: string): ExercisePRs => {
      let heaviestWeight = 0;
      let estimated1RM = 0;
      let maxSessionVolume = 0;

      for (const workout of history) {
        const found = workout.exercises.find((e) => e.exerciseId === exerciseId);
        if (!found) continue;

        let sessionVolume = 0;
        for (const s of found.sets) {
          if (!s.completed) continue;
          const w = s.weight || 0;
          const r = s.reps || 0;

          if (w > heaviestWeight) {
            heaviestWeight = w;
          }

          // Warmup sets excluded from e1RM
          if (s.tag !== 'W' && w > 0 && r > 0) {
            const e1rm = calculateE1RM(w, r);
            if (e1rm > estimated1RM) {
              estimated1RM = e1rm;
            }
          }

          sessionVolume += w * r;
        }

        if (sessionVolume > maxSessionVolume) {
          maxSessionVolume = sessionVolume;
        }
      }

      return {
        heaviestWeight,
        estimated1RM,
        maxSessionVolume,
      };
    },
    [history]
  );

  // Finish Workout
  const finishWorkout = useCallback(() => {
    if (!activeSession) return;

    const endTime = Date.now();
    const durationSeconds = Math.max(60, Math.round((endTime - activeSession.startTime) / 1000));
    let totalVolume = 0;
    const prsList: { exerciseName: string; weight: number; reps: number; type: string }[] = [];

    const completedExercises: CompletedExercise[] = activeSession.exercises
      .map((ex) => {
        const exerciseDef = getExerciseById(ex.exerciseId);
        const existingPRs = getExercisePRs(ex.exerciseId);
        let maxWeightInSession = 0;
        let maxE1RMInSession = 0;

        const completedSets: CompletedSet[] = ex.sets
          .filter((s) => s.completed && (s.weight ?? 0) > 0 && (s.reps ?? 0) > 0)
          .map((s) => {
            const weight = s.weight || 0;
            const reps = s.reps || 0;
            totalVolume += weight * reps;

            let isPR = false;
            if (s.tag !== 'W') {
              const currentE1RM = calculateE1RM(weight, reps);
              if (weight > existingPRs.heaviestWeight && weight > maxWeightInSession) {
                isPR = true;
                maxWeightInSession = weight;
                prsList.push({
                  exerciseName: exerciseDef?.name || 'Exercise',
                  weight,
                  reps,
                  type: 'Max Weight PR',
                });
              } else if (currentE1RM > existingPRs.estimated1RM && currentE1RM > maxE1RMInSession) {
                isPR = true;
                maxE1RMInSession = currentE1RM;
                prsList.push({
                  exerciseName: exerciseDef?.name || 'Exercise',
                  weight,
                  reps,
                  type: `e1RM PR (${currentE1RM} kg)`,
                });
              }
            }

            return {
              tag: s.tag,
              weight,
              reps,
              completed: true,
              isPR,
            };
          });

        return {
          exerciseId: ex.exerciseId,
          sets: completedSets,
        };
      })
      .filter((ex) => ex.sets.length > 0);

    const newCompletedWorkout: CompletedWorkout = {
      id: `workout-${Date.now()}`,
      name: activeSession.name,
      startTime: activeSession.startTime,
      endTime,
      durationSeconds,
      totalVolume,
      prsHit: prsList.length,
      exercises: completedExercises,
    };

    // Auto-save or update routine template with completed exercises for future workouts!
    const currentExIds = activeSession.exercises.map((e) => e.exerciseId);
    let templateToSync: WorkoutTemplate | null = null;
    if (currentExIds.length > 0) {
      const existing = templates.find(
        (t) => (activeSession.templateId && t.id === activeSession.templateId) ||
          t.name.toLowerCase() === activeSession.name.toLowerCase()
      );
      if (existing) {
        templateToSync = {
          ...existing,
          exerciseIds: Array.from(new Set([...existing.exerciseIds, ...currentExIds])),
        };
        setTemplates((prev) => prev.map((t) => (t.id === existing.id ? templateToSync! : t)));
      } else if (activeSession.name && activeSession.name !== 'Quick Workout') {
        templateToSync = {
          id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: activeSession.name,
          category: 'Full Body',
          description: `Saved routine with ${currentExIds.length} movements`,
          exerciseIds: currentExIds,
        };
        setTemplates((prev) => [templateToSync!, ...prev]);
      }
    }

    setHistory((prev) => [newCompletedWorkout, ...prev]);
    setActiveSession(null);
    setRestTimer({ active: false, secondsRemaining: 90, totalSeconds: 90 });

    // Supabase Cloud Sync
    saveSessionToSupabase(telegramUser.id, newCompletedWorkout);
    if (templateToSync) {
      saveTemplateToSupabase(telegramUser.id, templateToSync);
    }

    setFinishedSummary({
      workout: newCompletedWorkout,
      newPRsCount: prsList.length,
      prsList,
    });
  }, [activeSession, getExerciseById, getExercisePRs, templates, telegramUser.id]);

  const clearFinishedSummary = useCallback(() => {
    setFinishedSummary(null);
  }, []);

  // Progression points for charts
  const getExerciseProgression = useCallback(
    (exerciseId: string): ExerciseProgressionPoint[] => {
      // chronological order
      const sorted = [...history].sort((a, b) => a.endTime - b.endTime);
      const points: ExerciseProgressionPoint[] = [];

      for (const workout of sorted) {
        const found = workout.exercises.find((e) => e.exerciseId === exerciseId);
        if (!found || found.sets.length === 0) continue;

        let maxE1RM = 0;
        let topWeight = 0;
        let topReps = 0;
        let sessionVol = 0;

        for (const s of found.sets) {
          if (!s.completed) continue;
          const w = s.weight || 0;
          const r = s.reps || 0;
          sessionVol += w * r;

          if (w > topWeight) {
            topWeight = w;
            topReps = r;
          }

          if (s.tag !== 'W' && w > 0 && r > 0) {
            const e1rm = calculateE1RM(w, r);
            if (e1rm > maxE1RM) {
              maxE1RM = e1rm;
            }
          }
        }

        if (topWeight > 0) {
          const d = new Date(workout.endTime);
          const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          const sNum = points.length + 1;
          points.push({
            sessionNumber: sNum,
            sessionLabel: `Session ${sNum}`,
            date: dateStr,
            timestamp: workout.endTime,
            workoutName: workout.name,
            e1RM: maxE1RM > 0 ? maxE1RM : topWeight,
            topWeight,
            topReps,
            sessionVolume: sessionVol,
          });
        }
      }

      return points;
    },
    [history]
  );

  const getExerciseHistoryFeed = useCallback(
    (exerciseId: string) => {
      const sorted = [...history].sort((a, b) => b.endTime - a.endTime);
      const feed: { date: number; workoutName: string; sets: CompletedSet[] }[] = [];

      for (const workout of sorted) {
        const found = workout.exercises.find((e) => e.exerciseId === exerciseId);
        if (found && found.sets.length > 0) {
          feed.push({
            date: workout.endTime,
            workoutName: workout.name,
            sets: found.sets,
          });
        }
      }

      return feed;
    },
    [history]
  );

  const addCustomExercise = useCallback(
    (exercise: Omit<Exercise, 'id'>) => {
      const newEx: Exercise = {
        ...exercise,
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        isCustom: true,
      };
      setExercises((prev) => [...prev, newEx]);
      saveCustomExerciseToSupabase(telegramUser.id, newEx);
      return newEx;
    },
    [telegramUser.id]
  );

  const deleteWorkoutFromHistory = useCallback(
    (workoutId: string) => {
      setHistory((prev) => prev.filter((w) => w.id !== workoutId));
      deleteSessionFromSupabase(telegramUser.id, workoutId);
    },
    [telegramUser.id]
  );

  const resetAllData = useCallback(() => {
    setExercises(DEFAULT_EXERCISES);
    setHistory(SEED_COMPLETED_WORKOUTS);
    setActiveSession(null);
    setRestTimer({ active: false, secondsRemaining: 90, totalSeconds: 90 });
    localStorage.removeItem(STORAGE_KEYS.EXERCISES);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    localStorage.removeItem(STORAGE_KEYS.TIMER);
  }, []);

  const value = useMemo(
    () => ({
      telegramUser,
      cloudSyncStatus,
      exercises,
      history,
      templates,
      activeSession,
      restTimer,
      finishedSummary,
      clearFinishedSummary,
      startWorkout,
      renameActiveWorkout,
      createCustomTemplate,
      saveActiveWorkoutAsTemplate,
      deleteTemplate,
      cancelWorkout,
      finishWorkout,
      addExerciseToActiveWorkout,
      removeExerciseFromActiveWorkout,
      addSet,
      removeSet,
      updateSet,
      toggleSetCompleted,
      cycleSetTag,
      insertWarmupSets,
      startRestTimer,
      adjustRestTimer,
      skipRestTimer,
      addCustomExercise,
      getExerciseById,
      getLastPerformance,
      getExercisePRs,
      getExerciseProgression,
      getExerciseHistoryFeed,
      deleteWorkoutFromHistory,
      resetAllData,
    }),
    [
      telegramUser,
      cloudSyncStatus,
      exercises,
      history,
      templates,
      activeSession,
      restTimer,
      finishedSummary,
      clearFinishedSummary,
      startWorkout,
      renameActiveWorkout,
      createCustomTemplate,
      saveActiveWorkoutAsTemplate,
      deleteTemplate,
      cancelWorkout,
      finishWorkout,
      addExerciseToActiveWorkout,
      removeExerciseFromActiveWorkout,
      addSet,
      removeSet,
      updateSet,
      toggleSetCompleted,
      cycleSetTag,
      insertWarmupSets,
      startRestTimer,
      adjustRestTimer,
      skipRestTimer,
      addCustomExercise,
      getExerciseById,
      getLastPerformance,
      getExercisePRs,
      getExerciseProgression,
      getExerciseHistoryFeed,
      deleteWorkoutFromHistory,
      resetAllData,
    ]
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

