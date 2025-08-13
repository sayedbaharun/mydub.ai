-- Create cache table for application-level caching
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster cleanup of expired entries
CREATE INDEX idx_cache_expires_at ON cache(expires_at);

-- Enable RLS
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;

-- Policy for service role only (cache should not be accessible to users)
CREATE POLICY "Service role can manage cache" ON cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to automatically clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a cron job to run cleanup daily (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-cache', '0 2 * * *', 'SELECT cleanup_expired_cache();');