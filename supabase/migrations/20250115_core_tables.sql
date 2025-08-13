-- News Tables
-- news_sources table
CREATE TABLE public.news_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    logo TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    credibility_score INTEGER DEFAULT 5 CHECK (credibility_score >= 1 AND credibility_score <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- news_articles table
CREATE TABLE public.news_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_ar TEXT,
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Government Services Tables
-- government_departments table
CREATE TABLE public.government_departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
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

-- government_services table
CREATE TABLE public.government_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES public.government_departments(id),
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tourism Tables
-- tourism_attractions table
CREATE TABLE public.tourism_attractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- tourism_events table
CREATE TABLE public.tourism_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
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
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
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

-- Enable RLS
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- News Tables RLS
CREATE POLICY "Public can view news articles" ON public.news_articles
    FOR SELECT USING (true);

CREATE POLICY "Public can view active news sources" ON public.news_sources
    FOR SELECT USING (is_active = true);

-- Government Services RLS
CREATE POLICY "Public can view active government services" ON public.government_services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active departments" ON public.government_departments
    FOR SELECT USING (is_active = true);

-- Tourism RLS
CREATE POLICY "Public can view active attractions" ON public.tourism_attractions
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active events" ON public.tourism_events
    FOR SELECT USING (is_active = true);

-- Update triggers
CREATE TRIGGER update_news_articles_updated_at BEFORE UPDATE ON public.news_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_government_services_updated_at BEFORE UPDATE ON public.government_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tourism_attractions_updated_at BEFORE UPDATE ON public.tourism_attractions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tourism_events_updated_at BEFORE UPDATE ON public.tourism_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.news_sources TO anon, authenticated;
GRANT SELECT ON public.news_articles TO anon, authenticated;
GRANT SELECT ON public.government_departments TO anon, authenticated;
GRANT SELECT ON public.government_services TO anon, authenticated;
GRANT SELECT ON public.tourism_attractions TO anon, authenticated;
GRANT SELECT ON public.tourism_events TO anon, authenticated;