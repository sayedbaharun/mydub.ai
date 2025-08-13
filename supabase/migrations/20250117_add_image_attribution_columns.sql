-- Add image attribution columns to news_articles table
ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS image_alt TEXT,
ADD COLUMN IF NOT EXISTS image_credit TEXT;

-- Add comments for documentation
COMMENT ON COLUMN news_articles.image_alt IS 'Alternative text for the article image for accessibility';
COMMENT ON COLUMN news_articles.image_credit IS 'Attribution credit for the image source'; 