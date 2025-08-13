/**
 * Security utilities for Supabase integration
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { sanitizeInput, sanitizeUrl } from './headers'

/**
 * Secure wrapper for Supabase client operations
 */
export class SecureSupabaseClient {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Sanitize user input before database operations
   */
  sanitizeData<T extends Record<string, any>>(data: T): T {
    const sanitized = {} as T
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Sanitize strings
        sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T]
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively sanitize nested objects
        sanitized[key as keyof T] = this.sanitizeData(value) as T[keyof T]
      } else if (Array.isArray(value)) {
        // Sanitize array elements
        sanitized[key as keyof T] = value.map(item => 
          typeof item === 'string' ? sanitizeInput(item) : item
        ) as T[keyof T]
      } else {
        // Keep other types as-is
        sanitized[key as keyof T] = value
      }
    }
    
    return sanitized
  }

  /**
   * Validate and sanitize URLs in data
   */
  sanitizeUrls<T extends Record<string, any>>(data: T, urlFields: (keyof T)[]): T {
    const sanitized = { ...data }
    
    for (const field of urlFields) {
      if (typeof data[field] === 'string') {
        const cleaned = sanitizeUrl(data[field])
        if (cleaned === null) {
          throw new Error(`Invalid URL in field ${String(field)}`)
        }
        sanitized[field] = cleaned as T[keyof T]
      }
    }
    
    return sanitized
  }

  /**
   * Rate limit key generator
   */
  getRateLimitKey(userId: string, action: string): string {
    return `rate_limit:${userId}:${action}:${Date.now()}`
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(
    userId: string, 
    action: string, 
    maxAttempts: number = 10, 
    windowMs: number = 60000
  ): Promise<boolean> {
    const now = Date.now()
    const windowStart = now - windowMs
    const key = `rate_limit:${userId}:${action}`
    
    try {
      // Get recent attempts
      const { data, error } = await this.supabase
        .from('rate_limits')
        .select('attempt_count, window_start')
        .eq('key', key)
        .single()
      
      if (error && error.code !== 'PGRST116') { // Not found error
        

-- Index for efficient lookups
CREATE INDEX idx_rate_limits_user_action ON rate_limits(user_id, action);

-- Cleanup old entries
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE window_start < (EXTRACT(EPOCH FROM NOW()) * 1000 - 86400000); -- 24 hours
END;
$$ LANGUAGE plpgsql;

-- Security logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for efficient queries
CREATE INDEX idx_security_logs_user ON security_logs(user_id);
CREATE INDEX idx_security_logs_event ON security_logs(event_type);
CREATE INDEX idx_security_logs_created ON security_logs(created_at);

-- RLS policies
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY security_logs_admin_only ON security_logs
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );
`