-- Create bookmark collections table
CREATE TABLE IF NOT EXISTS bookmark_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'event', 'place', 'dining', 'service')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  url TEXT,
  collection_id UUID REFERENCES bookmark_collections(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure unique bookmarks per user and content
  UNIQUE(user_id, content_id)
);

-- Create indexes
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_content_id ON bookmarks(content_id);
CREATE INDEX idx_bookmarks_content_type ON bookmarks(content_type);
CREATE INDEX idx_bookmarks_collection_id ON bookmarks(collection_id);
CREATE INDEX idx_bookmark_collections_user_id ON bookmark_collections(user_id);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_collections ENABLE ROW LEVEL SECURITY;

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Bookmark collections policies
CREATE POLICY "Users can view their own collections"
  ON bookmark_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
  ON bookmark_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON bookmark_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON bookmark_collections FOR DELETE
  USING (auth.uid() = user_id);

-- Function to create default collection for new users
CREATE OR REPLACE FUNCTION create_default_bookmark_collection()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bookmark_collections (user_id, name, is_default)
  VALUES (NEW.id, 'My Bookmarks', TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default collection when user signs up
CREATE TRIGGER create_user_default_collection
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_bookmark_collection();

-- Update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_bookmark_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_bookmarks_updated_at
  BEFORE UPDATE ON bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_bookmark_timestamp();

CREATE TRIGGER update_bookmark_collections_updated_at
  BEFORE UPDATE ON bookmark_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_bookmark_timestamp();