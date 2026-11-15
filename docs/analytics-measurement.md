# Medição GA4 da iCuide

## Eventos

O contêiner de produção é `GTM-PX42JMRF` e envia eventos à propriedade `G-TBTD5CXPZG` após consentimento de analytics.

| Evento | Quando ocorre | Interpretação |
| --- | --- | --- |
| `begin_lead` | Pesquisa válida por CEP | Interesse inicial; não é solicitação concluída |
| `search_by_cep` | Pesquisa válida por CEP | Etapa de busca; acompanha a mesma ação de `begin_lead`, não somar como outro lead |
| `view_caregiver_preview` | Prévias de cuidadores exibidas | Resultado da busca pública |
| `sign_up_start` | Início do cadastro | Intenção de criar conta |
| `sign_up_oauth_start` | Início do cadastro por provedor externo | Ainda não é conta criada |
| `sign_up` | Conta criada com sucesso | Cadastro concluído; e-mail pode aguardar verificação |
| `sign_up_family` | Regra do GA4: `event_name = sign_up` e `user_role = family` | Cadastro de família; evento principal |
| `sign_up_caregiver` | Regra do GA4: `event_name = sign_up` e `user_role = caregiver` | Cadastro de cuidador; não é evento principal |
| `view_pricing` | Na home/landing, pelo menos metade do título dos planos aparece na tela, com consentimento; na área autenticada, abertura da tela de planos | Interesse nos planos; uma vez por montagem |
| `select_plan` | Seleção de plano pago | Escolha do plano, ainda sem pagamento |
| `start_free_plan` | Seleção do plano gratuito | Escolha gratuita; não é assinatura paga |
| `begin_checkout` | Início do checkout da família | Intenção de pagamento |
| `checkout_canceled` | Retorno de cancelamento do checkout | Abandono explícito do checkout |
| `subscribe_paid_plan` | Checkout pago verificado no servidor após retorno à área da família e sincronização da assinatura ativa | Contratação de plano; conversão comercial |
| `purchase` | Mesma compra verificada, com valor real, moeda, fatura e itens | Receita de aquisição; deduplicação por transação |
| `cta_click` | CTA instrumentado acionado | Interação auxiliar |
| `blog_article_view` | Artigo aberto com consentimento | Leitura de artigo |
| `blog_cta_click` | CTA de artigo acionado | Próximo passo originado no artigo |

Desde 14/11/2026, `sign_up_family` é o evento principal de cadastro para aquisição de famílias. `sign_up` continua sendo coletado como evento de origem, mas deixou de ser evento principal para não misturar os dois perfis nem contar o cadastro de família duas vezes como conversão. `sign_up_caregiver` mede os cuidadores separadamente. As duas regras copiam os parâmetros do evento de origem; a regra de família não possui valor monetário padrão. As regras novas valem para eventos futuros, sem reprocessar cadastros históricos.

`subscribe_paid_plan` permanece como evento principal de contratação. A página aguarda o perfil com assinatura `active` e ID da assinatura, ambos sincronizados pelo webhook. O hook `useCheckoutPurchase` consulta a Edge Function autenticada `checkout-analytics`, que verifica a sessão diretamente no Stripe, seu vínculo com a família e o cliente Stripe, os estados `complete` e `paid`, a fatura e os itens. Somente essa resposta confirmada permite emitir `purchase` e `subscribe_paid_plan`. Não basta abrir uma URL com `success=true`.

`purchase` usa o identificador da fatura como `transaction_id`, valor efetivamente cobrado em BRL, descontos já aplicados e itens com seus valores, excluindo impostos e frete. Não usa o preço mensal equivalente da vitrine. Transações já emitidas ficam protegidas em memória e no armazenamento local; o GA4 também deduplica `purchase` pelo identificador da transação. Não somar os eventos principais `purchase` e `subscribe_paid_plan` como se fossem duas vendas.

Essa medição ainda depende do retorno do navegador e de consentimento. Não cobre automaticamente renovações, upgrades sem Checkout, reembolsos ou pagamentos concluídos sem retorno ao site. Não foi criada uma integração de envio pelo webhook nem Conversions API da Meta. `generate_lead` continua sem ser evento principal e a solicitação de atendimento não é enviada ao GA4 neste momento.

Os eventos do funil carregam `user_role`, `signup_method`, `blog_slug`, `blog_category`, `blog_audience`, `plan_id` e parâmetros pertinentes quando presentes. `user_role` já existe como dimensão personalizada com escopo de evento. Valores `family` e `caregiver` identificam o perfil conhecido; `anonymous` ou valores ausentes não devem ser reclassificados automaticamente como família cadastrada. A prévia pública não envia `user_role` atualmente. Não incluir dados pessoais nesses parâmetros.

## Relatórios

Para aquisição de famílias, use sessões e usuários por **origem/mídia da sessão**, página de destino e os eventos `sign_up_family` e `subscribe_paid_plan`. Acompanhe cuidadores por `sign_up_caregiver` ou filtre os eventos originais pela dimensão `user_role`. Para o blog, acompanhe `blog_article_view` → `blog_cta_click` → `sign_up_family` → `subscribe_paid_plan`, com `blog_slug` quando disponível. A classificação `Direct` indica ausência de origem identificável; não atribua essas sessões ao blog ou ao tráfego pago sem outra evidência.

Separe páginas públicas (`/`, `/encontrar-cuidadores`, `/sobre`, `/para-cuidadores`, `/blog/*`, `/buscar-cuidadores` e páginas locais) de uso autenticado (`/family/*`, `/caregiver/*`, `/admin/*`). Visualizações das áreas autenticadas medem uso do produto, não novas visitas de aquisição. Exclua o teste artificial de julho das comparações históricas.

## Auditoria de 14/11/2026

- Propriedade GA4 `547463160`, fluxo `G-TBTD5CXPZG`; contêiner de produção `GTM-PX42JMRF`.
- As tags de produção cobrem os eventos do funil sem restringir a URL à landing antiga. A nova `/encontrar-cuidadores` já apareceu nos relatórios. A versão 9 do GTM acrescenta uma tag exclusiva `purchase` com envio de e-commerce do dataLayer e `user_role = family`, sem alterar as tags existentes.
- A dimensão `user_role` já distinguia os 10 cadastros dos últimos 28 dias em 2 de famílias e 8 de cuidadores antes da alteração. Esses totais são históricos e não representam os novos eventos derivados.
- O gerenciamento de conversões do GA4, tanto na seleção Google Analytics quanto na conta vinculada iCuide, não listava conversões importadas. Nenhuma campanha, orçamento ou ação de conversão do Google Ads foi modificada.
- Regras `sign_up_family` e `sign_up_caregiver` e a lista de eventos principais foram verificadas após recarregar a página.
- Checkout e assinatura têm instrumentação configurada, mas não tiveram ocorrências no período consultado. Foram testadas visibilidade, consentimento, verificação de pertencimento da compra, valores, rejeição de pagamentos inválidos e deduplicação. Não foi realizado pagamento nem criado cadastro artificial nesta auditoria; a validação de uma contratação completa no ambiente real ainda depende de uma ação controlada da família.
- Publicadas no Supabase: `checkout-analytics` v1, autenticada, somente leitura; `create-checkout` v20, preservando a função de produção e alterando apenas `success_url` para incluir `{CHECKOUT_SESSION_ID}`.
- Evidências locais: `output/analytics/ga4-cadastros-separados.jpg` e `output/analytics/ga4-eventos-principais.jpg`.

## Campanhas futuras

Use UTMs consistentes nos links de campanha. Exemplo de anúncio social:

`https://www.icuide.com.br/encontrar-cuidadores?utm_source=instagram&utm_medium=paid_social&utm_campaign=nome_da_campanha&utm_content=criativo_a`

Mantenha nomes em minúsculas e confira se UTMs e identificadores de clique sobrevivem aos redirecionamentos. Para Google Ads, confira a vinculação ao GA4 e a marcação automática antes de lançar a próxima campanha.

## Verificação

Teste com GTM Preview e GA4 DebugView, sob consentimento aceito: artigo, CTA, busca por CEP, cadastro real e contratação real. Confirme um único disparo por ação e compare cadastros/assinaturas com os registros do Supabase e do Stripe. As dimensões personalizadas de perfil, blog, cadastro, CTA e plano já foram criadas no GA4 para coleta futura.
