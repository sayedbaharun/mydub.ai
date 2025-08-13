-- Data Residency and Compliance Tables for UAE Federal Law No. 45 of 2021

-- Data location registry
CREATE TABLE IF NOT EXISTS data_location_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_type TEXT NOT NULL,
    storage_region TEXT NOT NULL DEFAULT 'AE',
    encryption_status BOOLEAN DEFAULT true,
    data_classification TEXT CHECK (data_classification IN ('public', 'internal', 'confidential', 'restricted')),
    retention_period_days INTEGER,
    last_accessed TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    stored_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Data transfer requests
CREATE TABLE IF NOT EXISTS data_transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_type TEXT NOT NULL,
    source_region TEXT NOT NULL DEFAULT 'AE',
    target_region TEXT NOT NULL,
    reason TEXT NOT NULL,
    business_justification TEXT,
    data_volume_estimate TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'completed', 'cancelled')),
    risk_assessment JSONB,
    safeguards_applied TEXT[],
    requested_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    denial_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Data access logs
CREATE TABLE IF NOT EXISTS data_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    accessor_id UUID NOT NULL REFERENCES auth.users(id),
    data_type TEXT NOT NULL,
    data_classification TEXT,
    access_location TEXT NOT NULL,
    access_ip INET,
    access_method TEXT CHECK (access_method IN ('api', 'web', 'mobile', 'export', 'admin')),
    access_time TIMESTAMPTZ DEFAULT now(),
    purpose TEXT NOT NULL,
    authorized BOOLEAN NOT NULL,
    blocked_reason TEXT,
    session_id UUID,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Data export logs
CREATE TABLE IF NOT EXISTS data_export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_types TEXT[] NOT NULL,
    export_format TEXT CHECK (export_format IN ('json', 'csv', 'pdf', 'xlsx')),
    export_location TEXT NOT NULL,
    allowed_types TEXT[],
    restricted_types TEXT[],
    export_size_bytes BIGINT,
    export_status TEXT CHECK (export_status IN ('requested', 'processing', 'completed', 'failed', 'blocked')),
    block_reason TEXT,
    attempted_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    download_link TEXT,
    download_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Compliance audit trails
CREATE TABLE IF NOT EXISTS compliance_audit_trails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_type TEXT NOT NULL CHECK (audit_type IN ('data_residency', 'access_control', 'transfer_request', 'export_control', 'retention_policy')),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB NOT NULL,
    compliance_status TEXT CHECK (compliance_status IN ('compliant', 'non_compliant', 'exception_granted')),
    findings TEXT[],
    recommendations TEXT[],
    auditor_id UUID REFERENCES auth.users(id),
    automated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type TEXT NOT NULL UNIQUE,
    retention_days INTEGER NOT NULL,
    deletion_strategy TEXT CHECK (deletion_strategy IN ('hard_delete', 'soft_delete', 'anonymize', 'archive')),
    legal_basis TEXT NOT NULL,
    review_frequency_days INTEGER DEFAULT 90,
    last_reviewed TIMESTAMPTZ DEFAULT now(),
    next_review TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days'),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default retention policies
INSERT INTO data_retention_policies (data_type, retention_days, deletion_strategy, legal_basis) VALUES
    ('user_profiles', 1095, 'anonymize', 'UAE Data Protection Law - 3 years after account closure'),
    ('chat_messages', 365, 'soft_delete', 'Service improvement and user experience'),
    ('ai_decision_logs', 730, 'anonymize', 'AI transparency and audit requirements'),
    ('content_moderation_logs', 1095, 'archive', 'Legal compliance and appeals process'),
    ('financial_transactions', 2555, 'archive', 'UAE financial regulations - 7 years'),
    ('government_records', 3650, 'archive', 'Government data retention requirements - 10 years'),
    ('minors_data', 30, 'hard_delete', 'Enhanced protection for minors - delete 30 days after 18th birthday')
ON CONFLICT (data_type) DO NOTHING;

-- Regional access control
CREATE TABLE IF NOT EXISTS regional_access_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type TEXT NOT NULL,
    allowed_regions TEXT[] DEFAULT ARRAY['AE'],
    blocked_regions TEXT[] DEFAULT ARRAY[]::TEXT[],
    require_approval_regions TEXT[] DEFAULT ARRAY[]::TEXT[],
    encryption_required BOOLEAN DEFAULT true,
    vpn_blocked BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(data_type)
);

-- Insert default regional controls
INSERT INTO regional_access_controls (data_type, allowed_regions, require_approval_regions) VALUES
    ('government_records', ARRAY['AE'], ARRAY['SA', 'KW', 'QA', 'BH', 'OM']),
    ('health_records', ARRAY['AE'], ARRAY['SA', 'KW', 'QA', 'BH', 'OM']),
    ('financial_transactions', ARRAY['AE', 'SA', 'KW', 'QA', 'BH', 'OM'], ARRAY['EU', 'GB', 'US']),
    ('personal_identification', ARRAY['AE'], ARRAY[]::TEXT[]),
    ('minors_data', ARRAY['AE'], ARRAY[]::TEXT[])
ON CONFLICT (data_type) DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_data_location_user_id ON data_location_registry(user_id);
CREATE INDEX idx_data_location_region ON data_location_registry(storage_region);
CREATE INDEX idx_data_location_type ON data_location_registry(data_type);
CREATE INDEX idx_data_location_expires ON data_location_registry(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_transfer_requests_user_id ON data_transfer_requests(user_id);
CREATE INDEX idx_transfer_requests_status ON data_transfer_requests(status);
CREATE INDEX idx_transfer_requests_requested_at ON data_transfer_requests(requested_at DESC);

CREATE INDEX idx_access_logs_user_id ON data_access_logs(user_id);
CREATE INDEX idx_access_logs_accessor_id ON data_access_logs(accessor_id);
CREATE INDEX idx_access_logs_time ON data_access_logs(access_time DESC);
CREATE INDEX idx_access_logs_authorized ON data_access_logs(authorized);

CREATE INDEX idx_export_logs_user_id ON data_export_logs(user_id);
CREATE INDEX idx_export_logs_attempted_at ON data_export_logs(attempted_at DESC);

CREATE INDEX idx_audit_trails_entity ON compliance_audit_trails(entity_type, entity_id);
CREATE INDEX idx_audit_trails_created_at ON compliance_audit_trails(created_at DESC);

-- Enable Row Level Security
ALTER TABLE data_location_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_access_controls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_location_registry
CREATE POLICY "Users can view own data locations" ON data_location_registry
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage data locations" ON data_location_registry
    FOR ALL WITH CHECK (true);

CREATE POLICY "Compliance officers can view all data locations" ON data_location_registry
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'compliance_officer')
        )
    );

-- RLS Policies for data_transfer_requests
CREATE POLICY "Users can view own transfer requests" ON data_transfer_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create transfer requests" ON data_transfer_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Compliance can manage all transfer requests" ON data_transfer_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'compliance_officer')
        )
    );

-- RLS Policies for data_access_logs
CREATE POLICY "Users can view own access logs" ON data_access_logs
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = accessor_id);

CREATE POLICY "System can insert access logs" ON data_access_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all access logs" ON data_access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for data_export_logs
CREATE POLICY "Users can view own export logs" ON data_export_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage export logs" ON data_export_logs
    FOR ALL WITH CHECK (true);

-- RLS Policies for compliance_audit_trails
CREATE POLICY "Compliance can manage audit trails" ON compliance_audit_trails
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'compliance_officer', 'auditor')
        )
    );

-- RLS Policies for data_retention_policies
CREATE POLICY "Public can view retention policies" ON data_retention_policies
    FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage retention policies" ON data_retention_policies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for regional_access_controls
CREATE POLICY "Public can view regional controls" ON regional_access_controls
    FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage regional controls" ON regional_access_controls
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Functions for compliance checks
CREATE OR REPLACE FUNCTION check_data_residency_compliance(p_user_id UUID)
RETURNS TABLE (
    compliant BOOLEAN,
    total_data_items INTEGER,
    uae_stored INTEGER,
    non_uae_stored INTEGER,
    critical_violations INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH user_data AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE storage_region = 'AE') as uae_count,
            COUNT(*) FILTER (WHERE storage_region != 'AE') as non_uae_count,
            COUNT(*) FILTER (WHERE storage_region != 'AE' AND data_type IN (
                'government_records', 'health_records', 'financial_transactions', 
                'personal_identification', 'minors_data'
            )) as critical_violations_count
        FROM data_location_registry
        WHERE user_id = p_user_id
    )
    SELECT 
        (critical_violations_count = 0) as compliant,
        total::INTEGER,
        uae_count::INTEGER,
        non_uae_count::INTEGER,
        critical_violations_count::INTEGER
    FROM user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enforce data retention
CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS void AS $$
DECLARE
    v_policy RECORD;
    v_deleted_count INTEGER;
BEGIN
    -- Loop through active retention policies
    FOR v_policy IN 
        SELECT * FROM data_retention_policies WHERE active = true
    LOOP
        -- Handle different deletion strategies
        CASE v_policy.deletion_strategy
            WHEN 'hard_delete' THEN
                -- Implement hard delete based on data_type
                -- This would need to be customized per data type
                NULL;
            
            WHEN 'soft_delete' THEN
                -- Implement soft delete
                UPDATE data_location_registry
                SET expires_at = now()
                WHERE data_type = v_policy.data_type
                    AND stored_at < now() - (v_policy.retention_days || ' days')::INTERVAL
                    AND expires_at IS NULL;
            
            WHEN 'anonymize' THEN
                -- Implement anonymization
                -- This would need custom logic per data type
                NULL;
            
            WHEN 'archive' THEN
                -- Implement archival
                -- Move to cold storage or archive tables
                NULL;
        END CASE;
        
        -- Log retention enforcement
        INSERT INTO compliance_audit_trails (
            audit_type,
            entity_type,
            entity_id,
            action,
            details,
            compliance_status,
            automated
        ) VALUES (
            'retention_policy',
            'data_retention_policies',
            v_policy.id,
            'enforce_retention',
            jsonb_build_object(
                'data_type', v_policy.data_type,
                'retention_days', v_policy.retention_days,
                'strategy', v_policy.deletion_strategy
            ),
            'compliant',
            true
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamps
CREATE TRIGGER update_data_location_updated_at BEFORE UPDATE ON data_location_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_requests_updated_at BEFORE UPDATE ON data_transfer_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retention_policies_updated_at BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regional_controls_updated_at BEFORE UPDATE ON regional_access_controls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for compliance dashboard
CREATE OR REPLACE VIEW data_residency_compliance_summary AS
SELECT 
    COUNT(DISTINCT dlr.user_id) as total_users,
    COUNT(*) as total_data_items,
    COUNT(*) FILTER (WHERE dlr.storage_region = 'AE') as uae_stored_items,
    COUNT(*) FILTER (WHERE dlr.storage_region != 'AE') as non_uae_items,
    COUNT(*) FILTER (WHERE dlr.data_type IN (
        'government_records', 'health_records', 'financial_transactions', 
        'personal_identification', 'minors_data'
    ) AND dlr.storage_region != 'AE') as critical_violations,
    COUNT(DISTINCT dtr.id) FILTER (WHERE dtr.status = 'pending') as pending_transfers,
    COUNT(DISTINCT dal.id) FILTER (WHERE dal.authorized = false) as unauthorized_access_attempts
FROM data_location_registry dlr
LEFT JOIN data_transfer_requests dtr ON dtr.user_id = dlr.user_id
LEFT JOIN data_access_logs dal ON dal.user_id = dlr.user_id;

-- Grant access to compliance summary
GRANT SELECT ON data_residency_compliance_summary TO authenticated;