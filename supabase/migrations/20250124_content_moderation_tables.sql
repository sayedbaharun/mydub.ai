-- Content Moderation Tables for UAE Compliance

-- Content moderation logs table
CREATE TABLE IF NOT EXISTS content_moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('chat', 'comment', 'post', 'profile')),
    content TEXT NOT NULL,
    flagged BOOLEAN NOT NULL DEFAULT false,
    categories TEXT[] DEFAULT '{}',
    severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low', 'safe')),
    scores JSONB DEFAULT '{}',
    action TEXT NOT NULL CHECK (action IN ('approved', 'blocked', 'review', 'warning')),
    reason TEXT,
    review_required BOOLEAN DEFAULT false,
    final_action TEXT CHECK (final_action IN ('approve', 'block', 'warn')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content reports table for user-reported content
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('chat', 'comment', 'post', 'profile')),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Moderation queue for content requiring review
CREATE TABLE IF NOT EXISTS moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('chat', 'comment', 'post', 'profile')),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    categories TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'reviewed', 'escalated')),
    assigned_to UUID REFERENCES auth.users(id),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    decision TEXT CHECK (decision IN ('approve', 'block', 'warn')),
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Moderation actions history
CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'content_removal', 'suspension', 'ban')),
    reason TEXT NOT NULL,
    duration_hours INTEGER, -- For temporary suspensions
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add violation tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS violation_severity INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_violation_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_violation_categories TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create indexes for performance
CREATE INDEX idx_moderation_logs_user_id ON content_moderation_logs(user_id);
CREATE INDEX idx_moderation_logs_created_at ON content_moderation_logs(created_at DESC);
CREATE INDEX idx_moderation_logs_flagged ON content_moderation_logs(flagged) WHERE flagged = true;
CREATE INDEX idx_moderation_logs_review_required ON content_moderation_logs(review_required) WHERE review_required = true;

CREATE INDEX idx_content_reports_status ON content_reports(status);
CREATE INDEX idx_content_reports_reporter_id ON content_reports(reporter_id);
CREATE INDEX idx_content_reports_created_at ON content_reports(created_at DESC);

CREATE INDEX idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX idx_moderation_queue_severity ON moderation_queue(severity);
CREATE INDEX idx_moderation_queue_assigned_to ON moderation_queue(assigned_to);

CREATE INDEX idx_moderation_actions_user_id ON moderation_actions(user_id);
CREATE INDEX idx_moderation_actions_created_at ON moderation_actions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE content_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_moderation_logs
-- Users can see their own moderation history
CREATE POLICY "Users can view own moderation logs" ON content_moderation_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Moderators and admins can view all logs
CREATE POLICY "Moderators can view all moderation logs" ON content_moderation_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('editor', 'admin')
        )
    );

-- System can insert logs
CREATE POLICY "System can insert moderation logs" ON content_moderation_logs
    FOR INSERT WITH CHECK (true);

-- Moderators can update logs
CREATE POLICY "Moderators can update moderation logs" ON content_moderation_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('editor', 'admin')
        )
    );

-- RLS Policies for content_reports
-- Users can create reports
CREATE POLICY "Users can create content reports" ON content_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON content_reports
    FOR SELECT USING (auth.uid() = reporter_id);

-- Moderators can view and update all reports
CREATE POLICY "Moderators can manage all reports" ON content_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('editor', 'admin')
        )
    );

-- RLS Policies for moderation_queue
-- Moderators can view and manage queue
CREATE POLICY "Moderators can manage moderation queue" ON moderation_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('editor', 'admin')
        )
    );

-- System can insert to queue
CREATE POLICY "System can insert to moderation queue" ON moderation_queue
    FOR INSERT WITH CHECK (true);

-- RLS Policies for moderation_actions
-- Users can view actions taken against them
CREATE POLICY "Users can view own moderation actions" ON moderation_actions
    FOR SELECT USING (auth.uid() = user_id);

-- Moderators can view and create actions
CREATE POLICY "Moderators can manage moderation actions" ON moderation_actions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('editor', 'admin')
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_content_moderation_logs_updated_at BEFORE UPDATE ON content_moderation_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_reports_updated_at BEFORE UPDATE ON content_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_queue_updated_at BEFORE UPDATE ON moderation_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically suspend users with too many violations
CREATE OR REPLACE FUNCTION check_user_violations()
RETURNS TRIGGER AS $$
BEGIN
    -- If user has 3+ violations or severity score >= 10, suspend them
    IF NEW.violation_count >= 3 OR NEW.violation_severity >= 10 THEN
        NEW.status = 'suspended';
        NEW.suspended_at = now();
        IF NEW.suspension_reason IS NULL THEN
            NEW.suspension_reason = 'Automatic suspension due to multiple content violations';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic suspension
CREATE TRIGGER auto_suspend_violators BEFORE UPDATE OF violation_count, violation_severity ON profiles
    FOR EACH ROW EXECUTE FUNCTION check_user_violations();

-- Create view for moderation statistics
CREATE OR REPLACE VIEW moderation_statistics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_moderations,
    COUNT(*) FILTER (WHERE flagged = true) as flagged_content,
    COUNT(*) FILTER (WHERE action = 'blocked') as blocked_content,
    COUNT(*) FILTER (WHERE action = 'review') as content_for_review,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_violations,
    COUNT(*) FILTER (WHERE severity = 'high') as high_violations,
    COUNT(DISTINCT user_id) as unique_users_moderated
FROM content_moderation_logs
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Grant permissions to authenticated users to view statistics (for dashboard)
GRANT SELECT ON moderation_statistics TO authenticated;