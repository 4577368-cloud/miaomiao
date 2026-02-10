-- Storage bucket 'public1' RLS policies for admin-only writes
create policy "public1 upload by admin"
on storage.objects for insert
to authenticated
with check (
  bucket_id = (select id from storage.buckets where name = 'public1')
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "public1 update by admin"
on storage.objects for update
to authenticated
using (
  bucket_id = (select id from storage.buckets where name = 'public1')
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  bucket_id = (select id from storage.buckets where name = 'public1')
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "public1 delete by admin"
on storage.objects for delete
to authenticated
using (
  bucket_id = (select id from storage.buckets where name = 'public1')
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
