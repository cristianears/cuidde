create or replace function public.sanitize_chat_contact_content(p_content text)
returns text
language plpgsql
immutable
as $$
declare
  v_content text := coalesce(p_content, '');
begin
  v_content := regexp_replace(v_content, 'https?://[^\s]+|www\.[^\s]+', '[contato removido]', 'gi');
  v_content := regexp_replace(v_content, '[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', '[contato removido]', 'g');
  v_content := regexp_replace(v_content, '\(?[0-9]{2}\)?[\s.-]?[0-9]{4,5}[\s.-]?[0-9]{4}', '[contato removido]', 'g');

  return v_content;
end;
$$;

create or replace function public.apply_chat_contact_filter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_should_filter boolean := false;
begin
  select
    a.status = 'pendente'
    or (
      a.status = 'ativo'
      and f.subscription_status in ('active', 'past_due')
      and f.subscription_started_at is not null
      and now() >= f.subscription_started_at
      and now() < f.subscription_started_at + interval '7 days'
    )
  into v_should_filter
  from public.appointments a
  join public.family_profiles f on f.id = a.family_id
  where a.id = new.appointment_id;

  if coalesce(v_should_filter, false) then
    new.content := public.sanitize_chat_contact_content(new.content);
  end if;

  return new;
end;
$$;

drop trigger if exists messages_contact_filter on public.messages;

create trigger messages_contact_filter
  before insert or update of content, appointment_id
  on public.messages
  for each row
  execute function public.apply_chat_contact_filter();
