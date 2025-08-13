-- Article Images Management System
-- Migration: 20250117_article_images_table.sql

-- Create article_images table for proper image management
CREATE TABLE IF NOT EXISTS public.article_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type TEXT DEFAULT 'main' CHECK (image_type IN ('main', 'thumbnail', 'gallery')),
    alt_text TEXT,
    caption TEXT,
    caption_ar TEXT,
    credit TEXT,
    credit_url TEXT,
    display_order INTEGER DEFAULT 1,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    format TEXT CHECK (format IN ('jpg', 'jpeg', 'png', 'webp')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_article_images_article_id ON public.article_images(article_id);
CREATE INDEX idx_article_images_type ON public.article_images(image_type);
CREATE INDEX idx_article_images_active ON public.article_images(is_active) WHERE is_active = true;

-- Add RLS policies
ALTER TABLE public.article_images ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Allow public read access to article images" ON public.article_images
    FOR SELECT USING (true);

-- Policy for authenticated insert access
CREATE POLICY "Allow authenticated users to insert article images" ON public.article_images
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated update access
CREATE POLICY "Allow authenticated users to update article images" ON public.article_images
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE public.article_images IS 'Stores image metadata and references for news articles';
COMMENT ON COLUMN public.article_images.article_id IS 'Reference to the parent news article';
COMMENT ON COLUMN public.article_images.image_url IS 'URL to the image file (Supabase Storage or external)';
COMMENT ON COLUMN public.article_images.image_type IS 'Type of image: main, thumbnail, or gallery';
COMMENT ON COLUMN public.article_images.alt_text IS 'Alternative text for accessibility';
COMMENT ON COLUMN public.article_images.credit IS 'Photo credit/attribution';
COMMENT ON COLUMN public.article_images.credit_url IS 'URL to original source or photographer';

-- Create storage bucket for article images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'article-images',
    'article-images',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for article-images bucket
CREATE POLICY "Allow public read access to article images storage" ON storage.objects
    FOR SELECT USING (bucket_id = 'article-images');

CREATE POLICY "Allow authenticated upload to article images storage" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'article-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated update to article images storage" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'article-images' 
        AND auth.role() = 'authenticated'
    );

-- Function to get main image for an article
CREATE OR REPLACE FUNCTION get_article_main_image(article_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    main_image_url TEXT;
BEGIN
    SELECT image_url INTO main_image_url
    FROM public.article_images
    WHERE article_id = article_uuid 
        AND image_type = 'main' 
        AND is_active = true
    ORDER BY display_order ASC
    LIMIT 1;
    
    -- Fallback to news_articles.image_url if no dedicated image found
    IF main_image_url IS NULL THEN
        SELECT image_url INTO main_image_url
        FROM public.news_articles
        WHERE id = article_uuid;
    END IF;
    
    RETURN main_image_url;
END;
$$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_article_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_article_images_updated_at
    BEFORE UPDATE ON public.article_images
    FOR EACH ROW
    EXECUTE FUNCTION update_article_images_updated_at(); 