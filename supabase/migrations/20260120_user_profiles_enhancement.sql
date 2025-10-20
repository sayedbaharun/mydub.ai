-- ============================================================================
-- Phase 3.1.1: User Profiles Enhancement
-- Enhanced user profile system with preferences and reading history
-- ============================================================================

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  location VARCHAR(100), -- Dubai neighborhood (e.g., "Dubai Marina", "Downtown Dubai")
  privacy_level VARCHAR(20) DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'friends')),
  preferences JSONB DEFAULT '{
    "categories": [],
    "notifications": {
      "breaking_news": true,
      "comments": true,
      "weekly_digest": true,
      "quiet_hours": {
        "enabled": false,
        "start": "22:00",
        "end": "08:00"
      }
    },
    "language": "en",
    "theme": "auto"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading History Table
CREATE TABLE IF NOT EXISTS user_reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES news_articles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent_seconds INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  UNIQUE(user_id, article_id, read_at)
);

-- Bookmarks Table
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES news_articles(id) ON DELETE CASCADE,
  collection VARCHAR(100), -- Optional grouping (e.g., "Read Later", "Favorites")
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);
CREATE INDEX IF NOT EXISTS idx_reading_history_user ON user_reading_history(user_id, read_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_history_article ON user_reading_history(article_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_collection ON user_bookmarks(collection) WHERE collection IS NOT NULL;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view public profiles"
  ON user_profiles FOR SELECT
  USING (privacy_level = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Reading History Policies (private to user)
CREATE POLICY "Users can view own reading history"
  ON user_reading_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading history"
  ON user_reading_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading history"
  ON user_reading_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Bookmarks Policies (private to user)
CREATE POLICY "Users can view own bookmarks"
  ON user_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON user_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON user_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Sample Data / Comments
-- ============================================================================

COMMENT ON TABLE user_profiles IS 'Extended user profile information beyond auth.users';
COMMENT ON TABLE user_reading_history IS 'Track user reading behavior for personalization';
COMMENT ON TABLE user_bookmarks IS 'User-saved articles with optional collections/notes';

COMMENT ON COLUMN user_profiles.privacy_level IS 'public: visible to all, private: only to user, friends: to connections';
COMMENT ON COLUMN user_profiles.preferences IS 'JSON object with user preferences (categories, notifications, theme, etc.)';
COMMENT ON COLUMN user_reading_history.completion_percentage IS 'How much of article was read (0-100%)';
COMMENT ON COLUMN user_bookmarks.collection IS 'Optional grouping like "Read Later" or "Favorites"';
