-- Adicionar colunas novas na tabela care_routines
-- Executar no SQL Editor do Supabase Dashboard

ALTER TABLE care_routines
ADD COLUMN IF NOT EXISTS vital_signs JSONB DEFAULT NULL;

ALTER TABLE care_routines
ADD COLUMN IF NOT EXISTS hydration TEXT DEFAULT NULL
CHECK (hydration IN ('under200', '200to500', '500to1000', 'over1000'));

COMMENT ON COLUMN care_routines.vital_signs IS 'Sinais vitais opcionais registrados pelo cuidador. Schema: { bloodPressure?: { systolic, diastolic }, temperature?, glucose?, heartRate?, oxygenSaturation?, recordedAt? }';
COMMENT ON COLUMN care_routines.hydration IS 'Nível de hidratação do idoso: under200, 200to500, 500to1000, over1000';
