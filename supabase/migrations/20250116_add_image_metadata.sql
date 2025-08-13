-- Add image metadata columns to news_articles table
-- Migration: 20250116_add_image_metadata.sql

-- Add image_alt and image_credit columns to news_articles table
ALTER TABLE public.news_articles 
ADD COLUMN IF NOT EXISTS image_alt TEXT,
ADD COLUMN IF NOT EXISTS image_credit TEXT;

-- Update existing records to have proper alt text (use title as fallback)
UPDATE public.news_articles 
SET image_alt = title 
WHERE image_alt IS NULL AND title IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.news_articles.image_alt IS 'Alternative text for the article image for accessibility';
COMMENT ON COLUMN public.news_articles.image_credit IS 'Credit/attribution for the article image source'; 