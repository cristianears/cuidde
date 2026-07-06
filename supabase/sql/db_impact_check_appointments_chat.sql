-- Database impact check for appointments and chat participant isolation.

begin;

set local statement_timeout = '15s';

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
) values
(
  '30000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'db-impact-family-chat@example.invalid',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"family","full_name":"DB Impact Chat Family","phone":"11971000001"}'::jsonb,
  now(),
  now(),
  false,
  false
),
(
  '30000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'db-impact-caregiver-chat@example.invalid',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"caregiver","full_name":"DB Impact Chat Caregiver","phone":"11971000002","cpf":"52998224725"}'::jsonb,
  now(),
  now(),
  false,
  false
),
(
  '30000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'db-impact-other-family-chat@example.invalid',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"family","full_name":"DB Impact Other Chat Family","phone":"11971000003"}'::jsonb,
  now(),
  now(),
  false,
  false
);

update public.family_profiles
set subscription_status = 'active'
where id = '30000000-0000-0000-0000-000000000001';

set local role authenticated;
set local request.jwt.claim.sub = '30000000-0000-0000-0000-000000000001';
set local request.jwt.claim.role = 'authenticated';

insert into public.appointments (
  id,
  family_id,
  caregiver_id,
  type,
  status,
  start_date,
  description,
  family_notes
) values (
  '30000000-0000-0000-0000-000000000010',
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002',
  'turno',
  'pendente',
  current_date,
  'DB impact appointment',
  'Sem contato direto nesta mensagem'
);

do $$
begin
  if not exists (
    select 1
    from public.appointments
    where id = '30000000-0000-0000-0000-000000000010'
  ) then
    raise exception 'db_impact_check failed: family_can_create_appointment_with_caregiver';
  end if;
end;
$$;

insert into public.messages (
  id,
  appointment_id,
  sender_id,
  content
) values (
  '30000000-0000-0000-0000-000000000011',
  '30000000-0000-0000-0000-000000000010',
  '30000000-0000-0000-0000-000000000001',
  'Ola, podemos combinar pelo chat da plataforma.'
);

insert into public.messages (
  id,
  appointment_id,
  sender_id,
  content
) values (
  '30000000-0000-0000-0000-000000000013',
  '30000000-0000-0000-0000-000000000010',
  '30000000-0000-0000-0000-000000000001',
  'Meu telefone e 11999999999'
);

do $$
begin
  if not exists (
    select 1
    from public.messages
    where id = '30000000-0000-0000-0000-000000000013'
      and content = 'Meu telefone e [contato removido]'
  ) then
    raise exception 'db_impact_check failed: contact_filter_sanitizes_phone_in_pending_chat';
  end if;
end;
$$;

set local request.jwt.claim.sub = '30000000-0000-0000-0000-000000000002';

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count
  from public.appointments
  where id = '30000000-0000-0000-0000-000000000010';

  if visible_count <> 1 then
    raise exception 'db_impact_check failed: caregiver_can_read_participant_appointment';
  end if;
end;
$$;

insert into public.messages (
  id,
  appointment_id,
  sender_id,
  content
) values (
  '30000000-0000-0000-0000-000000000012',
  '30000000-0000-0000-0000-000000000010',
  '30000000-0000-0000-0000-000000000002',
  'Combinado, sigo por aqui.'
);

update public.messages
set read_at = now()
where id = '30000000-0000-0000-0000-000000000011';

set local request.jwt.claim.sub = '30000000-0000-0000-0000-000000000003';

do $$
declare
  appointment_count integer;
  message_count integer;
begin
  select count(*) into appointment_count
  from public.appointments
  where id = '30000000-0000-0000-0000-000000000010';

  select count(*) into message_count
  from public.messages
  where appointment_id = '30000000-0000-0000-0000-000000000010';

  if appointment_count <> 0 or message_count <> 0 then
    raise exception 'db_impact_check failed: non_participant_cannot_read_messages';
  end if;
end;
$$;

reset role;

rollback;

select 'db_impact_check_appointments_chat_passed' as status;
