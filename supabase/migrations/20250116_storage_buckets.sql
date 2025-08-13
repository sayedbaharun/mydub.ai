-- Create storage buckets for content
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES 
  ('content-images', 'content-images', true, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('content-documents', 'content-documents', false, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('user-avatars', 'user-avatars', true, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for content-images bucket
CREATE POLICY "Anyone can view content images"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-images');

CREATE POLICY "Authenticated users can upload content images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Content owners can update their images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'content-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Content owners can delete their images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for content-documents bucket
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'content-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Document owners can update their documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'content-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Document owners can delete their documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for user-avatars bucket
CREATE POLICY "Anyone can view user avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);