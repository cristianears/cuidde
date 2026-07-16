import { describe, expect, it } from 'vitest'

describe('SEO static page generator', () => {
  it('publishes a sitemap with only public marketing and blog URLs', async () => {
    const { renderSitemap, publicRoutes, localPages, blogPosts } = await import('../../scripts/seo-pages.mjs')

    const sitemap = renderSitemap()

    expect(sitemap).toContain('<loc>https://www.icuide.com.br/</loc>')
    expect(sitemap).toContain('<loc>https://www.icuide.com.br/sobre</loc>')
    expect(sitemap).toContain('<loc>https://www.icuide.com.br/para-cuidadores</loc>')
    expect(sitemap).toContain('<loc>https://www.icuide.com.br/cuidador-de-idosos-sao-jose-dos-campos</loc>')
    expect(sitemap).toContain('<loc>https://www.icuide.com.br/cuidador-de-idosos-jacarei</loc>')
    expect(sitemap).toContain('<loc>https://www.icuide.com.br/cuidador-de-idosos-vale-do-paraiba</loc>')
    expect(sitemap).toContain('<loc>https://www.icuide.com.br/cuidador-noturno-sao-jose-dos-campos</loc>')
    expect(sitemap).toContain('<loc>https://www.icuide.com.br/blog</loc>')

    for (const post of blogPosts) {
      expect(sitemap).toContain(`<loc>https://www.icuide.com.br/blog/${post.slug}</loc>`)
      expect(sitemap).toContain(`<lastmod>${post.publishedAt}</lastmod>`)
    }

    expect(publicRoutes.every((route) => route.indexable)).toBe(true)
    expect(localPages.length).toBeGreaterThan(0)
    expect(sitemap).not.toContain('/family')
    expect(sitemap).not.toContain('/caregiver')
    expect(sitemap).not.toContain('/admin')
    expect(sitemap).not.toContain('/login')
    expect(sitemap).not.toContain('/onboarding')
  })

  it('renders local care pages with hiring-intent content and trust signals', async () => {
    const { renderPageHtml, renderLocalCarePageBody, localPages } = await import('../../scripts/seo-pages.mjs')
    const shell = '<!doctype html><html><head><title>Old</title></head><body><div id="root"></div></body></html>'
    const page = localPages.find((item) => item.path === '/cuidador-de-idosos-sao-jose-dos-campos')

    const html = renderPageHtml(shell, {
      path: page.path,
      title: page.title,
      description: page.description,
      bodyHtml: renderLocalCarePageBody(page),
    })

    expect(html).toContain('<title>Cuidador de idosos em São José dos Campos | iCuide</title>')
    expect(html).toContain('contratar cuidador de idosos')
    expect(html).toContain('cuidador de idosos por hora')
    expect(html).toContain('plantão de cuidador de idosos')
    expect(html).toContain('Experiência profissional')
    expect(html).toContain('Referências profissionais')
    expect(html).toContain('Antecedentes')
    expect(html).toContain('Buscar cuidadores pelo CEP')
  })

  it('resolves local care pages with or without trailing slash', async () => {
    const { getLocalCarePageByPath } = await import('../data/localCarePages.js')

    expect(getLocalCarePageByPath('/cuidador-de-idosos-sao-jose-dos-campos')?.city).toBe('São José dos Campos')
    expect(getLocalCarePageByPath('/cuidador-de-idosos-sao-jose-dos-campos/')?.city).toBe('São José dos Campos')
  })

  it('renders route-specific metadata and crawlable blog article content', async () => {
    const { renderPageHtml, blogPosts } = await import('../../scripts/seo-pages.mjs')
    const shell = '<!doctype html><html><head><title>Old</title><meta name="description" content="Old"></head><body><div id="root"></div></body></html>'
    const post = blogPosts[0]

    const html = renderPageHtml(shell, {
      path: `/blog/${post.slug}`,
      title: `${post.title} | icuide`,
      description: post.description,
      bodyHtml: `<article><h1>${post.title}</h1><h2>${post.sections[0].heading}</h2><p>${post.sections[0].body[0]}</p></article>`,
      type: 'article',
      publishedAt: post.publishedAt,
    })

    expect(html).toContain(`<title>${post.title} | icuide</title>`)
    expect(html).toContain(`content="${post.description}"`)
    expect(html).toContain(`href="https://www.icuide.com.br/blog/${post.slug}"`)
    expect(html).toContain('<article')
    expect(html).toContain(post.sections[0].heading)
    expect(html).toContain('application/ld+json')
    expect(html).toContain('"@type":"Article"')
  })

  it('renders parseable structured data for organization, website, service and software app', async () => {
    const { renderPageHtml } = await import('../../scripts/seo-pages.mjs')
    const shell = '<!doctype html><html><head><title>Old</title></head><body><div id="root"></div></body></html>'

    const html = renderPageHtml(shell, {
      path: '/',
      title: 'icuide',
      description: 'Plataforma para encontrar cuidadores de idosos',
      bodyHtml: '<main><h1>icuide</h1></main>',
    })
    const schema = html.match(/<script type="application\/ld\+json" data-seo="page">([\s\S]*?)<\/script>/)?.[1]
    const parsed = JSON.parse(schema ?? '{}')
    const types = parsed['@graph'].map((item) => item['@type'])

    expect(types).toContain('Organization')
    expect(types).toContain('WebSite')
    expect(types).toContain('Service')
    expect(types).toContain('SoftwareApplication')
    expect(types).toContain('WebPage')
    expect(JSON.stringify(parsed)).toContain('experiência')
    expect(JSON.stringify(parsed)).toContain('referências')
    expect(JSON.stringify(parsed)).toContain('antecedentes')
  })

  it('keeps static SEO body out of the visible React root to avoid a text-only loading flash', async () => {
    const { renderPageHtml } = await import('../../scripts/seo-pages.mjs')
    const shell = '<!doctype html><html><head><title>Old</title></head><body><div id="root"></div></body></html>'

    const html = renderPageHtml(shell, {
      path: '/',
      title: 'icuide',
      description: 'Encontre cuidadores de idosos',
      bodyHtml: '<main><h1>Texto estatico SEO</h1><p>Fallback para indexacao.</p></main>',
    })

    expect(html).toContain('<div id="root"></div>')
    expect(html).not.toContain('<div id="root"><main>')
    expect(html).toContain('<noscript data-seo-fallback>')
    expect(html).toContain('<h1>Texto estatico SEO</h1>')
  })

  it('generates Cloudflare redirects for static SEO routes without trailing slashes', async () => {
    const { renderRedirects } = await import('../../scripts/seo-pages.mjs')

    const redirects = renderRedirects('/privacy /privacy/index.html 200')

    expect(redirects).toContain('/cuidador-de-idosos-sao-jose-dos-campos /cuidador-de-idosos-sao-jose-dos-campos/index.html 200')
    expect(redirects).toContain('/cuidador-de-idosos-jacarei /cuidador-de-idosos-jacarei/index.html 200')
    expect(redirects).toContain('/blog/quanto-custa-cuidador-de-idosos /blog/quanto-custa-cuidador-de-idosos/index.html 200')
    expect(redirects).toContain('/privacy /privacy/index.html 200')
  })

  it('links local care pages from the static landing SEO body', async () => {
    const { renderLandingBody } = await import('../../scripts/seo-pages.mjs')

    const html = renderLandingBody()

    expect(html).toContain('Cidades atendidas pela icuide')
    expect(html).toContain('href="/cuidador-de-idosos-sao-jose-dos-campos/"')
    expect(html).toContain('href="/cuidador-de-idosos-jacarei/"')
    expect(html).toContain('href="/cuidador-de-idosos-vale-do-paraiba/"')
    expect(html).toContain('href="/cuidador-noturno-sao-jose-dos-campos/"')
  })

  it('keeps CEP and pricing flows out of the static SEO generator', async () => {
    const { renderLandingBody, renderCaregiverLandingBody } = await import('../../scripts/seo-pages.mjs')

    const landing = renderLandingBody()
    const caregivers = renderCaregiverLandingBody()

    expect(landing).toContain('Encontre cuidadores de idosos')
    expect(landing).toContain('/onboarding?type=family')
    expect(caregivers).toContain('/onboarding?type=caregiver')
    expect(landing).not.toContain('getLandingCepTarget')
    expect(landing).not.toContain('cleanCep')
    expect(landing).not.toContain('formatCep')
    expect(landing).not.toContain('checkout')
    expect(landing).not.toContain('Stripe')
  })
})
