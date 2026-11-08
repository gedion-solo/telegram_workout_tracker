import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CompletedWorkout, Exercise, WorkoutTemplate } from '../types/workout';
import { TelegramUser } from '../utils/telegram';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

/**
 * Ensures user profile exists in Supabase, updating split_plan and user info.
 */
export async function syncUserProfile(user: TelegramUser, splitPlan: string) {
  if (!supabase) return;
  try {
    await supabase.from('profiles').upsert(
      {
        telegram_id: user.id,
        username: user.username || null,
        first_name: user.firstName || 'Athlete',
        split_plan: splitPlan,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'telegram_id' }
    );
  } catch (err) {
    console.warn('Supabase syncUserProfile error:', err);
  }
}

/**
 * Fetches all user data (profile, history, custom exercises, routines) isolated by telegram_id.
 */
export async function fetchUserDataFromSupabase(telegramUserId: string) {
  if (!supabase) return null;

  try {
    const [profileRes, exercisesRes, templatesRes, sessionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('telegram_id', telegramUserId).maybeSingle(),
      supabase.from('custom_exercises').select('*').eq('telegram_user_id', telegramUserId),
      supabase.from('workout_templates').select('*').eq('telegram_user_id', telegramUserId),
      supabase.from('workout_sessions').select('*').eq('telegram_user_id', telegramUserId).order('end_time', { ascending: false }),
    ]);

    return {
      profile: profileRes.data,
      customExercises: exercisesRes.data?.map((row) => ({
        id: row.id,
        name: row.name,
        muscleGroup: row.muscle_group,
        category: row.category,
        equipment: row.equipment,
      })) as Exercise[] | undefined,
      templates: templatesRes.data?.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category || 'Full Body',
        description: row.description || '',
        exerciseIds: row.exercise_ids || [],
      })) as WorkoutTemplate[] | undefined,
      sessions: sessionsRes.data?.map((row) => ({
        id: row.id,
        name: row.name,
        startTime: new Date(row.start_time).getTime(),
        endTime: new Date(row.end_time).getTime(),
        durationSeconds: row.duration_seconds,
        totalVolume: Number(row.total_volume),
        prsHit: row.prs_hit,
        exercises: row.exercises,
      })) as CompletedWorkout[] | undefined,
    };
  } catch (err) {
    console.warn('Supabase fetchUserData error:', err);
    return null;
  }
}

/**
 * Persists a completed workout session to Supabase.
 */
export async function saveSessionToSupabase(telegramUserId: string, workout: CompletedWorkout) {
  if (!supabase) return;
  try {
    await supabase.from('workout_sessions').upsert({
      id: workout.id,
      telegram_user_id: telegramUserId,
      name: workout.name,
      start_time: new Date(workout.startTime).toISOString(),
      end_time: new Date(workout.endTime).toISOString(),
      duration_seconds: workout.durationSeconds,
      total_volume: workout.totalVolume,
      prs_hit: workout.prsHit || 0,
      exercises: workout.exercises,
    });
  } catch (err) {
    console.warn('Supabase saveSession error:', err);
  }
}

/**
 * Deletes a workout session from Supabase.
 */
export async function deleteSessionFromSupabase(telegramUserId: string, workoutId: string) {
  if (!supabase) return;
  try {
    await supabase
      .from('workout_sessions')
      .delete()
      .eq('telegram_user_id', telegramUserId)
      .eq('id', workoutId);
  } catch (err) {
    console.warn('Supabase deleteSession error:', err);
  }
}

/**
 * Persists a saved workout template routine to Supabase.
 */
export async function saveTemplateToSupabase(telegramUserId: string, template: WorkoutTemplate) {
  if (!supabase) return;
  try {
    await supabase.from('workout_templates').upsert({
      id: template.id,
      telegram_user_id: telegramUserId,
      name: template.name,
      category: template.category,
      description: template.description,
      exercise_ids: template.exerciseIds,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Supabase saveTemplate error:', err);
  }
}

/**
 * Deletes a workout template routine from Supabase.
 */
export async function deleteTemplateFromSupabase(telegramUserId: string, templateId: string) {
  if (!supabase) return;
  try {
    await supabase
      .from('workout_templates')
      .delete()
      .eq('telegram_user_id', telegramUserId)
      .eq('id', templateId);
  } catch (err) {
    console.warn('Supabase deleteTemplate error:', err);
  }
}

/**
 * Persists a user-created custom exercise to Supabase.
 */
export async function saveCustomExerciseToSupabase(telegramUserId: string, exercise: Exercise) {
  if (!supabase) return;
  try {
    await supabase.from('custom_exercises').upsert({
      id: exercise.id,
      telegram_user_id: telegramUserId,
      name: exercise.name,
      muscle_group: exercise.muscleGroup,
      category: exercise.category,
      equipment: exercise.equipment,
    });
  } catch (err) {
    console.warn('Supabase saveCustomExercise error:', err);
  }
}
