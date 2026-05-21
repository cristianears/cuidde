-- Advisor hardening: prevent broad listing of the public avatars bucket.
-- Public object URLs continue to work for a public bucket; authenticated users
-- keep SELECT on their own folder so avatar upserts can inspect existing files.

drop policy if exists "avatars: leitura pública" on storage.objects;

create policy "avatars: leitura própria"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and ((select auth.uid())::text = (storage.foldername(name))[1])
  );
