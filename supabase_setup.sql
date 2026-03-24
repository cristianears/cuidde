-- =============================================================================
-- CUIDDE — Setup completo do banco de dados
-- Cole este arquivo inteiro no SQL Editor do Supabase (supabase.com/dashboard)
-- Acesse: Project > SQL Editor > New query > cole e clique em Run
--
-- ORDEM DE EXECUÇÃO (já respeitada aqui):
--   1. Tabelas (respeitando dependências de FK)
--   2. Triggers e funções
--   3. RLS policies
--   4. Storage buckets
-- =============================================================================


-- =============================================================================
-- PARTE 1 — TABELAS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles (estende auth.users — criada via trigger no signup)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('caregiver', 'family', 'admin')),
  full_name   TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- caregiver_profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.caregiver_profiles (
  id                          UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Dados pessoais
  photo_url                   TEXT,
  whatsapp                    TEXT,
  bio                         TEXT,
  -- Endereço
  cep                         TEXT,
  street                      TEXT,
  number                      TEXT,
  neighborhood                TEXT,
  city                        TEXT,
  state                       CHAR(2),
  -- Profissional
  specialties                 TEXT[] DEFAULT '{}',
  modalities                  TEXT[] DEFAULT '{}',
  idiomas                     TEXT[] DEFAULT '{}',
  experience_years            INTEGER DEFAULT 0,
  profissao_formacao          TEXT CHECK (profissao_formacao IN (
                                'cuidador','tecnico_enfermagem','auxiliar_enfermagem',
                                'enfermeiro','fisioterapeuta','terapeuta_ocupacional','outro'
                              )),
  formacao_complementar       TEXT,
  -- CNH
  possui_cnh                  BOOLEAN DEFAULT FALSE,
  categoria_cnh               TEXT CHECK (categoria_cnh IN ('A','B','AB','C','D','E')),
  -- Seguro
  has_insurance               BOOLEAN DEFAULT FALSE,
  -- Preços
  price_per_hour              DECIMAL(10,2),
  price_per_day               DECIMAL(10,2),
  -- Registro profissional
  professional_reg_type       TEXT CHECK (professional_reg_type IN ('coren','crefito','outros')),
  professional_reg_number     TEXT,
  professional_reg_uf         CHAR(2),
  professional_reg_other_desc TEXT,
  -- Status e visibilidade
  status                      TEXT DEFAULT 'pending' CHECK (status IN ('pending','analyzing','verified','rejected')),
  rejection_reason            TEXT,
  is_visible                  BOOLEAN DEFAULT FALSE,
  -- Privacidade das referências
  show_refs_to_subscribers    BOOLEAN DEFAULT TRUE,
  mask_reference_phones       BOOLEAN DEFAULT TRUE,
  show_reference_full_names   BOOLEAN DEFAULT FALSE,
  -- Métricas (atualizadas por triggers/cron)
  profile_views_30d           INTEGER DEFAULT 0,
  search_appearances_30d      INTEGER DEFAULT 0,
  interested_families_30d     INTEGER DEFAULT 0,
  average_rating              DECIMAL(3,2) DEFAULT 0,
  review_count                INTEGER DEFAULT 0,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- professional_references
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.professional_references (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id  UUID REFERENCES public.caregiver_profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  workplace     TEXT,
  position      TEXT,
  work_duration TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- caregiver_documents
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.caregiver_documents (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id UUID REFERENCES public.caregiver_profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('rg_cnh','cnpj','curriculo','certificacao','antecedentes')),
  file_url     TEXT,
  file_name    TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','approved','rejected')),
  is_visible   BOOLEAN DEFAULT TRUE,
  required     BOOLEAN DEFAULT FALSE,
  reviewed_at  TIMESTAMPTZ,
  uploaded_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- caregiver_availability
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.caregiver_availability (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id UUID REFERENCES public.caregiver_profiles(id) ON DELETE CASCADE,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo, 6=sábado
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- family_profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_profiles (
  id                      UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url               TEXT,
  -- Responsável
  relationship            TEXT,
  -- Endereço
  cep                     TEXT,
  street                  TEXT,
  number                  TEXT,
  neighborhood            TEXT,
  city                    TEXT,
  state                   CHAR(2),
  -- Idoso
  elderly_name            TEXT,
  elderly_age             INTEGER,
  elderly_conditions      TEXT[] DEFAULT '{}',
  blood_type              TEXT,
  pre_existing_conditions TEXT,
  allergies               TEXT,
  continuous_medications  TEXT,
  responsible_doctor      TEXT,
  health_insurance        TEXT,
  care_needs              TEXT,
  -- Preferências de contratação
  service_formats         TEXT[] DEFAULT '{}',
  hourly_range_min        DECIMAL(10,2),
  hourly_range_max        DECIMAL(10,2),
  daily_range_min         DECIMAL(10,2),
  daily_range_max         DECIMAL(10,2),
  distance_preference     TEXT,
  -- Stripe
  stripe_customer_id      TEXT,
  plan                    TEXT CHECK (plan IN ('monthly','quarterly','annual')),
  subscription_status     TEXT CHECK (subscription_status IN ('active','trial','inactive','cancelled','expired')),
  stripe_subscription_id  TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- appointments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id     UUID REFERENCES public.family_profiles(id),
  caregiver_id  UUID REFERENCES public.caregiver_profiles(id),
  type          TEXT NOT NULL CHECK (type IN ('plantão','contínuo','turno')),
  status        TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','ativo','finalizado','cancelado')),
  start_date    DATE NOT NULL,
  end_date      DATE,
  description   TEXT,
  family_notes  TEXT,
  modality      TEXT,
  observations  TEXT,
  total_amount  DECIMAL(10,2),
  cancelled_by  TEXT,
  cancel_reason TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- care_routines
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.care_routines (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id         UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  date                   DATE NOT NULL,
  shift                  TEXT NOT NULL CHECK (shift IN ('morning','afternoon','night')),
  care_types             TEXT[] NOT NULL DEFAULT '{}',
  observations           TEXT,
  has_occurrence         BOOLEAN DEFAULT FALSE,
  occurrence_description TEXT,
  recorded_at            TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- messages
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  sender_id      UUID REFERENCES public.profiles(id),
  content        TEXT NOT NULL,
  read_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id),
  family_id      UUID REFERENCES public.family_profiles(id),
  caregiver_id   UUID REFERENCES public.caregiver_profiles(id),
  family_name    TEXT,
  family_photo   TEXT,
  rating         DECIMAL(2,1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, caregiver_id)
);

-- -----------------------------------------------------------------------------
-- favorites
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id    UUID REFERENCES public.family_profiles(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES public.caregiver_profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, caregiver_id)
);

-- -----------------------------------------------------------------------------
-- invoices
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id                UUID REFERENCES public.family_profiles(id),
  invoice_ref              TEXT,
  period                   TEXT,
  plan                     TEXT CHECK (plan IN ('monthly','quarterly','annual')),
  amount                   DECIMAL(10,2) NOT NULL,
  status                   TEXT DEFAULT 'pending' CHECK (status IN ('paid','pending','open')),
  stripe_invoice_id        TEXT,
  stripe_payment_intent_id TEXT,
  due_date                 DATE,
  paid_at                  TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- support_tickets
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL CHECK (subject IN (
                'conta','documentos','atendimentos','avaliacoes',
                'visibilidade','sugestoes','outro'
              )),
  message     TEXT NOT NULL,
  status      TEXT DEFAULT 'enviado' CHECK (status IN ('enviado','em_analise','respondido')),
  admin_reply TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- system_logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name  TEXT,
  user_role  TEXT CHECK (user_role IN ('admin','caregiver','family')),
  action     TEXT NOT NULL,
  details    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================================
-- PARTE 2 — FUNÇÕES E TRIGGERS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Trigger: auto-criar profile + sub-profile após signup
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  );

  IF NEW.raw_user_meta_data->>'role' = 'caregiver' THEN
    INSERT INTO public.caregiver_profiles (id) VALUES (NEW.id);
  ELSIF NEW.raw_user_meta_data->>'role' = 'family' THEN
    INSERT INTO public.family_profiles (id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Trigger: atualizar average_rating e review_count após novo review
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_caregiver_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.caregiver_profiles
  SET
    average_rating = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM public.reviews WHERE caregiver_id = NEW.caregiver_id),
    review_count   = (SELECT COUNT(*) FROM public.reviews WHERE caregiver_id = NEW.caregiver_id)
  WHERE id = NEW.caregiver_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_review_inserted ON public.reviews;
CREATE TRIGGER on_review_inserted
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_caregiver_rating();


-- =============================================================================
-- PARTE 3 — ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: ver e editar próprio"
  ON public.profiles
  USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- caregiver_profiles
-- -----------------------------------------------------------------------------
ALTER TABLE public.caregiver_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "caregiver_profiles: dono gerencia"
  ON public.caregiver_profiles
  FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "caregiver_profiles: público lê verificados e visíveis"
  ON public.caregiver_profiles
  FOR SELECT
  USING (status = 'verified' AND is_visible = TRUE);

-- -----------------------------------------------------------------------------
-- professional_references
-- -----------------------------------------------------------------------------
ALTER TABLE public.professional_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professional_references: dono gerencia"
  ON public.professional_references
  FOR ALL
  USING (caregiver_id = auth.uid());

CREATE POLICY "professional_references: família assinante lê"
  ON public.professional_references
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_profiles
      WHERE id = auth.uid()
      AND subscription_status = 'active'
    )
  );

-- -----------------------------------------------------------------------------
-- caregiver_documents
-- -----------------------------------------------------------------------------
ALTER TABLE public.caregiver_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "caregiver_documents: dono gerencia"
  ON public.caregiver_documents
  FOR ALL
  USING (caregiver_id = auth.uid());

CREATE POLICY "caregiver_documents: família assinante lê visíveis"
  ON public.caregiver_documents
  FOR SELECT
  USING (
    is_visible = TRUE
    AND EXISTS (
      SELECT 1 FROM public.family_profiles
      WHERE id = auth.uid()
      AND subscription_status = 'active'
    )
  );

-- -----------------------------------------------------------------------------
-- caregiver_availability
-- -----------------------------------------------------------------------------
ALTER TABLE public.caregiver_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "caregiver_availability: dono gerencia"
  ON public.caregiver_availability
  FOR ALL
  USING (caregiver_id = auth.uid());

CREATE POLICY "caregiver_availability: todos leem"
  ON public.caregiver_availability
  FOR SELECT
  USING (TRUE);

-- -----------------------------------------------------------------------------
-- family_profiles
-- -----------------------------------------------------------------------------
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_profiles: dono gerencia"
  ON public.family_profiles
  FOR ALL
  USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- appointments
-- -----------------------------------------------------------------------------
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments: participantes acessam"
  ON public.appointments
  USING (family_id = auth.uid() OR caregiver_id = auth.uid());

-- -----------------------------------------------------------------------------
-- care_routines
-- -----------------------------------------------------------------------------
ALTER TABLE public.care_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "care_routines: participantes do agendamento"
  ON public.care_routines
  USING (
    appointment_id IN (
      SELECT id FROM public.appointments
      WHERE family_id = auth.uid() OR caregiver_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- messages
-- -----------------------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages: participantes do agendamento"
  ON public.messages
  USING (
    appointment_id IN (
      SELECT id FROM public.appointments
      WHERE family_id = auth.uid() OR caregiver_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews: família insere"
  ON public.reviews
  FOR INSERT
  WITH CHECK (family_id = auth.uid());

CREATE POLICY "reviews: todos leem"
  ON public.reviews
  FOR SELECT
  USING (TRUE);

-- -----------------------------------------------------------------------------
-- favorites
-- -----------------------------------------------------------------------------
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites: família gerencia os seus"
  ON public.favorites
  USING (family_id = auth.uid());

-- -----------------------------------------------------------------------------
-- invoices
-- -----------------------------------------------------------------------------
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices: família vê as suas"
  ON public.invoices
  FOR SELECT
  USING (family_id = auth.uid());

-- -----------------------------------------------------------------------------
-- support_tickets
-- -----------------------------------------------------------------------------
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_tickets: usuário gerencia os seus"
  ON public.support_tickets
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- system_logs — sem RLS pública; acesso via service_role na Edge Function admin
-- -----------------------------------------------------------------------------
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy pública: apenas service_role (Edge Functions admin) pode ler/inserir


-- =============================================================================
-- PARTE 4 — STORAGE BUCKETS
-- =============================================================================

-- Bucket para fotos de perfil (público — URLs acessíveis sem autenticação)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Bucket para documentos (privado — acesso controlado por RLS)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', FALSE)
ON CONFLICT (id) DO NOTHING;

-- RLS do bucket avatars: usuário faz upload na própria pasta
CREATE POLICY "avatars: upload próprio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "avatars: leitura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: deletar próprio"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

-- RLS do bucket documents: apenas o dono faz upload e lê
CREATE POLICY "documents: upload próprio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "documents: dono lê"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "documents: deletar próprio"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);


-- =============================================================================
-- FIM DO SETUP
-- Após rodar este SQL:
-- 1. Habilite Email Auth + Google OAuth no Dashboard > Authentication > Providers
-- 2. Configure as variáveis de ambiente no projeto (.env.local):
--    VITE_SUPABASE_URL=
--    VITE_SUPABASE_ANON_KEY=
-- =============================================================================
