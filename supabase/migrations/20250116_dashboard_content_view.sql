-- Create unified content view for dashboard operations
CREATE OR REPLACE VIEW public.dashboard_content AS
WITH content_aggregation AS (
    -- News Articles
    SELECT 
        na.id,
        'news' as type,
        na.title,
        na.title_ar,
        COALESCE(na.summary, LEFT(na.content, 200)) as excerpt,
        COALESCE(na.summary_ar, LEFT(na.content_ar, 200)) as excerpt_ar,
        CASE 
            WHEN na.published_at IS NOT NULL THEN 'published'
            ELSE 'draft'
        END as status,
        na.author as author_name,
        NULL::UUID as author_id,
        NULL::UUID as editor_id,
        na.view_count as views,
        0 as likes,
        0 as shares,
        jsonb_build_object(
            'source_id', na.source_id,
            'category', na.category,
            'tags', na.tags,
            'url', na.url,
            'image_url', na.image_url,
            'is_featured', na.is_featured,
            'is_breaking', na.is_breaking,
            'has_video', na.has_video,
            'sentiment', na.sentiment
        ) as metadata,
        na.created_at,
        na.updated_at,
        na.published_at
    FROM public.news_articles na
    
    UNION ALL
    
    -- Government Services
    SELECT 
        gs.id,
        'government' as type,
        gs.title,
        gs.title_ar,
        LEFT(gs.description, 200) as excerpt,
        LEFT(gs.description_ar, 200) as excerpt_ar,
        CASE 
            WHEN gs.is_active THEN 'published'
            ELSE 'draft'
        END as status,
        NULL as author_name,
        NULL::UUID as author_id,
        NULL::UUID as editor_id,
        0 as views,
        0 as likes,
        0 as shares,
        jsonb_build_object(
            'department_id', gs.department_id,
            'department', gd.name,
            'department_ar', gd.name_ar,
            'category', gs.category,
            'url', gs.url,
            'is_online', gs.is_online,
            'fees', gs.fees,
            'processing_time', gs.processing_time,
            'requirements', gs.requirements
        ) as metadata,
        gs.created_at,
        gs.updated_at,
        gs.created_at as published_at
    FROM public.government_services gs
    LEFT JOIN public.government_departments gd ON gs.department_id = gd.id
    
    UNION ALL
    
    -- Tourism Attractions
    SELECT 
        ta.id,
        'tourism' as type,
        ta.name as title,
        ta.name_ar as title_ar,
        LEFT(ta.description, 200) as excerpt,
        LEFT(ta.description_ar, 200) as excerpt_ar,
        CASE 
            WHEN ta.is_active THEN 'published'
            ELSE 'draft'
        END as status,
        NULL as author_name,
        NULL::UUID as author_id,
        NULL::UUID as editor_id,
        ta.review_count as views,
        0 as likes,
        0 as shares,
        jsonb_build_object(
            'category', ta.category,
            'location', jsonb_build_object(
                'lat', ta.location_lat,
                'lng', ta.location_lng,
                'address', ta.address,
                'address_ar', ta.address_ar
            ),
            'rating', ta.rating,
            'admission_fee', ta.admission_fee,
            'is_featured', ta.is_featured,
            'images', ta.images
        ) as metadata,
        ta.created_at,
        ta.updated_at,
        ta.created_at as published_at
    FROM public.tourism_attractions ta
    
    UNION ALL
    
    -- Tourism Events
    SELECT 
        te.id,
        'event' as type,
        te.title,
        te.title_ar,
        LEFT(te.description, 200) as excerpt,
        LEFT(te.description_ar, 200) as excerpt_ar,
        CASE 
            WHEN te.is_active AND te.end_date > NOW() THEN 'published'
            WHEN te.end_date <= NOW() THEN 'archived'
            ELSE 'draft'
        END as status,
        te.organizer as author_name,
        NULL::UUID as author_id,
        NULL::UUID as editor_id,
        0 as views,
        0 as likes,
        0 as shares,
        jsonb_build_object(
            'category', te.category,
            'start_date', te.start_date,
            'end_date', te.end_date,
            'location', te.location,
            'venue', te.venue,
            'ticket_price', te.ticket_price,
            'ticket_url', te.ticket_url,
            'is_featured', te.is_featured
        ) as metadata,
        te.created_at,
        te.updated_at,
        te.start_date as published_at
    FROM public.tourism_events te
)
SELECT 
    c.*,
    -- Add author information from profiles if we have author_id
    CASE 
        WHEN c.author_id IS NOT NULL THEN 
            jsonb_build_object(
                'id', p.id,
                'email', p.email,
                'fullName', p.full_name,
                'avatar', p.avatar_url
            )
        ELSE 
            jsonb_build_object(
                'id', NULL,
                'email', NULL,
                'fullName', c.author_name,
                'avatar', NULL
            )
    END as author,
    -- Add editor information if we have editor_id
    CASE 
        WHEN c.editor_id IS NOT NULL THEN 
            jsonb_build_object(
                'id', e.id,
                'email', e.email,
                'fullName', e.full_name,
                'avatar', e.avatar_url
            )
        ELSE NULL
    END as editor
FROM content_aggregation c
LEFT JOIN public.profiles p ON c.author_id = p.id
LEFT JOIN public.profiles e ON c.editor_id = e.id;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS IF NOT EXISTS idx_news_articles_status ON public.news_articles((CASE WHEN published_at IS NOT NULL THEN 'published' ELSE 'draft' END));
CREATE INDEX IF NOT EXISTS IF NOT EXISTS idx_government_services_active ON public.government_services(is_active);
CREATE INDEX IF NOT EXISTS IF NOT EXISTS idx_tourism_attractions_active ON public.tourism_attractions(is_active);
CREATE INDEX IF NOT EXISTS IF NOT EXISTS idx_tourism_events_active ON public.tourism_events(is_active);
CREATE INDEX IF NOT EXISTS IF NOT EXISTS idx_tourism_events_dates ON public.tourism_events(end_date);

-- Grant permissions
GRANT SELECT ON public.dashboard_content TO authenticated;
GRANT SELECT ON public.dashboard_content TO anon;

-- Create a function to update content status across different tables
CREATE OR REPLACE FUNCTION update_content_status(
    p_content_id UUID,
    p_content_type TEXT,
    p_status TEXT,
    p_editor_id UUID,
    p_comments TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    CASE p_content_type
        WHEN 'news' THEN
            UPDATE public.news_articles
            SET 
                published_at = CASE 
                    WHEN p_status = 'published' THEN NOW()
                    ELSE NULL
                END,
                updated_at = NOW()
            WHERE id = p_content_id;
            
        WHEN 'government' THEN
            UPDATE public.government_services
            SET 
                is_active = (p_status = 'published'),
                updated_at = NOW()
            WHERE id = p_content_id;
            
        WHEN 'tourism' THEN
            UPDATE public.tourism_attractions
            SET 
                is_active = (p_status = 'published'),
                updated_at = NOW()
            WHERE id = p_content_id;
            
        WHEN 'event' THEN
            UPDATE public.tourism_events
            SET 
                is_active = (p_status = 'published'),
                updated_at = NOW()
            WHERE id = p_content_id;
    END CASE;
    
    -- Log the activity
    INSERT INTO public.activity_logs (
        user_id, action, resource, resource_id, details
    ) VALUES (
        p_editor_id,
        'content_' || p_status,
        'content',
        p_content_id::TEXT,
        jsonb_build_object(
            'type', p_content_type,
            'comments', p_comments
        )
    );
    
    -- Update or create entry in content table for dashboard-specific data
    INSERT INTO public.content (
        id, type, status, editor_id, updated_at
    ) VALUES (
        p_content_id, p_content_type, p_status, p_editor_id, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        editor_id = EXCLUDED.editor_id,
        updated_at = EXCLUDED.updated_at;
    
    v_result := jsonb_build_object(
        'success', true,
        'content_id', p_content_id,
        'new_status', p_status
    );
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_content_status TO authenticated;

-- Add missing columns to content table if they don't exist
DO $$ 
BEGIN
    -- Add type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'content' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE public.content 
        ADD COLUMN type TEXT NOT NULL DEFAULT 'news' CHECK (type IN ('news', 'government', 'tourism', 'event'));
    END IF;
END $$;