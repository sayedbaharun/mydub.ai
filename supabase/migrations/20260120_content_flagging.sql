-- ============================================================================
-- Phase 3.6.1: Content Flagging System
-- User-reported content with AI pre-screening and moderator review
-- ============================================================================

-- Content Flags Table
CREATE TABLE IF NOT EXISTS content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES news_articles(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  flag_type VARCHAR(50) CHECK (flag_type IN (
    'misinformation',
    'spam',
    'hate_speech',
    'harassment',
    'inappropriate',
    'duplicate',
    'off_topic',
    'other'
  )),
  reason TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_resolved')),
  ai_confidence DECIMAL(3,2), -- 0.00 to 1.00
  ai_analysis JSONB, -- AI pre-screening results
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (article_id IS NOT NULL OR comment_id IS NOT NULL)
);

-- Flag Statistics Table (for tracking flagged content patterns)
CREATE TABLE IF NOT EXISTS flag_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) CHECK (content_type IN ('article', 'comment')),
  content_id UUID NOT NULL,
  total_flags INTEGER DEFAULT 0,
  unique_reporters INTEGER DEFAULT 0,
  misinformation_count INTEGER DEFAULT 0,
  spam_count INTEGER DEFAULT 0,
  hate_speech_count INTEGER DEFAULT 0,
  harassment_count INTEGER DEFAULT 0,
  inappropriate_count INTEGER DEFAULT 0,
  auto_hidden BOOLEAN DEFAULT false,
  auto_hidden_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_content_flags_article ON content_flags(article_id, status);
CREATE INDEX IF NOT EXISTS idx_content_flags_comment ON content_flags(comment_id, status);
CREATE INDEX IF NOT EXISTS idx_content_flags_reporter ON content_flags(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_status ON content_flags(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flag_statistics_content ON flag_statistics(content_type, content_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE flag_statistics ENABLE ROW LEVEL SECURITY;

-- Users can view own flags
CREATE POLICY "Users can view own flags"
  ON content_flags FOR SELECT
  USING (auth.uid() = reporter_id);

-- Users can insert flags
CREATE POLICY "Users can report content"
  ON content_flags FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Anyone can view flag statistics (public info)
CREATE POLICY "Anyone can view flag statistics"
  ON flag_statistics FOR SELECT
  USING (true);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to create or update flag statistics
CREATE OR REPLACE FUNCTION update_flag_statistics()
RETURNS TRIGGER AS $$
DECLARE
  v_content_type VARCHAR(20);
  v_content_id UUID;
  v_flag_count INTEGER;
  v_reporter_count INTEGER;
BEGIN
  -- Determine content type and ID
  IF NEW.article_id IS NOT NULL THEN
    v_content_type := 'article';
    v_content_id := NEW.article_id;
  ELSE
    v_content_type := 'comment';
    v_content_id := NEW.comment_id;
  END IF;

  -- Insert or update statistics
  INSERT INTO flag_statistics (content_type, content_id)
  VALUES (v_content_type, v_content_id)
  ON CONFLICT (content_type, content_id) DO NOTHING;

  -- Count total flags and unique reporters
  SELECT COUNT(*), COUNT(DISTINCT reporter_id)
  INTO v_flag_count, v_reporter_count
  FROM content_flags
  WHERE (article_id = v_content_id OR comment_id = v_content_id)
    AND status != 'rejected';

  -- Update statistics
  UPDATE flag_statistics
  SET
    total_flags = v_flag_count,
    unique_reporters = v_reporter_count,
    misinformation_count = (SELECT COUNT(*) FROM content_flags WHERE (article_id = v_content_id OR comment_id = v_content_id) AND flag_type = 'misinformation' AND status != 'rejected'),
    spam_count = (SELECT COUNT(*) FROM content_flags WHERE (article_id = v_content_id OR comment_id = v_content_id) AND flag_type = 'spam' AND status != 'rejected'),
    hate_speech_count = (SELECT COUNT(*) FROM content_flags WHERE (article_id = v_content_id OR comment_id = v_content_id) AND flag_type = 'hate_speech' AND status != 'rejected'),
    harassment_count = (SELECT COUNT(*) FROM content_flags WHERE (article_id = v_content_id OR comment_id = v_content_id) AND flag_type = 'harassment' AND status != 'rejected'),
    inappropriate_count = (SELECT COUNT(*) FROM content_flags WHERE (article_id = v_content_id OR comment_id = v_content_id) AND flag_type = 'inappropriate' AND status != 'rejected'),
    updated_at = NOW()
  WHERE content_type = v_content_type AND content_id = v_content_id;

  -- Auto-hide content if threshold reached (3+ unique reporters OR high AI confidence)
  IF v_reporter_count >= 3 OR (NEW.ai_confidence >= 0.85 AND NEW.severity IN ('high', 'critical')) THEN
    UPDATE flag_statistics
    SET auto_hidden = true, auto_hidden_at = NOW()
    WHERE content_type = v_content_type AND content_id = v_content_id AND auto_hidden = false;

    -- Mark comment as flagged
    IF v_content_type = 'comment' THEN
      UPDATE comments
      SET is_flagged = true
      WHERE id = v_content_id;
    END IF;

    -- Notify moderators
    INSERT INTO notifications (user_id, type, title, message, link_url)
    SELECT
      u.id,
      'milestone',
      '⚠️ Content Auto-Hidden',
      'Content has been automatically hidden due to multiple flags or high AI confidence',
      CASE
        WHEN v_content_type = 'article' THEN '/admin/moderation/articles/' || v_content_id
        ELSE '/admin/moderation/comments/' || v_content_id
      END
    FROM auth.users u
    JOIN user_badges ub ON ub.user_id = u.id
    WHERE ub.badge_type IN ('admin', 'moderator');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update statistics on new flag
DROP TRIGGER IF EXISTS on_flag_created ON content_flags;
CREATE TRIGGER on_flag_created
  AFTER INSERT ON content_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_flag_statistics();

-- Function to approve flag (moderator action)
CREATE OR REPLACE FUNCTION approve_flag(
  p_flag_id UUID,
  p_moderator_id UUID,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_reporter_id UUID;
  v_flag_type VARCHAR(50);
BEGIN
  -- Get flag details
  SELECT reporter_id, flag_type INTO v_reporter_id, v_flag_type
  FROM content_flags
  WHERE id = p_flag_id;

  -- Update flag status
  UPDATE content_flags
  SET
    status = 'approved',
    reviewed_by = p_moderator_id,
    reviewed_at = NOW(),
    resolution_notes = p_resolution_notes
  WHERE id = p_flag_id;

  -- Award reputation points to reporter for accurate flag
  PERFORM add_reputation_points(
    v_reporter_id,
    'flag_verified',
    15,
    'Accurate content flag: ' || v_flag_type
  );

  -- Update helpful flags counter
  UPDATE user_reputation
  SET helpful_flags = helpful_flags + 1
  WHERE user_id = v_reporter_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reject flag (moderator action)
CREATE OR REPLACE FUNCTION reject_flag(
  p_flag_id UUID,
  p_moderator_id UUID,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE content_flags
  SET
    status = 'rejected',
    reviewed_by = p_moderator_id,
    reviewed_at = NOW(),
    resolution_notes = p_resolution_notes
  WHERE id = p_flag_id;

  -- Recalculate statistics
  PERFORM update_flag_statistics();
END;
$$ LANGUAGE plpgsql;

-- Function to get pending flags for moderation
CREATE OR REPLACE FUNCTION get_pending_flags(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  flag_id UUID,
  content_type VARCHAR,
  content_id UUID,
  flag_type VARCHAR,
  severity VARCHAR,
  reporter_count INTEGER,
  ai_confidence DECIMAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cf.id AS flag_id,
    CASE
      WHEN cf.article_id IS NOT NULL THEN 'article'::VARCHAR
      ELSE 'comment'::VARCHAR
    END AS content_type,
    COALESCE(cf.article_id, cf.comment_id) AS content_id,
    cf.flag_type,
    cf.severity,
    fs.unique_reporters,
    cf.ai_confidence,
    cf.created_at
  FROM content_flags cf
  LEFT JOIN flag_statistics fs ON (
    (fs.content_type = 'article' AND fs.content_id = cf.article_id)
    OR (fs.content_type = 'comment' AND fs.content_id = cf.comment_id)
  )
  WHERE cf.status = 'pending'
  ORDER BY
    cf.severity DESC,
    fs.unique_reporters DESC NULLS LAST,
    cf.ai_confidence DESC NULLS LAST,
    cf.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can flag content (rate limiting)
CREATE OR REPLACE FUNCTION can_user_flag_content(
  p_user_id UUID,
  p_article_id UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_recent_flags INTEGER;
  v_already_flagged BOOLEAN;
BEGIN
  -- Check if user already flagged this content
  SELECT EXISTS (
    SELECT 1 FROM content_flags
    WHERE reporter_id = p_user_id
      AND (article_id = p_article_id OR comment_id = p_comment_id)
  ) INTO v_already_flagged;

  IF v_already_flagged THEN
    RETURN false;
  END IF;

  -- Check rate limit (max 10 flags per hour)
  SELECT COUNT(*) INTO v_recent_flags
  FROM content_flags
  WHERE reporter_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour';

  IF v_recent_flags >= 10 THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE content_flags IS 'User-reported content with AI pre-screening';
COMMENT ON TABLE flag_statistics IS 'Aggregated flag statistics per content item';
COMMENT ON COLUMN content_flags.ai_confidence IS 'AI confidence score 0.00-1.00 for flag validity';
COMMENT ON COLUMN content_flags.ai_analysis IS 'Detailed AI analysis of flagged content';
COMMENT ON FUNCTION approve_flag IS 'Approve flag and award reputation to reporter';
COMMENT ON FUNCTION reject_flag IS 'Reject flag as invalid';
COMMENT ON FUNCTION get_pending_flags IS 'Get flags pending moderation, sorted by priority';
