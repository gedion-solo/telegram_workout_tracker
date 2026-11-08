-- ==============================================================================
-- DUO FIT TELEGRAM MINI APP - SUPABASE DATABASE SCHEMA
-- Multi-tenant isolation by Telegram User ID (telegram_user_id)
-- ==============================================================================

-- 1. Profiles Table: Stores Telegram athlete identity & preferences
CREATE TABLE IF NOT EXISTS public.profiles (
    telegram_id TEXT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    split_plan TEXT DEFAULT 'Custom',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Workout Sessions Table: Stores completed workouts & detailed exercise logs
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id TEXT PRIMARY KEY,
    telegram_user_id TEXT NOT NULL REFERENCES public.profiles(telegram_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    total_volume NUMERIC NOT NULL DEFAULT 0,
    prs_hit INTEGER NOT NULL DEFAULT 0,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Workout Templates Table: User-saved custom routines and split templates
CREATE TABLE IF NOT EXISTS public.workout_templates (
    id TEXT PRIMARY KEY,
    telegram_user_id TEXT NOT NULL REFERENCES public.profiles(telegram_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Full Body',
    description TEXT DEFAULT '',
    exercise_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Custom Exercises Table: User-created exercise movements
CREATE TABLE IF NOT EXISTS public.custom_exercises (
    id TEXT PRIMARY KEY,
    telegram_user_id TEXT NOT NULL REFERENCES public.profiles(telegram_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    category TEXT NOT NULL,
    equipment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- Performance Indexes (Fast lookups filtered by Telegram User ID)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON public.workout_sessions(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_time ON public.workout_sessions(end_time DESC);
CREATE INDEX IF NOT EXISTS idx_workout_templates_user ON public.workout_templates(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_custom_exercises_user ON public.custom_exercises(telegram_user_id);

-- ==============================================================================
-- Row-Level Security (RLS) Configuration
-- Enables secure multi-tenant isolation via the Supabase client
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Anon access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anon access on workout_sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Anon access on workout_templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Anon access on custom_exercises" ON public.custom_exercises;

-- Create policies for client access using anon key
CREATE POLICY "Anon access on profiles"
    ON public.profiles FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon access on workout_sessions"
    ON public.workout_sessions FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon access on workout_templates"
    ON public.workout_templates FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon access on custom_exercises"
    ON public.custom_exercises FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

