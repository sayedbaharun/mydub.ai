-- Add missing tables and RPCs required by the application
-- Safe to run multiple times (IF NOT EXISTS / OR REPLACE used where possible)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- user_preferences (exists in your DB; keep here for safety)
-- =========================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'system',
  language text DEFAULT 'en',
  timezone text DEFAULT 'Asia/Dubai',
  notifications jsonb DEFAULT '{}'::jsonb,
  accessibility jsonb DEFAULT '{}'::jsonb,
  tts_settings jsonb DEFAULT '{}'::jsonb,
  ai_preferences jsonb DEFAULT '{}'::jsonb,
  content_preferences jsonb DEFAULT '{}'::jsonb,
  privacy_preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Helper function to maintain updated_at (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $set_updated_at$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$set_updated_at$ LANGUAGE plpgsql;

-- Create trigger if not exists
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_preferences_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_preferences_updated_at
      BEFORE UPDATE ON public.user_preferences
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$do$;

-- =========================================
-- privacy_settings
-- =========================================
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility text DEFAULT 'public',
  data_collection boolean DEFAULT true,
  analytics_opt_in boolean DEFAULT true,
  marketing_opt_in boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_privacy_settings_updated_at'
  ) THEN
    CREATE TRIGGER trg_privacy_settings_updated_at
      BEFORE UPDATE ON public.privacy_settings
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$do$;

-- =========================================
-- user_consents
-- =========================================
CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  consent_given boolean NOT NULL,
  consent_version text,
  ip_address text,
  user_agent text,
  consent_date timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON public.user_consents(consent_type);

-- =========================================
-- user_onboarding
-- =========================================
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  step text DEFAULT 'start',
  completed boolean DEFAULT false,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_onboarding_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_onboarding_updated_at
      BEFORE UPDATE ON public.user_onboarding
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$do$;

-- =========================================
-- ai_agents (used by admin features; minimal schema so the table exists)
-- =========================================
CREATE TABLE IF NOT EXISTS public.ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  specialties text[] DEFAULT '{}',
  status text DEFAULT 'active',
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_agents_updated_at'
  ) THEN
    CREATE TRIGGER trg_ai_agents_updated_at
      BEFORE UPDATE ON public.ai_agents
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$do$;

-- =========================================
-- RPCs for preferences
-- =========================================
-- Provide sensible defaults and allow passing NULL to use auth.uid()
CREATE OR REPLACE FUNCTION public.get_user_preferences(user_uuid uuid DEFAULT NULL)
RETURNS public.user_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid := COALESCE(user_uuid, auth.uid());
  prefs public.user_preferences;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'No user id available';
  END IF;

  SELECT * INTO prefs FROM public.user_preferences WHERE user_id = uid;
  IF prefs IS NULL THEN
    INSERT INTO public.user_preferences(user_id)
    VALUES (uid)
    RETURNING * INTO prefs;
  END IF;
  RETURN prefs;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_preferences(
  preference_category text,
  preference_data jsonb,
  user_uuid uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid := COALESCE(user_uuid, auth.uid());
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'No user id available';
  END IF;

  INSERT INTO public.user_preferences(user_id, updated_at)
  VALUES (uid, now())
  ON CONFLICT (user_id) DO UPDATE SET updated_at = EXCLUDED.updated_at;

  IF preference_category = 'notifications' THEN
    UPDATE public.user_preferences SET notifications = preference_data WHERE user_id = uid;
  ELSIF preference_category = 'accessibility' THEN
    UPDATE public.user_preferences SET accessibility = preference_data WHERE user_id = uid;
  ELSIF preference_category = 'tts_settings' THEN
    UPDATE public.user_preferences SET tts_settings = preference_data WHERE user_id = uid;
  ELSIF preference_category = 'ai_preferences' THEN
    UPDATE public.user_preferences SET ai_preferences = preference_data WHERE user_id = uid;
  ELSIF preference_category = 'content_preferences' THEN
    UPDATE public.user_preferences SET content_preferences = preference_data WHERE user_id = uid;
  ELSIF preference_category = 'privacy_preferences' THEN
    UPDATE public.user_preferences SET privacy_preferences = preference_data WHERE user_id = uid;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_preferences(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_preferences(text, jsonb, uuid) TO authenticated;

-- =========================================
-- RLS policies (secure user-owned tables)
-- =========================================
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- user_preferences policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'upsert own user_preferences') THEN
    CREATE POLICY "upsert own user_preferences" ON public.user_preferences
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read own user_preferences') THEN
    CREATE POLICY "read own user_preferences" ON public.user_preferences
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'update own user_preferences') THEN
    CREATE POLICY "update own user_preferences" ON public.user_preferences
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- privacy_settings policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'upsert own privacy_settings') THEN
    CREATE POLICY "upsert own privacy_settings" ON public.privacy_settings
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read own privacy_settings') THEN
    CREATE POLICY "read own privacy_settings" ON public.privacy_settings
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'update own privacy_settings') THEN
    CREATE POLICY "update own privacy_settings" ON public.privacy_settings
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- user_onboarding policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'upsert own user_onboarding') THEN
    CREATE POLICY "upsert own user_onboarding" ON public.user_onboarding
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read own user_onboarding') THEN
    CREATE POLICY "read own user_onboarding" ON public.user_onboarding
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'update own user_onboarding') THEN
    CREATE POLICY "update own user_onboarding" ON public.user_onboarding
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- user_consents policies (users can insert their consents; optional select own)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'insert own user_consents') THEN
    CREATE POLICY "insert own user_consents" ON public.user_consents
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read own user_consents') THEN
    CREATE POLICY "read own user_consents" ON public.user_consents
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END$$;

-- Note: RLS intentionally NOT enabled on ai_agents to allow read access from anon unless you prefer otherwise.

