-- Create user_preferences table to fix the handle_new_user() function
-- This table stores user-specific settings and preferences

CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar', 'hi', 'ur')),
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    timezone TEXT DEFAULT 'Asia/Dubai',
    
    -- Notification preferences
    notifications JSONB DEFAULT '{
        "email": true,
        "push": false,
        "sms": false,
        "marketing": false
    }',
    
    -- Accessibility preferences
    accessibility JSONB DEFAULT '{
        "reduceMotion": false,
        "highContrast": false,
        "largeFonts": false,
        "screenReader": false
    }',
    
    -- Text-to-Speech settings
    tts_settings JSONB DEFAULT '{
        "voice": "",
        "rate": 1.0,
        "pitch": 1.0,
        "volume": 1.0,
        "autoPlay": false,
        "highlightText": true,
        "pauseOnPunctuation": true,
        "enableShortcuts": true
    }',
    
    -- AI assistant preferences
    ai_preferences JSONB DEFAULT '{
        "responseStyle": "conversational",
        "confidenceThreshold": 80,
        "biasAwareness": true,
        "explainDecisions": true
    }',
    
    -- Content and display preferences
    content_preferences JSONB DEFAULT '{
        "autoPlayVideos": false,
        "showImages": true,
        "compactMode": false,
        "articlesPerPage": 20
    }',
    
    -- Privacy preferences
    privacy_preferences JSONB DEFAULT '{
        "profileVisibility": "public",
        "dataCollection": true,
        "analyticsOptIn": true,
        "marketingOptIn": false
    }',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_preferences updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_language ON public.user_preferences(language);
CREATE INDEX IF NOT EXISTS idx_user_preferences_theme ON public.user_preferences(theme);
CREATE INDEX IF NOT EXISTS idx_user_preferences_timezone ON public.user_preferences(timezone);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
    DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
    DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
    DROP POLICY IF EXISTS "Admins can view all preferences" ON public.user_preferences;
END $$;

-- RLS Policies
-- Users can view their own preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all preferences
CREATE POLICY "Admins can view all preferences" ON public.user_preferences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON public.user_preferences TO authenticated;
GRANT SELECT ON public.user_preferences TO anon;

-- Function to get user preferences with defaults
CREATE OR REPLACE FUNCTION public.get_user_preferences(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    user_id UUID,
    language TEXT,
    theme TEXT,
    timezone TEXT,
    notifications JSONB,
    accessibility JSONB,
    tts_settings JSONB,
    ai_preferences JSONB,
    content_preferences JSONB,
    privacy_preferences JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Insert default preferences if they don't exist
    INSERT INTO public.user_preferences (user_id)
    VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Return preferences
    RETURN QUERY
    SELECT 
        up.user_id,
        up.language,
        up.theme,
        up.timezone,
        up.notifications,
        up.accessibility,
        up.tts_settings,
        up.ai_preferences,
        up.content_preferences,
        up.privacy_preferences,
        up.created_at,
        up.updated_at
    FROM public.user_preferences up
    WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user preferences safely
CREATE OR REPLACE FUNCTION public.update_user_preferences(
    preference_category TEXT,
    preference_data JSONB,
    user_uuid UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
    updated_preferences JSONB;
BEGIN
    -- Validate category
    IF preference_category NOT IN ('notifications', 'accessibility', 'tts_settings', 'ai_preferences', 'content_preferences', 'privacy_preferences') THEN
        RAISE EXCEPTION 'Invalid preference category: %', preference_category;
    END IF;
    
    -- Update the specific category
    EXECUTE format('
        UPDATE public.user_preferences 
        SET %I = $1, updated_at = NOW() 
        WHERE user_id = $2
        RETURNING %I
    ', preference_category, preference_category)
    USING preference_data, user_uuid
    INTO updated_preferences;
    
    RETURN updated_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;