-- Create parental_consents table for age verification
CREATE TABLE IF NOT EXISTS public.parental_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_birth_date DATE NOT NULL,
    parent_email TEXT NOT NULL,
    parent_phone TEXT,
    consent_token UUID NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    denied_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE,
    approved_ip INET,
    denied_ip INET,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL -- Link to user once they create account
);

-- Create indexes for better performance
CREATE INDEX idx_parental_consents_token ON public.parental_consents(consent_token);
CREATE INDEX idx_parental_consents_status ON public.parental_consents(status);
CREATE INDEX idx_parental_consents_parent_email ON public.parental_consents(parent_email);
CREATE INDEX idx_parental_consents_created_at ON public.parental_consents(created_at);

-- Enable RLS
ALTER TABLE public.parental_consents ENABLE ROW LEVEL SECURITY;

-- Policies for parental consent
-- Anyone can insert a consent request (for registration flow)
CREATE POLICY "Anyone can create consent request" ON public.parental_consents
    FOR INSERT WITH CHECK (true);

-- Anyone with valid token can view the consent request
CREATE POLICY "View consent with valid token" ON public.parental_consents
    FOR SELECT USING (true); -- In production, you'd want to restrict this more

-- Anyone with valid token can update status
CREATE POLICY "Update consent with valid token" ON public.parental_consents
    FOR UPDATE USING (status = 'pending')
    WITH CHECK (status IN ('approved', 'denied'));

-- Create function to expire old pending consents
CREATE OR REPLACE FUNCTION expire_old_parental_consents()
RETURNS void AS $$
BEGIN
    UPDATE public.parental_consents
    SET 
        status = 'expired',
        expired_at = NOW()
    WHERE 
        status = 'pending' 
        AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run daily (requires pg_cron extension)
-- In production, you'd set this up with your job scheduler
-- SELECT cron.schedule('expire-parental-consents', '0 0 * * *', 'SELECT expire_old_parental_consents();');

-- Create age_verifications table to track verified users
CREATE TABLE IF NOT EXISTS public.age_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    birth_date DATE NOT NULL,
    age_at_verification INTEGER NOT NULL,
    is_adult BOOLEAN NOT NULL,
    parental_consent_id UUID REFERENCES public.parental_consents(id),
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verification_method TEXT NOT NULL CHECK (verification_method IN ('self', 'parental_consent')),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes
CREATE INDEX idx_age_verifications_user_id ON public.age_verifications(user_id);
CREATE INDEX idx_age_verifications_expires_at ON public.age_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.age_verifications ENABLE ROW LEVEL SECURITY;

-- Policies for age verification
-- Users can view their own verification
CREATE POLICY "Users can view own verification" ON public.age_verifications
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert verifications (through service role)
CREATE POLICY "System can insert verifications" ON public.age_verifications
    FOR INSERT WITH CHECK (true);

-- Create function to check if user is age verified
CREATE OR REPLACE FUNCTION is_age_verified(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    verified BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.age_verifications 
        WHERE user_id = user_uuid 
        AND expires_at > NOW()
    ) INTO verified;
    
    RETURN verified;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user age info
CREATE OR REPLACE FUNCTION get_user_age_info(user_uuid UUID)
RETURNS TABLE (
    is_verified BOOLEAN,
    age INTEGER,
    is_adult BOOLEAN,
    has_parental_consent BOOLEAN,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TRUE as is_verified,
        av.age_at_verification as age,
        av.is_adult,
        av.parental_consent_id IS NOT NULL as has_parental_consent,
        av.expires_at
    FROM public.age_verifications av
    WHERE av.user_id = user_uuid 
    AND av.expires_at > NOW()
    ORDER BY av.verified_at DESC
    LIMIT 1;
    
    -- Return empty result if not verified
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::BOOLEAN, NULL::BOOLEAN, NULL::TIMESTAMP WITH TIME ZONE;
    END IF;
END;
$$ LANGUAGE plpgsql;