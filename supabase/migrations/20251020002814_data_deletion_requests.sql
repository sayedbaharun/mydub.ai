-- Create data_deletion_requests table for GDPR compliance
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_deletion_date TIMESTAMPTZ NOT NULL,
  actual_deletion_date TIMESTAMPTZ,
  reason TEXT,
  data_categories TEXT[] NOT NULL DEFAULT ARRAY['all']::TEXT[],
  retention_period_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON public.data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON public.data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_scheduled ON public.data_deletion_requests(scheduled_deletion_date) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ 
BEGIN
  -- Users can read their own deletion requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read own deletion requests') THEN
    CREATE POLICY "read own deletion requests" ON public.data_deletion_requests
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Users can insert their own deletion requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'create own deletion requests') THEN
    CREATE POLICY "create own deletion requests" ON public.data_deletion_requests
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update their own pending deletion requests (to cancel)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'update own deletion requests') THEN
    CREATE POLICY "update own deletion requests" ON public.data_deletion_requests
      FOR UPDATE
      USING (auth.uid() = user_id AND status = 'pending');
  END IF;

  -- Service role can process deletion requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service role can process deletions') THEN
    CREATE POLICY "service role can process deletions" ON public.data_deletion_requests
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

IF NOT EXISTS (
  SELECT 1 FROM pg_trigger WHERE tgname = 'trg_data_deletion_requests_updated_at'
) THEN
  CREATE TRIGGER trg_data_deletion_requests_updated_at
    BEFORE UPDATE ON public.data_deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
END IF;
