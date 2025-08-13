-- AI Reporter System Database Schema
-- This migration creates tables for the autonomous AI reporter system
-- which manages AI agents that fetch, analyze, and generate news content

-- Create enum types for better data integrity
CREATE TYPE agent_type AS ENUM ('news', 'lifestyle', 'business', 'tourism', 'weather');
CREATE TYPE task_type AS ENUM ('fetch', 'analyze', 'write', 'review', 'publish');
CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE task_status AS ENUM ('pending', 'claimed', 'processing', 'completed', 'failed');
CREATE TYPE source_type AS ENUM ('rss', 'api', 'scraper', 'manual');
CREATE TYPE pipeline_stage AS ENUM ('fetched', 'analyzed', 'written', 'reviewed', 'queued');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'edited');

-- 1. AI Reporter Agents Table
-- Stores configuration and metadata for each AI reporter agent
CREATE TABLE ai_reporter_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    type agent_type NOT NULL,
    config JSONB DEFAULT '{}' NOT NULL,
    capabilities TEXT[] DEFAULT '{}' NOT NULL,
    schedule JSONB DEFAULT '{}' NOT NULL, -- Cron schedule configuration
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_run TIMESTAMPTZ,
    performance_metrics JSONB DEFAULT '{"success_rate": 0, "quality_scores": [], "articles_generated": 0}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT check_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100)
);

-- Add comments for documentation
COMMENT ON TABLE ai_reporter_agents IS 'Stores AI reporter agents that autonomously generate content';
COMMENT ON COLUMN ai_reporter_agents.config IS 'Agent-specific configuration (e.g., GPT model, temperature, prompts)';
COMMENT ON COLUMN ai_reporter_agents.capabilities IS 'Array of capabilities this agent possesses';
COMMENT ON COLUMN ai_reporter_agents.schedule IS 'Cron schedule for automatic execution';
COMMENT ON COLUMN ai_reporter_agents.performance_metrics IS 'Track success rate, quality scores, and other metrics';

-- 2. Agent Tasks Table
-- Queue system for agent tasks
CREATE TABLE agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_reporter_agents(id) ON DELETE CASCADE,
    type task_type NOT NULL,
    priority task_priority DEFAULT 'medium' NOT NULL,
    status task_status DEFAULT 'pending' NOT NULL,
    source_url TEXT,
    metadata JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    claimed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0 NOT NULL,
    CONSTRAINT check_source_url_length CHECK (source_url IS NULL OR char_length(source_url) <= 2048)
);

COMMENT ON TABLE agent_tasks IS 'Task queue for AI agents to process';
COMMENT ON COLUMN agent_tasks.metadata IS 'Task-specific metadata and configuration';
COMMENT ON COLUMN agent_tasks.error_details IS 'Error information if task failed';

-- 3. Agent Sources Table
-- Manages data sources for AI agents
CREATE TABLE agent_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type source_type NOT NULL,
    url TEXT NOT NULL,
    credentials JSONB DEFAULT '{}' NOT NULL, -- Should be encrypted at application level
    fetch_interval INTERVAL DEFAULT '1 hour'::INTERVAL NOT NULL,
    last_fetched TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true NOT NULL,
    agent_id UUID NOT NULL REFERENCES ai_reporter_agents(id) ON DELETE CASCADE,
    config JSONB DEFAULT '{}' NOT NULL,
    error_count INTEGER DEFAULT 0 NOT NULL,
    last_error JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT check_url_length CHECK (char_length(url) <= 2048),
    CONSTRAINT check_fetch_interval CHECK (fetch_interval >= '5 minutes'::INTERVAL)
);

COMMENT ON TABLE agent_sources IS 'Data sources that AI agents can fetch content from';
COMMENT ON COLUMN agent_sources.credentials IS 'Encrypted credentials for accessing the source';
COMMENT ON COLUMN agent_sources.config IS 'Source-specific configuration (e.g., RSS parser settings, API parameters)';

-- 4. Content Pipeline Table
-- Tracks content through various processing stages
CREATE TABLE content_pipeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES ai_reporter_agents(id) ON DELETE CASCADE,
    stage pipeline_stage DEFAULT 'fetched' NOT NULL,
    raw_content JSONB DEFAULT '{}' NOT NULL,
    processed_content JSONB DEFAULT '{}' NOT NULL,
    article_draft JSONB DEFAULT '{}' NOT NULL,
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
    relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
    metadata JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    processed_at TIMESTAMPTZ,
    processing_duration INTERVAL GENERATED ALWAYS AS (
        CASE 
            WHEN processed_at IS NOT NULL THEN processed_at - created_at 
            ELSE NULL 
        END
    ) STORED
);

COMMENT ON TABLE content_pipeline IS 'Tracks content through the AI processing pipeline';
COMMENT ON COLUMN content_pipeline.raw_content IS 'Original fetched content';
COMMENT ON COLUMN content_pipeline.processed_content IS 'Content after analysis and processing';
COMMENT ON COLUMN content_pipeline.article_draft IS 'Generated article draft';
COMMENT ON COLUMN content_pipeline.quality_score IS 'AI-determined quality score (0-1)';
COMMENT ON COLUMN content_pipeline.relevance_score IS 'AI-determined relevance score (0-1)';

-- 5. Content Approval Queue Table
-- Human review queue for AI-generated content
CREATE TABLE content_approval_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID NOT NULL REFERENCES content_pipeline(id) ON DELETE CASCADE,
    article_data JSONB NOT NULL,
    status approval_status DEFAULT 'pending' NOT NULL,
    reviewer_notes TEXT,
    approved_by UUID REFERENCES auth.users(id),
    published_at TIMESTAMPTZ,
    published_article_id UUID, -- Reference to news_articles table
    auto_publish_at TIMESTAMPTZ,
    rejection_reason TEXT,
    edit_history JSONB[] DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    reviewed_at TIMESTAMPTZ,
    CONSTRAINT check_reviewer_notes_length CHECK (reviewer_notes IS NULL OR char_length(reviewer_notes) <= 5000),
    CONSTRAINT check_rejection_reason_length CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 1000)
);

COMMENT ON TABLE content_approval_queue IS 'Queue for human review of AI-generated articles';
COMMENT ON COLUMN content_approval_queue.article_data IS 'Complete article data ready for review';
COMMENT ON COLUMN content_approval_queue.published_article_id IS 'Reference to published article in news_articles table';
COMMENT ON COLUMN content_approval_queue.auto_publish_at IS 'Scheduled auto-publish time if approved';
COMMENT ON COLUMN content_approval_queue.edit_history IS 'Array of edit history with timestamps and changes';

-- Create indexes for performance
CREATE INDEX idx_ai_reporter_agents_type ON ai_reporter_agents(type);
CREATE INDEX idx_ai_reporter_agents_is_active ON ai_reporter_agents(is_active);
CREATE INDEX idx_ai_reporter_agents_last_run ON ai_reporter_agents(last_run);

CREATE INDEX idx_agent_tasks_agent_id ON agent_tasks(agent_id);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_priority_status ON agent_tasks(priority, status);
CREATE INDEX idx_agent_tasks_created_at ON agent_tasks(created_at DESC);

CREATE INDEX idx_agent_sources_agent_id ON agent_sources(agent_id);
CREATE INDEX idx_agent_sources_is_active ON agent_sources(is_active);
CREATE INDEX idx_agent_sources_last_fetched ON agent_sources(last_fetched);
CREATE INDEX idx_agent_sources_type ON agent_sources(type);

CREATE INDEX idx_content_pipeline_task_id ON content_pipeline(task_id);
CREATE INDEX idx_content_pipeline_agent_id ON content_pipeline(agent_id);
CREATE INDEX idx_content_pipeline_stage ON content_pipeline(stage);
CREATE INDEX idx_content_pipeline_created_at ON content_pipeline(created_at DESC);
CREATE INDEX idx_content_pipeline_quality_score ON content_pipeline(quality_score DESC) WHERE quality_score IS NOT NULL;

CREATE INDEX idx_content_approval_queue_pipeline_id ON content_approval_queue(pipeline_id);
CREATE INDEX idx_content_approval_queue_status ON content_approval_queue(status);
CREATE INDEX idx_content_approval_queue_created_at ON content_approval_queue(created_at DESC);
CREATE INDEX idx_content_approval_queue_auto_publish_at ON content_approval_queue(auto_publish_at) WHERE auto_publish_at IS NOT NULL;

-- Create update triggers for updated_at columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_ai_reporter_agents
    BEFORE UPDATE ON ai_reporter_agents
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_agent_sources
    BEFORE UPDATE ON agent_sources
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Row Level Security (RLS) Policies
ALTER TABLE ai_reporter_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_approval_queue ENABLE ROW LEVEL SECURITY;

-- Admin users can see and modify everything
CREATE POLICY "Admins can manage all AI reporter agents" ON ai_reporter_agents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can manage all agent tasks" ON agent_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can manage all agent sources" ON agent_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can manage all content pipeline" ON content_pipeline
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can manage all approval queue" ON content_approval_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Editor users can view and approve content
CREATE POLICY "Editors can view approval queue" ON content_approval_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'editor')
        )
    );

CREATE POLICY "Editors can update approval queue" ON content_approval_queue
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'editor')
        )
    );

-- Service role (for Edge Functions) can access everything
CREATE POLICY "Service role full access to ai_reporter_agents" ON ai_reporter_agents
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to agent_tasks" ON agent_tasks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to agent_sources" ON agent_sources
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to content_pipeline" ON content_pipeline
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to content_approval_queue" ON content_approval_queue
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions to authenticated users for read operations on approved content
GRANT SELECT ON ai_reporter_agents TO authenticated;
GRANT SELECT ON content_approval_queue TO authenticated;

-- Create helper functions for common operations
CREATE OR REPLACE FUNCTION get_agent_next_task(p_agent_id UUID)
RETURNS UUID AS $$
DECLARE
    v_task_id UUID;
BEGIN
    -- Claim the next pending task for the agent
    UPDATE agent_tasks
    SET status = 'claimed',
        claimed_at = now()
    WHERE id = (
        SELECT id
        FROM agent_tasks
        WHERE agent_id = p_agent_id
        AND status = 'pending'
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING id INTO v_task_id;
    
    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate agent performance metrics
CREATE OR REPLACE FUNCTION update_agent_performance_metrics(p_agent_id UUID)
RETURNS VOID AS $$
DECLARE
    v_metrics JSONB;
    v_success_rate DECIMAL;
    v_avg_quality DECIMAL;
    v_total_articles INTEGER;
BEGIN
    -- Calculate success rate
    SELECT 
        COALESCE(
            CAST(COUNT(*) FILTER (WHERE status = 'completed') AS DECIMAL) / 
            NULLIF(COUNT(*), 0), 
            0
        ) INTO v_success_rate
    FROM agent_tasks
    WHERE agent_id = p_agent_id
    AND created_at > now() - INTERVAL '30 days';
    
    -- Calculate average quality score
    SELECT 
        COALESCE(AVG(quality_score), 0) INTO v_avg_quality
    FROM content_pipeline
    WHERE agent_id = p_agent_id
    AND created_at > now() - INTERVAL '30 days';
    
    -- Count total articles generated
    SELECT COUNT(*) INTO v_total_articles
    FROM content_pipeline
    WHERE agent_id = p_agent_id
    AND stage IN ('written', 'reviewed', 'queued');
    
    -- Build metrics JSON
    v_metrics := jsonb_build_object(
        'success_rate', v_success_rate,
        'avg_quality_score', v_avg_quality,
        'articles_generated', v_total_articles,
        'last_updated', now()
    );
    
    -- Update agent metrics
    UPDATE ai_reporter_agents
    SET performance_metrics = v_metrics,
        updated_at = now()
    WHERE id = p_agent_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_agent_next_task IS 'Atomically claim the next pending task for an agent';
COMMENT ON FUNCTION update_agent_performance_metrics IS 'Calculate and update performance metrics for an agent';