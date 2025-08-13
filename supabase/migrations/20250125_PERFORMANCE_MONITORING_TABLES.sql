-- =====================================================
-- PERFORMANCE MONITORING TABLES
-- =====================================================
-- Track performance metrics for Dubai/UAE optimization
-- =====================================================

-- Performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    country TEXT,
    city TEXT,
    
    -- Core Web Vitals
    lcp DECIMAL(10,2), -- Largest Contentful Paint (ms)
    fid DECIMAL(10,2), -- First Input Delay (ms)
    cls DECIMAL(10,4), -- Cumulative Layout Shift (score)
    fcp DECIMAL(10,2), -- First Contentful Paint (ms)
    ttfb DECIMAL(10,2), -- Time to First Byte (ms)
    
    -- Custom metrics
    api_latency JSONB, -- Endpoint-specific latencies
    cache_hit_rate DECIMAL(3,2), -- 0-1 percentage
    
    -- Context
    user_agent TEXT,
    connection_type TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance alerts table
CREATE TABLE IF NOT EXISTS public.performance_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type TEXT NOT NULL,
    country TEXT,
    city TEXT,
    metric_value DECIMAL(10,2),
    threshold DECIMAL(10,2),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CDN cache statistics
CREATE TABLE IF NOT EXISTS public.cdn_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint TEXT NOT NULL,
    country TEXT,
    hits INTEGER DEFAULT 0,
    misses INTEGER DEFAULT 0,
    bandwidth_saved BIGINT DEFAULT 0, -- bytes
    avg_response_time DECIMAL(10,2), -- ms
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(endpoint, country, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_country ON public.performance_metrics(country, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user ON public.performance_metrics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_active ON public.performance_alerts(resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cdn_statistics_endpoint ON public.cdn_statistics(endpoint, date DESC);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdn_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Performance metrics - users can see their own, admins see all
CREATE POLICY "performance_metrics_own" ON public.performance_metrics
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "performance_metrics_insert" ON public.performance_metrics
    FOR INSERT WITH CHECK (true); -- Anyone can submit metrics

-- Alerts - admins only
CREATE POLICY "performance_alerts_admin" ON public.performance_alerts
    FOR ALL USING (public.is_admin());

-- CDN stats - public read, admin write
CREATE POLICY "cdn_statistics_read" ON public.cdn_statistics
    FOR SELECT USING (true);

CREATE POLICY "cdn_statistics_admin" ON public.cdn_statistics
    FOR ALL USING (public.is_admin());

-- Grant permissions
GRANT SELECT, INSERT ON public.performance_metrics TO authenticated, anon;
GRANT SELECT ON public.performance_alerts TO authenticated;
GRANT ALL ON public.performance_alerts TO authenticated; -- Controlled by RLS
GRANT SELECT ON public.cdn_statistics TO authenticated, anon;
GRANT ALL ON public.cdn_statistics TO authenticated; -- Controlled by RLS

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get performance summary by country
CREATE OR REPLACE FUNCTION public.get_performance_summary(
    time_range INTERVAL DEFAULT '24 hours',
    country_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    country TEXT,
    city TEXT,
    avg_lcp DECIMAL,
    avg_fid DECIMAL,
    avg_cls DECIMAL,
    avg_ttfb DECIMAL,
    p75_lcp DECIMAL,
    p75_fid DECIMAL,
    cache_hit_rate DECIMAL,
    sample_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.country,
        pm.city,
        ROUND(AVG(pm.lcp)::DECIMAL, 2) as avg_lcp,
        ROUND(AVG(pm.fid)::DECIMAL, 2) as avg_fid,
        ROUND(AVG(pm.cls)::DECIMAL, 4) as avg_cls,
        ROUND(AVG(pm.ttfb)::DECIMAL, 2) as avg_ttfb,
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY pm.lcp)::DECIMAL, 2) as p75_lcp,
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY pm.fid)::DECIMAL, 2) as p75_fid,
        ROUND(AVG(pm.cache_hit_rate)::DECIMAL, 2) as cache_hit_rate,
        COUNT(*) as sample_count
    FROM public.performance_metrics pm
    WHERE 
        pm.created_at >= NOW() - time_range
        AND (country_filter IS NULL OR pm.country = country_filter)
    GROUP BY pm.country, pm.city
    ORDER BY sample_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update CDN statistics
CREATE OR REPLACE FUNCTION public.update_cdn_stats(
    p_endpoint TEXT,
    p_country TEXT,
    p_cache_hit BOOLEAN,
    p_response_time DECIMAL,
    p_bytes_saved BIGINT DEFAULT 0
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.cdn_statistics (
        endpoint,
        country,
        hits,
        misses,
        bandwidth_saved,
        avg_response_time,
        date
    ) VALUES (
        p_endpoint,
        p_country,
        CASE WHEN p_cache_hit THEN 1 ELSE 0 END,
        CASE WHEN p_cache_hit THEN 0 ELSE 1 END,
        CASE WHEN p_cache_hit THEN p_bytes_saved ELSE 0 END,
        p_response_time,
        CURRENT_DATE
    )
    ON CONFLICT (endpoint, country, date) DO UPDATE SET
        hits = cdn_statistics.hits + CASE WHEN p_cache_hit THEN 1 ELSE 0 END,
        misses = cdn_statistics.misses + CASE WHEN p_cache_hit THEN 0 ELSE 1 END,
        bandwidth_saved = cdn_statistics.bandwidth_saved + CASE WHEN p_cache_hit THEN p_bytes_saved ELSE 0 END,
        avg_response_time = (
            (cdn_statistics.avg_response_time * (cdn_statistics.hits + cdn_statistics.misses) + p_response_time) / 
            (cdn_statistics.hits + cdn_statistics.misses + 1)
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=== PERFORMANCE MONITORING TABLES CREATED ===';
    RAISE NOTICE 'Tables added:';
    RAISE NOTICE '- performance_metrics';
    RAISE NOTICE '- performance_alerts';
    RAISE NOTICE '- cdn_statistics';
    RAISE NOTICE 'Functions added:';
    RAISE NOTICE '- get_performance_summary()';
    RAISE NOTICE '- update_cdn_stats()';
    RAISE NOTICE '==========================================';
END $$;