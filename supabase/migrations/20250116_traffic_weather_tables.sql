-- Create traffic and weather tables for MyDub.AI
-- Also add API integration fields to tourism_events table

-- traffic_data table
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

-- traffic_incidents table
CREATE TABLE IF NOT EXISTS public.traffic_incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  traffic_data_id UUID REFERENCES public.traffic_data(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('accident', 'construction', 'event', 'weather')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  estimated_clear_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- weather_data table
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

-- Enable RLS
ALTER TABLE public.traffic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view traffic data" ON public.traffic_data
  FOR SELECT USING (true);

CREATE POLICY "Public can view traffic incidents" ON public.traffic_incidents
  FOR SELECT USING (true);
  
CREATE POLICY "Public can view weather data" ON public.weather_data
  FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT ON public.traffic_data TO anon, authenticated;
GRANT SELECT ON public.traffic_incidents TO anon, authenticated;
GRANT SELECT ON public.weather_data TO anon, authenticated;

-- Insert sample traffic data
INSERT INTO public.traffic_data (road, road_ar, area, area_ar, status, description, description_ar) VALUES
('Sheikh Zayed Road', 'شارع الشيخ زايد', 'Dubai Marina to Downtown', 'من مرسى دبي إلى وسط المدينة', 'moderate', 'Moderate traffic due to morning rush hour', 'حركة مرور معتدلة بسبب ساعة الذروة الصباحية'),
('Al Khaleej Road', 'شارع الخليج', 'Deira to Bur Dubai', 'من ديرة إلى بر دبي', 'smooth', 'Traffic flowing smoothly', 'حركة المرور تسير بسلاسة'),
('Jumeirah Beach Road', 'شارع شاطئ جميرا', 'Jumeirah to Umm Suqeim', 'من جميرا إلى أم سقيم', 'heavy', 'Heavy traffic near Mall of the Emirates', 'حركة مرور كثيفة بالقرب من مول الإمارات'),
('Dubai-Al Ain Road', 'طريق دبي العين', 'Festival City to Al Warqa', 'من فستيفال سيتي إلى الورقاء', 'smooth', 'Clear roads with normal flow', 'طرق واضحة مع تدفق طبيعي'),
('Mohammed Bin Zayed Road', 'شارع محمد بن زايد', 'Academic City to Silicon Oasis', 'من المدينة الأكاديمية إلى واحة السيليكون', 'blocked', 'Road closure due to construction work', 'إغلاق الطريق بسبب أعمال البناء');

-- Insert sample weather data
INSERT INTO public.weather_data (temperature, feels_like, humidity, wind_speed, wind_direction, condition, description, description_ar, uv_index, visibility, pressure, sunrise, sunset) VALUES
(28.5, 32.1, 68, 12.3, 'NW', 'partly-cloudy', 'Partly cloudy with light winds', 'غائم جزئياً مع رياح خفيفة', 7, 10.0, 1013.2, '06:45', '18:15');

-- Insert sample tourism events
INSERT INTO public.tourism_events (title, title_ar, description, description_ar, category, start_date, end_date, location, location_ar, venue, venue_ar, organizer, organizer_ar, ticket_price, image_url, is_featured) VALUES
('Dubai Shopping Festival 2025', 'مهرجان دبي للتسوق ٢٠٢٥', 'The ultimate shopping, entertainment and cultural celebration featuring amazing deals, fantastic prizes, and spectacular entertainment across Dubai.', 'احتفال التسوق والترفيه والثقافة الأمثل يضم عروضاً مذهلة وجوائز رائعة وترفيهاً رائعاً في جميع أنحاء دبي.', 'shopping', '2025-01-20T00:00:00Z', '2025-02-28T23:59:59Z', 'Dubai Malls & Shopping Centers', 'مراكز التسوق في دبي', 'Dubai Mall, Mall of the Emirates, City Walk', 'دبي مول، مول الإمارات، سيتي ووك', 'Dubai Festivals and Retail Establishment', 'مؤسسة دبي للمهرجانات والتجارة', 0, '/images/events/dsf-2025.jpg', true),
('Dubai International Film Festival', 'مهرجان دبي السينمائي الدولي', 'A prestigious cinema celebration showcasing the best of Middle Eastern and international films.', 'احتفال سينمائي مرموق يعرض أفضل الأفلام الشرق أوسطية والدولية.', 'culture', '2025-01-25T00:00:00Z', '2025-02-02T23:59:59Z', 'Dubai Opera & Various Venues', 'دار الأوبرا دبي ومواقع مختلفة', 'Dubai Opera, Madinat Jumeirah', 'دار أوبرا دبي، مدينة جميرا', 'Dubai Culture & Arts Authority', 'هيئة الثقافة والفنون في دبي', 150, '/images/events/film-festival.jpg', true),
('Dubai Food Festival', 'مهرجان دبي للطعام', 'A month-long culinary journey featuring the finest local and international cuisines.', 'رحلة طهي لمدة شهر تتميز بأفضل المأكولات المحلية والدولية.', 'food', '2025-02-15T00:00:00Z', '2025-03-15T23:59:59Z', 'Dubai Restaurants & Food Trucks', 'مطاعم دبي وشاحنات الطعام', 'Beach Canteen, Various Restaurants', 'كانتين الشاطئ، مطاعم مختلفة', 'Dubai Department of Tourism', 'دائرة السياحة في دبي', 75, '/images/events/food-festival.jpg', false),
('Art Dubai Contemporary Art Fair', 'معرض آرت دبي للفن المعاصر', 'The premier contemporary art fair in the Middle East, Africa and South Asia region.', 'معرض الفن المعاصر الرائد في منطقة الشرق الأوسط وأفريقيا وجنوب آسيا.', 'art', '2025-03-01T00:00:00Z', '2025-03-05T23:59:59Z', 'Madinat Jumeirah', 'مدينة جميرا', 'Madinat Jumeirah Exhibition Centre', 'مركز معارض مدينة جميرا', 'Art Dubai Group', 'مجموعة آرت دبي', 200, '/images/events/art-dubai.jpg', true),
('Dubai Marathon 2025', 'ماراثون دبي ٢٠٢٥', 'Join thousands of runners in this iconic marathon through the heart of Dubai.', 'انضم إلى آلاف العدائين في هذا الماراثون الشهير عبر قلب دبي.', 'sports', '2025-01-28T06:00:00Z', '2025-01-28T12:00:00Z', 'Dubai Marina to Burj Al Arab', 'من مرسى دبي إلى برج العرب', 'Dubai Marina Start Point', 'نقطة انطلاق مرسى دبي', 'Dubai Sports Council', 'مجلس دبي الرياضي', 100, '/images/events/dubai-marathon.jpg', false);

-- Insert traffic incidents for roads with issues
INSERT INTO public.traffic_incidents (traffic_data_id, type, severity, description, description_ar, estimated_clear_time)
SELECT 
  td.id,
  'construction',
  'medium',
  'Lane closure for road maintenance',
  'إغلاق مسار لصيانة الطريق',
  NOW() + INTERVAL '2 hours'
FROM public.traffic_data td 
WHERE td.road = 'Jumeirah Beach Road';

INSERT INTO public.traffic_incidents (traffic_data_id, type, severity, description, description_ar, estimated_clear_time)
SELECT 
  td.id,
  'construction',
  'high',
  'Major construction work blocking main lanes',
  'أعمال بناء كبيرة تحجب المسارات الرئيسية',
  NOW() + INTERVAL '6 hours'
FROM public.traffic_data td 
WHERE td.road = 'Mohammed Bin Zayed Road';

-- Add API integration fields to existing tourism_events table
ALTER TABLE public.tourism_events 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tourism_events_source ON public.tourism_events(source);
CREATE INDEX IF NOT EXISTS idx_tourism_events_external_id ON public.tourism_events(external_id);
CREATE INDEX IF NOT EXISTS idx_tourism_events_is_active ON public.tourism_events(is_active); 