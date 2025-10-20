-- ============================================================================
-- Phase 3.2.1: Threaded Comments System
-- Nested comments with reactions, votes, and moderation
-- ============================================================================

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES news_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- NULL for top-level comments
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 10000),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true, -- Auto-approved for trusted users
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment Reactions Table
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction_type)
);

-- Comment Votes Table
CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote INTEGER CHECK (vote IN (-1, 1)), -- -1 for downvote, 1 for upvote
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Add comment_count to news_articles if not exists
ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_approved ON comments(is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment ON comment_votes(comment_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- Comments Policies
CREATE POLICY "Anyone can view approved comments"
  ON comments FOR SELECT
  USING (is_approved = true AND is_deleted = false);

CREATE POLICY "Users can insert own comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id AND is_deleted = false);

-- Reactions Policies
CREATE POLICY "Anyone can view reactions"
  ON comment_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can add own reactions"
  ON comment_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON comment_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Votes Policies
CREATE POLICY "Users can view votes"
  ON comment_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can add own votes"
  ON comment_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON comment_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON comment_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to update upvotes/downvotes when vote changes
CREATE OR REPLACE FUNCTION update_comment_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = 1 THEN
      UPDATE comments SET upvotes = upvotes + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE comments SET downvotes = downvotes + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote = 1 AND NEW.vote = -1 THEN
      UPDATE comments SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.comment_id;
    ELSIF OLD.vote = -1 AND NEW.vote = 1 THEN
      UPDATE comments SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote = 1 THEN
      UPDATE comments SET upvotes = upvotes - 1 WHERE id = OLD.comment_id;
    ELSE
      UPDATE comments SET downvotes = downvotes - 1 WHERE id = OLD.comment_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for vote counting
DROP TRIGGER IF EXISTS on_comment_vote_change ON comment_votes;
CREATE TRIGGER on_comment_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON comment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_votes();

-- Function to increment article comment count
CREATE OR REPLACE FUNCTION increment_article_comments()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_approved = true THEN
    UPDATE news_articles
    SET comment_count = comment_count + 1
    WHERE id = NEW.article_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted = false AND NEW.is_deleted = true THEN
    UPDATE news_articles
    SET comment_count = comment_count - 1
    WHERE id = NEW.article_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for article comment count
DROP TRIGGER IF EXISTS on_comment_change ON comments;
CREATE TRIGGER on_comment_change
  AFTER INSERT OR UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION increment_article_comments();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_timestamp();

-- Function to check comment depth (max 3 levels)
CREATE OR REPLACE FUNCTION check_comment_depth()
RETURNS TRIGGER AS $$
DECLARE
  depth INTEGER := 0;
  current_parent UUID;
BEGIN
  current_parent := NEW.parent_id;

  WHILE current_parent IS NOT NULL AND depth < 3 LOOP
    SELECT parent_id INTO current_parent
    FROM comments
    WHERE id = current_parent;

    depth := depth + 1;
  END LOOP;

  IF depth >= 3 THEN
    RAISE EXCEPTION 'Comment nesting depth cannot exceed 3 levels';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce max depth
DROP TRIGGER IF EXISTS check_comment_depth_trigger ON comments;
CREATE TRIGGER check_comment_depth_trigger
  BEFORE INSERT ON comments
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION check_comment_depth();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE comments IS 'User comments on articles with nested threading';
COMMENT ON COLUMN comments.parent_id IS 'NULL for top-level comments, otherwise references parent comment';
COMMENT ON COLUMN comments.is_deleted IS 'Soft delete - comment remains but content hidden';
COMMENT ON COLUMN comments.is_flagged IS 'Community flagged for moderation review';
COMMENT ON COLUMN comments.is_approved IS 'Auto-approved for trusted users, pending for new users';

COMMENT ON TABLE comment_reactions IS 'Emoji reactions to comments (like, love, laugh, etc.)';
COMMENT ON TABLE comment_votes IS 'Upvote/downvote system for comment quality ranking';
