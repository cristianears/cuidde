// Mock data for CuidaBem platform

export interface Caregiver {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  photo: string;
  bio: string;
  address: {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  specialties: string[];
  modalities: string[];
  pricePerHour: number;
  pricePerDay: number;
  emergencyAvailable: boolean;
  hasInsurance: boolean;
  status: 'pending' | 'analyzing' | 'verified' | 'rejected';
  rating: number;
  reviewCount: number;
  createdAt: string;
  documentsComplete: boolean;
  profileComplete: boolean;
  // Novos campos para o card público
  profissaoFormacao: string;
  totalAtendimentos: number;
  hasProfessionalRegistration: boolean;
  hasCNH: boolean;
  idiomas: string[];
  experienceYears?: number;
}

export interface Document {
  id: string;
  caregiverId: string;
  type: 'rg' | 'cpf' | 'antecedentes' | 'curriculo' | 'certificacao' | 'cnpj' | 'rg_cnh' | 'comprovante_endereco';
  name: string;
  status: 'pending' | 'sent' | 'approved' | 'rejected';
  uploadedAt: string | null;
  reviewedAt: string | null;
  rejectionReason?: string;
  fileName?: string;
}

export interface ProfessionalReference {
  id: string;
  caregiverId: string;
  name: string;
  phone: string;
  workplace: string;
  position: string;
  workDuration: string;
  notes: string;
}

export interface Review {
  id: string;
  caregiverId: string;
  familyName: string;
  familyPhoto: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Family {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  photo?: string;
  address: {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  elderlyInfo: {
    name: string;
    age: number;
    healthConditions: string[];
    careNeeds: string;
  };
  plan: 'basic' | 'essential' | 'premium';
  createdAt: string;
}

export interface Appointment {
  id: string;
  caregiverId: string;
  familyId: string;
  familyName: string;
  familyPhoto: string;
  elderlyName: string;
  type: string;
  status: 'active' | 'completed' | 'cancelled' | 'scheduled';
  startDate: string;
  endDate?: string;
  modality: string;
  address: string;
}

export interface Report {
  id: string;
  reporterType: 'family' | 'caregiver';
  reporterId: string;
  reporterName: string;
  reportedType: 'family' | 'caregiver';
  reportedId: string;
  reportedName: string;
  reason: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface SystemLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'caregiver' | 'family';
  details: string;
  timestamp: string;
}

// Specialties list
export const specialtiesList = [
  'Alzheimer e demências',
  'Parkinson',
  'Diabetes',
  'Hipertensão',
  'Mobilidade reduzida',
  'Pós-operatório',
  'Cuidados paliativos',
  'Cuidados noturnos',
  'Fisioterapia',
  'Acompanhamento hospitalar',
  'Acompanhamento de pacientes em consultas e exames',
  'Realização de curativos',
  'Aplicação de injeções',
];

export const modalitiesList = [
  'Plantão diurno (12h)',
  'Plantão noturno (12h)',
  'Período integral (24h)',
  'Meio período (6h)',
  'Acompanhamento pontual',
  'Final de semana',
];

export const idiomasList = [
  'Português',
  'Inglês',
  'Espanhol',
  'Francês',
  'Outro',
];

// Mock Caregivers
export const mockCaregivers: Caregiver[] = [
  {
    id: '1',
    name: 'Maria Aparecida Silva',
    email: 'maria.silva@email.com',
    phone: '(11) 99876-5432',
    whatsapp: '(11) 99876-5432',
    photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=face',
    bio: 'Cuidadora há mais de 15 anos, especializada em Alzheimer e demências. Formada em técnico de enfermagem com cursos de especialização em geriatria. Sou uma pessoa dedicada, paciente e comprometida com o bem-estar dos idosos. Acredito que cada pessoa merece ser tratada com dignidade e carinho, especialmente em momentos de vulnerabilidade.',
    address: {
      cep: '01310-100',
      street: 'Avenida Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    },
    specialties: ['Alzheimer e demências', 'Cuidados paliativos', 'Mobilidade reduzida'],
    modalities: ['Plantão diurno (12h)', 'Período integral (24h)'],
    pricePerHour: 35,
    pricePerDay: 280,
    emergencyAvailable: true,
    hasInsurance: true,
    status: 'verified',
    rating: 4.9,
    reviewCount: 47,
    createdAt: '2023-06-15',
    documentsComplete: true,
    profileComplete: true,
    profissaoFormacao: 'Técnica em Enfermagem',
    totalAtendimentos: 52,
    hasProfessionalRegistration: true,
    hasCNH: true,
    idiomas: ['Português', 'Inglês'],
    experienceYears: 15,
  },
  {
    id: '2',
    name: 'João Carlos Santos',
    email: 'joao.santos@email.com',
    phone: '(11) 98765-4321',
    whatsapp: '(11) 98765-4321',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    bio: 'Enfermeiro formado com especialização em gerontologia. Experiência de 8 anos em hospitais e atendimento domiciliar. Focado em cuidados pós-operatórios e acompanhamento de pacientes com doenças crônicas. Prezo pela comunicação clara com as famílias e pelo trabalho em equipe.',
    address: {
      cep: '04543-011',
      street: 'Rua Funchal',
      number: '500',
      neighborhood: 'Vila Olímpia',
      city: 'São Paulo',
      state: 'SP',
    },
    specialties: ['Pós-operatório', 'Diabetes', 'Hipertensão', 'Acompanhamento hospitalar'],
    modalities: ['Plantão diurno (12h)', 'Plantão noturno (12h)', 'Acompanhamento pontual'],
    pricePerHour: 45,
    pricePerDay: 350,
    emergencyAvailable: true,
    hasInsurance: true,
    status: 'verified',
    rating: 4.8,
    reviewCount: 32,
    createdAt: '2023-08-22',
    documentsComplete: true,
    profileComplete: true,
    profissaoFormacao: 'Enfermeiro',
    totalAtendimentos: 38,
    hasProfessionalRegistration: true,
    hasCNH: false,
    idiomas: ['Português', 'Espanhol'],
    experienceYears: 8,
  },
  {
    id: '3',
    name: 'Ana Paula Oliveira',
    email: 'ana.oliveira@email.com',
    phone: '(11) 97654-3210',
    whatsapp: '(11) 97654-3210',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    bio: 'Técnica de enfermagem com 10 anos de experiência em cuidados domiciliares. Especializada em Parkinson e fisioterapia de reabilitação. Busco sempre proporcionar qualidade de vida e autonomia aos idosos que cuido.',
    address: {
      cep: '01415-000',
      street: 'Rua da Consolação',
      number: '2500',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
    },
    specialties: ['Parkinson', 'Fisioterapia', 'Mobilidade reduzida'],
    modalities: ['Meio período (6h)', 'Plantão diurno (12h)'],
    pricePerHour: 40,
    pricePerDay: 300,
    emergencyAvailable: false,
    hasInsurance: true,
    status: 'analyzing',
    rating: 4.7,
    reviewCount: 18,
    createdAt: '2024-01-10',
    documentsComplete: true,
    profileComplete: true,
    profissaoFormacao: 'Técnica em Enfermagem',
    totalAtendimentos: 21,
    hasProfessionalRegistration: true,
    hasCNH: true,
    idiomas: ['Português'],
    experienceYears: 10,
  },
  {
    id: '4',
    name: 'Roberto Mendes',
    email: 'roberto.mendes@email.com',
    phone: '(11) 96543-2109',
    whatsapp: '(11) 96543-2109',
    photo: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
    bio: 'Cuidador certificado com foco em plantões noturnos. Trabalho há 5 anos com idosos que precisam de supervisão 24 horas.',
    address: {
      cep: '04038-001',
      street: 'Rua Domingos de Morais',
      number: '1800',
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
    },
    specialties: ['Cuidados noturnos', 'Alzheimer e demências'],
    modalities: ['Plantão noturno (12h)', 'Final de semana'],
    pricePerHour: 38,
    pricePerDay: 290,
    emergencyAvailable: true,
    hasInsurance: false,
    status: 'pending',
    rating: 0,
    reviewCount: 0,
    createdAt: '2024-03-05',
    documentsComplete: false,
    profileComplete: false,
    profissaoFormacao: 'Cuidador de Idosos',
    totalAtendimentos: 0,
    hasProfessionalRegistration: false,
    hasCNH: false,
    idiomas: ['Português'],
    experienceYears: 5,
  },
  {
    id: '5',
    name: 'Fernanda Costa Lima',
    email: 'fernanda.lima@email.com',
    phone: '(11) 95432-1098',
    whatsapp: '(11) 95432-1098',
    photo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop&crop=face',
    bio: 'Fisioterapeuta e cuidadora especializada em reabilitação de idosos. Atuo com foco em manter a independência funcional e qualidade de vida. Experiência em pós-operatório ortopédico e neurológico.',
    address: {
      cep: '05424-000',
      street: 'Rua dos Pinheiros',
      number: '800',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
    },
    specialties: ['Fisioterapia', 'Pós-operatório', 'Mobilidade reduzida'],
    modalities: ['Meio período (6h)', 'Acompanhamento pontual'],
    pricePerHour: 55,
    pricePerDay: 400,
    emergencyAvailable: false,
    hasInsurance: true,
    status: 'verified',
    rating: 5.0,
    reviewCount: 24,
    createdAt: '2023-04-18',
    documentsComplete: true,
    profileComplete: true,
    profissaoFormacao: 'Fisioterapeuta',
    totalAtendimentos: 29,
    hasProfessionalRegistration: true,
    hasCNH: true,
    idiomas: ['Português', 'Inglês', 'Francês'],
    experienceYears: 7,
  },
  {
    id: '6',
    name: 'Luciana Ferreira',
    email: 'luciana.ferreira@email.com',
    phone: '(11) 94321-0987',
    whatsapp: '(11) 94321-0987',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
    bio: 'Auxiliar de enfermagem com 3 anos de experiência em cuidados domiciliares.',
    address: {
      cep: '03310-000',
      street: 'Rua Vergueiro',
      number: '1200',
      neighborhood: 'Liberdade',
      city: 'São Paulo',
      state: 'SP',
    },
    specialties: ['Diabetes', 'Hipertensão'],
    modalities: ['Meio período (6h)'],
    pricePerHour: 30,
    pricePerDay: 220,
    emergencyAvailable: false,
    hasInsurance: false,
    status: 'rejected',
    rating: 0,
    reviewCount: 0,
    createdAt: '2024-02-01',
    documentsComplete: false,
    profileComplete: true,
    profissaoFormacao: 'Auxiliar de Enfermagem',
    totalAtendimentos: 0,
    hasProfessionalRegistration: false,
    hasCNH: false,
    idiomas: ['Português'],
    experienceYears: 3,
  },
];

// Mock Documents
export const mockDocuments: Document[] = [
  // Caregiver 1 (verified) - all approved
  { id: '1', caregiverId: '1', type: 'rg_cnh', name: 'RG ou CNH', status: 'approved', uploadedAt: '2023-06-15', reviewedAt: '2023-06-16' },
  { id: '2', caregiverId: '1', type: 'comprovante_endereco', name: 'Comprovante de Endereço', status: 'approved', uploadedAt: '2023-06-15', reviewedAt: '2023-06-16' },
  { id: '3', caregiverId: '1', type: 'curriculo', name: 'Currículo', status: 'approved', uploadedAt: '2023-06-15', reviewedAt: '2023-06-16' },
  { id: '4', caregiverId: '1', type: 'certificacao', name: 'Certificações', status: 'approved', uploadedAt: '2023-06-15', reviewedAt: '2023-06-18' },
  { id: '5', caregiverId: '1', type: 'antecedentes', name: 'Antecedentes Criminais', status: 'approved', uploadedAt: '2023-06-15', reviewedAt: '2023-06-17' },

  // Caregiver 3 (analyzing) - mixed statuses
  { id: '6', caregiverId: '3', type: 'rg_cnh', name: 'RG ou CNH', status: 'approved', uploadedAt: '2024-01-10', reviewedAt: '2024-01-11' },
  { id: '7', caregiverId: '3', type: 'comprovante_endereco', name: 'Comprovante de Endereço', status: 'sent', uploadedAt: '2024-01-10', reviewedAt: null },
  { id: '8', caregiverId: '3', type: 'curriculo', name: 'Currículo', status: 'approved', uploadedAt: '2024-01-10', reviewedAt: '2024-01-11' },
  { id: '9', caregiverId: '3', type: 'certificacao', name: 'Certificações', status: 'rejected', uploadedAt: '2024-01-10', reviewedAt: '2024-01-12', rejectionReason: 'Documento ilegível. Por favor, envie uma nova foto.' },
  { id: '10', caregiverId: '3', type: 'antecedentes', name: 'Antecedentes Criminais', status: 'sent', uploadedAt: '2024-01-10', reviewedAt: null },

  // Caregiver 4 (pending) - mostly not sent
  { id: '11', caregiverId: '4', type: 'rg_cnh', name: 'RG ou CNH', status: 'sent', uploadedAt: '2024-03-06', reviewedAt: null },
  { id: '12', caregiverId: '4', type: 'comprovante_endereco', name: 'Comprovante de Endereço', status: 'sent', uploadedAt: '2024-03-06', reviewedAt: null },
  { id: '13', caregiverId: '4', type: 'curriculo', name: 'Currículo', status: 'pending', uploadedAt: null, reviewedAt: null },
  { id: '14', caregiverId: '4', type: 'certificacao', name: 'Certificações', status: 'pending', uploadedAt: null, reviewedAt: null },
  { id: '15', caregiverId: '4', type: 'antecedentes', name: 'Antecedentes Criminais', status: 'pending', uploadedAt: null, reviewedAt: null },

  // Caregiver 6 (rejected) - had issues
  { id: '16', caregiverId: '6', type: 'rg_cnh', name: 'RG ou CNH', status: 'rejected', uploadedAt: '2024-02-01', reviewedAt: '2024-02-05', rejectionReason: 'Documento ilegível. Imagem borrada.' },
  { id: '17', caregiverId: '6', type: 'comprovante_endereco', name: 'Comprovante de Endereço', status: 'rejected', uploadedAt: '2024-02-01', reviewedAt: '2024-02-05', rejectionReason: 'Documento fora da validade.' },
  { id: '18', caregiverId: '6', type: 'curriculo', name: 'Currículo', status: 'approved', uploadedAt: '2024-02-01', reviewedAt: '2024-02-03' },
  { id: '19', caregiverId: '6', type: 'certificacao', name: 'Certificações', status: 'pending', uploadedAt: null, reviewedAt: null },
  { id: '20', caregiverId: '6', type: 'antecedentes', name: 'Antecedentes Criminais', status: 'rejected', uploadedAt: '2024-02-01', reviewedAt: '2024-02-05', rejectionReason: 'Certidão vencida. Envie uma versão atualizada.' },
];

// Mock References
export const mockReferences: ProfessionalReference[] = [
  {
    id: '1',
    caregiverId: '1',
    name: 'Dr. Carlos Eduardo',
    phone: '(11) 99999-1111',
    workplace: 'Hospital Albert Einstein',
    position: 'Médico Geriatra',
    workDuration: '3 anos',
    notes: 'Trabalhou como cuidadora de minha mãe durante internação e cuidados domiciliares posteriores.',
  },
  {
    id: '2',
    caregiverId: '1',
    name: 'Família Rodrigues',
    phone: '(11) 99999-2222',
    workplace: 'Residência particular',
    position: 'Familiar',
    workDuration: '5 anos',
    notes: 'Cuidou de nosso pai com Alzheimer. Profissional exemplar.',
  },
  {
    id: '3',
    caregiverId: '2',
    name: 'Dra. Mariana Souza',
    phone: '(11) 99999-3333',
    workplace: 'Hospital Sírio-Libanês',
    position: 'Enfermeira Chefe',
    workDuration: '4 anos',
    notes: 'Excelente profissional, sempre pontual e dedicado.',
  },
];

// Mock Reviews
export const mockReviews: Review[] = [
  {
    id: '1',
    caregiverId: '1',
    familyName: 'Família Santos',
    familyPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    comment: 'Maria é uma profissional excepcional. Cuidou da minha mãe com tanto carinho e dedicação. Sempre atenciosa e paciente, mesmo nos momentos mais difíceis. Recomendo de olhos fechados!',
    date: '2024-02-15',
  },
  {
    id: '2',
    caregiverId: '1',
    familyName: 'Família Oliveira',
    familyPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    comment: 'Profissional muito competente e humana. Meu pai adorava quando ela chegava. Fez toda a diferença no tratamento dele.',
    date: '2024-01-28',
  },
  {
    id: '3',
    caregiverId: '1',
    familyName: 'Família Costa',
    familyPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    rating: 4,
    comment: 'Muito boa profissional. Pontual e dedicada. Minha avó melhorou muito com os cuidados dela.',
    date: '2023-12-10',
  },
  {
    id: '4',
    caregiverId: '2',
    familyName: 'Família Mendes',
    familyPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    comment: 'João é um enfermeiro incrível! Acompanhou meu pai no pós-operatório e fez um trabalho impecável.',
    date: '2024-03-01',
  },
  {
    id: '5',
    caregiverId: '5',
    familyName: 'Família Lima',
    familyPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    comment: 'Fernanda é uma fisioterapeuta excelente. A recuperação da minha mãe foi muito mais rápida graças a ela.',
    date: '2024-02-20',
  },
];

// Mock Appointments
export const mockAppointments: Appointment[] = [
  {
    id: '1',
    caregiverId: '1',
    familyId: '1',
    familyName: 'Família Rodrigues',
    familyPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    elderlyName: 'Dona Helena',
    type: 'Cuidado contínuo',
    status: 'active',
    startDate: '2024-01-15',
    modality: 'Plantão diurno (12h)',
    address: 'Av. Paulista, 1500 - Bela Vista, São Paulo',
  },
  {
    id: '2',
    caregiverId: '1',
    familyId: '2',
    familyName: 'Família Souza',
    familyPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    elderlyName: 'Seu José',
    type: 'Acompanhamento',
    status: 'scheduled',
    startDate: '2024-03-20',
    modality: 'Acompanhamento pontual',
    address: 'Rua Funchal, 300 - Vila Olímpia, São Paulo',
  },
  {
    id: '3',
    caregiverId: '1',
    familyId: '3',
    familyName: 'Família Costa',
    familyPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    elderlyName: 'Dona Maria',
    type: 'Pós-operatório',
    status: 'completed',
    startDate: '2023-11-01',
    endDate: '2023-12-15',
    modality: 'Período integral (24h)',
    address: 'Rua Augusta, 800 - Consolação, São Paulo',
  },
];

// Mock Families
export const mockFamilies: Family[] = [
  {
    id: '1',
    name: 'Carlos Eduardo Rodrigues',
    email: 'carlos.rodrigues@email.com',
    phone: '(11) 99888-7766',
    whatsapp: '(11) 99888-7766',
    address: {
      cep: '01310-100',
      street: 'Avenida Paulista',
      number: '1500',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    },
    elderlyInfo: {
      name: 'Dona Helena',
      age: 82,
      healthConditions: ['Alzheimer estágio inicial', 'Hipertensão'],
      careNeeds: 'Precisa de acompanhamento diário, ajuda com medicações e atividades do dia a dia. Boa mobilidade, mas precisa de supervisão constante.',
    },
    plan: 'premium',
    createdAt: '2023-10-15',
  },
  {
    id: '2',
    name: 'Fernanda Beatriz Souza',
    email: 'fernanda.souza@email.com',
    phone: '(11) 98777-6655',
    whatsapp: '(11) 98777-6655',
    address: {
      cep: '04543-011',
      street: 'Rua Funchal',
      number: '300',
      neighborhood: 'Vila Olímpia',
      city: 'São Paulo',
      state: 'SP',
    },
    elderlyInfo: {
      name: 'Seu José',
      age: 78,
      healthConditions: ['Diabetes tipo 2', 'Mobilidade reduzida'],
      careNeeds: 'Necessita de ajuda com locomoção e cuidados com alimentação devido à diabetes. Usa cadeira de rodas.',
    },
    plan: 'essential',
    createdAt: '2024-01-20',
  },
];

// Mock Reports
export const mockReports: Report[] = [
  {
    id: '1',
    reporterType: 'family',
    reporterId: '1',
    reporterName: 'Carlos Eduardo Rodrigues',
    reportedType: 'caregiver',
    reportedId: '4',
    reportedName: 'Roberto Mendes',
    reason: 'Atraso frequente',
    description: 'O cuidador chegou atrasado 3 vezes na última semana, sem aviso prévio.',
    status: 'investigating',
    createdAt: '2024-03-10',
  },
  {
    id: '2',
    reporterType: 'caregiver',
    reporterId: '2',
    reporterName: 'João Carlos Santos',
    reportedType: 'family',
    reportedId: '2',
    reportedName: 'Fernanda Beatriz Souza',
    reason: 'Pagamento atrasado',
    description: 'O pagamento do último mês não foi realizado até a data acordada.',
    status: 'resolved',
    createdAt: '2024-02-25',
  },
];

// Mock System Logs
export const mockSystemLogs: SystemLog[] = [
  { id: '1', action: 'Documento aprovado', userId: 'admin1', userName: 'Admin Sistema', userRole: 'admin', details: 'Aprovou RG de Maria Aparecida Silva', timestamp: '2024-03-15 14:32:00' },
  { id: '2', action: 'Novo cadastro', userId: '5', userName: 'Fernanda Costa Lima', userRole: 'caregiver', details: 'Novo cuidador cadastrado na plataforma', timestamp: '2024-03-15 10:15:00' },
  { id: '3', action: 'Match realizado', userId: '1', userName: 'Carlos Eduardo Rodrigues', userRole: 'family', details: 'Solicitou contato com Maria Aparecida Silva', timestamp: '2024-03-14 16:45:00' },
  { id: '4', action: 'Documento rejeitado', userId: 'admin1', userName: 'Admin Sistema', userRole: 'admin', details: 'Rejeitou certificação de Ana Paula Oliveira - documento ilegível', timestamp: '2024-03-14 11:20:00' },
  { id: '5', action: 'Perfil atualizado', userId: '2', userName: 'João Carlos Santos', userRole: 'caregiver', details: 'Atualizou biografia e especialidades', timestamp: '2024-03-13 09:30:00' },
];

// Admin Subscriptions
export interface AdminSubscription {
  id: string;
  familyId: string;
  familyName: string;
  plan: 'match' | 'essencial' | 'daily';
  planLabel: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: string;
  nextRenewal: string | null;
  value: number;
}

export const planLabels: Record<string, string> = {
  match: 'Match — Mensalista',
  essencial: 'Essencial',
  daily: 'Daily — Plantão & Diária',
};

export const planValues: Record<string, number> = {
  match: 397,
  essencial: 129,
  daily: 49,
};

export const mockAdminSubscriptions: AdminSubscription[] = [
  { id: 'sub-1', familyId: '1', familyName: 'Carlos Eduardo Rodrigues', plan: 'match', planLabel: 'Match — Mensalista', status: 'active', startDate: '2025-11-10', nextRenewal: null, value: 397 },
  { id: 'sub-2', familyId: '2', familyName: 'Fernanda Beatriz Souza', plan: 'essencial', planLabel: 'Essencial', status: 'active', startDate: '2025-12-01', nextRenewal: '2026-03-01', value: 129 },
  { id: 'sub-3', familyId: '3', familyName: 'Ricardo Almeida', plan: 'daily', planLabel: 'Daily — Plantão & Diária', status: 'active', startDate: '2026-01-05', nextRenewal: null, value: 49 },
  { id: 'sub-4', familyId: '4', familyName: 'Patrícia Mendes', plan: 'essencial', planLabel: 'Essencial', status: 'active', startDate: '2025-10-15', nextRenewal: '2026-03-15', value: 129 },
  { id: 'sub-5', familyId: '5', familyName: 'Marcos Vinícius Pereira', plan: 'match', planLabel: 'Match — Mensalista', status: 'active', startDate: '2026-01-20', nextRenewal: null, value: 397 },
  { id: 'sub-6', familyId: '6', familyName: 'Juliana Costa', plan: 'daily', planLabel: 'Daily — Plantão & Diária', status: 'cancelled', startDate: '2025-09-01', nextRenewal: null, value: 49 },
  { id: 'sub-7', familyId: '7', familyName: 'André Luís Barros', plan: 'essencial', planLabel: 'Essencial', status: 'expired', startDate: '2025-06-01', nextRenewal: null, value: 129 },
  { id: 'sub-8', familyId: '8', familyName: 'Camila Duarte', plan: 'match', planLabel: 'Match — Mensalista', status: 'pending', startDate: '2026-02-01', nextRenewal: null, value: 397 },
];

// Admin Invoices
export interface AdminInvoice {
  id: string;
  familyId: string;
  familyName: string;
  plan: 'match' | 'essencial' | 'daily';
  planLabel: string;
  period: string;
  value: number;
  dueDate: string;
  paidAt: string | null;
  status: 'paid' | 'pending' | 'overdue';
}

export const mockAdminInvoices: AdminInvoice[] = [
  { id: 'inv-001', familyId: '1', familyName: 'Carlos Eduardo Rodrigues', plan: 'match', planLabel: 'Match — Mensalista', period: 'Janeiro 2026', value: 397, dueDate: '2026-01-10', paidAt: '2026-01-08', status: 'paid' },
  { id: 'inv-002', familyId: '2', familyName: 'Fernanda Beatriz Souza', plan: 'essencial', planLabel: 'Essencial', period: 'Fevereiro 2026', value: 129, dueDate: '2026-02-01', paidAt: '2026-01-30', status: 'paid' },
  { id: 'inv-003', familyId: '4', familyName: 'Patrícia Mendes', plan: 'essencial', planLabel: 'Essencial', period: 'Fevereiro 2026', value: 129, dueDate: '2026-02-15', paidAt: null, status: 'pending' },
  { id: 'inv-004', familyId: '3', familyName: 'Ricardo Almeida', plan: 'daily', planLabel: 'Daily — Plantão & Diária', period: 'Janeiro 2026', value: 49, dueDate: '2026-01-15', paidAt: '2026-01-14', status: 'paid' },
  { id: 'inv-005', familyId: '5', familyName: 'Marcos Vinícius Pereira', plan: 'match', planLabel: 'Match — Mensalista', period: 'Fevereiro 2026', value: 397, dueDate: '2026-02-20', paidAt: null, status: 'pending' },
  { id: 'inv-006', familyId: '7', familyName: 'André Luís Barros', plan: 'essencial', planLabel: 'Essencial', period: 'Dezembro 2025', value: 129, dueDate: '2025-12-01', paidAt: null, status: 'overdue' },
  { id: 'inv-007', familyId: '6', familyName: 'Juliana Costa', plan: 'daily', planLabel: 'Daily — Plantão & Diária', period: 'Novembro 2025', value: 49, dueDate: '2025-11-10', paidAt: '2025-11-09', status: 'paid' },
  { id: 'inv-008', familyId: '8', familyName: 'Camila Duarte', plan: 'match', planLabel: 'Match — Mensalista', period: 'Fevereiro 2026', value: 397, dueDate: '2026-02-05', paidAt: null, status: 'overdue' },
  { id: 'inv-009', familyId: '2', familyName: 'Fernanda Beatriz Souza', plan: 'essencial', planLabel: 'Essencial', period: 'Janeiro 2026', value: 129, dueDate: '2026-01-01', paidAt: '2025-12-30', status: 'paid' },
  { id: 'inv-010', familyId: '3', familyName: 'Ricardo Almeida', plan: 'daily', planLabel: 'Daily — Plantão & Diária', period: 'Fevereiro 2026', value: 49, dueDate: '2026-02-10', paidAt: null, status: 'pending' },
];

// Admin Metrics
export const mockAdminMetrics = {
  totalCaregivers: 156,
  verifiedCaregivers: 89,
  pendingApproval: 23,
  totalFamilies: 234,
  activeFamilies: 187,
  monthlyRevenue: 45890,
  subscriptions: {
    basic: 45,
    essential: 98,
    premium: 44,
  },
  matchesThisMonth: 67,
  averageRating: 4.7,
};
