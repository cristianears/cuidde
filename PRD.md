# PRD.md — Cuidde: Marketplace de Cuidadores de Idosos

> **Metodologia:** Spec-Driven Development (SDD) — workflow Anti-Vibe Coding  
> **Fase atual:** Backend — conectar front-end mockado ao Supabase + Stripe  
> **Stack Frontend:** React + Vite + TypeScript + TailwindCSS + shadcn/ui + TanStack Query v5  
> **Stack Backend:** Supabase (Auth + PostgreSQL + Storage + Realtime) + Stripe

---

## 1. Visão Geral do Produto

### O que é a Cuidde
Marketplace que conecta **cuidadores de idosos** (técnicos de enfermagem, auxiliares, fisioterapeutas, terapeutas ocupacionais, cuidadores formados) com **famílias** que precisam de cuidado para um idoso.

A plataforma gerencia o ciclo completo: cadastro com verificação de documentos, busca com filtros geográficos, matching por condições de saúde, agendamentos (plantão / contínuo / turno), chat em tempo real, registro de rotina de cuidado, pagamento e avaliação.

### Naming do projeto (conforme código real)
- Prestador = **Caregiver** (cuidador)
- Cliente = **Family** (família)
- Paciente = idoso vinculado à família (`elderlyInfo`)

### ⚠️ Correção crítica de modelo de negócio
A monetização é **assinatura da família**, com 3 planos pagos (sem plano gratuito na plataforma):
- **Mensal** — R$ 127/mês
- **Trimestral** — R$ 297 (R$ 99/mês) — destaque "Melhor custo-benefício"
- **Anual** — R$ 997 (R$ 83/mês)

> Observação: a família pode estar `inactive` antes de assinar qualquer plano (funciona como freemium implícito — acesso só após assinar). Status possíveis: `active` | `trial` | `inactive`.

O cuidador acessa a plataforma gratuitamente. A família paga para acessar perfis completos, documentos, reviews e chat com cuidadores.

**O que o plano da família desbloqueia** (extraído de `FamilyBilling.tsx`):
- Visualização completa de perfis
- Reviews de outras famílias
- Acesso a documentos do profissional
- Contato direto ilimitado via chat
- Filtros avançados por região e disponibilidade
- Favoritar perfis

> **Regra importante** (texto explícito no código): "A contratação, negociação e pagamento do cuidador são combinados diretamente entre família e profissional." — a plataforma **não** processa pagamento do serviço, apenas da assinatura.

---

## 2. Usuários e Papéis

### 2.1 Caregiver (Cuidador) — Rotas `/caregiver/*`

| Módulo | Rota | O que o backend precisa entregar |
|--------|------|----------------------------------|
| Dashboard | `/caregiver` | Métricas reais: visualizações 30d, aparições em busca, famílias interessadas, status de aprovação, progresso de perfil (6 critérios), próximos agendamentos, weekly tip |
| Perfil | `/caregiver/profile` | CRUD 4 etapas: dados básicos + endereço, bio, especialidades/modalidades/idiomas/formação/CNH, referências profissionais. Upload de foto (Storage). CEP → auto-fill ViaCEP |
| Documentos | `/caregiver/documents` | Upload: RG/CNH (obrigatório), CNPJ se MEI, currículo, certificações, antecedentes criminais. Registro profissional (COREN/CREFITO/outros). Controle de visibilidade por documento |
| Disponibilidade | `/caregiver/availability` | Configuração de dias/horários disponíveis por semana |
| Preços | `/caregiver/pricing` | Valores por tipo de atendimento (hora, diária, plantão) |
| Visibilidade | `/caregiver/visibility` | Toggle on/off no marketplace. Checklist de critérios de visibilidade |
| Agendamentos | `/caregiver/appointments` | Lista por tabs: ativos / finalizados / pendentes. Tipos: plantão, contínuo, turno |
| Detalhe | `/caregiver/appointments/:id` | Dados completos + ações (aceitar/recusar/finalizar) |
| Rotina | `/caregiver/appointments/:id/care-routine` | Registro de atividades durante atendimento ativo |
| Suporte | `/caregiver/support` | Canal de suporte |

**Status de aprovação do cuidador** (4 estados reais do código):
```
pending → analyzing → verified
                    → rejected
```

**Progresso de perfil** — 6 critérios calculados em `getProfileCompleteness()`:
1. Tem foto
2. Bio ≥ 150 caracteres
3. Especialidades ≥ 1
4. Modalidades ≥ 1
5. Certificação aprovada ou enviada
6. Referências ≥ 1

---

### 2.2 Family (Família) — Rotas `/family/*`

| Módulo | Rota | O que o backend precisa entregar |
|--------|------|----------------------------------|
| Dashboard | `/family` | Favoritos, solicitações ativas, total cuidadores disponíveis, cuidadores recomendados (com distância real), perfil do idoso |
| Perfil | `/family/profile` | Dados da família + `elderlyInfo`: nome, idade, condições de saúde (array), necessidades de cuidado (texto) |
| Billing | `/family/billing` | Plano ativo, método de pagamento salvo (Stripe), histórico |
| Busca | `/family/search` | Filtros: texto (nome/bairro/cidade), especialidades, proximidade (3/5/10/20 km), faixa de preço (slider), avaliação mínima, disponibilidade emergencial. Apenas `status: verified` e `is_visible: true` |
| Matches | `/family/matches` | Cuidadores sugeridos: `caregiver.specialties` × `elderlyInfo.healthConditions` |
| Perfil Cuidador | `/family/caregiver/:id` | Perfil público detalhado: bio, formação complementar, especialidades, modalidades, idiomas, selos de verificação, registro profissional, disponibilidade (jornadas + área), valores, documentos visíveis (view-only, sem download), referências profissionais (com mascaramento configurável), avaliações. Requer `subscription_status = 'active'` para documentos e referências |
| Favoritos | `/family/favorites` | Adicionar/remover favoritos |
| Agendamentos | `/family/appointments` | Lista de agendamentos da família |
| Detalhe | `/family/appointments/:id` | Detalhes + ações + acesso ao chat |
| Faturas | `/family/invoices` | Histórico de faturas com filtros |
| Detalhe Fatura | `/family/invoices/:id` | Fatura individual com download de recibo |
| Suporte | `/family/support` | Canal de suporte |

---

### 2.3 Admin — Rotas `/admin/*`

| Módulo | Rota | O que o backend precisa entregar |
|--------|------|----------------------------------|
| Dashboard | `/admin` | Métricas gerais da plataforma |
| Aprovações | `/admin/approvals` | Lista por tab (pending/analyzing/verified/rejected), painel lateral com perfil completo + documentos, ações: aprovar → `verified`, reprovar com motivo → `rejected` |
| Financeiro | `/admin/finance` | Métricas (receita mensal, assinaturas ativas, ticket médio, faturas do mês). Listagem de assinaturas com filtros (busca, plano, status). Listagem de faturas com filtros (busca, plano, status, período). Download de recibo |
| Segurança | `/admin/security` | **Log do sistema** — listagem de eventos por role (admin/cuidador/família), busca por texto. NÃO tem denúncias ou banimentos — apenas registro de atividades (`mockSystemLogs`) |

---

### 2.4 Shared

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Chat | `/chat/:id` | Chat em tempo real, vinculado a `appointment_id` |
| Onboarding | `/onboarding` | **A implementar do zero.** Fluxo: (1) escolha de role → (2) dados pessoais + senha forte → (3) endereço via CEP → (4) informações adicionais → (5) confirmação. Auth via email (comum ou Gmail OAuth). |
| Home | `/` | Landing page pública com campo de busca por CEP |

---

### Autenticação — Detalhes importantes

#### Métodos de login suportados
1. **Email + senha** — cadastro comum com confirmação obrigatória por email
2. **Gmail (Google OAuth)** — login social via Google

#### Fluxo de confirmação de email (ambos os métodos)
- Após cadastro com email/senha: Supabase envia email automático com link de confirmação
- Usuário **deve clicar no link** recebido para ativar a conta
- Sem confirmação: conta criada mas acesso bloqueado (`email_confirmed_at` null)
- Para Gmail: email já é considerado verificado pelo Google — não exige confirmação adicional
- Supabase Auth gerencia ambos os fluxos nativamente

#### Landing page — Busca por CEP sem login
- Campo de CEP na home (`/`) disponível para qualquer visitante
- Ao submeter o CEP → redireciona para `/family/search?cep=XXXXX`
- Se não estiver logado → exibe modal/página de login antes de mostrar resultados
- Fluxo pós-login: retorna para a busca com o CEP já preenchido (preservar `?cep=` na URL)

---

## 3. Campos por Entidade (mapeados do código real)

### Caregiver Profile
```typescript
// Dados pessoais
name, email, phone, whatsapp, photo_url

// Endereço
cep, street, number, neighborhood, city, state

// Profissional
bio, specialties: string[], modalities: string[], 
idiomas: string[], yearsExperience: number,
profissaoFormacao: 'cuidador' | 'tecnico_enfermagem' | 'auxiliar_enfermagem' 
                 | 'enfermeiro' | 'fisioterapeuta' | 'terapeuta_ocupacional' | 'outro',
formacaoComplementar: string

// CNH
possuiCNH: boolean, categoriaCNH: 'A' | 'B' | 'AB' | 'C' | 'D' | 'E' | ''

// Seguro e status
hasInsurance: boolean, status: 'pending' | 'analyzing' | 'verified' | 'rejected'
is_visible: boolean

// Preços
pricePerHour: number, pricePerDay: number

// Registro profissional
professionalRegType: 'coren' | 'crefito' | 'outros' | ''
registrationNumber, registrationUF, otherRegistrationDesc

// Visibilidade de referências
showReferencesToSubscribers: boolean
maskReferencePhones: boolean  
showReferenceFullNames: boolean
```

### Professional Reference
```typescript
{ id, caregiverId, name, phone, workplace, position, workDuration, notes }
```

### Document (tipos reais)
```typescript
type: 'rg_cnh' | 'cnpj' | 'curriculo' | 'certificacao' | 'antecedentes'
status: 'pending' | 'sent' | 'approved' | 'rejected'
// Visibilidade individual por documento:
showCurriculo, showCertificacoes, showAntecedentes: boolean
```

### Appointment — status padronizado (em português, igual nos dois roles)
```typescript
status: 'pendente' | 'ativo' | 'finalizado' | 'cancelado'
```
> `FamilyAppointments.tsx` usava `'active'/'finished'` no mock — inconsistência a corrigir. O backend usa sempre português para appointments.
> Nota: status de `caregiver_profiles` (`pending/analyzing/verified/rejected`), `caregiver_documents` (`pending/sent/approved/rejected`), `invoices` (`paid/pending/open`) e `subscription_status` (`active/trial/inactive/cancelled/expired`) permanecem em inglês — são termos técnicos ligados ao Stripe e ao fluxo de aprovação, sem equivalência no front.

### Care Routine (campos reais do CareRoutine.tsx)
```typescript
date: Date
shift: 'morning' | 'afternoon' | 'night'   // manhã 06h-12h, tarde 12h-18h, noite 18h-06h
careTypes: string[]   // 'hygiene' | 'medication' | 'feeding' | 'mobility' 
                      // | 'appointments' | 'monitoring' | 'other'
observations: string
hasOccurrence: boolean
occurrenceDescription: string
```

### Family + ElderlyInfo
```typescript
// Responsável (família)
responsibleName, responsibleEmail, responsiblePhone
relationship: string   // ex: 'filho', 'filha', 'cônjuge'
responsiblePhoto: string | null
address: { cep, street, number, neighborhood, city, state }

// Idoso
elderlyName, elderlyAge: number
healthConditions: string[]  // 'Alzheimer' | 'Parkinson' | 'Acamado' | 'Mobilidade reduzida' 
                             // | 'Demência' | 'Pós-operatório' | 'AVC' | 'Diabetes' 
                             // | 'Hipertensão' | 'Outros'
bloodType: string
preExistingConditions: string   // texto livre
allergies: string               // texto livre
continuousMedications: string   // texto livre
responsibleDoctor: string
healthInsurance: string
careNeeds: string               // texto livre

// Preferências de contratação
serviceFormats: string[]   // 'plantoes' | 'diarias' | 'turnos' | 'cobertura'
hourlyRange: [min, max]    // faixa de preço/hora desejada
dailyRange: [min, max]     // faixa de preço/diária desejada
distancePreference: string // ex: '10km'
```

### Suporte — detalhes reais (CaregiverSupport.tsx)
O módulo de suporte tem:
- **FAQ** com 6 perguntas frequentes (estáticas, não precisam de backend)
- **Formulário de contato** com: assunto (select) + mensagem (textarea, máx. 600 chars)
- **Assuntos disponíveis:** conta, documentos, atendimentos, avaliações, visibilidade, sugestões, outro
- **Histórico de solicitações** com status: `enviado` | `em_analise` | `respondido`
- Mesmo padrão para `FamilySupport.tsx`

> Isso implica uma tabela `support_tickets` no backend.

### System Logs (campos de Security.tsx — `mockSystemLogs`)
```typescript
{
  id: string
  action: string       // ex: 'Login realizado', 'Perfil atualizado'
  userRole: 'admin' | 'caregiver' | 'family'
  userName: string
  details: string
  timestamp: string
}
```

> Módulo de segurança é apenas **log do sistema** — não há denúncias ou banimentos no front atual.

### Reviews (campos reais de CaregiverReviews.tsx + mockReviews)
```typescript
{
  id: string
  caregiverId: string
  familyName: string
  familyPhoto: string    // URL da foto do responsável
  rating: number         // 1 a 5, permite decimal (ex: 4.5)
  comment: string
  date: string           // ISO date
}
```
**Tela do cuidador exibe:** nota média + distribuição por estrela (1–5) + lista com foto, nome, data, estrelas e comentário.

### Admin Finance
```typescript
// Planos de assinatura (família) — IDs internos Stripe
plan: 'monthly' | 'quarterly' | 'annual'
// Labels exibidos: 'Mensal' | 'Trimestral' | 'Anual'
// Preços: R$127/mês | R$297/trimestre | R$997/ano

// Status de assinatura
subscription_status: 'active' | 'trial' | 'inactive' | 'cancelled' | 'expired'

// Status de fatura (Invoice)
invoice_status: 'paid' | 'pending' | 'open'
// Labels: 'Paga' | 'Pendente' | 'Em aberto'
```

### Invoice (campos reais de FamilyInvoices.tsx)
```typescript
id: string        // ex: 'INV-2026-003'
period: string    // ex: 'Março 2026'
plan: string      // nome do plano no período
amount: number    // valor em reais
dueDate: string   // data de vencimento
paidDate: string | null
status: 'paid' | 'pending' | 'open'
```

---

## 4. Regras de Negócio (extraídas do código real)

| # | Regra | Fonte |
|---|-------|-------|
| RN01 | Apenas cuidadores com `status: verified` aparecem na busca | `SearchCaregivers.tsx` |
| RN02 | Cuidador pode estar verificado mas invisível (`is_visible: false`) | `CaregiverVisibility.tsx` |
| RN03 | Progresso de perfil calculado em 6 critérios específicos | `CaregiverDashboard.tsx` |
| RN04 | CEP deve chamar ViaCEP real para auto-fill de endereço | `Onboarding.tsx` (simulateCepAutofill) |
| RN05 | Verificação de email obrigatória para email/senha — link enviado pelo Supabase Auth | Auth |
| RN05b | Login via Gmail (Google OAuth) não exige confirmação de email adicional | Auth |
| RN05c | Landing page: CEP pode ser digitado sem login, mas busca exige autenticação. CEP deve ser preservado na URL durante redirect para login | `Index.tsx` |
| RN06 | Senha forte: ≥8 chars + 1 maiúscula + 1 caractere especial | `Onboarding.tsx` |
| RN07 | Admin aprova/reprova cuidador; reprovação exige motivo | `ApprovalQueue.tsx` |
| RN08 | Distâncias na busca são mockadas — precisam de cálculo real por CEP ou geolocalização | `FamilyDashboard.tsx` (TODO comentado) |
| RN09 | Matching: `caregiver.specialties` ∩ `elderlyInfo.healthConditions` | `FamilyMatches.tsx` |
| RN10 | Assinaturas são das famílias (não cuidadores). 3 planos: match, essencial, daily | `Finance.tsx` |
| RN11 | Stripe Webhook é a fonte de verdade do status de assinatura | — |
| RN12 | Referências têm privacidade configurável (visível só p/ assinantes, mascarar telefone) | `CaregiverProfile.tsx` |
| RN16 | Botão de chat no `FamilyAppointmentDetails` só aparece se `status === 'ativo'` | `FamilyAppointmentDetails.tsx` |
| RN17 | Chat é acessado via `/chat/:id?role=family` — o role é passado como query param | `FamilyAppointmentDetails.tsx` |
| RN18 | Suporte tem histórico de tickets com status: enviado → em_analise → respondido | `CaregiverSupport.tsx` |
| RN19 | Admin/Security é apenas log de atividades — não há denúncias ou banimentos | `Security.tsx` |
| RN20 | Status de agendamentos padronizados em português: `pendente`, `ativo`, `finalizado`, `cancelado` — igual nos dois roles. O mock da família usava `active/finished` (inglês), isso era inconsistência a corrigir no backend | `FamilyAppointments.tsx` / `CaregiverAppointments.tsx` |
| RN14 | CNPJ só aparece se tipo de registro for MEI | `CaregiverDocuments.tsx` |
| RN15 | Admin não pode ser cadastrado pelo fluxo público — apenas via seed/script | — |

---

## 5. TODOs explícitos encontrados no código + itens a implementar do zero

### TODOs no código existente (pontos de integração com backend)
1. `CaregiverDashboard.tsx` — `mockInsights` → substituir por dados reais da API
2. `FamilyDashboard.tsx` — `mockDistances = [2, 5, 11]` → substituir por cálculo real de distância
3. `Onboarding.tsx` — **não implementado no Lovable** → implementar do zero com Supabase Auth
4. `Onboarding.tsx` — `simulateCepAutofill` → substituir por chamada real à API ViaCEP
5. `CaregiverDocuments.tsx` — upload de arquivos → conectar ao Supabase Storage
6. `ApprovalQueue.tsx` — `setCaregivers` local → conectar ao banco real
7. `Finance.tsx` — `mockAdminSubscriptions` / `mockAdminInvoices` → dados reais do Stripe/Supabase

### Itens novos a criar do zero
- **Página de login** (`/login`) — email/senha + botão "Entrar com Google"
- **Fluxo de confirmação de email** — página de "verifique seu email" após cadastro
- **Fluxo pós-login com redirect** — preservar `?cep=XXXXX` da landing page
- **Campo CEP na landing page** (`/`) — input + botão buscar, redireciona para `/family/search?cep=`

---

## 6. Integrações Externas

| Serviço | Uso |
|---------|-----|
| **Supabase Auth** | Login, cadastro, JWT, proteção de rotas por role |
| **Supabase PostgreSQL** | Todas as tabelas de dados |
| **Supabase Storage** | Foto de perfil, documentos (RG, certificações, etc.) |
| **Supabase Realtime** | Chat em tempo real |
| **Stripe** | Assinaturas das famílias (3 planos), faturas, webhooks |
| **ViaCEP** | Auto-fill de endereço: `https://viacep.com.br/ws/{cep}/json/` |

---

## 7. Stack Confirmada

```
Já instalado — NÃO reinstalar:
  react, react-dom, react-router-dom v6
  @tanstack/react-query v5        ← sintaxe diferente da v4!
  react-hook-form + zod + @hookform/resolvers
  date-fns, recharts, react-day-picker
  todos os componentes @radix-ui (shadcn/ui)
  vitest + @testing-library/react
  lovable-tagger                  ← gerado pelo Lovable, não remover

A instalar:
  @supabase/supabase-js
  @stripe/stripe-js
```
