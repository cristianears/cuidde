import { describe, expect, it } from 'vitest'

describe('SEO static page generator', () => {
  it('publishes a sitemap with only public marketing and blog URLs', async () => {
    const { renderSitemap, publicRoutes, blogPosts } = await import('../../scripts/seo-pages.mjs')

    const sitemap = renderSitemap()

    expect(sitemap).toContain('<loc>https://www.icuide.com.br/</loc>')
    expect(sitemap).toContain('<loc>https://www.icuide.com.br/sobre</loc>')
    expect(sitemap).toContain('<loc>https://www.icuide.com.br/para-cuidadores</loc>')
    expect(sitemap).toContain('<loc>https://www.icuide.com.br/blog</loc>')

    for (const post of blogPosts) {
      expect(sitemap).toContain(`<loc>https://www.icuide.com.br/blog/${post.slug}</loc>`)
      expect(sitemap).toContain(`<lastmod>${post.publishedAt}</lastmod>`)
    }

    expect(publicRoutes.every((route) => route.indexable)).toBe(true)
    expect(sitemap).not.toContain('/family')
    expect(sitemap).not.toContain('/caregiver')
    expect(sitemap).not.toContain('/admin')
    expect(sitemap).not.toContain('/login')
    expect(sitemap).not.toContain('/onboarding')
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
