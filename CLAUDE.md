# CLAUDE.md — Cuidde

> Este arquivo é lido automaticamente pelo Claude Code em toda sessão.
> Mantenha-o atualizado conforme o projeto evolui.

---

## O que é este projeto

Marketplace que conecta cuidadores de idosos (cuidadores) com famílias.
Frontend React + Vite + TypeScript gerado no Lovable — **todas as páginas existem e estão mockadas**.
O trabalho aqui é **conectar o backend**, não recriar UI.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + Vite + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Supabase (Auth + PostgreSQL + Storage + Realtime) |
| Pagamentos | Stripe (assinaturas de família) |
| Estado servidor | TanStack Query v5 |
| Forms | react-hook-form + zod |
| CEP | ViaCEP API |

---

## Regras inegociáveis

1. **Nunca recriar UI que já existe** — verificar sempre `src/components/shared/` e `src/components/ui/` antes de criar qualquer componente
2. **Nunca remover dados mockados** sem confirmar que o dado real está funcionando
3. **Uma sessão = um sprint** — não misturar sprints; consultar SPEC.md para o sprint atual
4. **TanStack Query v5** — sintaxe obrigatória:
   ```typescript
   // Query
   useQuery({ queryKey: ['key'], queryFn: () => ... })
   // Mutation
   useMutation({ mutationFn: (data) => ... })
   ```
5. **Nunca expor `service_role_key` no cliente** — sempre via Supabase Edge Function
6. **Stripe Webhook é a fonte de verdade** — nunca atualizar `plan` ou `subscription_status` diretamente pelo cliente

---

## Estrutura de pastas relevante

```
src/
├── lib/              ← clientes e helpers (supabase.ts, auth.ts, viacep.ts, stripe.ts)
├── types/            ← database.ts com todos os tipos do Supabase
├── contexts/         ← AuthContext.tsx
├── hooks/            ← todos os hooks de dados (useAuth, useCaregiverProfile, etc.)
├── components/
│   ├── shared/       ← AppSidebar, PageHeader, StatusBadge, StarRating (JÁ EXISTEM)
│   └── ui/           ← shadcn components (JÁ EXISTEM)
└── pages/            ← todas as páginas (JÁ EXISTEM, mockadas)

supabase/
├── functions/        ← Edge Functions (create-checkout, stripe-webhook, admin-actions)
└── migrations/       ← SQL files (já executados manualmente via supabase_setup.sql)
```

---

## Componentes compartilhados — NÃO recriar

| Componente | Import | Props principais |
|---|---|---|
| `AppSidebar` | `@/components/shared/AppSidebar` | `role`, `userName`, `userPhoto` |
| `PageHeader` | `@/components/shared/PageHeader` | `title`, `description`, `children` |
| `StatusBadge` | `@/components/shared/StatusBadge` | `status` |
| `StarRating` | `@/components/shared/StarRating` | `rating`, `size`, `showValue`, `className` |

---

## Roles e rotas

| Role | Rotas | Redirect após login |
|------|-------|---------------------|
| `caregiver` | `/caregiver/*` | `/caregiver` |
| `family` | `/family/*` | `/family` |
| `admin` | `/admin/*` | `/admin` |

- Rotas públicas: `/`, `/login`, `/verify-email`, `/onboarding`
- Admin nunca pode ser criado via signup público

---

## Dados mockados — como substituir

Cada página importa de `@/data/mockData`. Ao conectar um hook real:

```typescript
// ANTES (mock)
import { mockCaregivers } from "@/data/mockData"
const user = mockCaregivers[0]

// DEPOIS (real)
const { data: user } = useCaregiverProfile()
```

Não deletar o arquivo `mockData.ts` — outras páginas ainda podem depender dele durante a migração.

---

## Convenções de código

- **Nomes de arquivos**: PascalCase para componentes (`CaregiverProfile.tsx`), camelCase para hooks (`useCaregiverProfile.ts`)
- **Hooks**: sempre em `src/hooks/`, um arquivo por domínio
- **Imports**: usar sempre `@/` (path alias já configurado)
- **Tipos**: derivar de `src/types/database.ts` — não criar tipos duplicados
- **Sem `console.log`** no código entregue — apenas durante debug
- **Sem comentários óbvios** — comentar apenas lógica não-trivial
- **Tratamento de erro**: usar `toast` do `sonner` (já instalado) para feedback ao usuário

---

## Status dos campos principais

| Campo | Valores | Tabela |
|-------|---------|--------|
| `caregiver_profiles.status` | `pending \| analyzing \| verified \| rejected` | inglês — mantido no banco, mas NÃO controla busca |
| `caregiver_profiles.profile_complete` | `true \| false` | calculado por trigger — controla visibilidade na busca |
| `appointments.status` | `pendente \| ativo \| finalizado \| cancelado` | português — exibido diretamente na UI |
| `family_profiles.subscription_status` | `active \| trial \| inactive \| cancelled \| expired` | inglês — espelho do Stripe |
| `invoices.status` | `paid \| pending \| open` | inglês — espelho do Stripe |
| `caregiver_documents.status` | `pending \| sent \| approved \| rejected` | inglês — fluxo de aprovação |
| `support_tickets.status` | `enviado \| em_analise \| respondido` | português — exibido na UI |

---

## Quando algo der errado num sprint

1. **Não apagar o que foi feito** — comentar o código novo com `// TODO: broken`
2. **Restaurar o import do mock** temporariamente para a página funcionar
3. **Descrever o problema** antes de tentar corrigir — não sair editando às cegas
4. **Verificar Supabase Dashboard** → Table Editor para confirmar se os dados chegaram
5. **Verificar RLS**: se query retorna vazio sem erro, provavelmente é RLS bloqueando — testar com `service_role` no Dashboard

---

## Referências rápidas

- Schema completo + RLS: `SPEC.md` → seção "Schema do Banco de Dados"
- Plano de sprints: `SPEC.md` → seção "Plano de Implementação"
- Regras de negócio: `PRD.md` → seção "Regras de Negócio"
- SQL para rodar no Supabase: `supabase_setup.sql`
- Docs Supabase Auth Google: https://supabase.com/docs/guides/auth/social-login/auth-google
- Docs Supabase Storage RLS: https://supabase.com/docs/guides/storage/security/access-control
- Docs Supabase Realtime: https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- Docs Stripe Webhooks: https://stripe.com/docs/webhooks
