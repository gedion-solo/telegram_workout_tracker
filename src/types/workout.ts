export type MuscleGroup = 'Chest' | 'Back' | 'Shoulders' | 'Legs' | 'Arms' | 'Core';

export type SplitCategory = 'Upper' | 'Lower' | 'Full Body';

export type SetTag = 'W' | 'N' | 'D' | 'F';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  category: SplitCategory;
  equipment: 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight';
  instructions?: string;
  isCustom?: boolean;
}

export interface WorkoutSet {
  id: string;
  tag: SetTag;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  previousWeight?: number;
  previousReps?: number;
  isPR?: boolean;
}

export interface ActiveExercise {
  id: string;
  exerciseId: string;
  notes?: string;
  sets: WorkoutSet[];
}

export interface ActiveWorkoutSession {
  id: string;
  name: string;
  templateId?: string;
  startTime: number; // timestamp
  exercises: ActiveExercise[];
}

export interface CompletedSet {
  tag: SetTag;
  weight: number;
  reps: number;
  completed: boolean;
  isPR?: boolean;
}

export interface CompletedExercise {
  exerciseId: string;
  sets: CompletedSet[];
}

export interface CompletedWorkout {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  totalVolume: number; // kg tonnage
  prsHit: number;
  exercises: CompletedExercise[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  category: SplitCategory;
  description: string;
  exerciseIds: string[];
}

export interface ExercisePRs {
  heaviestWeight: number; // kg
  estimated1RM: number; // e1RM via Epley
  maxSessionVolume: number; // kg
}

export interface ExerciseProgressionPoint {
  sessionNumber: number;
  sessionLabel: string;
  date: string;
  timestamp: number;
  workoutName: string;
  e1RM: number;
  topWeight: number;
  topReps: number;
  sessionVolume: number;
}

