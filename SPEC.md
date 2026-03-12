# SPEC.md — Especificação Técnica de Implementação Backend

> **Projeto:** Cuidde  
> **Stack:** React + Vite + TypeScript + Supabase + Stripe  
> **Metodologia:** Spec-Driven Development (SDD)  
> **TanStack Query:** v5 — usar `{ queryKey, queryFn }` e `useMutation({ mutationFn })`  
> **Como usar:** Uma sessão do Claude Code = um sprint. Nunca misture sprints.

---

## Diagrama de Relações (ERD)

```
auth.users (Supabase Auth)
    │
    └──► profiles  (1:1 — criada via trigger no signup)
              │
              ├──► caregiver_profiles  (1:1 — id = profiles.id)
              │         │
              │         ├──► professional_references  (1:N — caregiver_id)
              │         ├──► caregiver_documents      (1:N — caregiver_id)
              │         ├──► caregiver_availability   (1:N — caregiver_id)
              │         ├──► appointments             (1:N — caregiver_id)
              │         ├──► reviews                  (1:N — caregiver_id)
              │         └──► favorites                (1:N — caregiver_id)
              │
              ├──► family_profiles  (1:1 — id = profiles.id)
              │         │
              │         ├──► appointments   (1:N — family_id)
              │         ├──► reviews        (1:N — family_id)
              │         ├──► favorites      (1:N — family_id)
              │         ├──► invoices       (1:N — family_id)
              │         └──► support_tickets (1:N — user_id → profiles.id)
              │
              └──► support_tickets  (1:N — user_id → profiles.id, qualquer role)

appointments  (N:1 caregiver + N:1 family)
    │
    ├──► care_routines  (1:N — appointment_id)
    ├──► messages       (1:N — appointment_id)
    └──► reviews        (1:1 — appointment_id, UNIQUE family_id+caregiver_id)

system_logs  (referência fraca — user_id pode ser NULL se usuário deletado)
```

### Regras de cardinalidade importantes
- `profiles` → `caregiver_profiles` ou `family_profiles`: exclusivo por role (nunca os dois)
- `favorites`: UNIQUE(family_id, caregiver_id) — uma família favorita um cuidador uma vez
- `reviews`: UNIQUE(family_id, caregiver_id) — uma família avalia um cuidador uma vez
- `appointments` ↔ `reviews`: um agendamento pode gerar no máximo uma review
- `messages`: não tem relação direta com `profiles` — o `sender_id` referencia `auth.users` via RLS
- `invoices`: ligada a `family_profiles` apenas (cuidador não tem fatura na plataforma)
- `support_tickets`: qualquer role pode abrir (caregiver ou family)

---

### Tabela: `profiles`
Extende `auth.users`. Criada via trigger automático no signup.

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT CHECK (role IN ('caregiver', 'family', 'admin')),  -- nullable para cadastro Google (role definido no onboarding)
  full_name   TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabela: `caregiver_profiles`
```sql
CREATE TABLE caregiver_profiles (
  id                          UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  -- Dados pessoais
  photo_url                   TEXT,
  whatsapp                    TEXT,
  bio                         TEXT,
  -- Endereço
  cep                         TEXT,
  street                      TEXT,
  number                      TEXT,
  complement                  TEXT,
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
  -- Disponibilidade emergencial
  emergency_available         BOOLEAN DEFAULT FALSE,
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
  -- Métricas
  profile_views_30d           INTEGER DEFAULT 0,
  search_appearances_30d      INTEGER DEFAULT 0,
  interested_families_30d     INTEGER DEFAULT 0,
  average_rating              DECIMAL(3,2) DEFAULT 0,
  review_count                INTEGER DEFAULT 0,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabela: `professional_references`
```sql
CREATE TABLE professional_references (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id  UUID REFERENCES caregiver_profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  workplace     TEXT,
  position      TEXT,
  work_duration TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabela: `caregiver_documents`
```sql
CREATE TABLE caregiver_documents (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id    UUID REFERENCES caregiver_profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('rg_cnh','curriculo','certificacao','antecedentes')),
  file_url        TEXT,
  file_name       TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','approved','rejected')),
  is_visible      BOOLEAN DEFAULT TRUE,     -- controle de visibilidade por documento
  required        BOOLEAN DEFAULT FALSE,
  reviewed_at     TIMESTAMPTZ,
  uploaded_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabela: `caregiver_availability`
```sql
CREATE TABLE caregiver_availability (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id  UUID REFERENCES caregiver_profiles(id) ON DELETE CASCADE,
  day_of_week   INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabela: `family_profiles`
```sql
CREATE TABLE family_profiles (
  id                    UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url             TEXT,
  -- Responsável
  relationship          TEXT,                    -- 'filho', 'filha', 'cônjuge', etc.
  -- Endereço
  cep                   TEXT,
  street                TEXT,
  number                TEXT,
  complement            TEXT,
  neighborhood          TEXT,
  city                  TEXT,
  state                 CHAR(2),
  -- Idoso
  elderly_name          TEXT,
  elderly_age           INTEGER,
  elderly_conditions    TEXT[] DEFAULT '{}',     -- 'Alzheimer', 'Parkinson', 'AVC', etc.
  blood_type            TEXT,
  pre_existing_conditions TEXT,
  allergies             TEXT,
  continuous_medications TEXT,
  responsible_doctor    TEXT,
  health_insurance      TEXT,
  care_needs            TEXT,
  -- Preferências de contratação
  service_formats       TEXT[] DEFAULT '{}',     -- 'plantoes', 'diarias', 'turnos', 'cobertura'
  hourly_range_min      DECIMAL(10,2),
  hourly_range_max      DECIMAL(10,2),
  daily_range_min       DECIMAL(10,2),
  daily_range_max       DECIMAL(10,2),
  distance_preference   TEXT,
  -- Stripe
  stripe_customer_id    TEXT,
  plan                  TEXT CHECK (plan IN ('monthly','quarterly','annual')),
  subscription_status   TEXT DEFAULT 'free' CHECK (subscription_status IN ('free','active','past_due','canceled','incomplete')),
  stripe_subscription_id TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabela: `appointments`
```sql
CREATE TABLE appointments (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id     UUID REFERENCES family_profiles(id),
  caregiver_id  UUID REFERENCES caregiver_profiles(id),
  type          TEXT NOT NULL CHECK (type IN ('plantão','contínuo','turno')),
  -- Status padronizado em português — igual nos dois roles (família e cuidador)
  status        TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','ativo','finalizado','cancelado')),
  start_date    DATE NOT NULL,
  end_date      DATE,
  description   TEXT,
  family_notes  TEXT,        -- preferências da família sobre o idoso
  modality      TEXT,        -- ex: 'Presencial - Residência da família'
  observations  TEXT,
  total_amount  DECIMAL(10,2),
  cancelled_by  TEXT,
  cancel_reason TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

> **Mapeamento de labels (status já estão em português no banco):**
> - `pendente` → "Pendente"
> - `ativo` → "Ativo"
> - `finalizado` → "Finalizado"
> - `cancelado` → "Cancelado"

---

### Tabela: `care_routines`
```sql
CREATE TABLE care_routines (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id          UUID REFERENCES appointments(id) ON DELETE CASCADE,
  date                    DATE NOT NULL,
  shift                   TEXT NOT NULL CHECK (shift IN ('morning','afternoon','night')),
  care_types              TEXT[] NOT NULL DEFAULT '{}',  -- 'hygiene','medication','feeding',
                                                          -- 'mobility','appointments','monitoring','other'
  observations            TEXT,
  has_occurrence          BOOLEAN DEFAULT FALSE,
  occurrence_description  TEXT,
  recorded_at             TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabela: `messages`
```sql
CREATE TABLE messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES profiles(id),
  content         TEXT NOT NULL,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabela: `reviews`
```sql
CREATE TABLE reviews (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id  UUID REFERENCES appointments(id),
  family_id       UUID REFERENCES family_profiles(id),
  caregiver_id    UUID REFERENCES caregiver_profiles(id),
  family_name     TEXT,           -- desnormalizado para evitar joins na exibição
  family_photo    TEXT,           -- URL da foto do responsável
  rating          DECIMAL(2,1) NOT NULL CHECK (rating BETWEEN 1 AND 5),  -- permite 4.5
  comment         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, caregiver_id)   -- 1 review por par família/cuidador
);
```

---

### Tabela: `favorites`
```sql
CREATE TABLE favorites (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id     UUID REFERENCES family_profiles(id) ON DELETE CASCADE,
  caregiver_id  UUID REFERENCES caregiver_profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, caregiver_id)
);
```

---

### Tabela: `invoices`
```sql
CREATE TABLE invoices (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id                 UUID REFERENCES family_profiles(id),
  invoice_ref               TEXT,              -- ex: 'INV-2026-003'
  period                    TEXT,              -- ex: 'Março 2026'
  plan                      TEXT,              -- 'monthly' | 'quarterly' | 'annual'
  amount                    DECIMAL(10,2) NOT NULL,
  status                    TEXT DEFAULT 'pending' CHECK (status IN ('paid','pending','open','overdue')),
  stripe_invoice_id         TEXT,
  stripe_payment_intent_id  TEXT,
  due_date                  DATE,
  paid_at                   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabela: `support_tickets`
```sql
CREATE TABLE support_tickets (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
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
```

---

### Tabela: `system_logs`
```sql
CREATE TABLE system_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name   TEXT,
  user_role   TEXT CHECK (user_role IN ('admin','caregiver','family')),
  action      TEXT NOT NULL,
  details     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

> Logs são inseridos via triggers ou Edge Functions nos eventos relevantes (login, aprovação de cuidador, mudança de status de agendamento, etc.). Admin lê via RLS com service_role.

---

### Auto-criar profile após signup
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'role',                                              -- NULL para Google (role definido depois no onboarding)
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), -- Google envia como 'name'
    NEW.raw_user_meta_data->>'phone'
  );
  -- Só cria sub-perfil se role já foi definido (cadastro por email)
  -- Para Google, o sub-perfil é criado no onboarding após escolha do role
  IF NEW.raw_user_meta_data->>'role' = 'caregiver' THEN
    INSERT INTO public.caregiver_profiles (id) VALUES (NEW.id);
  ELSIF NEW.raw_user_meta_data->>'role' = 'family' THEN
    INSERT INTO public.family_profiles (id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Atualizar average_rating após novo review
```sql
CREATE OR REPLACE FUNCTION update_caregiver_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE caregiver_profiles
  SET 
    average_rating = (SELECT AVG(rating) FROM reviews WHERE caregiver_id = NEW.caregiver_id),
    review_count   = (SELECT COUNT(*) FROM reviews WHERE caregiver_id = NEW.caregiver_id)
  WHERE id = NEW.caregiver_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_inserted
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_caregiver_rating();
```

---

## Row Level Security (RLS)

```sql
-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: ver e editar próprio" ON profiles
  USING (auth.uid() = id);

-- caregiver_profiles: dono edita, público lê se verified+visible
ALTER TABLE caregiver_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "caregiver: dono edita" ON caregiver_profiles
  FOR ALL USING (auth.uid() = id);
CREATE POLICY "caregiver: público lê verificados" ON caregiver_profiles
  FOR SELECT USING (status = 'verified' AND is_visible = TRUE);

-- appointments: participantes do agendamento
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments: participantes" ON appointments
  USING (family_id = auth.uid() OR caregiver_id = auth.uid());

-- messages: participantes do agendamento
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages: participantes" ON messages
  USING (
    appointment_id IN (
      SELECT id FROM appointments
      WHERE family_id = auth.uid() OR caregiver_id = auth.uid()
    )
  );

-- reviews: família cria, todos leem
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews: família insere" ON reviews
  FOR INSERT WITH CHECK (family_id = auth.uid());
CREATE POLICY "reviews: todos leem" ON reviews
  FOR SELECT USING (TRUE);

-- favorites: família gerencia os seus
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites: família gerencia" ON favorites
  USING (family_id = auth.uid());

-- invoices: família vê as suas
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices: família vê" ON invoices
  FOR SELECT USING (family_id = auth.uid());
```

---

## ✅ Pré-requisitos — faça isso ANTES do Sprint 1.1

### 1. Banco de dados — rodar o SQL no Supabase
O arquivo `supabase_setup.sql` (na raiz do projeto) contém todo o schema pronto para colar.

**Como rodar:**
1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) → seu projeto
2. Vá em **SQL Editor** → **New query**
3. Cole o conteúdo inteiro do `supabase_setup.sql`
4. Clique em **Run**

O arquivo cria na ordem correta:
- Todas as tabelas (respeitando dependências de FK)
- Triggers (`handle_new_user`, `update_caregiver_rating`)
- RLS policies para cada tabela
- Storage buckets (`avatars` público, `documents` privado) com suas policies

### 2. Autenticação — habilitar no Supabase Dashboard
Em **Authentication → Providers**:
- ✅ Email — ativar "Confirm email"
- ✅ Google — inserir Client ID e Client Secret (obtidos no Google Cloud Console)

### 3. Variáveis de ambiente
Crie o arquivo `.env.local` na raiz do projeto:
```env
# Supabase (Dashboard > Settings > API)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Stripe (Dashboard > Developers > API Keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Apenas para Edge Functions (nunca expor no frontend)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_QUARTERLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Stripe — criar produtos antes do Sprint 6.1
Em [dashboard.stripe.com](https://dashboard.stripe.com) → **Products**:
- Criar produto "Cuidde — Plano Mensal" → preço R$127,00 recorrente/mês → copiar `price_id`
- Criar produto "Cuidde — Plano Trimestral" → preço R$297,00 recorrente/3 meses → copiar `price_id`
- Criar produto "Cuidde — Plano Anual" → preço R$997,00 recorrente/ano → copiar `price_id`

---

> **Regra de ouro:** Nova sessão do Claude Code = novo sprint. Contexto limpo sempre.

---

## Componentes compartilhados existentes (NÃO recriar)

Estes componentes já existem em `src/components/shared/` e são usados em várias páginas. O Claude Code deve **importá-los**, nunca recriá-los:

| Componente | Props principais |
|---|---|
| `AppSidebar` | `role="caregiver" \| "family" \| "admin"`, `userName`, `userPhoto` |
| `PageHeader` | `title`, `description`, `children` (botões de ação opcionais) |
| `StatusBadge` | `status` — renderiza badge colorido do status do agendamento |
| `StarRating` | `rating`, `size="sm" \| "lg"`, `showValue`, `className` |

> Antes de criar qualquer componente novo de UI, sempre verificar se já existe em `src/components/shared/` ou em `src/components/ui/` (shadcn).

---

## ⚠️ Correções obrigatórias — Mock → Backend

> **Contexto:** Auditoria cruzou o código-fonte do front-end (GitHub) com o schema SQL e encontrou inconsistências nos mocks que devem ser corrigidas ao conectar cada módulo ao backend. O Claude Code deve aplicar cada correção quando tocar no arquivo correspondente durante o sprint.

### C1 — Planos de assinatura: padronizar nomes

O `FamilyBilling.tsx` usa `monthly | quarterly | annual` (correto, alinhado com o banco).
Porém `mockAdminSubscriptions` e `mockAdminInvoices` no `mockData.ts` usam `match | essencial | daily` com preços diferentes.

**Correção:** ao conectar `Finance.tsx` (Sprint 7.1), usar os planos reais do banco:

| ID do plano | Label exibido | Preço |
|---|---|---|
| `monthly` | Mensal | R$ 127/mês |
| `quarterly` | Trimestral | R$ 297/trimestre |
| `annual` | Anual | R$ 997/ano |

Ignorar `planLabels` e `planValues` do mockData. Os labels devem ser derivados do `plan` real:
```typescript
const planLabels: Record<string, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  annual: 'Anual',
};
```

### C2 — Status de appointments da família: português

O `FamilyAppointments.tsx` usa `'active'` e `'finished'` (inglês) no mock local.
O banco e o `CaregiverAppointments.tsx` usam português: `'pendente' | 'ativo' | 'finalizado' | 'cancelado'`.

**Correção:** ao conectar `FamilyAppointments.tsx` e `FamilyAppointmentDetails.tsx` (Sprint 4.1), usar os status em português do banco. Atualizar também o `StatusBadge` se necessário para mapear esses valores.

### C3 — Status de assinatura: modelo freemium alinhado com Stripe

O schema original usava `active | trial | inactive | cancelled | expired`.
Após correção do banco (`supabase_corrections.sql`), os status reais são:

| Status | Significado |
|---|---|
| `free` | Acesso gratuito com limitações (padrão ao criar conta) |
| `active` | Plano pago ativo, pagamento em dia |
| `past_due` | Pagamento atrasado, assinatura ainda existe |
| `canceled` | Cancelada pelo usuário ou por inadimplência (volta para `free`) |
| `incomplete` | Checkout iniciado mas pagamento não finalizado |

**Regra de acesso no front:** `subscription_status === 'active'` → desbloqueia tudo.
Qualquer outro status → modo gratuito limitado:
- ✅ Pode: buscar cuidadores, ver cards resumidos
- ❌ Não pode: ver perfil completo, reviews, documentos, chat, favoritos, filtros avançados

**Correção:** ao conectar `FamilyBilling.tsx` (Sprint 6.1) e `Finance.tsx` (Sprint 7.1), usar esses status. Atualizar `planStatusLabels` em `FamilyBilling.tsx`:
```typescript
const planStatusLabels: Record<string, { label: string; className: string }> = {
  free: { label: 'Gratuito', className: 'bg-gray-100 text-gray-600' },
  active: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700' },
  past_due: { label: 'Pagamento atrasado', className: 'bg-amber-100 text-amber-700' },
  canceled: { label: 'Cancelado', className: 'bg-red-100 text-red-600' },
  incomplete: { label: 'Pendente', className: 'bg-gray-100 text-gray-600' },
};
```

### C4 — Status de invoices: adicionar 'overdue'

O `mockAdminInvoices` usa `'overdue'` mas o mock da família (`FamilyInvoices.tsx`) não tinha.
Após correção do banco, `invoices.status` aceita: `'paid' | 'pending' | 'open' | 'overdue'`.

**Correção:** ao conectar `FamilyInvoices.tsx` (Sprint 6.1) e `Finance.tsx` (Sprint 7.1), garantir que o `statusConfig` inclui `overdue`:
```typescript
const statusConfig = {
  paid: { label: 'Paga', className: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-700' },
  open: { label: 'Em aberto', className: 'bg-muted text-muted-foreground' },
  overdue: { label: 'Vencida', className: 'bg-red-50 text-red-700' },
};
```

### C5 — Remover card "Buscas na sua região" do CaregiverDashboard

O card 5 (`buscas_proximas_30d`) não tem coluna correspondente no banco e foi removido do escopo do MVP.

**Correção:** ao conectar `CaregiverDashboard.tsx` (Sprint 2.1 ou quando tocar no dashboard):
- Remover o card "Buscas na sua região" do layout
- Remover `buscas_proximas_30d` do objeto de métricas
- Manter os 4 cards restantes: Visualizações, Aparições nas buscas, Famílias interessadas, Weekly Tip

### C6 — Remover `comprovante_endereco` do fluxo de documentos

O `mockData.ts` e `DocumentChecklist.tsx` (admin) referenciam `'comprovante_endereco'`, mas esse tipo de documento não existe no CHECK do banco e foi removido do escopo.

**Correção:** ao conectar documentos (Sprint 2.2 e Sprint 7.1):
- Remover `'comprovante_endereco'` de `mockDocuments` no `mockData.ts`
- Remover a entrada `{ type: "comprovante_endereco", label: "Comprovante de Endereço" }` de `DocumentChecklist.tsx`
- Tipos válidos: `'rg_cnh' | 'curriculo' | 'certificacao' | 'antecedentes'` (cnpj removido — MEI fora do escopo)

### C7 — Campo `emergency_available` adicionado ao banco

A coluna `emergency_available` foi adicionada em `caregiver_profiles` via `supabase_corrections.sql`.

**Correção:** ao conectar `SearchCaregivers.tsx` (Sprint 3.1) e `CaregiverCard.tsx`:
- Mapear `caregiver.emergencyAvailable` (front) → `caregiver_profiles.emergency_available` (banco)
- O filtro "Disponibilidade emergencial" na busca deve filtrar por essa coluna
- Incluir em `src/types/database.ts` ao gerar os tipos

### C8 — Interface `Report` e `mockReports` — não usar

Existem no `mockData.ts` mas nenhuma página os importa. O módulo de segurança (admin) é apenas log do sistema, sem denúncias ou banimentos.

**Correção:** não criar tabela, não usar. Podem ser removidos do `mockData.ts` durante limpeza final.

---

#### Sprint 1.1 — Setup Supabase
```
Preciso configurar o Supabase no projeto Cuidde (React + Vite + TypeScript).

Tarefas:
1. Instalar @supabase/supabase-js
2. Criar src/lib/supabase.ts com o cliente (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
3. Criar src/types/database.ts com tipos TypeScript de TODAS as tabelas do SPEC.md
4. Criar .env.example com todas as variáveis necessárias
5. NÃO criar nenhuma lógica de autenticação ainda

Atenção: o projeto usa @tanstack/react-query v5.
```

✅ **Sprint 1.1 concluído quando:**
- `import { supabase } from "@/lib/supabase"` funciona sem erros
- `src/types/database.ts` tem tipos de todas as tabelas do schema
- `.env.example` documenta todas as variáveis necessárias

#### Sprint 1.2 — Autenticação
> 📖 **Referência obrigatória antes de implementar:** [Supabase Auth — Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
```
Preciso implementar autenticação no Cuidde usando Supabase Auth.
O onboarding atual (Onboarding.tsx) foi feito no Lovable mas NÃO foi implementado —
precisa ser conectado ao backend do zero.

Métodos de autenticação:
1. Email + senha com confirmação obrigatória por email
2. Google OAuth (Gmail) — email já verificado pelo Google, sem confirmação adicional

Tarefas:

1. Habilitar no Supabase Dashboard:
   - Email Auth com "Confirm email" ativado
   - Google OAuth Provider (Client ID + Secret do Google Cloud Console)

2. Criar src/lib/auth.ts com funções:
   - signUpWithEmail(email, password, metadata: { role, full_name, phone })
     → Supabase envia email de confirmação automaticamente
   - signInWithEmail(email, password)
   - signInWithGoogle()
     → usar supabase.auth.signInWithOAuth({ provider: 'google' })
   - signOut()
   - getSession()

3. Criar src/contexts/AuthContext.tsx:
   - Escutar supabase.auth.onAuthStateChange
   - Expor: user, session, role, isLoading

4. Criar src/components/ProtectedRoute.tsx:
   - Se não autenticado: redirecionar para /login
   - Se autenticado mas email não confirmado: redirecionar para /verify-email
   - Se autenticado: redirecionar por role (caregiver → /caregiver, family → /family, admin → /admin)
   - Preservar query params no redirect (ex: ?cep=01310100)

5. Criar src/pages/auth/Login.tsx (nova página — não existe):
   - Input email + senha
   - Botão "Entrar com Google" (Google OAuth)
   - Link para cadastro (/onboarding)
   - Link "esqueci a senha"

6. Criar src/pages/auth/VerifyEmail.tsx (nova página):
   - Mensagem: "Enviamos um link para [email]. Clique nele para ativar sua conta."
   - Botão reenviar email de confirmação
   - Supabase Auth trata a confirmação automaticamente via URL callback

7. Conectar Onboarding.tsx:
   - Step final: chamar signUpWithEmail com role, full_name, phone, cep, etc.
   - Após signup: redirecionar para /verify-email (não para /caregiver ou /family ainda)
   - Para Google: chamar signInWithGoogle() — após callback, criar profile se não existir

8. Adicionar rota /login e /verify-email em App.tsx

9. Landing page (Index.tsx) — campo de CEP:
   - Input de CEP já existe no mock
   - Ao submeter: se logado → redirecionar para /family/search?cep={cep}
   - Se não logado → redirecionar para /login?redirect=/family/search&cep={cep}
   - Após login: ProtectedRoute lê os params e completa o redirect

Usar react-hook-form + zod para validações (já instalados).
TanStack Query v5 para mutations.
```

⚠️ Fluxo Google OAuth — comportamento especial:
- Cadastro Google: usuário é criado com role=NULL no profiles.
  O AuthCallback verifica se profile.role existe:
  - Se tem role → redireciona para dashboard (é login de usuário existente)
  - Se não tem role → redireciona para /onboarding?from=google (é cadastro novo)
  O onboarding Google pula o step de email/senha e preenche nome automaticamente.
  Ao finalizar, o onboarding faz UPDATE no profiles com role + dados de endereço.
- Login Google: mesmo signInWithGoogle() para ambos os casos.
  A diferença é tratada no AuthCallback pela presença ou ausência de role.

✅ **Sprint 1.2 concluído quando:**
- Cadastro com email/senha redireciona para `/verify-email`
- Login com Google redireciona para `/caregiver` ou `/family` conforme role
- Rota protegida sem login redireciona para `/login`
- CEP digitado na landing page é preservado na URL após login

---

### FASE 2 — Perfil do Cuidador (Semana 2)

#### Sprint 2.1 — Dados do Perfil ✅ CONCLUÍDO

**Arquivos entregues:**
- `src/hooks/useCaregiverProfile.ts` — hook centralizado com todas as queries e mutations
- `src/pages/caregiver/CaregiverProfile.tsx` — reescrito (4 steps conectados ao Supabase)
- `src/pages/caregiver/CaregiverAvailability.tsx` — reescrito
- `src/pages/caregiver/CaregiverPricing.tsx` — reescrito
- `src/components/shared/Stepper.tsx` — prop `onStepClick` adicionada (steps clicáveis)
- `supabase_sprint21.sql` — colunas novas em `caregiver_profiles` (já aplicado)

**Decisões tomadas:**
- `CaregiverVisibility.tsx` removida do escopo (rota `/caregiver/visibility` desativada)
- Disponibilidade armazenada em `caregiver_profiles` (não em `caregiver_availability`) — ver nota de inconsistência acima
- Idioma "Outro" é normalizado: salva o texto real no banco, reconstrói estado correto no load
- Mutations de bio/especialidades usam `.select('id')` para detectar falha silenciosa de RLS

✅ **Sprint 2.1 concluído — verificado em produção:**
- Dados do perfil salvos no Supabase persistem após refresh
- Foto de perfil carregada do Storage bucket `avatars`
- Colunas novas (`complement`, `journey_types`, `area_type`, `area_radius`, `availability_notes`, `is_available_for_new`, `pricing_note`) confirmadas no banco

#### Sprint 2.2 — Documentos ✅ CONCLUÍDO

**Arquivos entregues:**
- `src/hooks/useCaregiverDocuments.ts` — `useDocuments`, `useUploadDocument`, `useRemoveDocument`, `useToggleDocumentVisibility`, `useUpdateProfessionalReg`
- `src/pages/caregiver/CaregiverDocuments.tsx` — reescrito (dados reais)
- `src/components/shared/DocumentUpload.tsx` — atualizado para `CaregiverDocument` + prop `label`
- `src/types/database.ts` — `rejection_reason` adicionado a `CaregiverDocument`; `cnpj` removido de `DocumentType`
- `supabase_sprint22_pre.sql` — constraint, RLS, Storage policies (deve ser rodado antes de testar)

**Decisões tomadas:**
- `file_url` armazena o path do Storage (ex: `{uid}/rg_cnh.pdf`), não URL pública — signed URL gerada no Sprint da família
- 4 slots de documentos fixos derivados de `DOC_DEFINITIONS`; slots sem registro exibem `status: 'pending'`
- Upsert usa `UNIQUE(caregiver_id, type)` — reenvio sobrescreve o arquivo no Storage e o registro no banco
- Visibilidade desabilitada para slots ainda não enviados (sem `id` real no banco)
- Viewer de documentos para família (signed URL + iframe) → escopo do Sprint 3.x

✅ **Sprint 2.2 concluído — verificado em produção:**
- Upload de documento aparece no Supabase Storage bucket `documents`
- Status do documento muda para `sent` após upload
- Barra de progresso reflete documentos reais (não mock)

---

### FASE 3 — Busca e Marketplace (Semana 2-3)

#### Sprint 3.1 — Busca de Cuidadores ✅ CONCLUÍDO

**Arquivos entregues:**
- `src/hooks/useSearchCaregivers.ts` — query com filtros (nome, bairro, cidade, especialidades, preço, avaliação, emergência)
- `src/hooks/useFamilyMatches.ts` — cuidadores cuja `specialties` tem interseção com `elderly_conditions` da família
- `src/hooks/useFavorites.ts` — `useFavorites`, `useAddFavorite`, `useRemoveFavorite`
- `src/hooks/useFamilyProfile.ts` — leitura do perfil da família logada
- `src/components/shared/CaregiverCard.tsx` — atualizado para `CaregiverPublic` (tipo DB)
- `src/types/database.ts` — `CaregiverPublic` adicionado
- `src/pages/family/SearchCaregivers.tsx` — conectado ao Supabase
- `src/pages/family/Favorites.tsx` — conectado ao Supabase
- `src/pages/family/FamilyDashboard.tsx` — conectado ao Supabase
- `supabase_sprint31.sql` — RLS policies para profiles, family_profiles, favorites

**Decisões tomadas:**
- Filtro de proximidade por km removido do MVP (ViaCEP não fornece lat/lng)
  → Substituído por filtros de **cidade** e **bairro** (ilike no banco)
  → Geocodificação registrada como sprint futuro
- `CaregiverPublic` é um tipo flat (JOIN de `caregiver_profiles` + `profiles.full_name`)
- `FamilyMatches.tsx` permanece mock — escopo real é Sprint 4.1 (agendamentos)
- `useFamilyMatches` alimenta o card "Cuidadores recomendados" no FamilyDashboard

✅ **Sprint 3.1 concluído quando:**
- Busca retorna apenas cuidadores com `status='verified'` e `is_visible=true`
- Filtros de especialidade, cidade e bairro funcionam e reduzem resultados
- Favoritar/desfavoritar persiste no banco após refresh

---

#### Sprint 3.x (futuro) — Geocodificação e Filtro por Proximidade (km)
```
Registrado como sprint futuro. ViaCEP não retorna coordenadas geográficas.

Opções para implementar no futuro:
1. Google Maps Geocoding API — converte CEP → lat/lng (pago)
2. OpenCage / Nominatim (OpenStreetMap) — gratuito com limites de taxa
3. Tabela local de CEPs com coordenadas (grandes cidades brasileiras)

Ao implementar:
- Armazenar lat/lng em caregiver_profiles e family_profiles (colunas: lat DECIMAL(9,6), lng DECIMAL(9,6))
- Usar fórmula de Haversine para calcular distância no Supabase (função SQL)
- Substituir filtros de cidade/bairro pelo filtro de raio (km) no SearchCaregivers.tsx
```

---

### FASE 4 — Agendamentos e Chat (Semana 3)

#### Sprint 4.1 — Agendamentos
```
Preciso implementar o sistema de agendamentos.

Arquivos afetados:
- src/pages/caregiver/CaregiverAppointments.tsx (tabs: ativos/finalizados/pendentes)
- src/pages/caregiver/AppointmentDetails.tsx
- src/pages/caregiver/CareRoutine.tsx
- src/pages/family/FamilyAppointments.tsx
- src/pages/family/FamilyAppointmentDetails.tsx

Tarefas:
1. Criar src/hooks/useAppointments.ts:
   - query: listar por role (caregiver_id ou family_id) e status
   - query: buscar detalhe por ID
   - mutation: família cria agendamento (status: pendente)
   - mutation: cuidador aceita → status: ativo
   - mutation: cuidador recusa → status: cancelado (com motivo)
   - mutation: finalizar → status: finalizado

2. Criar src/hooks/useCareRoutine.ts:
   - query: listar atividades do agendamento
   - mutation: adicionar atividade
   - mutation: marcar atividade como concluída
   - Guard: só editável se appointment.status === 'ativo'

3. Substituir mockAppointments locais por dados reais em todas as páginas

Tipos reais: plantão | contínuo | turno
Status reais: pendente | ativo | finalizado | cancelado
```

✅ **Sprint 4.1 concluído quando:**
- Família cria agendamento e ele aparece para o cuidador com status `pendente`
- Cuidador aceita e status muda para `ativo` para os dois lados
- Registro de rotina de cuidado salva no banco e aparece no histórico

#### Sprint 4.2 — Chat
> 📖 **Referência obrigatória antes de implementar:** [Supabase Realtime — Subscribing to Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)
```
Preciso implementar chat em tempo real com Supabase Realtime.

Arquivo afetado: src/pages/chat/AppointmentChat.tsx

Tarefas:
1. Criar src/hooks/useChat.ts:
   - query: buscar histórico de mensagens por appointment_id
   - mutation: enviar mensagem (INSERT em messages)
   - realtime: subscribar ao canal do Supabase para novas mensagens
     (usar supabase.channel('messages').on('INSERT', callback).subscribe())
   - mutation: marcar mensagens como lidas (read_at)

2. Conectar AppointmentChat.tsx com hook real
3. Identificar sender pelo auth.uid() — mostrar mensagens próprias à direita

Docs Supabase Realtime: https://supabase.com/docs/guides/realtime/postgres-changes
```

✅ **Sprint 4.2 concluído quando:**
- Mensagem enviada aparece na tela sem precisar de refresh (Realtime funcionando)
- Mensagens do remetente aparecem à direita, do destinatário à esquerda
- Histórico de mensagens anteriores carrega ao abrir o chat

---

### FASE 5 — Reviews (Semana 4)

#### Sprint 5.1 — Reviews
```
Preciso implementar avaliações dos cuidadores.

Arquivos afetados:
- src/pages/caregiver/CaregiverReviews.tsx
- src/pages/family/FamilyAppointmentDetails.tsx (formulário de avaliação)

Tarefas:
1. Criar src/hooks/useReviews.ts:
   - query: listar reviews de um cuidador (por caregiver_id)
   - mutation: família submete review
     - Só permitido se appointment.status === 'finalizado'
     - Verificar constraint UNIQUE(family_id, caregiver_id)
   - O trigger SQL atualiza average_rating automaticamente após INSERT

2. CaregiverReviews.tsx: exibir reviews reais com nota e comentário
3. Após agendamento finalizado em FamilyAppointmentDetails: 
   mostrar formulário de avaliação (1-5 estrelas + comentário)
```

✅ **Sprint 5.1 concluído quando:**
- Review submetido aparece em `CaregiverReviews.tsx` com nome e foto da família
- `average_rating` do cuidador atualiza automaticamente após review (trigger SQL)
- Formulário de avaliação não aparece se agendamento não estiver `finalizado`

---

### FASE 6 — Pagamentos Stripe (Semana 4)

#### Sprint 6.1 — Assinaturas da Família
> 📖 **Referência obrigatória antes de implementar:** [Stripe — Webhooks](https://stripe.com/docs/webhooks)
```
Preciso implementar assinaturas Stripe para famílias.

Arquivos afetados:
- src/pages/family/FamilyBilling.tsx
- src/pages/family/FamilyInvoices.tsx
- src/pages/family/FamilyInvoiceDetails.tsx

Planos reais (3 planos pagos — sem plano gratuito):
- monthly:    R$ 127/mês
- quarterly:  R$ 297/trimestre (equivale a R$ 99/mês)
- annual:     R$ 997/ano (equivale a R$ 83/mês)

ATENÇÃO: a plataforma NÃO processa pagamento do serviço do cuidador.
Apenas a assinatura de uso da plataforma é cobrada via Stripe.
O pagamento ao cuidador é combinado diretamente entre família e profissional.

Tarefas:
1. Instalar @stripe/stripe-js

2. Criar Supabase Edge Function: supabase/functions/create-checkout/index.ts
   - Recebe: family_id, price_id (ID do produto no Stripe Dashboard)
   - Cria/recupera Stripe Customer (salva stripe_customer_id em family_profiles)
   - Cria Stripe Checkout Session para subscription
   - Retorna: { url: checkoutUrl }

3. Criar Supabase Edge Function: supabase/functions/stripe-webhook/index.ts
   - Eventos a tratar:
     * customer.subscription.created → subscription_status = 'active', salva plan
     * customer.subscription.updated → atualiza plan + subscription_status
     * customer.subscription.deleted → subscription_status = 'canceled'
       (no front, tratar canceled como free — família volta ao acesso limitado)
     * invoice.paid → cria/atualiza registro em invoices (status = 'paid') + subscription_status = 'active'
     * invoice.payment_failed → subscription_status = 'past_due' + invoice status = 'overdue'
     * checkout.session.expired → subscription_status = 'incomplete'
   - Status válidos de subscription: free | active | past_due | canceled | incomplete
   - Status válidos de invoice: paid | pending | open | overdue
   - Família começa com subscription_status = 'free' (default do banco)
   - SEMPRE usar stripe-webhook-secret para validar assinatura
   - Ver correção C3 e C4 na seção "Correções obrigatórias" acima

4. Criar src/hooks/useSubscription.ts:
   - query: buscar plano atual da família logada
   - mutation: iniciar checkout (chama Edge Function)
   - mutation: cancelar assinatura

5. Criar src/hooks/useInvoices.ts:
   - query: listar faturas (invoices) da família logada
   - query: buscar fatura por ID

6. Conectar FamilyBilling, FamilyInvoices, FamilyInvoiceDetails com dados reais

REGRA: Stripe Webhook é a fonte de verdade. Nunca atualizar plan diretamente pelo cliente.
```

✅ **Sprint 6.1 concluído quando:**
- Clicar em "Assinar" abre o Stripe Checkout (página real do Stripe)
- Após pagamento, `family_profiles.plan` e `subscription_status` atualizam via webhook
- Faturas aparecem em `FamilyInvoices.tsx` com dados reais do Stripe

---

### FASE 7 — Admin (Semana 5)

#### Sprint 7.1 — Aprovações e Admin
```
Preciso implementar o painel admin com dados reais.

Arquivos afetados:
- src/pages/admin/AdminDashboard.tsx
- src/pages/admin/ApprovalQueue.tsx
- src/pages/admin/Finance.tsx

Tarefas:
1. Criar Supabase Edge Function: supabase/functions/admin-actions/index.ts
   - Usa SUPABASE_SERVICE_ROLE_KEY para bypass do RLS
   - Ações: aprovar cuidador, reprovar cuidador, buscar todos os usuários, métricas

2. Criar src/hooks/useAdmin.ts:
   - query: listar cuidadores por status (para ApprovalQueue)
   - query: buscar documentos de um cuidador
   - mutation: aprovar → status: 'verified'
   - mutation: reprovar → status: 'rejected' + rejection_reason
   - query: métricas gerais (total users, verified, active subscriptions)
   - query: todas as invoices com filtros (para Finance.tsx)
   - query: todas as subscriptions com filtros

3. ApprovalQueue.tsx: substituir setCaregivers local pelo hook real
4. Finance.tsx: substituir mockAdminSubscriptions/mockAdminInvoices por dados reais
   (buscar de family_profiles JOIN invoices)

ATENÇÃO: Rotas /admin/* precisam verificar role='admin' via ProtectedRoute.
Admin NUNCA expõe service_role_key no cliente — sempre via Edge Function.
```

✅ **Sprint 7.1 concluído quando:**
- Aprovação de cuidador muda `status` para `verified` e ele aparece na busca
- Rejeição exige motivo e bloqueia o cuidador de aparecer na busca
- Usuário sem role `admin` é redirecionado ao tentar acessar `/admin/*`

#### Sprint 7.2 — Suporte e Logs
```
Preciso implementar o módulo de suporte e logs do sistema.

Arquivos afetados:
- src/pages/caregiver/CaregiverSupport.tsx
- src/pages/family/FamilySupport.tsx
- src/pages/admin/Security.tsx

Tarefas:
1. Criar src/hooks/useSupport.ts:
   - mutation: enviar ticket (INSERT em support_tickets)
     campos: subject (enum), message (máx 600 chars)
   - query: listar tickets do usuário logado com status

2. Conectar CaregiverSupport.tsx e FamilySupport.tsx:
   - Substituir handleSubmit mock por mutation real
   - Substituir mockRequests por query real de tickets do usuário

3. Criar helper para inserir system_logs nos eventos principais:
   - Login/logout
   - Aprovação/reprovação de cuidador
   - Mudança de status de agendamento
   - Envio de documentos

4. Security.tsx: substituir mockSystemLogs por query real
   (requer Edge Function com service_role para leitura sem RLS)
```

✅ **Sprint 7.2 concluído quando:**
- Ticket de suporte enviado aparece no histórico com status `enviado`
- Logs de sistema exibem eventos reais (aprovações, logins, mudanças de status)
- Busca de logs por texto funciona na página de Segurança

```typescript
// Adicionar ao App.tsx:
import Login from "./pages/auth/Login";
import VerifyEmail from "./pages/auth/VerifyEmail";

// Dentro de <Routes>:
<Route path="/login" element={<Login />} />
<Route path="/verify-email" element={<VerifyEmail />} />

// Todas as rotas /caregiver/*, /family/*, /admin/* devem ser
// envolvidas em <ProtectedRoute role="caregiver|family|admin">
```

---

```
src/
├── lib/
│   ├── supabase.ts
│   ├── auth.ts             ← signUp, signIn, signInWithGoogle, signOut
│   ├── stripe.ts
│   └── viacep.ts           ← helper para auto-fill de CEP
├── types/
│   └── database.ts         ← tipos gerados do Supabase
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useCaregiverProfile.ts
│   ├── useCaregiverDocuments.ts
│   ├── useFamilyProfile.ts
│   ├── useSearchCaregivers.ts
│   ├── useFamilyMatches.ts
│   ├── useFavorites.ts
│   ├── useAppointments.ts
│   ├── useCareRoutine.ts
│   ├── useChat.ts
│   ├── useReviews.ts
│   ├── useSubscription.ts
│   ├── useInvoices.ts
│   └── useAdmin.ts
├── components/
│   └── ProtectedRoute.tsx
└── pages/
    ├── auth/               ← NOVO — não existia no Lovable
    │   ├── Login.tsx       ← email/senha + botão "Entrar com Google"
    │   └── VerifyEmail.tsx ← tela pós-cadastro com email/senha
    └── [demais já existentes e mockados]

supabase/
├── migrations/
│   ├── 001_create_tables.sql
│   ├── 002_rls_policies.sql
│   └── 003_triggers.sql
└── functions/
    ├── create-checkout/
    ├── stripe-webhook/
    └── admin-actions/
```

---

## Variáveis de Ambiente

```env
# .env.local — nunca commitar
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=

# Apenas em Supabase Edge Functions (secrets — nunca no cliente)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_MONTHLY=
STRIPE_PRICE_ID_QUARTERLY=
STRIPE_PRICE_ID_ANNUAL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Comandos Claude Code — Templates de Prompt

### /research — Antes de cada sprint
```
Preciso que você pesquise a codebase antes de implementar o Sprint X.X do SPEC.md.

1. Leia os arquivos afetados listados no sprint
2. Identifique onde os dados estão mockados (busque por mockData, mockCaregivers, etc.)
3. Identifique os patterns de estado e componentes já em uso
4. Verifique se já existe algum hook relacionado em src/hooks/
5. Liste quais imports precisarão mudar

Não implemente nada ainda. Apenas produza um resumo da sua pesquisa.
```

### /plan — Após a pesquisa
```
Com base na pesquisa feita e no Sprint X.X do SPEC.md, crie um plano de implementação.

Liste:
- Arquivos novos a criar (com path completo)
- Arquivos existentes a modificar (com as mudanças específicas)
- Ordem de execução

Aguarde minha aprovação antes de implementar qualquer coisa.
```

### /implement — Após aprovação do plano
```
Execute o plano aprovado para o Sprint X.X.

Regras:
- Implemente um arquivo por vez
- Use os padrões já existentes no projeto (não reinvente)
- TanStack Query v5: usar { queryKey, queryFn } e useMutation({ mutationFn })
- Não remova nenhum dado mockado sem antes confirmar que o real está funcionando
- Após cada arquivo, mostre o que foi feito e aguarde confirmação para continuar
```
