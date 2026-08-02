import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { blogPostContent } from '../src/data/blogContent.js'
import { localCarePages } from '../src/data/localCarePages.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')

export const siteUrl = 'https://www.icuide.com.br'
const organizationLogo = `${siteUrl}/logo.png`
const defaultImage = `${siteUrl}/blog/family-care-price-2026.jpg`
const defaultImageAlt = 'Cuidadora aferindo a pressao de idoso em casa durante atendimento domiciliar'

const imageMetadataByPath = {
  '/logo.png': {
    width: 500,
    height: 500,
    type: 'image/png',
    alt: 'Logo da icuide',
  },
  '/blog/family-care-price-2026.jpg': {
    width: 1600,
    height: 878,
    type: 'image/jpeg',
    alt: 'Cuidadora aferindo a pressao de idoso em casa durante atendimento domiciliar',
  },
  '/blog/family-care-hiring-safety.jpg': {
    width: 1536,
    height: 1024,
    type: 'image/jpeg',
    alt: 'Cuidadora, familiar e idosa revisando combinados antes da contratacao',
  },
  '/blog/family-care-costs.jpg': {
    width: 1400,
    height: 933,
    type: 'image/jpeg',
    alt: 'Cuidadora ajudando idosa a revisar planejamento de custos em casa',
  },
  '/blog/family-care-schedule.jpg': {
    width: 1400,
    height: 933,
    type: 'image/jpeg',
    alt: 'Cuidadora e idoso organizando uma agenda de cuidados em casa',
  },
  '/blog/family-care-night.jpg': {
    width: 1400,
    height: 933,
    type: 'image/jpeg',
    alt: 'Cuidadora oferecendo apoio tranquilo a idosa durante rotina noturna em casa',
  },
  '/blog/family-care-alzheimer.jpg': {
    width: 1400,
    height: 933,
    type: 'image/jpeg',
    alt: 'Cuidadora acompanhando idosa em atividade de memoria com album de familia',
  },
  '/blog/family-care-sao-jose-dos-campos.jpg': {
    width: 1400,
    height: 933,
    type: 'image/jpeg',
    alt: 'Familia e cuidadora apoiando idosa com andador em casa',
  },
  '/blog/family-care-vale-do-paraiba.jpg': {
    width: 1400,
    height: 933,
    type: 'image/jpeg',
    alt: 'Cuidadora e familiar acompanhando idosa em casa com paisagem verde ao fundo',
  },
}

export const blogPosts = blogPostContent
export const localPages = localCarePages

export const publicRoutes = [
  {
    path: '/',
    indexable: true,
    title: 'icuide — Cuidadores de idosos perto de você',
    description:
      'Encontre cuidadores de idosos com mais transparência. A icuide conecta famílias a profissionais de cuidado para conversas e combinados diretos.',
    body: renderLandingBody,
  },
  {
    path: '/sobre',
    indexable: true,
    title: 'Sobre a icuide | Cuidadores de idosos e famílias',
    description:
      'Conheça a icuide, uma plataforma criada para aproximar famílias e profissionais de cuidado com transparência, autonomia e informação.',
    body: renderAboutBody,
  },
  {
    path: '/para-cuidadores',
    indexable: true,
    title: 'Para cuidadores de idosos | Crie seu perfil grátis | icuide',
    description:
      'Crie um perfil profissional gratuito na icuide, informe experiência, disponibilidade, valores e referências, e seja encontrado por famílias.',
    body: renderCaregiverLandingBody,
  },
  {
    path: '/blog',
    indexable: true,
    title: 'Blog da icuide | Guias sobre cuidadores de idosos',
    description:
      'Guias práticos para famílias que buscam cuidadores de idosos e para profissionais que querem apresentar melhor sua experiência.',
    body: renderBlogIndexBody,
  },
]

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function shouldUseTrailingSlash(path) {
  return path !== '/' && !/\.[a-z0-9]+$/i.test(path)
}

function canonicalPath(path) {
  if (path === '/') return '/'
  return shouldUseTrailingSlash(path) ? `${path}/` : path
}

function absoluteUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${siteUrl}${canonicalPath(path)}`
}

function imagePathFromUrl(image) {
  if (!image) return '/blog/family-care-price-2026.jpg'
  if (!image.startsWith('http://') && !image.startsWith('https://')) return image

  try {
    return new URL(image).pathname
  } catch {
    return image
  }
}

function imageMetadata(image, page = {}) {
  const metadata = imageMetadataByPath[imagePathFromUrl(image)]

  return {
    width: metadata?.width,
    height: metadata?.height,
    type: metadata?.type,
    alt: page.imageAlt ?? metadata?.alt ?? defaultImageAlt,
  }
}

function publishedDateTime(date) {
  return date ? `${date}T00:00:00-03:00` : undefined
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

export function renderLandingBody() {
  return `
    <main>
      <section>
        <h1>Encontre cuidadores de idosos perto de você com transparência e calma</h1>
        <p>A icuide conecta famílias a profissionais de cuidado, com perfis organizados, informações claras e contato direto para combinar a rotina.</p>
        <p><a href="/onboarding?type=family">Buscar cuidadores de idosos pelo CEP</a></p>
      </section>
      <section>
        <h2>Como a icuide ajuda famílias</h2>
        ${list([
          'Compare profissionais por experiência, disponibilidade, região e referências.',
          'Converse antes de avançar e alinhe expectativas sobre rotina, valores e cuidado.',
          'Use guias e informações do perfil para decidir com mais segurança.',
        ])}
      </section>
      <section>
        <h2>Guias para contratar cuidadores de idosos com mais confiança</h2>
        ${renderPostLinks()}
      </section>
      <section>
        <h2>Cidades atendidas pela icuide</h2>
        <ul>
          ${localPages
            .map(
              (page) => `
                <li>
                  <a href="${escapeHtml(page.path)}/">${escapeHtml(page.h1)}</a>
                </li>
              `,
            )
            .join('')}
        </ul>
      </section>
      <section>
        <h2>Perguntas frequentes sobre cuidadores de idosos</h2>
        <h3>Quem faz a contratação do profissional?</h3>
        <p>A contratação, o vínculo e o pagamento do atendimento são definidos diretamente entre família e profissional.</p>
        <h3>O cadastro do cuidador é gratuito?</h3>
        <p>Sim. Profissionais podem criar perfil gratuitamente e apresentar experiência, documentos, disponibilidade e referências.</p>
      </section>
    </main>
  `
}

export function renderAboutBody() {
  return `
    <main>
      <section>
        <h1>Sobre a icuide</h1>
        <p>A icuide nasceu para aproximar famílias que precisam de apoio no cuidado com idosos e profissionais que desejam apresentar seu trabalho com clareza.</p>
        <p>A plataforma organiza informações importantes para a decisão: experiência, disponibilidade, valores de referência, documentos, certificações e referências.</p>
      </section>
      <section>
        <h2>O que fazemos</h2>
        <p>Facilitamos a conexão inicial entre famílias e cuidadores de idosos. A conversa, a contratação, o vínculo e o pagamento do serviço são combinados diretamente entre as partes.</p>
      </section>
      <section>
        <h2>Compromissos da plataforma</h2>
        ${list([
          'Transparência nas informações apresentadas em perfis e planos.',
          'Autonomia para famílias e profissionais conversarem antes de decidir.',
          'Conteúdo educativo para orientar decisões sobre cuidado domiciliar.',
        ])}
      </section>
      <section>
        <h2>Contato</h2>
        <p>Fale com a icuide pelo e-mail contato@icuide.com.br ou pelo telefone (12) 98852-7053.</p>
      </section>
    </main>
  `
}

export function renderCaregiverLandingBody() {
  return `
    <main>
      <section>
        <h1>Crie seu perfil gratuito de cuidador de idosos</h1>
        <p>Apresente experiência, formação, especialidades, valores, disponibilidade, documentos e referências em um perfil claro para famílias.</p>
        <p><a href="/onboarding?type=caregiver">Criar perfil grátis</a></p>
      </section>
      <section>
        <h2>Como funciona para profissionais</h2>
        ${list([
          'Crie sua conta gratuita.',
          'Complete perfil, valores e disponibilidade.',
          'Receba solicitações e converse com famílias antes de aceitar.',
        ])}
      </section>
      <section>
        <h2>Dicas para cuidadores</h2>
        ${renderPostLinks('cuidadores')}
      </section>
    </main>
  `
}

export function renderBlogIndexBody() {
  return `
    <main>
      <section>
        <h1>Blog da icuide: guias sobre cuidadores de idosos</h1>
        <p>Conteúdos objetivos para famílias que precisam escolher um profissional e para cuidadores que querem apresentar melhor sua experiência.</p>
      </section>
      <section>
        <h2>Guias recentes</h2>
        ${renderPostLinks()}
      </section>
    </main>
  `
}

export function renderLocalCarePageBody(page) {
  return `
    <main>
      <section>
        <p>${escapeHtml(page.areaLabel)}</p>
        <h1>${escapeHtml(page.h1)}</h1>
        <p>${escapeHtml(page.intro)}</p>
        <p>${escapeHtml(page.proof)}</p>
        <p>${escapeHtml(page.searchIntent)}</p>
        <p><a href="/onboarding?type=family">Buscar cuidadores pelo CEP</a></p>
      </section>
      <section>
        <h2>O que você consegue avaliar na icuide</h2>
        ${list([
          'Experiência profissional e tipos de cuidado realizados.',
          'Referências profissionais disponíveis no perfil.',
          'Antecedentes quando informados pelo cuidador.',
          'Documentos, certificações, disponibilidade, região atendida e valores de referência.',
        ])}
      </section>
      <section>
        <h2>Formatos de atendimento procurados</h2>
        ${list(page.formats)}
      </section>
      <section>
        <h2>Regiões e bairros</h2>
        ${list(page.neighborhoods)}
      </section>
      <section>
        <h2>Como escolher com mais segurança</h2>
        ${list([
          'Descreva a rotina do idoso, horários críticos e tipo de apoio esperado.',
          'Busque cuidadores pelo CEP e confira se atendem sua região com regularidade.',
          'Compare experiência, referências, antecedentes, documentos, disponibilidade e valores.',
          'Converse com o profissional antes de combinar o primeiro atendimento.',
          ...page.localNotes,
        ])}
      </section>
      <section>
        <h2>Perguntas frequentes</h2>
        ${page.faqs
          .map(
            (faq) => `
              <h3>${escapeHtml(faq.question)}</h3>
              <p>${escapeHtml(faq.answer)}</p>
            `,
          )
          .join('')}
      </section>
    </main>
  `
}

export function renderBlogPostBody(post) {
  const relatedPosts = (post.relatedSlugs ?? [])
    .map((slug) => blogPosts.find((relatedPost) => relatedPost.slug === slug))
    .filter(Boolean)

  const renderLinkedParagraph = (paragraph) => {
    const links = post.inlineLinks ?? []
    const lowerParagraph = paragraph.toLocaleLowerCase('pt-BR')
    const matches = links
      .flatMap((link) => {
        const lowerLinkText = link.text.toLocaleLowerCase('pt-BR')
        const foundMatches = []
        let startIndex = 0

        while (startIndex < paragraph.length) {
          const index = lowerParagraph.indexOf(lowerLinkText, startIndex)
          if (index < 0) break

          foundMatches.push({ ...link, index })
          startIndex = index + link.text.length
        }

        return foundMatches
      })
      .sort((first, second) => first.index - second.index)

    let cursor = 0
    let html = ''

    for (const match of matches) {
      if (match.index < cursor) continue

      html += escapeHtml(paragraph.slice(cursor, match.index))
      html += `<a href="${escapeHtml(match.href)}">${escapeHtml(
        paragraph.slice(match.index, match.index + match.text.length),
      )}</a>`
      cursor = match.index + match.text.length
    }

    html += escapeHtml(paragraph.slice(cursor))
    return `<p>${html}</p>`
  }

  return `
    <main>
      <article>
        <p>${escapeHtml(post.category)} · ${escapeHtml(post.readingTime)}</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p>${escapeHtml(post.hero)}</p>
        ${post.sections
          .map(
            (section) => `
              <section>
                <h${section.level === 3 ? '3' : '2'}>${escapeHtml(section.heading)}</h${section.level === 3 ? '3' : '2'}>
                ${section.body.map((paragraph) => renderLinkedParagraph(paragraph)).join('')}
              </section>
            `,
          )
          .join('')}
        ${
          post.sourceLinks?.length
            ? `<section>
                <h2>Fontes oficiais consultadas</h2>
                <ul>
                  ${post.sourceLinks
                    .map(
                      (source) => `
                        <li>
                          <a href="${escapeHtml(source.href)}">${escapeHtml(source.label)}</a>
                        </li>
                      `,
                    )
                    .join('')}
                </ul>
              </section>`
            : ''
        }
        ${
          relatedPosts.length
            ? `<section>
                <h2>Leia também</h2>
                <ul>
                  ${relatedPosts
                    .map(
                      (relatedPost) => `
                        <li>
                          <a href="/blog/${escapeHtml(relatedPost.slug)}">${escapeHtml(relatedPost.title)}</a>
                        </li>
                      `,
                    )
                    .join('')}
                </ul>
              </section>`
            : ''
        }
        <p><a href="/blog">Voltar ao blog da icuide</a></p>
      </article>
    </main>
  `
}

function renderPostLinks(audience) {
  const posts =
    audience === 'cuidadores'
      ? blogPosts.filter((post) => post.audience === 'cuidadores' || post.category === 'Para profissionais')
      : blogPosts
  return `<ul>${posts
    .map(
      (post) => `
        <li>
          <a href="/blog/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a>
          <p>${escapeHtml(post.description)}</p>
        </li>
      `,
    )
    .join('')}</ul>`
}

function renderSchema(page) {
  const canonical = absoluteUrl(page.path)
  const graph = [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'icuide',
      url: siteUrl,
      logo: organizationLogo,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+55-12-98852-7053',
        contactType: 'customer support',
        areaServed: 'BR',
        availableLanguage: 'Portuguese',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: 'icuide',
      url: `${siteUrl}/`,
      inLanguage: 'pt-BR',
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
    },
    {
      '@type': 'Service',
      '@id': `${siteUrl}/#service`,
      name: 'Plataforma para encontrar cuidadores de idosos',
      serviceType: 'Conexão entre famílias e cuidadores de idosos',
      provider: {
        '@id': `${siteUrl}/#organization`,
      },
      areaServed: {
        '@type': 'Country',
        name: 'Brasil',
      },
      audience: {
        '@type': 'Audience',
        audienceType: 'Famílias que procuram cuidadores de idosos',
      },
      description:
        'A icuide conecta famílias a cuidadores de idosos, permitindo comparar perfis por experiência, referências, antecedentes quando disponíveis, disponibilidade, região e valores de referência.',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#softwareapplication`,
      name: 'icuide',
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      url: `${siteUrl}/`,
      inLanguage: 'pt-BR',
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/OnlineOnly',
        url: `${siteUrl}/`,
      },
      description:
        'Aplicação web para famílias buscarem cuidadores de idosos e para profissionais criarem perfis com experiência, documentos, referências, antecedentes quando disponíveis e disponibilidade.',
    },
    {
      '@type': page.type === 'article' ? 'Article' : 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: page.title,
      headline: page.title,
      description: page.description,
      image: page.image ?? defaultImage,
      datePublished: page.publishedAt,
      dateModified: page.publishedAt,
      author: {
        '@type': 'Organization',
        name: 'icuide',
      },
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
      isPartOf: {
        '@id': `${siteUrl}/#website`,
      },
    },
  ].filter(Boolean)

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  })
}

export function renderPageHtml(shellHtml, page) {
  const canonical = absoluteUrl(page.path)
  const description = escapeHtml(page.description)
  const title = escapeHtml(page.title)
  const type = page.type === 'article' ? 'article' : 'website'
  const image = page.image ?? defaultImage
  const metadata = imageMetadata(image, page)
  const imageAlt = escapeHtml(metadata.alt)
  const articlePublishedTime = publishedDateTime(page.publishedAt)
  const headTags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<link rel="canonical" href="${canonical}">`,
    '<meta name="robots" content="index,follow">',
    '<meta property="og:site_name" content="icuide">',
    '<meta property="og:locale" content="pt_BR">',
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:secure_url" content="${image}">`,
    metadata.type ? `<meta property="og:image:type" content="${metadata.type}">` : '',
    metadata.width ? `<meta property="og:image:width" content="${metadata.width}">` : '',
    metadata.height ? `<meta property="og:image:height" content="${metadata.height}">` : '',
    `<meta property="og:image:alt" content="${imageAlt}">`,
    page.type === 'article' && articlePublishedTime
      ? `<meta property="article:published_time" content="${articlePublishedTime}">`
      : '',
    page.type === 'article' && articlePublishedTime
      ? `<meta property="article:modified_time" content="${articlePublishedTime}">`
      : '',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${image}">`,
    `<meta name="twitter:image:alt" content="${imageAlt}">`,
    `<script type="application/ld+json" data-seo="page">${renderSchema(page).replaceAll('<', '\\u003c')}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ')

  const withoutTitle = shellHtml.replace(/<title>[\s\S]*?<\/title>\s*/i, '')
  const withoutSeoTags = withoutTitle
    .replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']robots["'][^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi, '')
    .replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '')

  return withoutSeoTags
    .replace('</head>', `    ${headTags}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"></div>\n    <noscript data-seo-fallback>${page.bodyHtml}</noscript>`)
}

export function renderSitemap() {
  const urls = [
    ...publicRoutes.map((route) => ({ path: route.path, lastmod: '2026-07-02' })),
    ...localPages.map((page) => ({ path: page.path, lastmod: '2026-07-16' })),
    ...blogPosts.map((post) => ({ path: `/blog/${post.slug}`, lastmod: post.publishedAt })),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${absoluteUrl(url.path)}</loc>
    <lastmod>${url.lastmod}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>
`
}

export function renderRedirects(currentRedirects) {
  const staticPaths = [
    ...publicRoutes.map((route) => route.path),
    ...localPages.map((page) => page.path),
    ...blogPosts.map((post) => `/blog/${post.slug}`),
  ].filter((path) => path !== '/')

  const existingLines = currentRedirects
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const lines = [...existingLines]

  for (const path of staticPaths) {
    const redirectLine = `${path} ${path}/index.html 200`
    if (!lines.includes(redirectLine)) lines.push(redirectLine)
  }

  return `${lines.join('\n')}\n`
}

function writeRoute(shellHtml, page) {
  const outputPath = page.path === '/' ? join(distDir, 'index.html') : join(distDir, page.path.replace(/^\//, ''), 'index.html')
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, renderPageHtml(shellHtml, page), 'utf8')
}

export function writeSeoFiles() {
  const shellPath = join(distDir, 'index.html')
  if (!existsSync(shellPath)) {
    throw new Error('dist/index.html not found. Run vite build before generating SEO pages.')
  }

  const shellHtml = readFileSync(shellPath, 'utf8')

  for (const route of publicRoutes) {
    writeRoute(shellHtml, {
      path: route.path,
      title: route.title,
      description: route.description,
      bodyHtml: route.body(),
    })
  }

  for (const page of localPages) {
    writeRoute(shellHtml, {
      path: page.path,
      title: page.title,
      description: page.description,
      bodyHtml: renderLocalCarePageBody(page),
    })
  }

  for (const post of blogPosts) {
    writeRoute(shellHtml, {
      path: `/blog/${post.slug}`,
      title: `${post.title} | icuide`,
      description: post.description,
      bodyHtml: renderBlogPostBody(post),
      type: 'article',
      publishedAt: post.publishedAt,
      image: post.imagePath ? absoluteUrl(post.imagePath) : undefined,
    })
  }

  writeFileSync(join(distDir, 'sitemap.xml'), renderSitemap(), 'utf8')
  const robotsPath = join(distDir, 'robots.txt')
  const currentRobots = existsSync(robotsPath) ? readFileSync(robotsPath, 'utf8').trim() : 'User-agent: *\nAllow: /'
  const sitemapLine = `Sitemap: ${siteUrl}/sitemap.xml`
  const robots = currentRobots.includes(sitemapLine) ? currentRobots : `${currentRobots}\n\n${sitemapLine}`
  writeFileSync(robotsPath, `${robots}\n`, 'utf8')

  const redirectsPath = join(distDir, '_redirects')
  const currentRedirects = existsSync(redirectsPath) ? readFileSync(redirectsPath, 'utf8').trim() : ''
  writeFileSync(redirectsPath, renderRedirects(currentRedirects), 'utf8')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeSeoFiles()
}
