-- Permite que o cuidador leia o perfil do idoso da família
-- somente quando há um atendimento vinculando os dois.
-- Isso libera a aba "Perfil do idoso" em cuidador/atendimento.

CREATE POLICY "family_profiles: cuidador lê dados do idoso no atendimento"
  ON public.family_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.family_id    = family_profiles.id
        AND appointments.caregiver_id = auth.uid()
        AND appointments.status IN ('pendente', 'ativo', 'finalizado')
    )
  );
