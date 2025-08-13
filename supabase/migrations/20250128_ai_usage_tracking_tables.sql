-- AI Usage Tracking and Budget Control Tables
-- Created: 2025-01-28
-- Description: Tables for tracking AI service usage, costs, and implementing budget controls

-- AI Usage Tracking Table
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    service_type TEXT NOT NULL CHECK (service_type IN ('chat', 'content_generation', 'translation', 'summarization', 'search', 'other')),
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    actual_cost DECIMAL(10, 6),
    request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_timestamp TIMESTAMPTZ,
    request_duration_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Budgets Table
CREATE TABLE IF NOT EXISTS usage_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID, -- For future organization support
    budget_type TEXT NOT NULL CHECK (budget_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    budget_limit DECIMAL(10, 2) NOT NULL,
    current_usage DECIMAL(10, 2) NOT NULL DEFAULT 0,
    reset_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    alert_thresholds INTEGER[] DEFAULT ARRAY[50, 75, 90], -- Percentage thresholds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one active budget per type per user
    UNIQUE(user_id, budget_type, is_active) WHERE is_active = true
);

-- Usage Alerts Table
CREATE TABLE IF NOT EXISTS usage_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    budget_id UUID REFERENCES usage_budgets(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold', 'limit_exceeded', 'daily_summary')),
    threshold_percentage INTEGER,
    current_usage DECIMAL(10, 2) NOT NULL,
    budget_limit DECIMAL(10, 2) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Rules Table
CREATE TABLE IF NOT EXISTS budget_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID, -- For future organization support
    rule_type TEXT NOT NULL CHECK (rule_type IN ('daily_limit', 'monthly_limit', 'per_request_limit', 'service_limit', 'rate_limit')),
    rule_value DECIMAL(10, 2) NOT NULL,
    applies_to TEXT NOT NULL CHECK (applies_to IN ('all', 'specific_service', 'specific_user')),
    service_filter TEXT,
    user_filter TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    enforcement_action TEXT NOT NULL CHECK (enforcement_action IN ('block', 'warn', 'throttle', 'downgrade')),
    alternative_service TEXT, -- For downgrade action
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Violations Table
CREATE TABLE IF NOT EXISTS budget_violations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES budget_rules(id) ON DELETE SET NULL,
    violation_amount DECIMAL(10, 2) NOT NULL,
    rule_limit DECIMAL(10, 2) NOT NULL,
    action_taken TEXT NOT NULL CHECK (action_taken IN ('blocked', 'warned', 'throttled')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_user_id ON ai_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_timestamp ON ai_usage_tracking(request_timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_service ON ai_usage_tracking(service_type, provider, model);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_session ON ai_usage_tracking(session_id);

CREATE INDEX IF NOT EXISTS idx_usage_budgets_user_id ON usage_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_budgets_active ON usage_budgets(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_usage_budgets_reset_date ON usage_budgets(reset_date);

CREATE INDEX IF NOT EXISTS idx_usage_alerts_user_id ON usage_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_unread ON usage_alerts(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_usage_alerts_created_at ON usage_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_budget_rules_user_id ON budget_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_rules_active ON budget_rules(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_budget_violations_user_id ON budget_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_violations_created_at ON budget_violations(created_at);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_ai_usage_tracking_updated_at 
    BEFORE UPDATE ON ai_usage_tracking 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_usage_budgets_updated_at 
    BEFORE UPDATE ON usage_budgets 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_budget_rules_updated_at 
    BEFORE UPDATE ON budget_rules 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to automatically calculate total_tokens
CREATE OR REPLACE FUNCTION calculate_total_tokens()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_tokens = COALESCE(NEW.input_tokens, 0) + COALESCE(NEW.output_tokens, 0);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_total_tokens_trigger
    BEFORE INSERT OR UPDATE ON ai_usage_tracking
    FOR EACH ROW EXECUTE PROCEDURE calculate_total_tokens();

-- RLS Policies
ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_violations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view their own AI usage" ON ai_usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI usage" ON ai_usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own budgets" ON usage_budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budgets" ON usage_budgets
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own alerts" ON usage_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON usage_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert alerts" ON usage_alerts
    FOR INSERT WITH CHECK (true); -- Allow system to create alerts

CREATE POLICY "Users can view their own budget rules" ON budget_rules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budget rules" ON budget_rules
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own violations" ON budget_violations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert violations" ON budget_violations
    FOR INSERT WITH CHECK (true); -- Allow system to log violations

-- Views for easier querying
CREATE OR REPLACE VIEW user_usage_summary AS
SELECT 
    user_id,
    DATE_TRUNC('day', request_timestamp) as usage_date,
    service_type,
    provider,
    model,
    COUNT(*) as request_count,
    SUM(input_tokens) as total_input_tokens,
    SUM(output_tokens) as total_output_tokens,
    SUM(total_tokens) as total_tokens,
    SUM(estimated_cost) as total_estimated_cost,
    SUM(actual_cost) as total_actual_cost,
    AVG(request_duration_ms) as avg_duration_ms
FROM ai_usage_tracking
GROUP BY user_id, DATE_TRUNC('day', request_timestamp), service_type, provider, model;

CREATE OR REPLACE VIEW user_monthly_usage AS
SELECT 
    user_id,
    DATE_TRUNC('month', request_timestamp) as usage_month,
    COUNT(*) as total_requests,
    SUM(total_tokens) as total_tokens,
    SUM(estimated_cost) as total_cost,
    AVG(estimated_cost) as avg_cost_per_request
FROM ai_usage_tracking
GROUP BY user_id, DATE_TRUNC('month', request_timestamp);

-- Comments for documentation
COMMENT ON TABLE ai_usage_tracking IS 'Tracks all AI service usage with costs and metadata';
COMMENT ON TABLE usage_budgets IS 'User-defined budgets for AI service usage';
COMMENT ON TABLE usage_alerts IS 'Alerts generated when budget thresholds are reached';
COMMENT ON TABLE budget_rules IS 'Rules for enforcing budget limits and controls';
COMMENT ON TABLE budget_violations IS 'Log of budget rule violations and actions taken';

COMMENT ON COLUMN ai_usage_tracking.service_type IS 'Type of AI service used (chat, content_generation, etc.)';
COMMENT ON COLUMN ai_usage_tracking.estimated_cost IS 'Estimated cost in USD based on token usage';
COMMENT ON COLUMN ai_usage_tracking.actual_cost IS 'Actual cost charged by the provider (if available)';
COMMENT ON COLUMN ai_usage_tracking.metadata IS 'Additional metadata like prompts, settings, quality ratings';

COMMENT ON COLUMN usage_budgets.alert_thresholds IS 'Percentage thresholds for sending alerts (e.g., [50, 75, 90])';
COMMENT ON COLUMN budget_rules.enforcement_action IS 'Action to take when rule is violated (block, warn, throttle, downgrade)';
COMMENT ON COLUMN budget_rules.alternative_service IS 'Alternative service to suggest when downgrading';

-- Grant permissions
GRANT SELECT, INSERT ON ai_usage_tracking TO authenticated;
GRANT ALL ON usage_budgets TO authenticated;
GRANT SELECT, UPDATE ON usage_alerts TO authenticated;
GRANT ALL ON budget_rules TO authenticated;
GRANT SELECT ON budget_violations TO authenticated;
GRANT SELECT ON user_usage_summary TO authenticated;
GRANT SELECT ON user_monthly_usage TO authenticated;