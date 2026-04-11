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
   // Query — usar queryKeys centralizados
   useQuery({ queryKey: queryKeys.familyProfile(userId), queryFn: () => ... })
   // Mutation
   useMutation({ mutationFn: (data) => ... })
   ```
   - **Query keys**: sempre usar `queryKeys` de `@/lib/query-keys` — nunca inline `['key', id]`
5. **Nunca expor `service_role_key` no cliente** — sempre via Supabase Edge Function
6. **Stripe Webhook é a fonte de verdade** — nunca atualizar `plan` ou `subscription_status` diretamente pelo cliente

---

## Estrutura de pastas relevante

```
src/
├── lib/              ← supabase.ts, auth.ts, viacep.ts, stripe.ts, constants.ts, query-keys.ts,
│                        geocode.ts, labels.ts, contact-filter.ts, caregiver-query.ts, caregiver-rank.ts
├── types/            ← database.ts com todos os tipos do Supabase
├── contexts/         ← AuthContext.tsx
├── hooks/            ← useAuth, useCaregiverProfile, useFamilyProfile, useAppointments, useCareRoutine,
│                        useChat, useSearchCaregivers, useFamilyMatches, useFavorites, useReviews,
│                        useInvoices, useSubscription, usePublicCaregiverProfile, useTrackCaregiverEvent
├── components/
│   ├── shared/       ← AppSidebar, PageHeader, StatusBadge, StarRating, RequestAppointmentDialog (JÁ EXISTEM)
│   └── ui/           ← shadcn components (JÁ EXISTEM)
├── pages/
│   ├── chat/         ← AppointmentChat.tsx (chat em tempo real)
│   └── ...           ← demais páginas (maioria já conectada ao backend)
└── data/             ← mockData.ts (ainda usado em páginas não conectadas)

supabase/
└── functions/        ← Edge Functions implantadas no Supabase
    ├── create-checkout/   ← cria Checkout Session, troca de plano, cancel/reactivate (JWT-autenticada)
    └── stripe-webhook/    ← processa eventos Stripe (fonte de verdade de subscription_status)
```

---

## Componentes compartilhados — NÃO recriar

| Componente | Import | Props principais |
|---|---|---|
| `AppSidebar` | `@/components/shared/AppSidebar` | `role`, `userName`, `userPhoto` |
| `PageHeader` | `@/components/shared/PageHeader` | `title`, `description`, `children` |
| `StatusBadge` | `@/components/shared/StatusBadge` | `status` |
| `StarRating` | `@/components/shared/StarRating` | `rating`, `size`, `showValue`, `className` |
| `RequestAppointmentDialog` | `@/components/shared/RequestAppointmentDialog` | `open`, `onOpenChange`, `caregiverId`, `caregiverName` |

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
- **Constantes**: valores reutilizados (limites de upload, raio padrão, preço máximo) ficam em `@/lib/constants.ts`
- **Query keys**: centralizados em `@/lib/query-keys.ts` — nunca criar keys inline nos hooks

---

## Padrão de layout e UI

### Estrutura de página

Toda página segue esta estrutura base:

```tsx
<div className="flex min-h-screen bg-background">
  <AppSidebar role="caregiver|family|admin" userName={...} userPhoto={...} />

  <main className="flex-1 p-4 md:p-6 lg:p-8">
    <PageHeader title="Título" description="Descrição opcional" />

    <div className="max-w-3xl space-y-4 md:space-y-6">
      {/* Cards/seções aqui */}
    </div>
  </main>
</div>
```

- **Wrapper**: `flex min-h-screen bg-background`
- **Main**: `flex-1 p-4 md:p-6 lg:p-8`
- **Container de conteúdo**: `max-w-3xl space-y-4 md:space-y-6` (alinhado à esquerda, sem `mx-auto`)
- **Max-width por tipo**: formulários simples `max-w-2xl`, padrão `max-w-3xl`, perfil completo `max-w-4xl`, dashboards sem max-w

### PageHeader (componente compartilhado)

```tsx
import PageHeader from "@/components/shared/PageHeader"
<PageHeader title="Título" description="Subtítulo" />
// Props: title (string), description? (string), children? (action buttons), className?
```

### Cards e seções

```tsx
<Card>
  <CardHeader className="pb-3 md:pb-6">
    <CardTitle className="text-base md:text-lg flex items-center gap-2">
      <Icon className="w-4 h-4" /> Título da seção
    </CardTitle>
    <CardDescription className="text-xs md:text-sm">Descrição</CardDescription>
  </CardHeader>
  <CardContent className="space-y-3 md:space-y-4">
    {/* Conteúdo */}
  </CardContent>
</Card>
```

- Espaço entre cards: `space-y-4 md:space-y-6` (no container pai)
- Espaço dentro do card: `space-y-3 md:space-y-4`

### Formulários

```tsx
{/* Grid de campos */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
  <div>
    <Label className="text-xs md:text-sm">Label</Label>
    <Input className="mt-1.5 text-sm" />
  </div>
</div>

{/* Botões de ação */}
<div className="flex flex-col sm:flex-row gap-3 pb-4 md:pb-0">
  <Button variant="outline">Cancelar</Button>
  <Button>Salvar</Button>
</div>
```

### Tipografia responsiva

| Elemento | Classes |
|----------|---------|
| Título da página (h1) | `text-2xl sm:text-3xl font-bold` |
| Título de seção (h2) | `text-base md:text-lg font-semibold` |
| Label de campo | `text-xs md:text-sm` |
| Texto auxiliar | `text-sm text-muted-foreground` |
| Texto pequeno | `text-xs text-muted-foreground` |

### Loading states

```tsx
// Página inteira — spinner centralizado
<main className="flex-1 flex items-center justify-center">
  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
</main>

// Em botão — spinner inline
<Button disabled={mutation.isPending}>
  {mutation.isPending ? (
    <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
  ) : (
    <Save className="w-4 h-4" />
  )}
  Salvar
</Button>
```

### Empty states

```tsx
<Card className="border-dashed">
  <CardContent className="py-16 text-center">
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
      <Icon className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">Título</h3>
    <p className="text-muted-foreground max-w-md mx-auto mb-6">Mensagem explicativa</p>
    <Button>Ação sugerida</Button>
  </CardContent>
</Card>
```

### Breakpoints e responsividade

| Breakpoint | Uso principal |
|------------|---------------|
| `sm` (640px) | Flex direction (`sm:flex-row`), largura de botão (`sm:w-auto`) |
| `md` (768px) | Padding (`md:p-6`), grid cols (`md:grid-cols-2`), text size (`md:text-lg`) |
| `lg` (1024px) | Padding (`lg:p-8`), grid cols desktop (`lg:grid-cols-3`) |

---

## Autenticação e sessão

**Auth provider:** Supabase Auth (Email/senha + Google OAuth)

**Configuração do client (`src/lib/supabase.ts`):**
- `flowType: 'pkce'` — PKCE flow obrigatório (protege OAuth contra interceptação)
- `storage: localStorage` — tokens persistidos no browser
- `autoRefreshToken: true` — JWT renova automaticamente antes de expirar

**Configuração no Supabase Dashboard (Authentication > Settings):**
- JWT Expiry = `86400` (24 horas)
- Refresh Token Reuse Interval = `10s` (padrão)
- Refresh Token Rotation = habilitado (padrão, não tem toggle no Free)
- Session Timeout (Inactivity) = **não disponível no plano Free** — configurar 7 dias quando migrar para Pro

**Logout (`src/lib/auth.ts` + `AppSidebar.tsx`):**
- `signOut({ scope: 'global' })` — invalida sessão em **todos** os dispositivos
- `queryClient.clear()` — limpa cache do TanStack Query (dados sensíveis)
- `localStorage.removeItem('cuidde_pending_signup')` + `sessionStorage.clear()` — limpa dados locais da app

**QueryClient (`src/lib/query-client.ts`):**
- Exportado como módulo separado para ser importado tanto no `App.tsx` quanto no logout
- Não instanciar outro `QueryClient` — sempre usar o exportado

**Regras:**
- Nunca armazenar tokens manualmente — o Supabase JS gerencia automaticamente
- Nunca usar `scope: 'local'` no signOut — sempre `'global'` para invalidar servidor
- HttpOnly cookies requerem server-side proxy (não suportado em SPA) — manter localStorage

---

## Geocodificação e busca por proximidade (Sprint 3.x)

**Fluxo:**
1. Família/cuidador salva endereço → `geocodeAddress({ cep })` → Google Maps API → `lat`/`lng` gravados no banco
2. Família abre busca → se tem `lat`/`lng` → RPC `search_caregivers_by_proximity(lat, lng, raio)` → IDs + distância
3. Se família não tem coordenadas → fallback para filtros cidade/bairro (ilike)

**Arquivos-chave:**
- `src/lib/geocode.ts` — client-side Google Maps Geocoding (env: `VITE_GMAPS_GEOCODE_KEY`); helper `resolveAndSaveCoords()` compartilhado entre hooks
- `src/hooks/useSearchCaregivers.ts` — lógica de proximidade + fallback
- `src/hooks/useFamilyProfile.ts` — chama `resolveAndSaveCoords()` nas mutations de endereço
- `src/hooks/useCaregiverProfile.ts` — chama `resolveAndSaveCoords()` ao salvar endereço

**Regras:**
- Geocodificação é best-effort (não bloqueia o save)
- `lat`/`lng` do cuidador **não são expostos** na busca pública
- Raio padrão: `DEFAULT_RADIUS_KM = 20` (em `@/lib/constants.ts`)

---

## Perfil público do cuidador (Sprint 3.2)

**Rota:** `/family/caregiver/:id`

**Arquivos-chave:**
- `src/hooks/usePublicCaregiverProfile.ts` — `CaregiverPublicDetail` + `DETAIL_SELECT` (separado do `CAREGIVER_SELECT` da busca)
- `src/pages/family/CaregiverPublicProfile.tsx` — perfil completo + visualizador de documentos

**Regras:**
- Documentos: família visualiza em modal (view-only, sem download) via `supabase.storage.download()` + blob URL
- Referências: sempre buscadas se `has_references=true`; mascaramento de nomes/telefones conforme flags do cuidador
- Documentos filtrados por `is_visible=true` e `type != 'rg_cnh'`
- Requer `subscription_status = 'active'` para acessar documentos e referências (RLS do banco + Storage)
- CSP em `index.html` inclui `frame-src 'self' blob:` e `img-src blob:` para renderizar documentos

---

## Status dos campos principais

| Campo | Valores | Tabela |
|-------|---------|--------|
| `caregiver_profiles.status` | `pending \| analyzing \| verified \| rejected` | inglês — mantido no banco, mas NÃO controla busca |
| `caregiver_profiles.profile_complete` | `true \| false` | calculado por trigger — controla visibilidade na busca |
| `appointments.status` | `pendente \| ativo \| finalizado \| cancelado` | português — exibido diretamente na UI |
| `family_profiles.subscription_status` | `free \| active \| past_due \| canceled \| incomplete` | inglês — espelho do Stripe |
| `invoices.status` | `paid \| pending \| open \| overdue` | inglês — espelho do Stripe |
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

- Schema completo + RLS: `SPEC.md` → seção "Schema"
- Plano de sprints: `SPEC.md` → seção "Sprints Concluídos"
- Regras de negócio: `PRD.md` → seção "Regras de Negócio"
- SQL de ciclo de assinatura: `supabase_subscription_lifecycle.sql`
- Edge Functions: `supabase/functions/create-checkout/` e `supabase/functions/stripe-webhook/`
- Geocodificação: `src/lib/geocode.ts` (Google Maps API via `VITE_GMAPS_GEOCODE_KEY`)
- Busca pública compartilhada: `src/lib/caregiver-query.ts` (`CAREGIVER_SELECT` + `mapCaregiverRow`)
- Ranking de cuidadores: `src/lib/caregiver-rank.ts` (`computeRankScore`)
- Docs Supabase Auth Google: https://supabase.com/docs/guides/auth/social-login/auth-google
- Docs Supabase Storage RLS: https://supabase.com/docs/guides/storage/security/access-control
- Docs Supabase Realtime: https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- Docs Stripe Webhooks: https://stripe.com/docs/webhooks
