-- Advisor hardening: remove duplicate permissive policies.
-- Group D1: reviews INSERT keeps only the appointment-finalized rule.

drop policy if exists "reviews: família insere" on public.reviews;

drop policy if exists "reviews: família insere somente para o cuidador do atendimento" on public.reviews;
create policy "reviews: família insere somente para o cuidador do atendimento"
  on public.reviews
  for insert
  to authenticated
  with check (
    family_id = (select auth.uid())
    and caregiver_id = (
      select a.caregiver_id
      from public.appointments a
      where a.id = reviews.appointment_id
        and a.family_id = (select auth.uid())
        and a.status = 'finalizado'
    )
  );

-- Group D2: professional_references SELECT policies are complementary.
-- Keep one SELECT policy and split owner writes by command.

drop policy if exists "professional_references: dono gerencia" on public.professional_references;
drop policy if exists "professional_references: família assinante lê" on public.professional_references;

create policy "professional_references: dono ou família assinante lê"
  on public.professional_references
  for select
  to authenticated
  using (
    caregiver_id = (select auth.uid())
    or exists (
      select 1
      from public.family_profiles
      where family_profiles.id = (select auth.uid())
        and family_profiles.subscription_status = 'active'
    )
  );

create policy "professional_references: dono insere"
  on public.professional_references
  for insert
  to authenticated
  with check (caregiver_id = (select auth.uid()));

create policy "professional_references: dono atualiza"
  on public.professional_references
  for update
  to authenticated
  using (caregiver_id = (select auth.uid()))
  with check (caregiver_id = (select auth.uid()));

create policy "professional_references: dono remove"
  on public.professional_references
  for delete
  to authenticated
  using (caregiver_id = (select auth.uid()));
