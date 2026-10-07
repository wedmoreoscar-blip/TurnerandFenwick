-- Create the public products bucket for product images.
--
-- Project: Supabase dev first, prod later (same file, same order).
-- docs/decisions.md, "Medusa configuration": Medusa's S3 file provider uploads product images here
-- through Supabase Storage's S3 endpoint. S3 access keys act with service-level rights and bypass
-- storage RLS, so no storage.objects policies are needed. The bucket is public so the storefront
-- can load images by URL; nothing else may be written to it.
--
-- Limits: 10 MB per file; JPEG, PNG, WebP and AVIF only (browsers can't show HEIC, so iPhone photos
-- must be exported as JPEG first).
--
-- Safe to run twice: an existing bucket is left unchanged. Undo: empty the bucket, then
-- delete from storage.buckets where id = 'products';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products',
  'products',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;
