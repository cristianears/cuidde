import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { getBlogPost, latestBlogPosts } from '@/data/blogPosts'
import { useSeo } from '@/hooks/useSeo'

const BlogPost = () => {
  const { slug } = useParams()
  const post = slug ? getBlogPost(slug) : undefined

  useSeo({
    title: post ? `${post.title} | icuide` : 'Guia não encontrado | icuide',
    description: post?.description ?? 'Conteúdos práticos da icuide sobre cuidado para idosos.',
  })

  if (!post) return <Navigate to="/blog" replace />

  const relatedPosts = latestBlogPosts.filter((item) => item.slug !== post.slug).slice(0, 2)

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
            <div className="grid lg:grid-cols-[minmax(0,720px)_300px] gap-8 lg:gap-12 items-start">
              <div className="space-y-9">
                {post.sections.map((section) => (
                  <section key={section.heading} className="bg-card rounded-xl border border-border/40 shadow-card p-5 md:p-7">
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4">{section.heading}</h2>
                    <div className="space-y-4">
                      {section.body.map((paragraph) => (
                        <p key={paragraph} className="text-sm md:text-base text-muted-foreground leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <aside className="lg:sticky lg:top-24 space-y-4">
                <div className="bg-card rounded-xl border border-border/40 shadow-card p-5">
                  <h2 className="text-base font-semibold text-foreground mb-2">Próximo passo</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Use o guia para comparar melhor e avance quando quiser ver profissionais disponíveis.
                  </p>
                  <Button asChild className="h-auto min-h-11 w-full rounded-lg bg-accent px-3 py-2 text-accent-foreground hover:bg-accent/90 whitespace-normal">
                    <Link to={post.cta.href} className="flex items-center justify-center gap-2 text-center leading-snug">
                      <span className="min-w-0 break-words">{post.cta.label}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </Link>
                  </Button>
                </div>

                {relatedPosts.length > 0 && (
                  <div className="bg-card rounded-xl border border-border/40 shadow-card p-5">
                    <h2 className="text-base font-semibold text-foreground mb-4">Outros guias</h2>
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
                  </div>
                )}
              </aside>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}

export default BlogPost
