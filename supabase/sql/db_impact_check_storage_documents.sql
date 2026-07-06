-- Database impact check for caregiver document metadata and Storage object RLS.

begin;

set local statement_timeout = '15s';

do $$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'documents'
      and name = 'documents'
      and public = false
  ) then
    raise exception 'db_impact_check failed: documents_bucket_exists_private';
  end if;
end;
$$;

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
) values
(
  '50000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'db-impact-doc-caregiver@example.invalid',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"caregiver","full_name":"DB Impact Document Caregiver","phone":"11973000001","cpf":"12345678909"}'::jsonb,
  now(),
  now(),
  false,
  false
),
(
  '50000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'db-impact-other-doc-caregiver@example.invalid',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"caregiver","full_name":"DB Impact Other Document Caregiver","phone":"11973000002","cpf":"98765432100"}'::jsonb,
  now(),
  now(),
  false,
  false
);

set local role authenticated;
set local request.jwt.claim.sub = '50000000-0000-0000-0000-000000000001';
set local request.jwt.claim.role = 'authenticated';

insert into storage.objects (
  id,
  bucket_id,
  name,
  owner,
  owner_id,
  metadata
) values (
  '50000000-0000-0000-0000-000000000010',
  'documents',
  '50000000-0000-0000-0000-000000000001/rg_cnh.pdf',
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  '{"mimetype":"application/pdf","size":1}'::jsonb
);

insert into public.caregiver_documents (
  id,
  caregiver_id,
  type,
  file_url,
  file_name,
  status,
  is_visible,
  uploaded_at
) values (
  '50000000-0000-0000-0000-000000000011',
  '50000000-0000-0000-0000-000000000001',
  'rg_cnh',
  '50000000-0000-0000-0000-000000000001/rg_cnh.pdf',
  'rg_cnh.pdf',
  'pending',
  false,
  now()
);

do $$
begin
  if not exists (
    select 1
    from public.caregiver_documents
    where id = '50000000-0000-0000-0000-000000000011'
  ) then
    raise exception 'db_impact_check failed: caregiver_can_insert_own_document_metadata';
  end if;

  begin
    insert into storage.objects (
      bucket_id,
      name,
      owner,
      owner_id,
      metadata
    ) values (
      'documents',
      '50000000-0000-0000-0000-000000000002/rg_cnh.pdf',
      '50000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000001',
      '{"mimetype":"application/pdf","size":1}'::jsonb
    );

    raise exception 'db_impact_check failed: documents_storage_object_must_be_in_own_folder';
  exception
    when insufficient_privilege then
      null;
  end;
end;
$$;

set local request.jwt.claim.sub = '50000000-0000-0000-0000-000000000002';

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count
  from public.caregiver_documents
  where id = '50000000-0000-0000-0000-000000000011';

  if visible_count <> 0 then
    raise exception 'db_impact_check failed: other_caregiver_cannot_read_document_metadata';
  end if;
end;
$$;

reset role;

rollback;

select 'db_impact_check_storage_documents_passed' as status;
