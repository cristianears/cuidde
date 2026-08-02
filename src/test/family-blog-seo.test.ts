import { describe, expect, it } from 'vitest'
import { blogPosts } from '@/data/blogPosts'

const familySearchSlugs = [
  'preco-cuidador-de-idoso-tabela-atualizada-2026',
  'como-contratar-cuidador-de-idoso-com-seguranca',
  'quanto-custa-cuidador-de-idosos',
  'cuidador-de-idosos-por-hora-diaria-ou-plantao',
  'cuidador-de-idosos-noturno',
  'cuidador-para-idoso-com-alzheimer',
  'cuidador-de-idosos-em-sao-jose-dos-campos',
  'cuidador-de-idosos-no-vale-do-paraiba',
]

describe('family blog SEO articles', () => {
  it('publishes family articles for high-intent caregiver searches', () => {
    const posts = familySearchSlugs.map((slug) => blogPosts.find((post) => post.slug === slug))

    expect(posts.every(Boolean)).toBe(true)

    for (const post of posts) {
      expect(post?.audience).toBe('familias')
      expect(post?.title.toLowerCase()).toContain('cuidador')
      expect(post?.cta.href).toBe('/onboarding?type=family')
      expect(post?.sections.length).toBeGreaterThanOrEqual(5)
      expect(post?.title.toLowerCase()).not.toContain('vagas')
      expect(post?.image.src).toContain('/src/assets/blog/family-care-')
      expect(post?.image.src).toContain('.webp')
      expect(post?.sections.flatMap((section) => section.body).join(' ').split(/\s+/).length).toBeGreaterThan(350)
      expect(post?.relatedSlugs?.length).toBeGreaterThanOrEqual(3)
    }

    expect(posts[0]?.title).toContain('Preço')
    expect(posts[1]?.title).toContain('Como contratar')
    expect(posts[2]?.title).toContain('Quanto custa')
    expect(posts[3]?.title).toContain('por hora')
    expect(posts[4]?.title).toContain('noturno')
    expect(posts[5]?.title).toContain('Alzheimer')
    expect(posts[6]?.title).toContain('São José dos Campos')
    expect(posts[7]?.title).toContain('Vale do Paraíba')

    const imageSources = posts.map((post) => post?.image.src)

    expect(new Set(imageSources).size).toBe(familySearchSlugs.length)
    expect(posts[0]?.sourceLinks?.some((source) => source.href.includes('coren-sp.gov.br'))).toBe(true)
    expect(posts[1]?.sourceLinks?.some((source) => source.href.includes('planalto.gov.br'))).toBe(true)
  })

  it('includes the same family articles in the static SEO generator', async () => {
    const { blogPosts: seoPosts, renderSitemap } = await import('../../scripts/seo-pages.mjs')
    const sitemap = renderSitemap()

    for (const slug of familySearchSlugs) {
      const seoPost = seoPosts.find((post) => post.slug === slug)

      expect(seoPost).toBeTruthy()
      expect(seoPost?.title.toLowerCase()).toContain('cuidador')
      expect(seoPost?.imagePath).toContain('/blog/family-care-')
      expect(seoPost?.imagePath).toContain('.jpg')
      expect(seoPost?.relatedSlugs?.length).toBeGreaterThanOrEqual(3)
      expect(sitemap).toContain(`https://www.icuide.com.br/blog/${slug}/`)
    }

    expect(
      seoPosts.find((post) => post.slug === 'cuidador-de-idosos-em-sao-jose-dos-campos')?.sections[1].body.join(' '),
    ).toContain('perfil de vários cuidadores')
    expect(
      seoPosts.find((post) => post.slug === 'cuidador-de-idosos-no-vale-do-paraiba')?.sections[1].body.join(' '),
    ).toContain('perfis de vários cuidadores')
  })
})
