-- Create newsletter subscriptions table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'unsubscribed', 'pending')),
  language VARCHAR(10) DEFAULT 'en',
  preferences JSONB DEFAULT '{"news": true, "events": true, "dining": true, "tourism": true, "government": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes
CREATE INDEX idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);
CREATE INDEX idx_newsletter_subscriptions_status ON newsletter_subscriptions(status);
CREATE INDEX idx_newsletter_subscriptions_created_at ON newsletter_subscriptions(created_at DESC);

-- Enable RLS
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public to subscribe (insert)
CREATE POLICY "Allow public newsletter subscription"
  ON newsletter_subscriptions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to view their own subscription
CREATE POLICY "Users can view own subscription"
  ON newsletter_subscriptions
  FOR SELECT
  TO public
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Allow users to update their own subscription
CREATE POLICY "Users can update own subscription"
  ON newsletter_subscriptions
  FOR UPDATE
  TO public
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Admin full access
CREATE POLICY "Admin full access to newsletter subscriptions"
  ON newsletter_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Create function to clean up old unconfirmed subscriptions
CREATE OR REPLACE FUNCTION cleanup_unconfirmed_newsletter_subscriptions()
RETURNS void AS $$
BEGIN
  DELETE FROM newsletter_subscriptions
  WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup weekly (requires pg_cron extension)
-- Note: This needs to be set up separately in Supabase dashboard or via SQL Editor
-- SELECT cron.schedule('cleanup-unconfirmed-newsletters', '0 0 * * 0', 'SELECT cleanup_unconfirmed_newsletter_subscriptions();');