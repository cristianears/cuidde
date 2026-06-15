-- Permite que participantes continuem vendo nome/foto apos recusa da solicitacao.
-- Sem isso, o cuidador ve "Familia" e "?" quando a appointment vira cancelado.

drop policy if exists "family_profiles: leitura consolidada" on public.family_profiles;
create policy "family_profiles: leitura consolidada"
  on public.family_profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.appointments
      where appointments.family_id = family_profiles.id
        and appointments.caregiver_id = (select auth.uid())
        and appointments.status = any (array['pendente'::text, 'ativo'::text, 'finalizado'::text, 'cancelado'::text])
    )
  );

drop policy if exists "profiles: leitura consolidada" on public.profiles;
create policy "profiles: leitura consolidada"
  on public.profiles
  for select
  to public
  using (
    id = (select auth.uid())
    or id in (
      select cp.id
      from public.caregiver_profiles cp
      where cp.profile_complete = true
    )
    or id in (
      select a.family_id
      from public.appointments a
      where a.caregiver_id = (select auth.uid())
        and a.status = any (array['ativo'::text, 'pendente'::text, 'finalizado'::text, 'cancelado'::text])
    )
    or id in (
      select a.caregiver_id
      from public.appointments a
      where a.family_id = (select auth.uid())
        and a.status = any (array['ativo'::text, 'pendente'::text, 'finalizado'::text, 'cancelado'::text])
    )
  );

notify pgrst, 'reload schema';
