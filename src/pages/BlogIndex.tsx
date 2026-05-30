import { ArrowRight, BookOpen, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { blogPosts } from '@/data/blogPosts'
import { useSeo } from '@/hooks/useSeo'

const BlogIndex = () => {
  useSeo({
    title: 'Guias para famílias e cuidadores | icuide',
    description:
      'Conteúdos práticos para escolher cuidadores de idosos, comparar perfis e criar uma rotina de cuidado com mais clareza.',
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <section className="py-12 md:py-16 bg-echo-blue">
          <div className="container mx-auto px-6 md:px-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary mb-4">
                <BookOpen className="w-4 h-4" />
                Blog da icuide
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                Guias para decidir sobre cuidado com mais calma
              </h1>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
                Conteúdos objetivos para famílias que precisam escolher um profissional e para cuidadores que querem apresentar melhor sua experiência.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="container mx-auto px-6 md:px-10">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {blogPosts.map((post) => (
                <article
                  key={post.slug}
                  className="bg-card rounded-xl border border-border/40 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col"
                >
                  <img
                    src={post.image.src}
                    alt={post.image.alt}
                    className="h-40 w-full object-cover"
                    style={{ objectPosition: post.image.position }}
                    loading="lazy"
                  />
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="text-xs font-semibold text-primary">{post.category}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readingTime}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-foreground leading-snug mb-3">{post.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">{post.description}</p>
                    <Button asChild variant="outline" className="mt-5 rounded-lg">
                      <Link to={`/blog/${post.slug}`}>
                        Ler guia
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default BlogIndex
