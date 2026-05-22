-- Sprint: ciclo de vida da assinatura
-- Adiciona flag para sinalizar que a assinatura está marcada para cancelar no fim do período.
-- Ao longo do período o usuário continua com acesso (subscription_status = 'active'),
-- mas a UI exibe aviso de que a renovação está desativada.

ALTER TABLE family_profiles
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

ALTER TABLE family_profiles
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
