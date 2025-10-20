-- ============================================================================
-- Phase 3.3.1: Social Media Sharing
-- Track article shares for analytics and viral growth
-- ============================================================================

-- Article Shares Table
CREATE TABLE IF NOT EXISTS article_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES news_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous shares
  platform VARCHAR(20) CHECK (platform IN ('whatsapp', 'twitter', 'facebook', 'linkedin', 'email', 'copy', 'native')),
  referral_code VARCHAR(50), -- For tracking conversions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add share_count to news_articles
ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_article_shares_article ON article_shares(article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_shares_user ON article_shares(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_shares_platform ON article_shares(platform);
CREATE INDEX IF NOT EXISTS idx_news_articles_share_count ON news_articles(share_count DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE article_shares ENABLE ROW LEVEL SECURITY;

-- Anyone can view shares (for analytics)
CREATE POLICY "Anyone can view article shares"
  ON article_shares FOR SELECT
  USING (true);

-- Users can insert shares
CREATE POLICY "Anyone can track shares"
  ON article_shares FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to increment share count
CREATE OR REPLACE FUNCTION increment_share_count(article_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE news_articles
  SET share_count = share_count + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE article_shares IS 'Track article shares across social platforms for analytics';
COMMENT ON COLUMN article_shares.platform IS 'Social platform: whatsapp, twitter, facebook, linkedin, email, copy, native';
COMMENT ON COLUMN article_shares.referral_code IS 'Track conversions from shared links';
COMMENT ON COLUMN news_articles.share_count IS 'Total number of times article has been shared';
