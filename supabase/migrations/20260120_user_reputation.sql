-- ============================================================================
-- Phase 3.5.2: User Reputation System
-- Gamified points, levels, and privileges
-- ============================================================================

-- User Reputation Table
CREATE TABLE IF NOT EXISTS user_reputation (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reputation_score INTEGER DEFAULT 0,
  level VARCHAR(50) DEFAULT 'newcomer' CHECK (level IN ('newcomer', 'regular', 'contributor', 'expert', 'authority')),
  total_points_earned INTEGER DEFAULT 0, -- Lifetime points (never decreases)
  points_spent INTEGER DEFAULT 0, -- Points spent on rewards
  comments_posted INTEGER DEFAULT 0,
  comments_upvoted INTEGER DEFAULT 0,
  helpful_flags INTEGER DEFAULT 0, -- Accurate content flags
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reputation History Table (point transactions)
CREATE TABLE IF NOT EXISTS reputation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'comment_posted', 'comment_upvoted', 'flag_verified', etc.
  points_change INTEGER NOT NULL, -- Can be positive or negative
  reason TEXT,
  metadata JSONB, -- Related comment_id, article_id, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reputation Levels Configuration
CREATE TABLE IF NOT EXISTS reputation_levels (
  level VARCHAR(50) PRIMARY KEY,
  min_score INTEGER NOT NULL,
  max_score INTEGER,
  display_name VARCHAR(100) NOT NULL,
  color VARCHAR(20), -- Hex color for UI
  icon VARCHAR(10), -- Emoji
  privileges JSONB, -- Array of privilege keys
  description TEXT
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_reputation_score ON user_reputation(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_history_user ON reputation_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_history_action ON reputation_history(action);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_levels ENABLE ROW LEVEL SECURITY;

-- Anyone can view reputation (public information)
CREATE POLICY "Anyone can view user reputation"
  ON user_reputation FOR SELECT
  USING (true);

-- Anyone can view reputation history
CREATE POLICY "Anyone can view reputation history"
  ON reputation_history FOR SELECT
  USING (true);

-- Anyone can view reputation levels
CREATE POLICY "Anyone can view reputation levels"
  ON reputation_levels FOR SELECT
  USING (true);

-- ============================================================================
-- Seed Reputation Levels
-- ============================================================================

INSERT INTO reputation_levels (level, min_score, max_score, display_name, color, icon, privileges, description) VALUES
  ('newcomer', 0, 99, 'Newcomer', '#94a3b8', '🌱',
   '["comment", "upvote"]'::jsonb,
   'Welcome to MyDub.AI! Start building your reputation by posting helpful comments.'),

  ('regular', 100, 499, 'Regular', '#60a5fa', '👤',
   '["comment", "upvote", "downvote", "flag_content"]'::jsonb,
   'Active community member with basic privileges.'),

  ('contributor', 500, 999, 'Contributor', '#8b5cf6', '⭐',
   '["comment", "upvote", "downvote", "flag_content", "edit_own_after_24h"]'::jsonb,
   'Valued contributor to the MyDub.AI community.'),

  ('expert', 1000, 4999, 'Expert', '#f59e0b', '🏆',
   '["comment", "upvote", "downvote", "flag_content", "edit_own_after_24h", "vote_to_close", "vote_to_delete"]'::jsonb,
   'Trusted expert with advanced moderation privileges.'),

  ('authority', 5000, NULL, 'Authority', '#dc2626', '👑',
   '["comment", "upvote", "downvote", "flag_content", "edit_own_after_24h", "vote_to_close", "vote_to_delete", "edit_others_comments", "instant_flag_action"]'::jsonb,
   'Top contributor with full moderation privileges.')
ON CONFLICT (level) DO NOTHING;

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to create default reputation for new users
CREATE OR REPLACE FUNCTION create_default_reputation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_reputation (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create reputation on user signup
DROP TRIGGER IF EXISTS on_user_created_reputation ON auth.users;
CREATE TRIGGER on_user_created_reputation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_reputation();

-- Function to add reputation points
CREATE OR REPLACE FUNCTION add_reputation_points(
  p_user_id UUID,
  p_action VARCHAR(50),
  p_points INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_new_score INTEGER;
  v_new_level VARCHAR(50);
  v_old_level VARCHAR(50);
BEGIN
  -- Get current level
  SELECT level INTO v_old_level
  FROM user_reputation
  WHERE user_id = p_user_id;

  -- Update reputation score
  UPDATE user_reputation
  SET
    reputation_score = GREATEST(0, reputation_score + p_points),
    total_points_earned = total_points_earned + GREATEST(0, p_points),
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING reputation_score INTO v_new_score;

  -- Record in history
  INSERT INTO reputation_history (user_id, action, points_change, reason, metadata)
  VALUES (p_user_id, p_action, p_points, p_reason, p_metadata);

  -- Check for level up
  SELECT level INTO v_new_level
  FROM reputation_levels
  WHERE v_new_score >= min_score
    AND (max_score IS NULL OR v_new_score <= max_score)
  ORDER BY min_score DESC
  LIMIT 1;

  -- Update level if changed
  IF v_new_level IS DISTINCT FROM v_old_level THEN
    UPDATE user_reputation
    SET level = v_new_level
    WHERE user_id = p_user_id;

    -- Send level-up notification
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      p_user_id,
      'milestone',
      '🎉 Level Up!',
      'You reached ' || (SELECT display_name FROM reputation_levels WHERE level = v_new_level) || ' level with ' || v_new_score || ' reputation points!'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to award points for posting comments
CREATE OR REPLACE FUNCTION award_comment_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 5 points for posting a comment
  PERFORM add_reputation_points(
    NEW.user_id,
    'comment_posted',
    5,
    'Posted a comment',
    jsonb_build_object('comment_id', NEW.id, 'article_id', NEW.article_id)
  );

  -- Update counter
  UPDATE user_reputation
  SET comments_posted = comments_posted + 1
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment posting
DROP TRIGGER IF EXISTS on_comment_posted_reputation ON comments;
CREATE TRIGGER on_comment_posted_reputation
  AFTER INSERT ON comments
  FOR EACH ROW
  WHEN (NEW.is_deleted = false)
  EXECUTE FUNCTION award_comment_points();

-- Function to award points for comment upvotes
CREATE OR REPLACE FUNCTION award_upvote_points()
RETURNS TRIGGER AS $$
DECLARE
  v_comment_author UUID;
BEGIN
  -- Get comment author
  SELECT user_id INTO v_comment_author
  FROM comments
  WHERE id = NEW.id;

  -- Award points based on upvote milestones
  IF NEW.upvotes = 5 THEN
    PERFORM add_reputation_points(v_comment_author, 'comment_upvoted', 10, 'Comment reached 5 upvotes');
  ELSIF NEW.upvotes = 10 THEN
    PERFORM add_reputation_points(v_comment_author, 'comment_upvoted', 20, 'Comment reached 10 upvotes');
  ELSIF NEW.upvotes = 25 THEN
    PERFORM add_reputation_points(v_comment_author, 'comment_upvoted', 50, 'Comment reached 25 upvotes');
  ELSIF NEW.upvotes = 50 THEN
    PERFORM add_reputation_points(v_comment_author, 'comment_upvoted', 100, 'Comment reached 50 upvotes');
  END IF;

  -- Update counter
  IF NEW.upvotes > OLD.upvotes THEN
    UPDATE user_reputation
    SET comments_upvoted = comments_upvoted + (NEW.upvotes - OLD.upvotes)
    WHERE user_id = v_comment_author;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for upvote milestones
DROP TRIGGER IF EXISTS on_comment_upvoted_reputation ON comments;
CREATE TRIGGER on_comment_upvoted_reputation
  AFTER UPDATE OF upvotes ON comments
  FOR EACH ROW
  WHEN (NEW.upvotes > OLD.upvotes)
  EXECUTE FUNCTION award_upvote_points();

-- Function to deduct points for flagged content
CREATE OR REPLACE FUNCTION deduct_flagged_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_flagged = true AND OLD.is_flagged = false THEN
    PERFORM add_reputation_points(
      NEW.user_id,
      'comment_flagged',
      -20,
      'Comment was flagged for moderation',
      jsonb_build_object('comment_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for flagged comments
DROP TRIGGER IF EXISTS on_comment_flagged_reputation ON comments;
CREATE TRIGGER on_comment_flagged_reputation
  AFTER UPDATE OF is_flagged ON comments
  FOR EACH ROW
  EXECUTE FUNCTION deduct_flagged_points();

-- Function to get user's reputation rank
CREATE OR REPLACE FUNCTION get_user_reputation_rank(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_rank INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_rank
  FROM user_reputation
  WHERE reputation_score > (
    SELECT reputation_score
    FROM user_reputation
    WHERE user_id = p_user_id
  );

  RETURN v_rank;
END;
$$ LANGUAGE plpgsql;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_reputation_leaderboard(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  user_id UUID,
  display_name VARCHAR,
  reputation_score INTEGER,
  level VARCHAR,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.user_id,
    up.display_name,
    ur.reputation_score,
    ur.level,
    ROW_NUMBER() OVER (ORDER BY ur.reputation_score DESC)::INTEGER AS rank
  FROM user_reputation ur
  JOIN user_profiles up ON up.user_id = ur.user_id
  ORDER BY ur.reputation_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE user_reputation IS 'User reputation scores, levels, and stats';
COMMENT ON TABLE reputation_history IS 'Point transaction history for transparency';
COMMENT ON TABLE reputation_levels IS 'Reputation level definitions and privileges';
COMMENT ON COLUMN user_reputation.reputation_score IS 'Current reputation (can go up or down)';
COMMENT ON COLUMN user_reputation.total_points_earned IS 'Lifetime points earned (always increases)';
COMMENT ON FUNCTION add_reputation_points IS 'Add points, record history, check level-up';
COMMENT ON FUNCTION get_reputation_leaderboard IS 'Get top users by reputation';
