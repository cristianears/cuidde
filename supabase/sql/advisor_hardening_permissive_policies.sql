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
