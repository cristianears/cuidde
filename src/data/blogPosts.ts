import caregiversImage from '@/assets/caregivers-card-image.jpg'
import caregiverJobsJacareiImage from '@/assets/blog/caregiver-jobs-jacarei.jpg'
import caregiverJobsSaoJoseImage from '@/assets/blog/caregiver-jobs-sao-jose-dos-campos.jpg'
import caregiverJobsValeImage from '@/assets/blog/caregiver-jobs-vale-do-paraiba.jpg'
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
    slug: 'vagas-cuidador-idosos-sao-jose-dos-campos',
    title: 'Vagas para cuidador de idosos em São José dos Campos: como se destacar',
    description:
      'Dicas para cuidadores de idosos em São José dos Campos organizarem perfil, disponibilidade e referências para serem encontrados por famílias.',
    audience: 'cuidadores',
    category: 'Vagas para cuidadores',
    readingTime: '5 min',
    publishedAt: '2026-07-02',
    image: {
      src: caregiverJobsSaoJoseImage,
      alt: 'Cuidadora de idosos organizando seu perfil profissional em São José dos Campos',
      position: 'center top',
    },
    hero:
      'Quem busca vagas para cuidador de idosos em São José dos Campos também precisa mostrar confiança, experiência e disponibilidade de forma clara.',
    sections: [
      {
        heading: 'Por que criar um perfil profissional na cidade',
        body: [
          'São José dos Campos tem famílias que procuram apoio para rotina, companhia, higiene, alimentação, mobilidade e acompanhamento de idosos em casa. Para o cuidador, aparecer de forma organizada ajuda a transformar indicação solta em oportunidade real de conversa.',
          'Na icuide, o profissional pode criar um perfil gratuito com experiência, regiões atendidas, disponibilidade, valores de referência, certificados, antecedentes e referências. Isso facilita para a família entender seu trabalho antes do primeiro contato.',
        ],
      },
      {
        heading: 'O que ajuda um cuidador a se destacar',
        body: [
          'Um bom perfil deve explicar há quanto tempo você atua, quais tipos de cuidado realiza, se atende por hora, diária, plantão ou período fixo, e quais bairros ou regiões de São José dos Campos consegue atender com regularidade.',
          'Também vale manter uma foto profissional, uma bio objetiva e informações atualizadas. Famílias tendem a comparar perfis com calma, então clareza e coerência contam muito.',
        ],
      },
      {
        heading: 'Use a busca por vagas com estratégia',
        body: [
          'Procurar por vagas para cuidador de idosos pode ser útil, mas depender apenas de grupos e anúncios deixa o profissional vulnerável a propostas confusas. Um perfil próprio ajuda você a apresentar seu trabalho de forma mais segura.',
          'A icuide não garante contratação, mas ajuda cuidadores a serem encontrados por famílias que estão procurando profissionais de cuidado na região.',
        ],
      },
    ],
    cta: {
      label: 'Criar perfil grátis',
      href: '/para-cuidadores',
    },
  },
  {
    slug: 'vagas-cuidador-idosos-jacarei',
    title: 'Vagas para cuidador de idosos em Jacareí: como divulgar seu trabalho',
    description:
      'Orientações para cuidadores de idosos em Jacareí divulgarem seus serviços com segurança, clareza e perfil profissional gratuito.',
    audience: 'cuidadores',
    category: 'Vagas para cuidadores',
    readingTime: '5 min',
    publishedAt: '2026-07-02',
    image: {
      src: caregiverJobsJacareiImage,
      alt: 'Profissional de cuidado preparando informações para atender famílias em Jacareí',
      position: 'center top',
    },
    hero:
      'Para quem procura vagas de cuidador em Jacareí, divulgar experiência e disponibilidade do jeito certo pode abrir conversas melhores com famílias.',
    sections: [
      {
        heading: 'Divulgação com segurança vem antes da pressa',
        body: [
          'Muitos cuidadores divulgam telefone em grupos, panfletos ou redes sociais. Isso pode gerar contatos, mas também pode trazer mensagens sem contexto, propostas pouco claras e perda de controle sobre suas informações.',
          'Um perfil profissional permite apresentar seu trabalho antes da conversa: experiência, certificados, referências, valores de referência e disponibilidade. Assim, a família chega com mais informação e o cuidador consegue filtrar melhor as oportunidades.',
        ],
      },
      {
        heading: 'Como falar da sua experiência',
        body: [
          'Explique se você já atuou com idosos acamados, Alzheimer, Parkinson, mobilidade reduzida, pós-operatório, acompanhamento noturno ou rotina de companhia. Use termos simples e verdadeiros, sem exagerar promessas.',
          'Se atende Jacareí e cidades próximas, informe isso com clareza. Disponibilidade realista evita deslocamentos impossíveis e conversas que não combinam com sua rotina.',
        ],
      },
      {
        heading: 'Transforme busca por vagas em presença profissional',
        body: [
          'Buscar vagas para cuidador de idosos em Jacareí é um começo. Mas construir presença profissional ajuda você a ser lembrado quando uma família precisa comparar cuidadores com calma.',
          'Na icuide, o cadastro gratuito ajuda a organizar essas informações em um só lugar para que famílias conheçam melhor seu perfil.',
        ],
      },
    ],
    cta: {
      label: 'Criar perfil grátis',
      href: '/para-cuidadores',
    },
  },
  {
    slug: 'vagas-cuidador-idosos-vale-do-paraiba',
    title: 'Vagas para cuidador de idosos no Vale do Paraíba: como se preparar',
    description:
      'Guia para cuidadores do Vale do Paraíba organizarem perfil, regiões atendidas, valores e referências para conversar com famílias.',
    audience: 'cuidadores',
    category: 'Vagas para cuidadores',
    readingTime: '5 min',
    publishedAt: '2026-07-02',
    image: {
      src: caregiverJobsValeImage,
      alt: 'Cuidador de idosos organizando disponibilidade para atender no Vale do Paraíba',
      position: 'center top',
    },
    hero:
      'No Vale do Paraíba, o cuidador que apresenta bem sua experiência e sua área de atendimento aumenta as chances de conversar com famílias compatíveis.',
    sections: [
      {
        heading: 'Região atendida precisa ser clara',
        body: [
          'O Vale do Paraíba reúne cidades próximas, mas deslocamento, horários e custos mudam bastante de uma rotina para outra. Por isso, informe onde você atende com segurança: São José dos Campos, Jacareí, bairros específicos ou outras cidades da região.',
          'Também diga se aceita atendimentos por hora, diária, plantão, período noturno ou rotina fixa. Quanto mais clara for a disponibilidade, mais fácil para a família entender se existe encaixe.',
        ],
      },
      {
        heading: 'Valores e combinados devem aparecer com cuidado',
        body: [
          'Muitas famílias procuram cuidadores comparando preço, experiência e disponibilidade ao mesmo tempo. Ter valores de referência ajuda a iniciar conversas mais objetivas, mesmo que o combinado final dependa da rotina do idoso.',
          'Inclua informações sobre deslocamento, horários possíveis e tipos de cuidado que você realiza. Isso reduz dúvidas repetidas e evita expectativas desalinhadas.',
        ],
      },
      {
        heading: 'Um perfil completo ajuda além das vagas',
        body: [
          'A busca por vagas para cuidador de idosos no Vale do Paraíba pode levar o profissional a anúncios temporários. Um perfil completo, por outro lado, continua disponível para famílias que pesquisam cuidadores na região.',
          'Na icuide, cuidadores podem criar perfil gratuito e apresentar experiência, documentos, certificados, antecedentes, referências e disponibilidade em um formato pensado para a decisão das famílias.',
        ],
      },
    ],
    cta: {
      label: 'Criar perfil grátis',
      href: '/para-cuidadores',
    },
  },
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
