-- ============================================================================
-- Phase 3.1.2: User Engagement Tracking
-- Track user interactions for personalization algorithm improvement
-- ============================================================================

-- User Engagement Table
CREATE TABLE IF NOT EXISTS user_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES news_articles(id) ON DELETE CASCADE,
  engagement_type VARCHAR(20) CHECK (engagement_type IN ('view', 'click', 'share', 'bookmark')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add view_count and comment_count to news_articles if not exists
ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_engagement_user ON user_engagement(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_engagement_article ON user_engagement(article_id, engagement_type);
CREATE INDEX IF NOT EXISTS idx_news_articles_view_count ON news_articles(view_count DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;

-- Users can view their own engagement
CREATE POLICY "Users can view own engagement"
  ON user_engagement FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own engagement
CREATE POLICY "Users can insert own engagement"
  ON user_engagement FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to increment view count when article is viewed
CREATE OR REPLACE FUNCTION increment_article_views()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.engagement_type = 'view' THEN
    UPDATE news_articles
    SET view_count = view_count + 1
    WHERE id = NEW.article_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment view count
DROP TRIGGER IF EXISTS on_article_view ON user_engagement;
CREATE TRIGGER on_article_view
  AFTER INSERT ON user_engagement
  FOR EACH ROW
  WHEN (NEW.engagement_type = 'view')
  EXECUTE FUNCTION increment_article_views();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE user_engagement IS 'Track user interactions with articles for personalization';
COMMENT ON COLUMN user_engagement.engagement_type IS 'Type of interaction: view, click, share, bookmark';
COMMENT ON COLUMN news_articles.view_count IS 'Total number of views for trending calculation';
COMMENT ON COLUMN news_articles.comment_count IS 'Total number of comments (updated by comment system)';
