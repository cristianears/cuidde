-- Advisor hardening: replace auth.uid() with initPlan-friendly (select auth.uid()).
-- Group 1 keeps the original business rules for low-risk tables.

drop policy if exists "caregiver_availability: dono gerencia" on public.caregiver_availability;
create policy "caregiver_availability: dono gerencia"
  on public.caregiver_availability
  for all
  to authenticated
  using (caregiver_id = (select auth.uid()));

drop policy if exists "caregiver_documents: dono gerencia" on public.caregiver_documents;
create policy "caregiver_documents: dono gerencia"
  on public.caregiver_documents
  for all
  to authenticated
  using (caregiver_id = (select auth.uid()));

drop policy if exists "caregiver_documents: família assinante lê visíveis" on public.caregiver_documents;
create policy "caregiver_documents: família assinante lê visíveis"
  on public.caregiver_documents
  for select
  to authenticated
  using (
    is_visible = true
    and exists (
      select 1
      from public.family_profiles
      where family_profiles.id = (select auth.uid())
        and family_profiles.subscription_status = 'active'
    )
  );

drop policy if exists "support_tickets: usuário gerencia os seus" on public.support_tickets;
create policy "support_tickets: usuário gerencia os seus"
  on public.support_tickets
  for all
  to authenticated
  using (user_id = (select auth.uid()));
