-- AI Transparency and Disclosure Tables for UAE Compliance

-- AI decision logs table
CREATE TABLE IF NOT EXISTS ai_decision_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID,
    feature TEXT NOT NULL,
    model TEXT NOT NULL,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    reasoning TEXT,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- AI preferences table
CREATE TABLE IF NOT EXISTS ai_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_enabled BOOLEAN DEFAULT true,
    features JSONB DEFAULT '{
        "chatbot": true,
        "recommendations": true,
        "search_enhancement": true,
        "content_generation": true,
        "sentiment_analysis": true
    }',
    data_usage JSONB DEFAULT '{
        "allow_training": false,
        "allow_improvement": true,
        "allow_analytics": true
    }',
    transparency_level TEXT DEFAULT 'standard' CHECK (transparency_level IN ('minimal', 'standard', 'detailed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI opt-out logs
CREATE TABLE IF NOT EXISTS ai_opt_out_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opted_out BOOLEAN NOT NULL,
    feature TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- AI usage statistics
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    feature TEXT NOT NULL,
    model TEXT NOT NULL,
    interaction_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date, feature, model)
);

-- AI model registry
CREATE TABLE IF NOT EXISTS ai_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    version TEXT,
    capabilities TEXT[],
    limitations TEXT[],
    cost_per_1k_tokens DECIMAL(10,4),
    max_tokens INTEGER,
    supports_streaming BOOLEAN DEFAULT false,
    supports_functions BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default AI models
INSERT INTO ai_models (id, name, provider, version, capabilities, limitations, cost_per_1k_tokens, max_tokens, supports_streaming, supports_functions) VALUES
    ('gpt-4', 'GPT-4', 'OpenAI', '0613', 
     ARRAY['Natural language understanding', 'Code generation', 'Creative writing', 'Multilingual support'],
     ARRAY['Knowledge cutoff date', 'Cannot access real-time information', 'May occasionally generate incorrect information'],
     0.03, 8192, true, true),
    
    ('gpt-4-turbo', 'GPT-4 Turbo', 'OpenAI', '1106', 
     ARRAY['Faster processing', 'Larger context window', 'Better instruction following', 'JSON mode'],
     ARRAY['Knowledge cutoff date', 'Higher cost for large contexts', 'Rate limits apply'],
     0.01, 128000, true, true),
    
    ('claude-3-opus', 'Claude 3 Opus', 'Anthropic', '20240229', 
     ARRAY['Complex reasoning', 'Long context understanding', 'Nuanced responses', 'Safety-focused design'],
     ARRAY['Knowledge cutoff date', 'Cannot browse internet', 'May refuse certain requests'],
     0.015, 200000, true, false),
    
    ('claude-3-sonnet', 'Claude 3 Sonnet', 'Anthropic', '20240229', 
     ARRAY['Balanced performance', 'Good context retention', 'Efficient processing', 'Strong safety alignment'],
     ARRAY['Knowledge cutoff date', 'Limited multimodal support', 'Conservative responses'],
     0.003, 200000, true, false),
    
    ('gemini-pro', 'Gemini Pro', 'Google', '001', 
     ARRAY['Multimodal understanding', 'Efficient processing', 'Strong multilingual support', 'Google integration'],
     ARRAY['Knowledge cutoff date', 'Region restrictions', 'Usage quotas apply'],
     0.0005, 32768, true, true)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_ai_decision_logs_user_id ON ai_decision_logs(user_id);
CREATE INDEX idx_ai_decision_logs_created_at ON ai_decision_logs(created_at DESC);
CREATE INDEX idx_ai_decision_logs_feature ON ai_decision_logs(feature);
CREATE INDEX idx_ai_decision_logs_model ON ai_decision_logs(model);

CREATE INDEX idx_ai_opt_out_logs_user_id ON ai_opt_out_logs(user_id);
CREATE INDEX idx_ai_opt_out_logs_created_at ON ai_opt_out_logs(created_at DESC);

CREATE INDEX idx_ai_usage_stats_user_id ON ai_usage_stats(user_id);
CREATE INDEX idx_ai_usage_stats_date ON ai_usage_stats(date DESC);

-- Enable Row Level Security
ALTER TABLE ai_decision_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_opt_out_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_decision_logs
-- Users can view their own AI decision history
CREATE POLICY "Users can view own AI decisions" ON ai_decision_logs
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert AI decisions
CREATE POLICY "System can insert AI decisions" ON ai_decision_logs
    FOR INSERT WITH CHECK (true);

-- Admins can view all AI decisions
CREATE POLICY "Admins can view all AI decisions" ON ai_decision_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for ai_preferences
-- Users can view and update their own preferences
CREATE POLICY "Users can manage own AI preferences" ON ai_preferences
    FOR ALL USING (auth.uid() = user_id);

-- System can create default preferences
CREATE POLICY "System can create AI preferences" ON ai_preferences
    FOR INSERT WITH CHECK (true);

-- RLS Policies for ai_opt_out_logs
-- Users can view their own opt-out history
CREATE POLICY "Users can view own opt-out logs" ON ai_opt_out_logs
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert opt-out logs
CREATE POLICY "System can insert opt-out logs" ON ai_opt_out_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for ai_usage_stats
-- Users can view their own usage statistics
CREATE POLICY "Users can view own AI usage stats" ON ai_usage_stats
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert/update usage stats
CREATE POLICY "System can manage AI usage stats" ON ai_usage_stats
    FOR ALL WITH CHECK (true);

-- RLS Policies for ai_models
-- Everyone can view active AI models (for transparency)
CREATE POLICY "Public can view active AI models" ON ai_models
    FOR SELECT USING (active = true);

-- Only admins can manage AI models
CREATE POLICY "Admins can manage AI models" ON ai_models
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Function to update updated_at timestamp
CREATE TRIGGER update_ai_preferences_updated_at BEFORE UPDATE ON ai_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check AI feature access
CREATE OR REPLACE FUNCTION check_ai_feature_access(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_preferences RECORD;
BEGIN
    -- Get user preferences
    SELECT * INTO v_preferences
    FROM ai_preferences
    WHERE user_id = p_user_id;
    
    -- If no preferences, assume default (enabled)
    IF NOT FOUND THEN
        RETURN true;
    END IF;
    
    -- Check if AI is globally disabled
    IF NOT v_preferences.ai_enabled THEN
        RETURN false;
    END IF;
    
    -- Check specific feature
    IF v_preferences.features ? p_feature THEN
        RETURN (v_preferences.features->p_feature)::boolean;
    END IF;
    
    -- Default to enabled if feature not specified
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for AI transparency dashboard
CREATE OR REPLACE VIEW ai_transparency_summary AS
SELECT 
    u.id as user_id,
    u.email,
    p.full_name,
    COALESCE(prefs.ai_enabled, true) as ai_enabled,
    COALESCE(prefs.transparency_level, 'standard') as transparency_level,
    COUNT(DISTINCT logs.id) as total_ai_interactions,
    COUNT(DISTINCT logs.feature) as features_used,
    SUM(logs.tokens_used) as total_tokens_consumed,
    MAX(logs.created_at) as last_ai_interaction,
    COUNT(DISTINCT opt.id) FILTER (WHERE opt.opted_out = true) as opt_out_count
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN ai_preferences prefs ON prefs.user_id = u.id
LEFT JOIN ai_decision_logs logs ON logs.user_id = u.id
LEFT JOIN ai_opt_out_logs opt ON opt.user_id = u.id
GROUP BY u.id, u.email, p.full_name, prefs.ai_enabled, prefs.transparency_level;

-- Grant access to transparency summary for authenticated users
GRANT SELECT ON ai_transparency_summary TO authenticated;

-- Function to generate AI usage report
CREATE OR REPLACE FUNCTION generate_ai_usage_report(p_user_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
    feature TEXT,
    model TEXT,
    interaction_count BIGINT,
    tokens_used BIGINT,
    avg_confidence NUMERIC,
    avg_processing_time_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        logs.feature,
        logs.model,
        COUNT(*) as interaction_count,
        SUM(logs.tokens_used) as tokens_used,
        AVG(logs.confidence) as avg_confidence,
        AVG(logs.processing_time_ms) as avg_processing_time_ms
    FROM ai_decision_logs logs
    WHERE logs.user_id = p_user_id
        AND logs.created_at >= p_start_date
        AND logs.created_at <= p_end_date + INTERVAL '1 day'
    GROUP BY logs.feature, logs.model
    ORDER BY interaction_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;