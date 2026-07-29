import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { getBlogPost, latestBlogPosts } from '@/data/blogPosts'
import { useSeo } from '@/hooks/useSeo'

function renderLinkedText(text: string, links: Array<{ text: string; href: string }> = []) {
  const matches = links
    .map((link) => {
      const index = text.toLocaleLowerCase('pt-BR').indexOf(link.text.toLocaleLowerCase('pt-BR'))
      return index >= 0 ? { ...link, index } : undefined
    })
    .filter(Boolean)
    .sort((first, second) => first!.index - second!.index)

  const nodes: ReactNode[] = []
  let cursor = 0

  for (const match of matches) {
    if (!match || match.index < cursor) continue

    const linkText = text.slice(match.index, match.index + match.text.length)
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index))
    nodes.push(
      <Link
        key={`${match.href}-${match.index}`}
        to={match.href}
        className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      >
        {linkText}
      </Link>,
    )
    cursor = match.index + match.text.length
  }

  if (cursor < text.length) nodes.push(text.slice(cursor))

  return nodes.length > 0 ? nodes : text
}

const BlogPost = () => {
  const { slug } = useParams()
  const post = slug ? getBlogPost(slug) : undefined

  useSeo({
    title: post ? `${post.title} | icuide` : 'Guia não encontrado | icuide',
    description: post?.description ?? 'Conteúdos práticos da icuide sobre cuidado para idosos.',
  })

  if (!post) return <Navigate to="/blog" replace />

  const relatedPosts = (
    post.relatedSlugs?.map((relatedSlug) => getBlogPost(relatedSlug)).filter(Boolean) ??
    latestBlogPosts.filter((item) => item.slug !== post.slug)
  ).slice(0, 3)
  const nextStepDescription =
    post.audience === 'cuidadores'
      ? 'Use o guia para organizar melhor seu perfil e avance quando quiser se apresentar para famílias.'
      : 'Use o guia para comparar melhor e avance quando quiser ver profissionais disponíveis.'

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <article>
          <header className="py-12 md:py-16 bg-echo-blue">
            <div className="container mx-auto px-6 md:px-10">
              <div className="max-w-3xl">
                <Button asChild variant="ghost" className="mb-6 -ml-3 text-muted-foreground hover:text-foreground">
                  <Link to="/blog">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao blog
                  </Link>
                </Button>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span className="font-semibold text-primary">{post.category}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readingTime}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight mb-4">
                  {post.title}
                </h1>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{post.hero}</p>
              </div>
              <img
                src={post.image.src}
                alt={post.image.alt}
                className="mt-8 h-64 md:h-96 w-full max-w-4xl rounded-xl object-cover shadow-card"
                style={{ objectPosition: post.image.position }}
              />
            </div>
          </header>

          <div className="container mx-auto px-6 md:px-10 py-10 md:py-14">
            <div className="mx-auto max-w-3xl">
              <div className="space-y-8">
                {post.sections.map((section) => (
                  <section key={section.heading} className="space-y-4">
                    {section.level === 3 ? (
                      <h3 className="text-lg md:text-xl font-semibold text-foreground leading-snug">{section.heading}</h3>
                    ) : (
                      <h2 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">{section.heading}</h2>
                    )}
                    <div className="space-y-4">
                      {section.body.map((paragraph) => (
                        <p key={paragraph} className="text-sm md:text-base text-muted-foreground leading-7 md:leading-8">
                          {renderLinkedText(paragraph, post.inlineLinks)}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}

                {post.sourceLinks && post.sourceLinks.length > 0 && (
                  <section className="space-y-4 border-t border-border/40 pt-8">
                    <h2 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
                      Fontes oficiais consultadas
                    </h2>
                    <div className="space-y-3">
                      {post.sourceLinks.map((source) => (
                        <a
                          key={source.href}
                          href={source.href}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-sm md:text-base text-primary underline underline-offset-4 hover:text-primary/80"
                        >
                          {source.label}
                        </a>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="mt-12 space-y-8 border-t border-border/40 pt-8">
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Próximo passo</h2>
                  <p className="text-sm md:text-base text-muted-foreground leading-7 mb-4">
                    {nextStepDescription}
                  </p>
                  <Button asChild className="h-auto min-h-11 rounded-lg bg-accent px-4 py-2 text-accent-foreground hover:bg-accent/90 whitespace-normal">
                    <Link to={post.cta.href} className="flex items-center justify-center gap-2 text-center leading-snug">
                      <span className="min-w-0 break-words">{post.cta.label}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </Link>
                  </Button>
                </section>

                {relatedPosts.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Outros guias</h2>
                    <div className="space-y-4">
                      {relatedPosts.map((related) => (
                        <Link
                          key={related.slug}
                          to={`/blog/${related.slug}`}
                          className="block group"
                        >
                          <span className="text-xs font-semibold text-primary">{related.category}</span>
                          <h3 className="text-sm font-semibold text-foreground mt-1 group-hover:text-primary transition-colors">
                            {related.title}
                          </h3>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}

export default BlogPost
