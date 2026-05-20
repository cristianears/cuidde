# E2E Plan

Objetivo: cobrir os fluxos que podem quebrar producao mesmo quando testes unitarios passam.

Framework: Playwright (`@playwright/test`).

## Status local

- [x] `@playwright/test` instalado.
- [x] Chromium do Playwright instalado localmente.
- [x] Scripts adicionados ao `package.json`.
- [x] Config criada em `playwright.config.ts`.
- [x] Primeiro spec criado em `e2e/onboarding-family.spec.ts`.
- [x] `npm.cmd run test:e2e`: passou, 2 testes.
- [x] Revalidado em 2026-05-19: 2 testes passaram em Chromium.

## Instalar em novo ambiente

```powershell
npm.cmd install
npx playwright install chromium
```

Se o npm falhar com `UNABLE_TO_VERIFY_LEAF_SIGNATURE` no Windows local:

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npm.cmd install
npx playwright install chromium
```

## Primeiro arquivo de teste

`e2e/onboarding-family.spec.ts`

### Cenario 1: CEP na home preserva dados no onboarding -- implementado

- Abrir `/`.
- Preencher CEP `12236-063`.
- Clicar em "Buscar profissionais".
- Esperar URL `/onboarding?type=family&cep=12236063`.
- Confirmar que a etapa de cadastro aparece.

### Cenario 2: Fluxo Google simulado preserva CEP ate endereco -- implementado

- Abrir `/onboarding?from=google&type=family&cep=12236063`.
- Avancar perfil familia.
- Preencher telefone fake.
- Confirmar que etapa endereco mostra:
  - CEP `12236063`
  - Rua `Rua Angelo Bravini`
  - Bairro `Jardim Terras do Sul`
  - Cidade `Sao Jose dos Campos`
  - UF `SP`
  - Botao "Continuar" bloqueado enquanto numero nao foi preenchido

### Cenario 3: Busca mostra raio quando familia tem lat/lng

- Entrar com usuario familia preparado.
- Abrir `/family/search`.
- Confirmar que o filtro "Raio de busca" aparece.
- Confirmar que cards de cuidadores podem exibir distancia.

### Cenario 4: Meu Perfil carrega telefone/endereco sem F5

- Entrar com usuario familia preparado com telefone e endereco completos.
- Abrir `/family/profile`.
- Confirmar que telefone aparece no primeiro carregamento.
- Confirmar que CEP, rua, numero, bairro, cidade e UF aparecem no primeiro carregamento.
- Recarregar a pagina e confirmar que os mesmos campos continuam preenchidos.

### Cenario 5: Estado `past_due` limita acesso pago

- Entrar com usuario familia preparado com `subscription_status = 'past_due'`.
- Abrir perfil publico de cuidador buscavel.
- Confirmar CTA de contato com texto de regularizacao.
- Abrir chat de atendimento como familia em periodo sem carencia ou com `payment_failed_at` antigo.
- Confirmar que envio de mensagem fica bloqueado e leva para billing.

### Cenario 6: Estado `active` libera acesso pago

- Entrar com usuario familia preparado com `subscription_status = 'active'`.
- Abrir perfil publico de cuidador buscavel.
- Confirmar CTA "Solicitar Atendimento".
- Confirmar que favoritos e solicitacao de atendimento nao exibem bloqueio de assinatura.

## Dados de teste

Evitar usar dados reais de familia/cuidador.

Criar fixtures no Supabase para:

- familia com `lat/lng`
- familia sem `lat/lng`
- familia active
- familia past_due dentro da carencia
- familia past_due fora da carencia
- cuidador buscavel
- cuidador incompleto
- cuidador sem `has_rg_cnh`
- cuidador indisponivel

## Criterio minimo para ativar no CI

- Home + onboarding por CEP.
- Busca com raio.
- Perfil da familia carregando telefone/endereco sem F5.
- Smoke test de login.
- Acesso pago active vs past_due.

## Observacao

O login Google real nao deve ser automatizado no E2E local. Para E2E, usar usuario de teste com email/senha ou fixture de sessao autenticada.
