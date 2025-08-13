-- Create Storage Buckets for MyDub.AI
-- Run this in Supabase SQL Editor

-- Note: Supabase doesn't support creating buckets via SQL directly
-- You need to either:
-- 1. Use the Supabase Dashboard UI
-- 2. Use the JavaScript Admin SDK
-- 3. Use the Management API

-- However, we can set up the bucket policies via SQL after creating them

-- Step 1: Create these buckets manually in Supabase Dashboard:
-- Go to Storage > New Bucket and create:
-- 1. content-images (public, 10MB limit)
-- 2. article-images (public, 10MB limit)
-- 3. user-avatars (public, 5MB limit)
-- 4. content-documents (private, 50MB limit)

-- Step 2: After creating buckets, run these policies:

-- Content Images Bucket Policies
CREATE POLICY "Anyone can view content images" ON storage.objects
    FOR SELECT USING (bucket_id = 'content-images');

CREATE POLICY "Authenticated users can upload content images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'content-images' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update own content images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'content-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own content images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'content-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Article Images Bucket Policies
CREATE POLICY "Anyone can view article images" ON storage.objects
    FOR SELECT USING (bucket_id = 'article-images');

CREATE POLICY "Editors can manage article images" ON storage.objects
    FOR ALL USING (
        bucket_id = 'article-images' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('editor', 'admin', 'curator')
        )
    );

-- User Avatars Bucket Policies
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'user-avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'user-avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'user-avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Content Documents Bucket Policies (Private)
CREATE POLICY "Authenticated users can view documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'content-documents' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Editors can manage documents" ON storage.objects
    FOR ALL USING (
        bucket_id = 'content-documents' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('editor', 'admin')
        )
    );

-- Step 3: Test bucket creation
-- You can verify buckets exist by running:
-- SELECT * FROM storage.buckets;