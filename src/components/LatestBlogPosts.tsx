import { ArrowRight, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { latestBlogPosts } from '@/data/blogPosts'
import { Button } from '@/components/ui/button'

const LatestBlogPosts = () => {
  return (
    <section className="py-14 md:py-18 bg-echo-primary-soft relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-section-divider" />
      <div className="container mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary mb-3">
              <BookOpen className="w-4 h-4" />
              Guias da ditti
            </div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3 tracking-tight">
              Conteúdos para contratar cuidado com mais confiança
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Materiais curtos para ajudar famílias a comparar profissionais e orientar cuidadores na criação de um perfil mais completo.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full md:w-auto rounded-lg">
            <Link to="/blog">
              Ver todos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 lg:gap-5">
          {latestBlogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group bg-card rounded-xl border border-border/40 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col min-h-[300px]"
            >
              <img
                src={post.image.src}
                alt={post.image.alt}
                className="h-36 w-full object-cover"
                style={{ objectPosition: post.image.position }}
                loading="lazy"
              />
              <div className="p-5 flex flex-col flex-grow">
                <span className="text-xs font-semibold text-primary mb-3">{post.category}</span>
                <h3 className="text-base md:text-lg font-semibold text-foreground leading-snug mb-3 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed flex-grow">{post.description}</p>
                <span className="inline-flex items-center text-xs font-semibold text-accent mt-5">
                  Ler guia
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LatestBlogPosts
