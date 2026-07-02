import { describe, expect, it } from 'vitest'
import { blogPosts } from '@/data/blogPosts'

const localCaregiverSlugs = [
  'vagas-cuidador-idosos-sao-jose-dos-campos',
  'vagas-cuidador-idosos-jacarei',
  'vagas-cuidador-idosos-vale-do-paraiba',
]

describe('local caregiver blog SEO articles', () => {
  it('publishes caregiver articles for local vagas searches', () => {
    const posts = localCaregiverSlugs.map((slug) => blogPosts.find((post) => post.slug === slug))

    expect(posts.every(Boolean)).toBe(true)

    for (const post of posts) {
      expect(post?.audience).toBe('cuidadores')
      expect(post?.title.toLowerCase()).toContain('vagas')
      expect(post?.title.toLowerCase()).toContain('cuidador')
      expect(post?.cta.href).toBe('/para-cuidadores')
      expect(post?.sections.length).toBeGreaterThanOrEqual(3)
    }

    expect(posts[0]?.title).toContain('São José dos Campos')
    expect(posts[1]?.title).toContain('Jacareí')
    expect(posts[2]?.title).toContain('Vale do Paraíba')

    const imageSources = posts.map((post) => post?.image.src)

    expect(new Set(imageSources).size).toBe(localCaregiverSlugs.length)
  })

  it('includes the same caregiver articles in the static SEO generator', async () => {
    const { blogPosts: seoPosts, renderSitemap } = await import('../../scripts/seo-pages.mjs')
    const sitemap = renderSitemap()

    for (const slug of localCaregiverSlugs) {
      const seoPost = seoPosts.find((post) => post.slug === slug)

      expect(seoPost).toBeTruthy()
      expect(seoPost?.title.toLowerCase()).toContain('vagas')
      expect(sitemap).toContain(`https://www.icuide.com.br/blog/${slug}`)
    }
  })
})
