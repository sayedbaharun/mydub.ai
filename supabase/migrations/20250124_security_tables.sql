-- Security Enhancement Tables
-- Rate limiting and security logging

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 0,
  window_start BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for efficient lookups
CREATE INDEX idx_rate_limits_user_action ON rate_limits(user_id, action);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

-- Security logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('auth_failure', 'rate_limit', 'suspicious_activity', 'data_access')),
  user_id UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes for efficient queries
CREATE INDEX idx_security_logs_user ON security_logs(user_id);
CREATE INDEX idx_security_logs_event ON security_logs(event_type);
CREATE INDEX idx_security_logs_created ON security_logs(created_at);

-- Session tracking for enhanced security
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  error_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_failed_logins_email ON failed_login_attempts(email);
CREATE INDEX idx_failed_logins_ip ON failed_login_attempts(ip_address);
CREATE INDEX idx_failed_logins_created ON failed_login_attempts(created_at);

-- API key management (for future use)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  last_used TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Rate limits: Users can only see their own
CREATE POLICY rate_limits_user_select ON rate_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Security logs: Only admins can view
CREATE POLICY security_logs_admin_only ON security_logs
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- User sessions: Users can see their own sessions
CREATE POLICY user_sessions_own ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- User sessions: Users can delete their own sessions (logout)
CREATE POLICY user_sessions_delete_own ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Failed login attempts: Only admins can view
CREATE POLICY failed_logins_admin_only ON failed_login_attempts
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- API keys: Users can manage their own keys
CREATE POLICY api_keys_user_all ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Functions

-- Cleanup old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE window_start < (EXTRACT(EPOCH FROM NOW()) * 1000 - 86400000); -- 24 hours old
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log failed login attempt
CREATE OR REPLACE FUNCTION log_failed_login(
  p_email TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_error_type TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO failed_login_attempts (email, ip_address, user_agent, error_type)
  VALUES (p_email, p_ip_address, p_user_agent, p_error_type);
  
  -- Check if we need to trigger an alert (e.g., too many attempts)
  IF (
    SELECT COUNT(*) 
    FROM failed_login_attempts 
    WHERE email = p_email 
    AND created_at > NOW() - INTERVAL '15 minutes'
  ) >= 5 THEN
    -- Log security event
    INSERT INTO security_logs (event_type, details)
    VALUES ('suspicious_activity', jsonb_build_object(
      'type', 'multiple_failed_logins',
      'email', p_email,
      'ip_address', p_ip_address::text,
      'attempts_15min', 5
    ));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(p_ip_address INET)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM failed_login_attempts 
    WHERE ip_address = p_ip_address 
    AND created_at > NOW() - INTERVAL '1 hour'
    GROUP BY ip_address
    HAVING COUNT(*) >= 20
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup jobs (requires pg_cron extension)
-- Note: pg_cron must be enabled in Supabase dashboard
-- SELECT cron.schedule('cleanup-rate-limits', '0 * * * *', 'SELECT cleanup_old_rate_limits();');
-- SELECT cron.schedule('cleanup-sessions', '*/15 * * * *', 'SELECT cleanup_expired_sessions();');