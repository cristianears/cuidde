import caregiversImage from '@/assets/caregivers-card-image.jpg'
import caregiverJobsJacareiImage from '@/assets/blog/caregiver-jobs-jacarei.jpg'
import caregiverJobsSaoJoseImage from '@/assets/blog/caregiver-jobs-sao-jose-dos-campos.jpg'
import caregiverJobsValeImage from '@/assets/blog/caregiver-jobs-vale-do-paraiba.jpg'
import familyCareAlzheimerImage from '@/assets/blog/family-care-alzheimer.jpg'
import familyCareCostsImage from '@/assets/blog/family-care-costs.jpg'
import familyCareHiringSafetyImage from '@/assets/blog/family-care-hiring-safety.jpg'
import familyCareNightImage from '@/assets/blog/family-care-night.jpg'
import familyCarePrice2026Image from '@/assets/blog/family-care-price-2026.jpg'
import familyCareSaoJoseImage from '@/assets/blog/family-care-sao-jose-dos-campos.jpg'
import familyCareScheduleImage from '@/assets/blog/family-care-schedule.jpg'
import familyCareValeImage from '@/assets/blog/family-care-vale-do-paraiba.jpg'
import familiesImage from '@/assets/families-card-image.jpg'
import heroImage from '@/assets/hero-bg.jpg'
import { blogPostContent } from './blogContent'

export type BlogPost = {
  slug: string
  title: string
  description: string
  audience: 'familias' | 'cuidadores'
  category: string
  readingTime: string
  publishedAt: string
  image: {
    src: string
    alt: string
    position?: string
  }
  hero: string
  sections: Array<{
    heading: string
    level?: 2 | 3
    body: string[]
  }>
  relatedSlugs?: string[]
  inlineLinks?: Array<{
    text: string
    href: string
  }>
  sourceLinks?: Array<{
    label: string
    href: string
  }>
  cta: {
    label: string
    href: string
  }
}

const imagesBySlug: Record<string, BlogPost['image']> = {
  'preco-cuidador-de-idoso-tabela-atualizada-2026': {
    src: familyCarePrice2026Image,
    alt: 'Cuidadora aferindo a pressão de idoso em casa durante atendimento domiciliar',
    position: 'center',
  },
  'como-contratar-cuidador-de-idoso-com-seguranca': {
    src: familyCareHiringSafetyImage,
    alt: 'Cuidadora, familiar e idosa revisando combinados antes da contratação',
    position: 'center',
  },
  'vagas-cuidador-idosos-sao-jose-dos-campos': {
    src: caregiverJobsSaoJoseImage,
    alt: 'Cuidadora de idosos organizando seu perfil profissional em São José dos Campos',
    position: 'center top',
  },
  'vagas-cuidador-idosos-jacarei': {
    src: caregiverJobsJacareiImage,
    alt: 'Profissional de cuidado preparando informações para atender famílias em Jacareí',
    position: 'center top',
  },
  'vagas-cuidador-idosos-vale-do-paraiba': {
    src: caregiverJobsValeImage,
    alt: 'Cuidador de idosos organizando disponibilidade para atender no Vale do Paraíba',
    position: 'center top',
  },
  'quanto-custa-cuidador-de-idosos': {
    src: familyCareCostsImage,
    alt: 'Cuidadora ajudando idosa a revisar anotações de rotina e planejamento de custos em casa',
    position: 'center',
  },
  'cuidador-de-idosos-por-hora-diaria-ou-plantao': {
    src: familyCareScheduleImage,
    alt: 'Cuidadora e idoso organizando uma agenda de cuidados em ambiente familiar',
    position: 'center',
  },
  'cuidador-de-idosos-noturno': {
    src: familyCareNightImage,
    alt: 'Cuidadora oferecendo apoio tranquilo a idosa durante rotina noturna em casa',
    position: 'center',
  },
  'cuidador-para-idoso-com-alzheimer': {
    src: familyCareAlzheimerImage,
    alt: 'Cuidadora acompanhando idosa em atividade de memória com álbum de família',
    position: 'center',
  },
  'cuidador-de-idosos-em-sao-jose-dos-campos': {
    src: familyCareSaoJoseImage,
    alt: 'Família e cuidadora apoiando idosa com andador em casa',
    position: 'center',
  },
  'cuidador-de-idosos-no-vale-do-paraiba': {
    src: familyCareValeImage,
    alt: 'Cuidadora e familiar acompanhando idosa em casa com paisagem verde ao fundo',
    position: 'center',
  },
  'como-escolher-cuidador-de-idosos': {
    src: familiesImage,
    alt: 'Família conversando sobre cuidado domiciliar para idoso',
    position: 'center',
  },
  'perguntas-antes-de-contratar-cuidador': {
    src: heroImage,
    alt: 'Família analisando perguntas antes de contratar cuidado para idoso',
    position: 'center',
  },
  'como-montar-perfil-de-cuidador': {
    src: caregiversImage,
    alt: 'Profissional de cuidado apresentando seu perfil para famílias',
    position: 'center top',
  },
}

function getCta(audience: BlogPost['audience']) {
  return audience === 'cuidadores'
    ? {
        label: 'Criar perfil grátis',
        href: '/para-cuidadores',
      }
    : {
        label: 'Buscar cuidadores pelo CEP',
        href: '/onboarding?type=family',
      }
}

export const blogPosts: BlogPost[] = blogPostContent.map((post) => ({
  ...post,
  image: imagesBySlug[post.slug],
  cta: getCta(post.audience),
}))

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}

export const latestBlogPosts = [...blogPosts]
  .sort((first, second) => second.publishedAt.localeCompare(first.publishedAt))
  .slice(0, 3)
