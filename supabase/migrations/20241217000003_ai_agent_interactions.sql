-- Migration: Add AI Agent Interactions table for learning and improvement
-- This table tracks how users interact with the AI Mayor and specialized agents

-- Create AI Agent Interactions table
CREATE TABLE IF NOT EXISTS ai_agent_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Query information
    query TEXT NOT NULL,
    processed_query TEXT,
    intent_analysis JSONB,
    
    -- Response information
    response_content TEXT NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Agent information
    data_sources TEXT[],
    collaborating_agents TEXT[],
    primary_agent TEXT,
    
    -- Interaction metadata
    response_time_ms INTEGER,
    user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
    follow_up_query BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_agent_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_agent_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_primary_agent ON ai_agent_interactions(primary_agent);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_confidence ON ai_agent_interactions(confidence);

-- Create GIN index for JSONB intent analysis
CREATE INDEX IF NOT EXISTS idx_ai_interactions_intent_analysis 
ON ai_agent_interactions USING GIN (intent_analysis);

-- Create index for full-text search on queries
CREATE INDEX IF NOT EXISTS idx_ai_interactions_query_search 
ON ai_agent_interactions USING GIN (to_tsvector('english', query));

-- Enable Row Level Security
ALTER TABLE ai_agent_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own interactions
CREATE POLICY "Users can view own AI interactions" ON ai_agent_interactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own interactions
CREATE POLICY "Users can create AI interactions" ON ai_agent_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own interactions (for satisfaction ratings)
CREATE POLICY "Users can update own AI interactions" ON ai_agent_interactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin users can view all interactions for analytics
CREATE POLICY "Admin can view all AI interactions" ON ai_agent_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before UPDATE
CREATE TRIGGER trigger_update_ai_interactions_updated_at
    BEFORE UPDATE ON ai_agent_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_interactions_updated_at();

-- Add comment explaining the table purpose
COMMENT ON TABLE ai_agent_interactions IS 'Tracks user interactions with AI Mayor and specialized agents for learning and improvement';
COMMENT ON COLUMN ai_agent_interactions.intent_analysis IS 'JSON object containing intent analysis results from query processing';
COMMENT ON COLUMN ai_agent_interactions.data_sources IS 'Array of data sources used to generate the response';
COMMENT ON COLUMN ai_agent_interactions.collaborating_agents IS 'Array of agent IDs that collaborated on the response';
COMMENT ON COLUMN ai_agent_interactions.user_satisfaction IS 'User rating from 1-5 for response quality';