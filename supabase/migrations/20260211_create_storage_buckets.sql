-- Create 'evidence' bucket for sitter certification
-- Note: We make it public because the frontend uses getPublicUrl
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Create 'avatars' bucket for user profiles
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for 'evidence' bucket

-- 1. Public Read (Allow admins/system to view proofs, and frontend to display them)
-- In a stricter system, this might be restricted to Admins + Owner, but getPublicUrl requires public bucket or signed URLs.
CREATE POLICY "Evidence Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'evidence' );

-- 2. Authenticated Upload (Users can upload to their own folder)
-- Path convention: {userId}/filename
CREATE POLICY "Evidence Upload by User"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidence' AND
  (name LIKE (auth.uid() || '/%'))
);

-- 3. Authenticated Update (Users can update their own files)
CREATE POLICY "Evidence Update by User"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidence' AND
  (name LIKE (auth.uid() || '/%'))
);

-- 4. Authenticated Delete (Users can delete their own files)
CREATE POLICY "Evidence Delete by User"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidence' AND
  (name LIKE (auth.uid() || '/%'))
);


-- RLS Policies for 'avatars' bucket (Generic public bucket)

CREATE POLICY "Avatars Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "Avatars Upload by User"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (name LIKE (auth.uid() || '/%'))
);

CREATE POLICY "Avatars Update by User"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (name LIKE (auth.uid() || '/%'))
);
