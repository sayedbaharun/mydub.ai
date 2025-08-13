-- =====================================================
-- CORE CONTENT TABLES FOR MYDUB.AI
-- =====================================================
-- This migration adds the essential content tables
-- for news, government services, and tourism
-- =====================================================

-- =====================================================
-- NEWS TABLES
-- =====================================================

-- News Sources (media outlets)
CREATE TABLE IF NOT EXISTS public.news_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    logo TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    credibility_score INTEGER DEFAULT 5 CHECK (credibility_score >= 1 AND credibility_score <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News Articles
CREATE TABLE IF NOT EXISTS public.news_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_ar TEXT,
    title_hi TEXT,
    title_ur TEXT,
    summary TEXT NOT NULL,
    summary_ar TEXT,
    content TEXT NOT NULL,
    content_ar TEXT,
    source_id UUID REFERENCES public.news_sources(id),
    category TEXT NOT NULL,
    author TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    url TEXT UNIQUE,
    image_url TEXT,
    video_url TEXT,
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    read_time INTEGER,
    ai_summary TEXT,
    ai_summary_ar TEXT,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    is_breaking BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    has_video BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- GOVERNMENT SERVICES TABLES
-- =====================================================

-- Government Departments
CREATE TABLE IF NOT EXISTS public.government_departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_hi TEXT,
    name_ur TEXT,
    description TEXT,
    description_ar TEXT,
    logo TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    address_ar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Government Services
CREATE TABLE IF NOT EXISTS public.government_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES public.government_departments(id),
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    title_hi TEXT,
    title_ur TEXT,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    url TEXT,
    requirements TEXT[],
    requirements_ar TEXT[],
    documents TEXT[],
    documents_ar TEXT[],
    fees DECIMAL(10,2),
    processing_time TEXT,
    processing_time_ar TEXT,
    is_online BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- TOURISM TABLES
-- =====================================================

-- Tourism Attractions
CREATE TABLE IF NOT EXISTS public.tourism_attractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_hi TEXT,
    name_ur TEXT,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    address TEXT,
    address_ar TEXT,
    opening_hours JSONB,
    admission_fee DECIMAL(10,2),
    contact_phone TEXT,
    contact_email TEXT,
    website TEXT,
    images TEXT[],
    rating DECIMAL(2,1),
    review_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Tourism Events
CREATE TABLE IF NOT EXISTS public.tourism_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    title_hi TEXT,
    title_ur TEXT,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    location_ar TEXT NOT NULL,
    venue TEXT,
    venue_ar TEXT,
    organizer TEXT,
    organizer_ar TEXT,
    ticket_price DECIMAL(10,2),
    ticket_url TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    source TEXT DEFAULT 'manual',
    external_id TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- SUPPORTING TABLES
-- =====================================================

-- Traffic Data
CREATE TABLE IF NOT EXISTS public.traffic_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    road TEXT NOT NULL,
    road_ar TEXT NOT NULL,
    area TEXT NOT NULL,
    area_ar TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('smooth', 'moderate', 'heavy', 'blocked')),
    description TEXT,
    description_ar TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weather Data
CREATE TABLE IF NOT EXISTS public.weather_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    temperature DECIMAL(4,1) NOT NULL,
    feels_like DECIMAL(4,1) NOT NULL,
    humidity INTEGER NOT NULL,
    wind_speed DECIMAL(4,1) NOT NULL,
    wind_direction TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('sunny', 'partly-cloudy', 'cloudy', 'rainy', 'stormy', 'foggy', 'dusty')),
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    uv_index INTEGER,
    visibility DECIMAL(4,1),
    pressure DECIMAL(6,1),
    sunrise TIME,
    sunset TIME,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- News indexes
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON public.news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON public.news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_source ON public.news_articles(source_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_featured ON public.news_articles(is_featured) WHERE is_featured = true;

-- Government indexes
CREATE INDEX IF NOT EXISTS idx_gov_services_department ON public.government_services(department_id);
CREATE INDEX IF NOT EXISTS idx_gov_services_category ON public.government_services(category);
CREATE INDEX IF NOT EXISTS idx_gov_services_active ON public.government_services(is_active) WHERE is_active = true;

-- Tourism indexes
CREATE INDEX IF NOT EXISTS idx_tourism_attractions_category ON public.tourism_attractions(category);
CREATE INDEX IF NOT EXISTS idx_tourism_attractions_featured ON public.tourism_attractions(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_tourism_events_dates ON public.tourism_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tourism_events_active ON public.tourism_events(is_active, end_date) WHERE is_active = true;

-- Traffic indexes
CREATE INDEX IF NOT EXISTS idx_traffic_data_updated ON public.traffic_data(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_data_status ON public.traffic_data(status);

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_news_articles_updated_at ON public.news_articles;
CREATE TRIGGER update_news_articles_updated_at 
    BEFORE UPDATE ON public.news_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_government_services_updated_at ON public.government_services;
CREATE TRIGGER update_government_services_updated_at 
    BEFORE UPDATE ON public.government_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tourism_attractions_updated_at ON public.tourism_attractions;
CREATE TRIGGER update_tourism_attractions_updated_at 
    BEFORE UPDATE ON public.tourism_attractions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tourism_events_updated_at ON public.tourism_events;
CREATE TRIGGER update_tourism_events_updated_at 
    BEFORE UPDATE ON public.tourism_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_traffic_data_updated_at ON public.traffic_data;
CREATE TRIGGER update_traffic_data_updated_at 
    BEFORE UPDATE ON public.traffic_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Helper function for role checking (if doesn't exist)
CREATE OR REPLACE FUNCTION public.has_role(allowed_roles text[])
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role = ANY(allowed_roles)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- News Sources - Public read, admin manage
CREATE POLICY "news_sources_public_read" ON public.news_sources
    FOR SELECT USING (is_active = true);

CREATE POLICY "news_sources_admin_manage" ON public.news_sources
    FOR ALL USING (public.is_admin());

-- News Articles - Public read, role-based write
CREATE POLICY "news_articles_public_read" ON public.news_articles
    FOR SELECT USING (true);

CREATE POLICY "news_articles_curator_create" ON public.news_articles
    FOR INSERT WITH CHECK (public.has_role(ARRAY['curator', 'editor', 'admin']));

CREATE POLICY "news_articles_editor_update" ON public.news_articles
    FOR UPDATE USING (public.has_role(ARRAY['editor', 'admin']));

CREATE POLICY "news_articles_admin_delete" ON public.news_articles
    FOR DELETE USING (public.is_admin());

-- Government Departments - Public read active, admin manage
CREATE POLICY "gov_departments_public_read" ON public.government_departments
    FOR SELECT USING (is_active = true);

CREATE POLICY "gov_departments_admin_manage" ON public.government_departments
    FOR ALL USING (public.is_admin());

-- Government Services - Public read active, curator manage
CREATE POLICY "gov_services_public_read" ON public.government_services
    FOR SELECT USING (is_active = true);

CREATE POLICY "gov_services_curator_manage" ON public.government_services
    FOR ALL USING (public.has_role(ARRAY['curator', 'editor', 'admin']));

-- Tourism Attractions - Public read active, curator manage
CREATE POLICY "tourism_attractions_public_read" ON public.tourism_attractions
    FOR SELECT USING (is_active = true);

CREATE POLICY "tourism_attractions_curator_manage" ON public.tourism_attractions
    FOR ALL USING (public.has_role(ARRAY['curator', 'editor', 'admin']));

-- Tourism Events - Public read active, curator manage
CREATE POLICY "tourism_events_public_read" ON public.tourism_events
    FOR SELECT USING (is_active = true AND end_date >= NOW());

CREATE POLICY "tourism_events_curator_manage" ON public.tourism_events
    FOR ALL USING (public.has_role(ARRAY['curator', 'editor', 'admin']));

-- Traffic Data - Public read, editor manage
CREATE POLICY "traffic_data_public_read" ON public.traffic_data
    FOR SELECT USING (true);

CREATE POLICY "traffic_data_editor_manage" ON public.traffic_data
    FOR ALL USING (public.has_role(ARRAY['editor', 'admin']));

-- Weather Data - Public read, editor manage
CREATE POLICY "weather_data_public_read" ON public.weather_data
    FOR SELECT USING (true);

CREATE POLICY "weather_data_editor_manage" ON public.weather_data
    FOR ALL USING (public.has_role(ARRAY['editor', 'admin']));

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant read access to anonymous users
GRANT SELECT ON public.news_sources TO anon;
GRANT SELECT ON public.news_articles TO anon;
GRANT SELECT ON public.government_departments TO anon;
GRANT SELECT ON public.government_services TO anon;
GRANT SELECT ON public.tourism_attractions TO anon;
GRANT SELECT ON public.tourism_events TO anon;
GRANT SELECT ON public.traffic_data TO anon;
GRANT SELECT ON public.weather_data TO anon;

-- Grant full access to authenticated users (RLS will control actual access)
GRANT ALL ON public.news_sources TO authenticated;
GRANT ALL ON public.news_articles TO authenticated;
GRANT ALL ON public.government_departments TO authenticated;
GRANT ALL ON public.government_services TO authenticated;
GRANT ALL ON public.tourism_attractions TO authenticated;
GRANT ALL ON public.tourism_events TO authenticated;
GRANT ALL ON public.traffic_data TO authenticated;
GRANT ALL ON public.weather_data TO authenticated;

-- =====================================================
-- SAMPLE DATA (Remove in production)
-- =====================================================

-- Sample news source
INSERT INTO public.news_sources (name, name_ar, website, is_active)
VALUES ('Dubai Media Office', 'المكتب الإعلامي لحكومة دبي', 'https://mediaoffice.ae', true)
ON CONFLICT DO NOTHING;

-- Sample government department
INSERT INTO public.government_departments (name, name_ar, website, is_active)
VALUES ('Roads and Transport Authority', 'هيئة الطرق والمواصلات', 'https://www.rta.ae', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=== CORE CONTENT TABLES CREATED ===';
    RAISE NOTICE 'Tables added:';
    RAISE NOTICE '- news_sources, news_articles';
    RAISE NOTICE '- government_departments, government_services';
    RAISE NOTICE '- tourism_attractions, tourism_events';
    RAISE NOTICE '- traffic_data, weather_data';
    RAISE NOTICE 'RLS policies configured for role-based access';
    RAISE NOTICE '===================================';
END $$;