# Medição GA4 da iCuide

## Eventos

O contêiner de produção é `GTM-PX42JMRF` e envia eventos à propriedade `G-TBTD5CXPZG` após consentimento de analytics.

| Evento | Quando ocorre | Interpretação |
| --- | --- | --- |
| `begin_lead` | Pesquisa válida por CEP | Interesse inicial; não é solicitação concluída |
| `sign_up` | Conta criada com sucesso | Cadastro concluído; e-mail pode aguardar verificação |
| `subscribe_paid_plan` | Retorno do checkout e assinatura ativa confirmada no perfil da família | Contratação de plano; conversão comercial |
| `blog_article_view` | Artigo aberto com consentimento | Leitura de artigo |
| `blog_cta_click` | CTA de artigo acionado | Próximo passo originado no artigo |

`sign_up` é evento principal de cadastro. `subscribe_paid_plan` é o evento principal de contratação: o retorno de sucesso do Stripe só o dispara depois de o perfil mostrar assinatura `active` e um ID de assinatura, ambos sincronizados pelo webhook. `generate_lead` foi desmarcado como evento principal e a solicitação de atendimento não é enviada ao GA4 neste momento. Os eventos do funil carregam `user_role`, `signup_method`, `blog_slug`, `blog_category`, `blog_audience`, `plan_id` e parâmetros pertinentes quando presentes. Não incluir dados pessoais nesses parâmetros.

## Relatórios

Para aquisição, use sessões e usuários por **origem/mídia da sessão**, página de destino e os eventos `sign_up` e `subscribe_paid_plan`. Para o blog, acompanhe `blog_article_view` → `blog_cta_click` → `sign_up` → `subscribe_paid_plan`, com `blog_slug` quando disponível. A classificação `Direct` indica ausência de origem identificável; não atribua essas sessões ao blog ou ao tráfego pago sem outra evidência.

Separe páginas públicas (`/`, `/sobre`, `/para-cuidadores`, `/blog/*`, `/buscar-cuidadores` e páginas locais) de uso autenticado (`/family/*`, `/caregiver/*`, `/admin/*`). Visualizações das áreas autenticadas medem uso do produto, não novas visitas de aquisição. Exclua o teste artificial de julho das comparações históricas.

## Campanhas futuras

Use UTMs consistentes nos links de campanha. Exemplo de anúncio social:

`https://www.icuide.com.br/?utm_source=instagram&utm_medium=paid_social&utm_campaign=nome_da_campanha&utm_content=criativo_a`

Mantenha nomes em minúsculas e confira se UTMs e identificadores de clique sobrevivem aos redirecionamentos. Para Google Ads, confira a vinculação ao GA4 e a marcação automática antes de lançar a próxima campanha.

## Verificação

Teste com GTM Preview e GA4 DebugView, sob consentimento aceito: artigo, CTA, busca por CEP, cadastro real e contratação real. Confirme um único disparo por ação e compare cadastros/assinaturas com os registros do Supabase e do Stripe. As dimensões personalizadas de perfil, blog, cadastro, CTA e plano já foram criadas no GA4 para coleta futura.
