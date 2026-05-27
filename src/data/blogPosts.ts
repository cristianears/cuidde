import caregiversImage from '@/assets/caregivers-card-image.jpg'
import familiesImage from '@/assets/families-card-image.jpg'
import heroImage from '@/assets/hero-bg.jpg'

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
    body: string[]
  }>
  cta: {
    label: string
    href: string
  }
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'como-escolher-cuidador-de-idosos',
    title: 'Como escolher um cuidador de idosos sem depender apenas de indicação',
    description:
      'Um guia prático para comparar experiência, disponibilidade, referências, documentos e combinados antes da primeira conversa.',
    audience: 'familias',
    category: 'Guia para famílias',
    readingTime: '5 min',
    publishedAt: '2026-05-26',
    image: {
      src: familiesImage,
      alt: 'Família conversando sobre cuidado domiciliar para idoso',
      position: 'center',
    },
    hero: 'Compare mais do que preço: entenda o tipo de cuidado, a rotina da família e os sinais de confiança antes de decidir.',
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
    cta: {
      label: 'Buscar profissionais pelo CEP',
      href: '/onboarding?type=family',
    },
  },
  {
    slug: 'perguntas-antes-de-contratar-cuidador',
    title: 'Perguntas para fazer antes de contratar um cuidador',
    description:
      'Uma lista enxuta de perguntas para alinhar rotina, valores, experiência e expectativas antes do primeiro atendimento.',
    audience: 'familias',
    category: 'Checklist',
    readingTime: '4 min',
    publishedAt: '2026-05-26',
    image: {
      src: heroImage,
      alt: 'Família analisando perguntas antes de contratar cuidado para idoso',
      position: 'center',
    },
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
    cta: {
      label: 'Buscar cuidadores pelo CEP',
      href: '/onboarding?type=family',
    },
  },
  {
    slug: 'como-montar-perfil-de-cuidador',
    title: 'Como montar um perfil de cuidador que passa confiança',
    description:
      'Dicas para profissionais apresentarem experiência, especialidades, disponibilidade e referências com clareza.',
    audience: 'cuidadores',
    category: 'Para profissionais',
    readingTime: '4 min',
    publishedAt: '2026-05-26',
    image: {
      src: caregiversImage,
      alt: 'Profissional de cuidado apresentando seu perfil para famílias',
      position: 'center top',
    },
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
    cta: {
      label: 'Criar perfil grátis',
      href: '/para-cuidadores',
    },
  },
]

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}

export const latestBlogPosts = blogPosts.slice(0, 3)
