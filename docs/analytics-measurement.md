# Medição GA4 da iCuide

## Eventos

O contêiner de produção é `GTM-PX42JMRF` e envia eventos à propriedade `G-TBTD5CXPZG` após consentimento de analytics.

| Evento | Quando ocorre | Interpretação |
| --- | --- | --- |
| `begin_lead` | Pesquisa válida por CEP | Interesse inicial; não é solicitação concluída |
| `sign_up` | Conta criada com sucesso | Cadastro concluído; e-mail pode aguardar verificação |
| `generate_lead` | Solicitação de atendimento inserida no banco | Pedido real enviado por uma família |
| `blog_article_view` | Artigo aberto com consentimento | Leitura de artigo |
| `blog_cta_click` | CTA de artigo acionado | Próximo passo originado no artigo |

`sign_up` já é evento principal no GA4. `generate_lead` pode ser marcado como evento principal para analisar solicitações, sem alterar a definição de cadastro. Os eventos do funil carregam `user_role`, `signup_method`, `blog_slug`, `blog_category`, `blog_audience`, `lead_step`, `lead_type` e parâmetros pertinentes quando presentes. Não incluir dados pessoais nesses parâmetros.

## Relatórios

Para aquisição, use sessões e usuários por **origem/mídia da sessão**, página de destino e eventos `sign_up`/`generate_lead`. Para o blog, acompanhe `blog_article_view` → `blog_cta_click` → `sign_up` ou `generate_lead`, com `blog_slug`. A classificação `Direct` indica ausência de origem identificável; não atribua essas sessões ao blog ou ao tráfego pago sem outra evidência.

Separe páginas públicas (`/`, `/sobre`, `/para-cuidadores`, `/blog/*`, `/buscar-cuidadores` e páginas locais) de uso autenticado (`/family/*`, `/caregiver/*`, `/admin/*`). Visualizações das áreas autenticadas medem uso do produto, não novas visitas de aquisição. Exclua o teste artificial de julho das comparações históricas.

## Campanhas futuras

Use UTMs consistentes nos links de campanha. Exemplo de anúncio social:

`https://www.icuide.com.br/?utm_source=instagram&utm_medium=paid_social&utm_campaign=nome_da_campanha&utm_content=criativo_a`

Mantenha nomes em minúsculas e confira se UTMs e identificadores de clique sobrevivem aos redirecionamentos. Para Google Ads, confira a vinculação ao GA4 e a marcação automática antes de lançar a próxima campanha.

## Verificação

Teste com GTM Preview e GA4 DebugView, sob consentimento aceito: artigo, CTA, busca por CEP, cadastro real e solicitação real. Confirme um único disparo por ação e compare cadastros/solicitações com registros do Supabase. Antes de criar dimensões personalizadas, verifique se já existem `user_role`, `blog_slug`, `blog_category` e `lead_type`; elas só aparecem nos relatórios após configuração e coleta futura.
