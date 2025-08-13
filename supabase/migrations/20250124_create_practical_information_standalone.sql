-- Create Practical Information Table (Standalone Version)
-- This version includes the necessary RLS functions or works without them

-- First, ensure we have the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the practical_information table
CREATE TABLE IF NOT EXISTS practical_information (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Core content fields
  title TEXT NOT NULL,
  title_ar TEXT, -- Arabic translation
  title_hi TEXT, -- Hindi translation
  title_ur TEXT, -- Urdu translation
  
  content TEXT NOT NULL, -- Main content in Markdown/HTML
  content_ar TEXT,
  content_hi TEXT,
  content_ur TEXT,
  
  -- URL and categorization
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Metadata
  description TEXT,
  description_ar TEXT,
  tags TEXT[] DEFAULT '{}',
  icon TEXT, -- Icon name for UI display
  featured_image TEXT, -- URL to featured image
  
  -- Status and visibility
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false, -- Pin important info at top
  published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMP WITH TIME ZONE, -- For time-sensitive information
  
  -- Ordering and importance
  sort_order INTEGER DEFAULT 0,
  importance_level TEXT DEFAULT 'normal' CHECK (importance_level IN ('low', 'normal', 'high', 'critical')),
  
  -- User interaction tracking
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  -- SEO fields
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  
  -- Related content
  related_links JSONB DEFAULT '[]'::jsonb, -- Array of {title, url, type}
  external_resources JSONB DEFAULT '[]'::jsonb, -- Official websites, forms, etc.
  
  -- Contact information (where applicable)
  contact_info JSONB, -- {phone, email, website, address, hours}
  
  -- Location data (if location-specific)
  location_data JSONB, -- {lat, lng, area, emirate}
  
  -- Additional structured data
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for performance
CREATE INDEX idx_practical_info_slug ON practical_information(slug);
CREATE INDEX idx_practical_info_category ON practical_information(category, subcategory);
CREATE INDEX idx_practical_info_active_published ON practical_information(is_active, published_at DESC);
CREATE INDEX idx_practical_info_featured ON practical_information(is_featured, sort_order);
CREATE INDEX idx_practical_info_importance ON practical_information(importance_level, is_pinned);
CREATE INDEX idx_practical_info_search ON practical_information USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Create updated_at trigger
CREATE TRIGGER update_practical_information_updated_at
  BEFORE UPDATE ON practical_information
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE practical_information ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Simplified - without role functions for now)

-- Public read access for active content
DROP POLICY IF EXISTS "practical_info_public_read" ON practical_information;
CREATE POLICY "practical_info_public_read" ON practical_information
  FOR SELECT USING (
    is_active = true 
    AND published_at <= now()
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Authenticated users can create (temporary - update after RLS functions are created)
DROP POLICY IF EXISTS "practical_info_auth_create" ON practical_information;
CREATE POLICY "practical_info_auth_create" ON practical_information
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = created_by
  );

-- Users can update their own content
DROP POLICY IF EXISTS "practical_info_update_own" ON practical_information;
CREATE POLICY "practical_info_update_own" ON practical_information
  FOR UPDATE USING (
    created_by = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid()
  );

-- Create categories lookup table
CREATE TABLE IF NOT EXISTS practical_info_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_hi TEXT,
  name_ur TEXT,
  description TEXT,
  icon TEXT,
  color TEXT, -- For UI theming
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  parent_category TEXT, -- For subcategories
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on categories
ALTER TABLE practical_info_categories ENABLE ROW LEVEL SECURITY;

-- Categories are publicly readable
DROP POLICY IF EXISTS "categories_public_read" ON practical_info_categories;
CREATE POLICY "categories_public_read" ON practical_info_categories
  FOR SELECT USING (is_active = true);

-- Insert default categories
INSERT INTO practical_info_categories (category_key, name, name_ar, icon, color, sort_order) VALUES
  ('transportation', 'Transportation', 'النقل', 'Car', '#3B82F6', 10),
  ('healthcare', 'Healthcare', 'الرعاية الصحية', 'Heart', '#EF4444', 20),
  ('banking', 'Banking & Finance', 'البنوك والمالية', 'DollarSign', '#10B981', 30),
  ('utilities', 'Utilities', 'المرافق', 'Zap', '#F59E0B', 40),
  ('legal', 'Legal & Government', 'القانونية والحكومية', 'Scale', '#6366F1', 50),
  ('education', 'Education', 'التعليم', 'GraduationCap', '#8B5CF6', 60),
  ('emergency', 'Emergency Services', 'خدمات الطوارئ', 'AlertTriangle', '#DC2626', 5),
  ('housing', 'Housing & Property', 'الإسكان والممتلكات', 'Home', '#059669', 70),
  ('shopping', 'Shopping & Services', 'التسوق والخدمات', 'ShoppingBag', '#EC4899', 80),
  ('culture', 'Culture & Etiquette', 'الثقافة والآداب', 'Users', '#7C3AED', 90),
  ('business', 'Business Setup', 'إعداد الأعمال', 'Briefcase', '#2563EB', 100),
  ('visa', 'Visa & Immigration', 'التأشيرة والهجرة', 'FileText', '#0891B2', 15)
ON CONFLICT (category_key) DO NOTHING;

-- Create view counter function
CREATE OR REPLACE FUNCTION increment_practical_info_view_count(info_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE practical_information
  SET view_count = view_count + 1
  WHERE id = info_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create feedback tracking table
CREATE TABLE IF NOT EXISTS practical_info_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  info_id UUID REFERENCES practical_information(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  -- Ensure one feedback per user per info item
  UNIQUE(info_id, user_id)
);

-- Enable RLS on feedback
ALTER TABLE practical_info_feedback ENABLE ROW LEVEL SECURITY;

-- Users can create and view their own feedback
DROP POLICY IF EXISTS "feedback_user_own" ON practical_info_feedback;
CREATE POLICY "feedback_user_own" ON practical_info_feedback
  FOR ALL USING (
    user_id = auth.uid()
  );

-- Function to update helpful/not helpful counts
CREATE OR REPLACE FUNCTION update_practical_info_feedback_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counts based on the change
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_helpful THEN
      UPDATE practical_information
      SET helpful_count = helpful_count + 1
      WHERE id = NEW.info_id;
    ELSE
      UPDATE practical_information
      SET not_helpful_count = not_helpful_count + 1
      WHERE id = NEW.info_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_helpful != NEW.is_helpful THEN
      IF NEW.is_helpful THEN
        UPDATE practical_information
        SET helpful_count = helpful_count + 1,
            not_helpful_count = not_helpful_count - 1
        WHERE id = NEW.info_id;
      ELSE
        UPDATE practical_information
        SET helpful_count = helpful_count - 1,
            not_helpful_count = not_helpful_count + 1
        WHERE id = NEW.info_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_helpful THEN
      UPDATE practical_information
      SET helpful_count = helpful_count - 1
      WHERE id = OLD.info_id;
    ELSE
      UPDATE practical_information
      SET not_helpful_count = not_helpful_count - 1
      WHERE id = OLD.info_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for feedback counts
CREATE TRIGGER update_feedback_counts
  AFTER INSERT OR UPDATE OR DELETE ON practical_info_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_practical_info_feedback_counts();

-- Migration to update RLS policies after role functions are created
-- Run this after the RLS migration:
/*
-- Update policies to use role functions
DROP POLICY IF EXISTS "practical_info_auth_create" ON practical_information;
DROP POLICY IF EXISTS "practical_info_update_own" ON practical_information;

-- Staff can view all content
CREATE POLICY "practical_info_staff_read" ON practical_information
  FOR SELECT USING (
    public.has_role(ARRAY['curator', 'editor', 'admin'])
  );

-- Curators and above can create
CREATE POLICY "practical_info_create" ON practical_information
  FOR INSERT WITH CHECK (
    public.has_role(ARRAY['curator', 'editor', 'admin'])
    AND auth.uid() = created_by
  );

-- Creators can update their own, editors can update any
CREATE POLICY "practical_info_update" ON practical_information
  FOR UPDATE USING (
    (created_by = auth.uid() AND public.has_role(ARRAY['curator', 'editor', 'admin']))
    OR public.has_role(ARRAY['editor', 'admin'])
  )
  WITH CHECK (
    (created_by = auth.uid() AND public.has_role(ARRAY['curator', 'editor', 'admin']))
    OR public.has_role(ARRAY['editor', 'admin'])
  );

-- Only admins can delete
CREATE POLICY "practical_info_delete" ON practical_information
  FOR DELETE USING (public.is_admin());

-- Update categories policy
DROP POLICY IF EXISTS "categories_public_read" ON practical_info_categories;
CREATE POLICY "categories_public_read" ON practical_info_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "categories_admin_all" ON practical_info_categories
  FOR ALL USING (public.is_admin());

-- Update feedback policy
DROP POLICY IF EXISTS "feedback_user_own" ON practical_info_feedback;
CREATE POLICY "feedback_user_own" ON practical_info_feedback
  FOR ALL USING (
    user_id = auth.uid()
    OR public.has_role(ARRAY['curator', 'editor', 'admin'])
  );
*/