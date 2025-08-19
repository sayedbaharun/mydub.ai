-- Align schema with app types and usage

-- privacy_settings: add fields used by the app
ALTER TABLE public.privacy_settings
  ADD COLUMN IF NOT EXISTS data_sharing_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS marketing_emails_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS analytics_tracking_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS third_party_sharing_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_retention_period text DEFAULT 'indefinite',
  ADD COLUMN IF NOT EXISTS cookie_consent jsonb DEFAULT '{}'::jsonb;

-- user_onboarding: add the columns referenced by the service
ALTER TABLE public.user_onboarding
  ADD COLUMN IF NOT EXISTS has_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_steps text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS device_id text;

-- Ensure updated_at is maintained via trigger function created earlier
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_privacy_settings_updated_at'
  ) THEN
    CREATE TRIGGER trg_privacy_settings_updated_at
      BEFORE UPDATE ON public.privacy_settings
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_onboarding_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_onboarding_updated_at
      BEFORE UPDATE ON public.user_onboarding
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$do$;

