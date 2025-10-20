-- AI Content Generation Pipeline Tables
-- Phase 2.1.1: Track AI-generated content, quality gates, and generation requests

-- =============================================================================
-- 1. AI Generation Requests Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ai_generation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request Details
  topic TEXT NOT NULL,
  category TEXT NOT NULL,
  target_audience TEXT,
  tone TEXT CHECK (tone IN ('professional', 'casual', 'formal', 'friendly', 'authoritative')),
  word_count_target INTEGER DEFAULT 800,

  -- AI Model Configuration
  model_provider TEXT NOT NULL CHECK (model_provider IN ('openai', 'anthropic', 'google', 'ensemble')),
  model_name TEXT NOT NULL,
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 1),

  -- Request Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'quality_check', 'human_review', 'approved', 'rejected', 'failed')
  ),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),

  -- Metadata
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Results
  generated_article_id UUID REFERENCES public.news_articles(id) ON DELETE SET NULL,
  error_message TEXT,
  generation_time_ms INTEGER,

  -- Quality Gates
  quality_score DECIMAL(5,2) CHECK (quality_score >= 0 AND quality_score <= 100),
  passed_quality_gates BOOLEAN,
  quality_gate_results JSONB,

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_generation_requests_status ON public.ai_generation_requests(status);
CREATE INDEX idx_generation_requests_requested_by ON public.ai_generation_requests(requested_by);
CREATE INDEX idx_generation_requests_priority ON public.ai_generation_requests(priority DESC);
CREATE INDEX idx_generation_requests_created_at ON public.ai_generation_requests(created_at DESC);

-- =============================================================================
-- 2. AI Generated Content Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ai_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_request_id UUID REFERENCES public.ai_generation_requests(id) ON DELETE CASCADE,

  -- Generated Content
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  tags TEXT[],

  -- AI Metadata
  model_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_version TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  generation_cost DECIMAL(10,6),

  -- Quality Metrics
  readability_score DECIMAL(5,2),
  originality_score DECIMAL(5,2),
  factual_accuracy_score DECIMAL(5,2),
  bias_score DECIMAL(5,2),
  engagement_score DECIMAL(5,2),

  -- Content Analysis
  word_count INTEGER,
  sentence_count INTEGER,
  paragraph_count INTEGER,
  reading_time_minutes INTEGER,

  -- Source Attribution
  sources_used JSONB,
  citations_count INTEGER DEFAULT 0,

  -- Review Status
  human_reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_generated_content_request ON public.ai_generated_content(generation_request_id);
CREATE INDEX idx_generated_content_reviewed ON public.ai_generated_content(human_reviewed);
CREATE INDEX idx_generated_content_created_at ON public.ai_generated_content(created_at DESC);

-- =============================================================================
-- 3. Quality Gate Results Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.quality_gate_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_request_id UUID NOT NULL REFERENCES public.ai_generation_requests(id) ON DELETE CASCADE,
  generated_content_id UUID REFERENCES public.ai_generated_content(id) ON DELETE CASCADE,

  -- Gate Details
  gate_name TEXT NOT NULL,
  gate_type TEXT NOT NULL CHECK (
    gate_type IN ('readability', 'bias_check', 'fact_check', 'originality', 'sentiment', 'quality_score', 'word_count')
  ),

  -- Results
  passed BOOLEAN NOT NULL,
  score DECIMAL(5,2),
  threshold DECIMAL(5,2),

  -- Details
  details JSONB,
  failure_reason TEXT,

  -- Metadata
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  execution_time_ms INTEGER
);

-- Indexes
CREATE INDEX idx_quality_gates_request ON public.quality_gate_results(generation_request_id);
CREATE INDEX idx_quality_gates_content ON public.quality_gate_results(generated_content_id);
CREATE INDEX idx_quality_gates_passed ON public.quality_gate_results(passed);

-- =============================================================================
-- 4. Model Performance Metrics Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ai_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Model Details
  model_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,

  -- Performance Metrics (rolling averages)
  avg_quality_score DECIMAL(5,2),
  avg_generation_time_ms INTEGER,
  avg_cost DECIMAL(10,6),

  -- Success Rates
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),

  -- Quality Gates
  quality_gate_pass_rate DECIMAL(5,2),
  avg_human_review_score DECIMAL(5,2),

  -- Usage Stats
  total_tokens_used BIGINT DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,

  -- Time Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one record per model per period
  UNIQUE(model_provider, model_name, period_start)
);

-- Indexes
CREATE INDEX idx_model_performance_provider ON public.ai_model_performance(model_provider);
CREATE INDEX idx_model_performance_period ON public.ai_model_performance(period_start DESC);

-- =============================================================================
-- 5. Content Sources Table (for multi-source aggregation)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source Details
  name TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (
    source_type IN ('rss', 'api', 'scraper', 'manual')
  ),

  -- Credibility
  credibility_score DECIMAL(5,2) DEFAULT 50 CHECK (credibility_score >= 0 AND credibility_score <= 100),
  fact_check_history JSONB,

  -- Configuration
  fetch_frequency_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  api_key_required BOOLEAN DEFAULT false,

  -- Categories
  primary_category TEXT,
  supported_categories TEXT[],

  -- Performance
  total_articles_fetched INTEGER DEFAULT 0,
  successful_fetches INTEGER DEFAULT 0,
  failed_fetches INTEGER DEFAULT 0,
  last_fetch_at TIMESTAMPTZ,
  last_fetch_status TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sources_active ON public.content_sources(is_active);
CREATE INDEX idx_sources_credibility ON public.content_sources(credibility_score DESC);

-- =============================================================================
-- Row-Level Security Policies
-- =============================================================================

-- Enable RLS
ALTER TABLE public.ai_generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_gate_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;

-- AI Generation Requests Policies
CREATE POLICY "editors can view all generation requests"
  ON public.ai_generation_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('editor', 'admin', 'publisher')
    )
  );

CREATE POLICY "editors can create generation requests"
  ON public.ai_generation_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('editor', 'admin', 'publisher')
    )
  );

CREATE POLICY "editors can update their own requests"
  ON public.ai_generation_requests FOR UPDATE
  USING (
    requested_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'publisher')
    )
  );

-- AI Generated Content Policies
CREATE POLICY "editors can view generated content"
  ON public.ai_generated_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('editor', 'admin', 'publisher')
    )
  );

CREATE POLICY "editors can update generated content"
  ON public.ai_generated_content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('editor', 'admin', 'publisher')
    )
  );

-- Quality Gate Results Policies (read-only for most users)
CREATE POLICY "editors can view quality gates"
  ON public.quality_gate_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('editor', 'admin', 'publisher')
    )
  );

-- Model Performance Policies (read-only)
CREATE POLICY "editors can view model performance"
  ON public.ai_model_performance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('editor', 'admin', 'publisher')
    )
  );

-- Content Sources Policies
CREATE POLICY "admins can manage sources"
  ON public.content_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin')
    )
  );

CREATE POLICY "editors can view sources"
  ON public.content_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('editor', 'admin', 'publisher')
    )
  );

-- =============================================================================
-- Functions for automatic updates
-- =============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_generation_requests_updated_at
  BEFORE UPDATE ON public.ai_generation_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_content_updated_at
  BEFORE UPDATE ON public.ai_generated_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_performance_updated_at
  BEFORE UPDATE ON public.ai_model_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_sources_updated_at
  BEFORE UPDATE ON public.content_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Sample Content Sources (Dubai-focused)
-- =============================================================================
INSERT INTO public.content_sources (name, url, source_type, credibility_score, primary_category, supported_categories) VALUES
  ('Gulf News', 'https://gulfnews.com', 'rss', 90, 'news', ARRAY['news', 'government', 'tourism']),
  ('The National UAE', 'https://www.thenationalnews.com', 'rss', 90, 'news', ARRAY['news', 'government', 'tourism']),
  ('Khaleej Times', 'https://www.khaleejtimes.com', 'rss', 85, 'news', ARRAY['news', 'government', 'tourism']),
  ('Time Out Dubai', 'https://www.timeoutdubai.com', 'rss', 80, 'eatanddrink', ARRAY['eatanddrink', 'nightlife', 'tourism']),
  ('What\'s On Dubai', 'https://whatson.ae', 'rss', 80, 'tourism', ARRAY['tourism', 'eatanddrink', 'nightlife']),
  ('Dubai Tourism', 'https://www.visitdubai.com', 'api', 95, 'tourism', ARRAY['tourism', 'luxurylife']),
  ('Dubai Media Office', 'https://www.mediaoffice.ae', 'rss', 100, 'government', ARRAY['government', 'news'])
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE public.ai_generation_requests IS 'Tracks all AI content generation requests with quality gates and status';
COMMENT ON TABLE public.ai_generated_content IS 'Stores AI-generated article content with quality metrics';
COMMENT ON TABLE public.quality_gate_results IS 'Individual quality gate check results for generated content';
COMMENT ON TABLE public.ai_model_performance IS 'Performance metrics for different AI models over time';
COMMENT ON TABLE public.content_sources IS 'External content sources for multi-source aggregation';
