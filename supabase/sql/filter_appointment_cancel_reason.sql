-- Defesa no banco: motivo de recusa tambem nao pode carregar contato externo.

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
  v_content := regexp_replace(
    v_content,
    '\m(rua|r\.|avenida|av\.?|alameda|travessa|estrada|rodovia|praca|largo|condominio|residencial)\s+[a-zA-Z0-9][a-zA-Z0-9\s.''-]{1,80}?(,\s*|\s+n[o.]?\s*|\s+)[0-9]{1,6}(\s*[-,/]\s*[a-zA-Z0-9][a-zA-Z0-9\s.''-]{0,40})?',
    '[contato removido]',
    'gi'
  );
  v_content := regexp_replace(v_content, '\m[0-9]{5}-?[0-9]{3}\M', '[contato removido]', 'g');
  v_content := regexp_replace(v_content, '\(?[0-9]{2}\)?[\s.-]?[0-9]{4,5}[\s.-]?[0-9]{4}', '[contato removido]', 'g');

  return v_content;
end;
$$;

create or replace function public.filter_appointment_cancel_reason()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelado' and new.cancel_reason is not null then
    new.cancel_reason := nullif(trim(public.sanitize_chat_contact_content(new.cancel_reason)), '');
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_cancel_reason_contact_filter on public.appointments;

create trigger appointments_cancel_reason_contact_filter
  before insert or update of cancel_reason, status
  on public.appointments
  for each row
  execute function public.filter_appointment_cancel_reason();

update public.appointments
set cancel_reason = nullif(trim(public.sanitize_chat_contact_content(cancel_reason)), '')
where status = 'cancelado'
  and cancel_reason is not null;
