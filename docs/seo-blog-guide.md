# Guia de SEO e blog da icuide

Este guia resume as decisões de SEO da landing e do blog para consultar antes de criar novos artigos ou páginas públicas.

## Objetivo atual

- Captar cuidadores de idosos, especialmente em São José dos Campos, Jacareí e Vale do Paraíba.
- Usar o blog para responder buscas reais de profissionais, como "vagas para cuidador", "vagas de cuidador de idosos", "como conseguir clientes como cuidador" e "como divulgar trabalho de cuidador".
- Manter o texto honesto: a icuide ajuda cuidadores a criarem perfil e serem encontrados por famílias, mas não promete contratação ou vaga garantida.

## Estratégia de títulos

- Colocar a intenção principal no título do artigo.
- Para cuidadores, pode usar "vagas para cuidador" quando o artigo atender essa busca.
- Usar cidade/região quando fizer sentido real no conteúdo:
  - São José dos Campos
  - Jacareí
  - Vale do Paraíba
- Evitar criar muitos artigos quase iguais mudando só o nome da cidade. Cada artigo precisa ter um ângulo próprio.

Exemplos bons:

- `Vagas para cuidador de idosos em São José dos Campos: como se destacar`
- `Vagas para cuidador de idosos em Jacareí: como divulgar seu trabalho`
- `Vagas para cuidador de idosos no Vale do Paraíba: como se preparar`

## Conteúdo dos artigos

Cada artigo deve ter:

- Um título claro com a busca principal.
- Uma descrição curta para SEO e cards do blog.
- Um texto de abertura que explique a promessa do artigo.
- Pelo menos 3 seções com subtítulos objetivos.
- CTA final para cuidadores: `Criar perfil grátis`, apontando para `/para-cuidadores`.
- Linguagem simples, profissional e sem promessas exageradas.

Para artigos de cuidadores, bons temas são:

- Como conseguir clientes como cuidador de idosos.
- Como divulgar trabalho de cuidador com segurança.
- Quanto cobrar como cuidador.
- Como montar perfil profissional.
- Como organizar disponibilidade, valores e regiões atendidas.
- Como apresentar certificados, antecedentes e referências.

## Imagens do blog

- Evitar repetir a mesma imagem em vários artigos próximos.
- Preferir imagens de cuidado, rotina profissional, organização de agenda, conversa com família ou atendimento domiciliar.
- Não usar imagens com texto, marca, logo ou tela legível.
- Não usar fotos genéricas demais de cidade se a intenção principal for confiança profissional.
- Salvar imagens otimizadas no projeto, em `src/assets/blog/`.
- Tamanho recomendado:
  - Largura: 1200 px.
  - Formato: WebP quando disponível; JPG otimizado também é aceitável.
  - Peso alvo: 80 KB a 180 KB por imagem.
- O blog já usa `loading="lazy"` na listagem, então imagens abaixo da dobra não carregam todas imediatamente.

## Arquivos que precisam ser atualizados

Hoje os posts aparecem em dois lugares:

- `src/data/blogPosts.ts`: fonte usada pela interface React do blog.
- `scripts/seo-pages.mjs`: fonte usada para gerar HTML estático, metadados e sitemap no build.

Ao criar artigo novo, atualizar os dois até que o projeto seja refatorado para ter fonte única.

Também verificar:

- `src/test/caregiver-local-blog.test.ts`, quando o artigo fizer parte de uma campanha local importante.
- `src/test/seo-pages.test.ts`, se mudar comportamento do gerador SEO.

## SEO técnico atual

O build roda:

```bash
npm run build
```

Esse comando executa:

```bash
vite build && node scripts/seo-pages.mjs
```

O script `scripts/seo-pages.mjs` gera:

- HTML estático para `/`.
- HTML estático para `/sobre`.
- HTML estático para `/para-cuidadores`.
- HTML estático para `/blog`.
- HTML estático para cada `/blog/:slug`.
- `dist/sitemap.xml`.
- `Sitemap: https://www.icuide.com.br/sitemap.xml` em `dist/robots.txt`.

As páginas recebem:

- `<title>`.
- Meta description.
- Canonical.
- Robots `index,follow`.
- Open Graph.
- Twitter card.
- JSON-LD com `Organization`, `WebPage` ou `Article`.

## Canonical e domínio

- A versão principal é `https://www.icuide.com.br`.
- O sitemap usa URLs com `www`.
- As páginas usam canonical com `www`.
- Idealmente, configurar depois um redirecionamento 301 no Cloudflare:
  - `https://icuide.com.br/*`
  - para `https://www.icuide.com.br/*`

## Fallback estático e flash de texto

O conteúdo estático SEO não deve entrar dentro de `#root`, porque isso causa uma tela textual antes do React carregar.

O conteúdo estático deve ficar em:

```html
<noscript data-seo-fallback>
```

Assim:

- O usuário com JavaScript vê a aplicação real.
- O conteúdo continua disponível como fallback sem JavaScript.
- Evita o flash de página apenas com texto.

## Search Console

Depois de publicar novos artigos:

1. Confirmar que o deploy do Cloudflare Pages terminou.
2. Abrir `https://www.icuide.com.br/sitemap.xml`.
3. No Google Search Console, reenviar ou validar o sitemap se necessário.
4. Usar Inspeção de URL para artigos prioritários.
5. Solicitar indexação das URLs novas.
6. Acompanhar em Desempenho termos como:
   - vagas para cuidador
   - vagas de cuidador de idosos
   - cuidador de idosos São José dos Campos
   - cuidador de idosos Jacareí
   - cuidador de idosos Vale do Paraíba

## Cuidados importantes

- Não mexer em áreas privadas como família, cuidador logado ou admin quando a tarefa for SEO público.
- Não alterar fluxo de CEP/onboarding sem pedido explícito.
- Não alterar planos ou preços junto com conteúdo de blog, salvo pedido explícito.
- Não prometer emprego, contratação, disponibilidade de vagas ou renda.
- Não publicar conteúdo médico ou jurídico como se fosse orientação profissional especializada.
- Não copiar texto de outros sites.

## Checklist antes de publicar

- Artigo existe em `src/data/blogPosts.ts`.
- Artigo existe em `scripts/seo-pages.mjs`.
- Título tem intenção de busca clara.
- Description está objetiva.
- CTA aponta para a rota correta.
- Imagem é própria, leve e sem texto/logos.
- `npm test -- src/test/seo-pages.test.ts` passa.
- Testes específicos do blog passam, quando houver.
- `npm run build` passa.
- `dist/sitemap.xml` inclui a URL nova.
- Uma página gerada em `dist/blog/<slug>/index.html` tem title, canonical e JSON-LD.
