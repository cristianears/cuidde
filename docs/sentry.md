# Sentry no iCuide

A integração captura exceções JavaScript não tratadas, rejeições de promises e erros de renderização React. Erros de renderização exibem uma opção para recarregar a página. Erros que o código trata com `try/catch` ou callbacks precisam de `captureException` explícito quando forem falhas inesperadas; mensagens de validação comuns não devem ser reportadas.

## Ativação

1. Em Sentry → Settings → Projects → projeto → Client Keys (DSN), copie o DSN público.
2. Configure `VITE_SENTRY_DSN` em `.env.local` para desenvolvimento e nas variáveis de build do Cloudflare Pages para produção.
3. Configure `VITE_SENTRY_ENVIRONMENT=production` no Cloudflare e `development` localmente.
4. Gere uma nova build. Variáveis `VITE_` são incorporadas na compilação; editar a configuração sem reconstruir não ativa o monitoramento.

Sem DSN a aplicação funciona com o monitoramento desativado. A captura de erros usa a amostragem padrão de 100%; os traces de desempenho usam 10% em produção e 100% em desenvolvimento. A integração com React Router nomeia as transações pelas rotas.

Em 02/11/2026, `VITE_SENTRY_DSN` e `VITE_SENTRY_ENVIRONMENT=production` foram configurados no ambiente de produção do projeto Cloudflare Pages `icuide`. A publicação é acionada pelo push para `main` do repositório `cristianears/cuidde`.

## Mapas de código e versões

Configure no ambiente de build do Cloudflare Pages:

- `SENTRY_ORG=icuide`
- `SENTRY_PROJECT=<slug do projeto Sentry>`
- `SENTRY_AUTH_TOKEN=<token de build com permissão para upload de source maps>`

O token pertence apenas ao build e nunca deve receber o prefixo `VITE_`. Com o token e o projeto configurados, o plugin envia os mapas de código e os remove de `dist` antes da publicação. Sem essas duas variáveis, mapas não são gerados nem publicados e as pilhas de produção podem aparecer minificadas.

Para builds locais, as variáveis `SENTRY_` também podem ficar em `.env.sentry-build-plugin`, que está no `.gitignore`. Variáveis do ambiente de build têm prioridade.

O identificador da versão usa `VITE_SENTRY_RELEASE` ou, no Cloudflare Pages, `CF_PAGES_COMMIT_SHA`. O plugin de build e o SDK recebem o mesmo valor. Para builds locais versionadas, configure `VITE_SENTRY_RELEASE` explicitamente.

## Dados coletados

Não há Session Replay nem widget de feedback. O envio automático de dados pessoais está desativado. Eventos removem usuário, corpo da requisição, cabeçalhos, cookies e parâmetros das URLs da página; breadcrumbs de interações com o DOM estão desativados. URLs em breadcrumbs e spans HTTP também perdem parâmetros e fragmentos. Mensagens de exceções ainda devem evitar dados pessoais e segredos.

## Verificação

Verificação local realizada em 02/11/2026 com o SDK inicializado pelo `src/main.tsx` do aplicativo. Uma exceção disparada pelo navegador, `iCuide Sentry verification 2026-11-02`, foi aceita pelo endpoint Sentry com HTTP 200. O gatilho temporário foi removido. A aceitação do evento não confirma a qualidade dos mapas de código, que depende do token de build.

Com um DSN real configurado, inicie o aplicativo e provoque temporariamente uma exceção em um evento da interface. Confirme a ocorrência em Sentry → Issues, incluindo ambiente, versão e arquivo/linha. Remova o gatilho de teste antes de publicar. O recebimento do evento e a qualidade dos mapas ainda precisam de confirmação na conta Sentry.

O plugin do agente é separado do SDK do aplicativo: ele permite consultar e investigar os erros pelo Codex após autenticação. A instalação do plugin sozinha não ativa a captura no site.
