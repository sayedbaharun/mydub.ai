-- Analytics Performance Table
CREATE TABLE IF NOT EXISTS analytics_performance (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    url TEXT NOT NULL,
    page_path TEXT NOT NULL,
    
    -- Web Vitals
    cls DECIMAL,
    fcp DECIMAL,
    fid DECIMAL,
    lcp DECIMAL,
    ttfb DECIMAL,
    inp DECIMAL,
    
    -- Device Info
    viewport_width INTEGER,
    viewport_height INTEGER,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    
    -- Connection Info
    connection_type VARCHAR(50),
    connection_speed DECIMAL,
    connection_rtt DECIMAL,
    
    -- Raw metrics for debugging
    raw_metrics JSONB,
    
    -- Indexes
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_performance_timestamp ON analytics_performance(timestamp DESC);
CREATE INDEX idx_analytics_performance_page ON analytics_performance(page_path);
CREATE INDEX idx_analytics_performance_device ON analytics_performance(device_type);

-- Analytics Errors Table
CREATE TABLE IF NOT EXISTS analytics_errors (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    url TEXT,
    user_agent TEXT,
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(100),
    context JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_errors_timestamp ON analytics_errors(timestamp DESC);
CREATE INDEX idx_analytics_errors_type ON analytics_errors(error_type);
CREATE INDEX idx_analytics_errors_user ON analytics_errors(user_id);

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(100),
    event_value DECIMAL,
    event_data JSONB,
    url TEXT,
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(100),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);

-- Performance Violations Table (for alerting)
CREATE TABLE IF NOT EXISTS performance_violations (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    url TEXT NOT NULL,
    metric VARCHAR(50) NOT NULL,
    value DECIMAL NOT NULL,
    threshold DECIMAL NOT NULL,
    severity VARCHAR(20) NOT NULL,
    alerted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_performance_violations_timestamp ON performance_violations(timestamp DESC);
CREATE INDEX idx_performance_violations_severity ON performance_violations(severity);
CREATE INDEX idx_performance_violations_alerted ON performance_violations(alerted);

-- Alert History Table
CREATE TABLE IF NOT EXISTS alert_history (
    id BIGSERIAL PRIMARY KEY,
    alert_name VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL NOT NULL,
    threshold_value DECIMAL NOT NULL,
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_channels JSONB,
    error_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_history_timestamp ON alert_history(created_at DESC);
CREATE INDEX idx_alert_history_type ON alert_history(alert_type);
CREATE INDEX idx_alert_history_severity ON alert_history(severity);

-- Analytics Summary View (Materialized)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_performance_summary AS
SELECT 
    date_trunc('hour', timestamp) as hour,
    page_path,
    device_type,
    COUNT(*) as page_views,
    
    -- Web Vitals Percentiles
    percentile_cont(0.5) WITHIN GROUP (ORDER BY lcp) as lcp_p50,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY lcp) as lcp_p75,
    percentile_cont(0.9) WITHIN GROUP (ORDER BY lcp) as lcp_p90,
    
    percentile_cont(0.5) WITHIN GROUP (ORDER BY fcp) as fcp_p50,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY fcp) as fcp_p75,
    percentile_cont(0.9) WITHIN GROUP (ORDER BY fcp) as fcp_p90,
    
    percentile_cont(0.5) WITHIN GROUP (ORDER BY cls) as cls_p50,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY cls) as cls_p75,
    percentile_cont(0.9) WITHIN GROUP (ORDER BY cls) as cls_p90,
    
    -- Good/Needs Improvement/Poor counts (based on Web Vitals thresholds)
    COUNT(*) FILTER (WHERE lcp <= 2500) as lcp_good,
    COUNT(*) FILTER (WHERE lcp > 2500 AND lcp <= 4000) as lcp_needs_improvement,
    COUNT(*) FILTER (WHERE lcp > 4000) as lcp_poor,
    
    COUNT(*) FILTER (WHERE cls <= 0.1) as cls_good,
    COUNT(*) FILTER (WHERE cls > 0.1 AND cls <= 0.25) as cls_needs_improvement,
    COUNT(*) FILTER (WHERE cls > 0.25) as cls_poor
    
FROM analytics_performance
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY hour, page_path, device_type;

-- Create index on materialized view
CREATE INDEX idx_analytics_summary_hour ON analytics_performance_summary(hour DESC);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_analytics_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE analytics_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role can manage analytics" ON analytics_performance
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage errors" ON analytics_errors
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage events" ON analytics_events
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Admins can view analytics
CREATE POLICY "Admins can view analytics" ON analytics_performance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can view errors" ON analytics_errors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Users can only see their own events
CREATE POLICY "Users can see own events" ON analytics_events
    FOR SELECT USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE analytics_performance IS 'Stores web performance metrics from Real User Monitoring';
COMMENT ON TABLE analytics_errors IS 'Stores application errors and exceptions';
COMMENT ON TABLE analytics_events IS 'Stores custom analytics events';
COMMENT ON TABLE performance_violations IS 'Stores performance threshold violations for alerting';
COMMENT ON TABLE alert_history IS 'History of all alerts triggered by the monitoring system';