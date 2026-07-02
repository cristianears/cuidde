import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')

export const siteUrl = 'https://www.icuide.com.br'
const defaultImage = `${siteUrl}/logo.png`

export const blogPosts = [
  {
    slug: 'como-escolher-cuidador-de-idosos',
    title: 'Como escolher um cuidador de idosos sem depender apenas de indicação',
    description:
      'Um guia prático para comparar experiência, disponibilidade, referências, documentos e combinados antes da primeira conversa.',
    category: 'Guia para famílias',
    readingTime: '5 min',
    publishedAt: '2026-05-26',
    hero:
      'Compare mais do que preço: entenda o tipo de cuidado, a rotina da família e os sinais de confiança antes de decidir.',
    sections: [
      {
        heading: 'Comece pela necessidade real do idoso',
        body: [
          'Antes de procurar um profissional, descreva a rotina que precisa de apoio: higiene, alimentação, mobilidade, companhia, medicação, acompanhamento noturno ou cuidados após uma alta hospitalar.',
          'Essa clareza ajuda a família a buscar alguém com experiência parecida, disponibilidade compatível e limites bem combinados desde o início.',
        ],
      },
      {
        heading: 'Compare sinais de confiança',
        body: [
          'Um perfil mais completo costuma trazer foto, bio, experiência, formação, modalidades de atendimento, valores de referência, disponibilidade, referências e documentos enviados pelo profissional.',
          'Nenhum dado isolado resolve a decisão. O mais importante é olhar o conjunto e conversar com calma antes de combinar qualquer atendimento.',
        ],
      },
      {
        heading: 'Faça perguntas objetivas',
        body: [
          'Pergunte sobre experiência com condições parecidas, rotina de plantão, deslocamento, valores, referências e o que o profissional faz em situações de urgência.',
          'Anote as respostas. Quando a família compara vários profissionais, detalhes pequenos ajudam a perceber quem combina melhor com a necessidade do idoso.',
        ],
      },
    ],
  },
  {
    slug: 'perguntas-antes-de-contratar-cuidador',
    title: 'Perguntas para fazer antes de contratar um cuidador',
    description:
      'Uma lista enxuta de perguntas para alinhar rotina, valores, experiência e expectativas antes do primeiro atendimento.',
    category: 'Checklist',
    readingTime: '4 min',
    publishedAt: '2026-05-26',
    hero: 'Boas perguntas reduzem ansiedade e evitam combinados confusos quando a família precisa decidir rápido.',
    sections: [
      {
        heading: 'Sobre experiência',
        body: [
          'Pergunte há quanto tempo a pessoa atua, com quais tipos de cuidado tem mais experiência e se já atendeu idosos com condições parecidas, como Alzheimer, Parkinson, mobilidade reduzida ou pós-operatório.',
          'Peça exemplos de rotina, sempre respeitando privacidade de famílias anteriores.',
        ],
      },
      {
        heading: 'Sobre disponibilidade e valores',
        body: [
          'Confirme dias, horários, formato de atendimento, deslocamento, valores por hora, diária ou plantão e o que está incluído nesse combinado.',
          'Também vale perguntar com antecedência como funcionam faltas, trocas de horário e necessidade de continuidade.',
        ],
      },
      {
        heading: 'Sobre comunicação com a família',
        body: [
          'Combine como a família será atualizada: mensagens, registros de rotina, ocorrências, alimentação, medicação informada pela família e mudanças percebidas durante o atendimento.',
          'Quanto mais claro for esse fluxo, menos insegurança aparece depois.',
        ],
      },
    ],
  },
  {
    slug: 'como-montar-perfil-de-cuidador',
    title: 'Como montar um perfil de cuidador que passa confiança',
    description:
      'Dicas para profissionais apresentarem experiência, especialidades, disponibilidade e referências com clareza.',
    category: 'Para profissionais',
    readingTime: '4 min',
    publishedAt: '2026-05-26',
    hero: 'Um perfil completo ajuda a família a entender seu trabalho antes da primeira conversa.',
    sections: [
      {
        heading: 'Escreva uma bio clara',
        body: [
          'Conte sua experiência de forma simples: tempo de atuação, tipos de cuidado que costuma realizar, regiões atendidas e qual postura profissional a família pode esperar.',
          'Evite prometer resultados. Foque no que você sabe fazer, na sua rotina de trabalho e nos cuidados em que tem mais segurança.',
        ],
      },
      {
        heading: 'Mostre informações que ajudam a comparar',
        body: [
          'Especialidades, modalidades de atendimento, valores de referência, disponibilidade e formação complementar deixam a escolha mais objetiva para a família.',
          'Documentos, certificações e referências também fortalecem o perfil quando estão atualizados e coerentes com sua experiência.',
        ],
      },
      {
        heading: 'Mantenha disponibilidade realista',
        body: [
          'Informe apenas horários e regiões que você consegue atender. Isso evita conversas frustradas e aumenta a chance de receber solicitações compatíveis.',
          'Responder com agilidade e profissionalismo também ajuda a construir confiança desde o primeiro contato.',
        ],
      },
    ],
  },
]

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

function absoluteUrl(path) {
  if (path === '/') return `${siteUrl}/`
  return `${siteUrl}${path}`
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

export function renderBlogPostBody(post) {
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
                <h2>${escapeHtml(section.heading)}</h2>
                ${section.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
              </section>
            `,
          )
          .join('')}
        <p><a href="/blog">Voltar ao blog da icuide</a></p>
      </article>
    </main>
  `
}

function renderPostLinks(audience) {
  const posts = audience === 'cuidadores' ? blogPosts.filter((post) => post.category === 'Para profissionais') : blogPosts
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
      logo: defaultImage,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+55-12-98852-7053',
        contactType: 'customer support',
        areaServed: 'BR',
        availableLanguage: 'Portuguese',
      },
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
  const headTags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<link rel="canonical" href="${canonical}">`,
    '<meta name="robots" content="index,follow">',
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${image}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${image}">`,
    `<script type="application/ld+json" data-seo="page">${renderSchema(page).replaceAll('<', '\\u003c')}</script>`,
  ].join('\n    ')

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

  for (const post of blogPosts) {
    writeRoute(shellHtml, {
      path: `/blog/${post.slug}`,
      title: `${post.title} | icuide`,
      description: post.description,
      bodyHtml: renderBlogPostBody(post),
      type: 'article',
      publishedAt: post.publishedAt,
    })
  }

  writeFileSync(join(distDir, 'sitemap.xml'), renderSitemap(), 'utf8')
  const robotsPath = join(distDir, 'robots.txt')
  const currentRobots = existsSync(robotsPath) ? readFileSync(robotsPath, 'utf8').trim() : 'User-agent: *\nAllow: /'
  const sitemapLine = `Sitemap: ${siteUrl}/sitemap.xml`
  const robots = currentRobots.includes(sitemapLine) ? currentRobots : `${currentRobots}\n\n${sitemapLine}`
  writeFileSync(robotsPath, `${robots}\n`, 'utf8')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeSeoFiles()
}
