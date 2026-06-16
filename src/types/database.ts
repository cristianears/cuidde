// Tipos TypeScript derivados do schema do Supabase (SPEC.md)
// NÃO editar manualmente — derivar sempre do schema real do banco

// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type UserRole = 'caregiver' | 'family' | 'admin'

export type CaregiverStatus = 'pending' | 'analyzing' | 'verified' | 'rejected'

export type ProfissaoFormacao =
  | 'cuidador'
  | 'tecnico_enfermagem'
  | 'auxiliar_enfermagem'
  | 'enfermeiro'
  | 'fisioterapeuta'
  | 'terapeuta_ocupacional'
  | 'outro'

export type CategoriaCNH = 'A' | 'B' | 'AB' | 'C' | 'D' | 'E'

export type ProfessionalRegType = 'coren' | 'crefito' | 'outros'

export type DocumentType =
  | 'rg_cnh'
  | 'curriculo'
  | 'certificacao'
  | 'antecedentes'

export type DocumentStatus = 'pending' | 'sent' | 'approved' | 'rejected'

export type SubscriptionPlan = 'monthly' | 'quarterly' | 'annual'

export type SubscriptionStatus =
  | 'free'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'

export type AppointmentType = 'plantão' | 'contínuo' | 'turno'

export type AppointmentStatus = 'pendente' | 'ativo' | 'finalizado' | 'cancelado'

export type CareShift = 'morning' | 'afternoon' | 'night'

export type CareType =
  | 'hygiene'
  | 'medication'
  | 'feeding'
  | 'mobility'
  | 'appointments'
  | 'monitoring'
  | 'other'

export type FeedingStatus = 'full' | 'partial' | 'refused'

export type HydrationLevel = 'under200' | '200to500' | '500to1000' | 'over1000'

export type MoodStatus = 'agitated' | 'calm' | 'sleepy' | 'anxious' | 'communicative' | 'cheerful'

export interface MedicationItem {
  name: string
  time: string         // formato 'HH:MM'
  applied: boolean
  applied_at: string | null  // ISO timestamp ou null
}

export interface ElderlyMedication {
  name: string
  time: string  // formato 'HH:MM'
}

export interface VitalSignsData {
  bloodPressure?: { systolic: number; diastolic: number }
  temperature?: number
  glucose?: number
  heartRate?: number
  oxygenSaturation?: number
  recordedAt?: string  // ISO timestamp
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'

export type SupportSubject =
  | 'conta'
  | 'documentos'
  | 'atendimentos'
  | 'avaliacoes'
  | 'visibilidade'
  | 'sugestoes'
  | 'outro'

export type SupportTicketStatus = 'enviado' | 'em_analise' | 'respondido'

export type LegalConsentType =
  | 'terms_of_use'
  | 'privacy_policy'
  | 'cookie_policy'
  | 'third_party_data'

export type SubscriptionCancellationReason =
  | 'found_caregiver_elsewhere'
  | 'no_caregivers_region'
  | 'price_high'
  | 'temporary_need'
  | 'difficult_to_use'
  | 'missing_features'
  | 'other'

// ─── Tabela: profiles ────────────────────────────────────────────────────────

export interface Profile {
  id: string
  role: UserRole | null  // nullable para cadastro Google (role definido no onboarding)
  full_name: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface UserConsent {
  id: string
  user_id: string
  consent_type: LegalConsentType
  document_version: string
  document_url: string
  accepted: boolean
  context: string
  metadata: Record<string, unknown>
  accepted_at: string
  created_at: string
}

export interface SubscriptionCancellationFeedback {
  id: string
  family_id: string
  reason_code: SubscriptionCancellationReason
  reason_label: string
  reason_details: string | null
  plan: SubscriptionPlan | null
  subscription_status: SubscriptionStatus | null
  cancel_at_period_end: boolean | null
  current_period_end: string | null
  created_at: string
}

// ─── Tabela: caregiver_profiles ──────────────────────────────────────────────

export interface CaregiverProfile {
  id: string
  // Dados pessoais
  photo_url: string | null
  whatsapp: string | null
  bio: string | null
  // Endereço
  cep: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zona: 'zona_norte' | 'zona_sul' | 'zona_leste' | 'zona_oeste' | 'centro' | null
  // Geocodificação
  lat: number | null
  lng: number | null
  // Profissional
  specialties: string[]
  modalities: string[]
  idiomas: string[]
  experience_years: number
  profissao_formacao: ProfissaoFormacao | null
  formacao_complementar: string | null
  // CNH
  possui_cnh: boolean
  categoria_cnh: CategoriaCNH | null
  // Seguro
  has_insurance: boolean
  // Disponibilidade emergencial (C7)
  emergency_available: boolean
  // Disponibilidade
  is_available_for_new: boolean
  journey_types: string[]
  area_type: string | null
  area_radius: string | null
  availability_notes: string | null
  // Preços
  price_per_hour: number | null
  price_per_day: number | null
  pricing_note: string | null
  // Registro profissional
  professional_reg_type: ProfessionalRegType | null
  professional_reg_number: string | null
  professional_reg_uf: string | null
  professional_reg_other_desc: string | null
  // Status e visibilidade
  status: CaregiverStatus
  rejection_reason: string | null
  is_visible: boolean
  // Completude automática (calculada por trigger — sem aprovação de admin)
  profile_complete: boolean
  // Flags de documentos enviados (calculadas por trigger — visíveis publicamente)
  has_rg_cnh: boolean
  has_antecedentes: boolean
  has_certificado: boolean
  has_references: boolean
  // Privacidade das referências
  show_refs_to_subscribers: boolean
  mask_reference_phones: boolean
  show_reference_full_names: boolean
  // Métricas
  profile_views_30d: number
  search_appearances_30d: number
  interested_families_30d: number
  average_rating: number
  review_count: number
  created_at: string
  updated_at: string
}

// ─── Tabela: professional_references ─────────────────────────────────────────

export interface ProfessionalReference {
  id: string
  caregiver_id: string
  name: string
  phone: string
  workplace: string | null
  position: string | null
  work_duration: string | null
  notes: string | null
  created_at: string
}

// ─── Tabela: caregiver_documents ─────────────────────────────────────────────

export interface CaregiverDocument {
  id: string
  caregiver_id: string
  type: DocumentType
  file_url: string | null
  file_name: string | null
  status: DocumentStatus
  is_visible: boolean
  required: boolean
  rejection_reason: string | null
  reviewed_at: string | null
  uploaded_at: string | null
  created_at: string
}

// ─── Tabela: caregiver_availability ──────────────────────────────────────────

export interface CaregiverAvailability {
  id: string
  caregiver_id: string
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = domingo, 6 = sábado
  start_time: string  // formato 'HH:MM'
  end_time: string    // formato 'HH:MM'
  created_at: string
}

// ─── Tabela: family_profiles ──────────────────────────────────────────────────

export interface FamilyProfile {
  id: string
  photo_url: string | null
  // Responsável
  relationship: string | null
  // Endereço
  cep: string | null
  street: string | null
  number: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  // Geocodificação
  lat: number | null
  lng: number | null
  // Idoso
  elderly_name: string | null
  elderly_age: number | null
  elderly_conditions: string[]
  blood_type: string | null
  pre_existing_conditions: string | null
  allergies: string | null
  continuous_medications: string | null
  responsible_doctor: string | null
  health_insurance: string | null
  care_needs: string | null
  // Preferências de contratação
  service_formats: string[]
  hourly_range_min: number | null
  hourly_range_max: number | null
  daily_range_min: number | null
  daily_range_max: number | null
  distance_preference: string | null
  // Medicamentos do idoso (pré-definidos pela família)
  elderly_medications: ElderlyMedication[]
  // Stripe
  stripe_customer_id: string | null
  plan: SubscriptionPlan | null
  subscription_status: SubscriptionStatus
  stripe_subscription_id: string | null
  cancel_at_period_end: boolean
  current_period_end: string | null
  payment_failed_at: string | null
  pending_plan: SubscriptionPlan | null
  created_at: string
  updated_at: string
}

// ─── Tabela: appointments ─────────────────────────────────────────────────────

export interface Appointment {
  id: string
  family_id: string
  caregiver_id: string
  type: AppointmentType
  status: AppointmentStatus
  start_date: string   // formato 'YYYY-MM-DD'
  end_date: string | null
  description: string | null
  family_notes: string | null
  modality: string | null
  observations: string | null
  total_amount: number | null
  cancelled_by: string | null
  cancel_reason: string | null
  created_at: string
  updated_at: string
}

// ─── Tabela: care_routines ────────────────────────────────────────────────────

export interface CareRoutine {
  id: string
  appointment_id: string
  date: string          // formato 'YYYY-MM-DD'
  shift: CareShift
  care_types: CareType[]
  observations: string | null
  has_occurrence: boolean
  occurrence_description: string | null
  // Checklist de medicamentos (aplicados pelo cuidador)
  medication_items: MedicationItem[]
  // Diário de bem-estar
  feeding_status: FeedingStatus | null
  hydration: HydrationLevel | null
  hygiene_done: boolean | null
  mood: MoodStatus | null
  // Sinais vitais
  vital_signs: VitalSignsData | null
  // Itens em falta
  items_running_low: string[]
  recorded_at: string
}

// ─── Tabela: messages ─────────────────────────────────────────────────────────

export interface Message {
  id: string
  appointment_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
}

// ─── Tabela: reviews ──────────────────────────────────────────────────────────

export interface Review {
  id: string
  appointment_id: string | null
  family_id: string
  caregiver_id: string
  family_name: string | null
  family_photo: string | null
  rating: number    // 1.0 a 5.0 — média dos 5 critérios (calculada antes do INSERT)
  // Critérios granulares (Sprint 5.1) — permite meia estrela (ex: 4.5)
  rating_pontualidade: number | null
  rating_competencia: number | null
  rating_comunicacao: number | null
  rating_trato: number | null
  rating_confianca: number | null
  comment: string | null
  // Resposta do cuidador (UI futura — coluna criada, sem UI por ora)
  caregiver_reply: string | null
  replied_at: string | null
  created_at: string
}

// ─── Tabela: favorites ────────────────────────────────────────────────────────

export interface Favorite {
  id: string
  family_id: string
  caregiver_id: string
  created_at: string
}

// ─── Tabela: invoices ─────────────────────────────────────────────────────────

export interface Invoice {
  id: string
  family_id: string
  invoice_ref: string | null    // ex: 'INV-2026-003'
  period: string | null         // ex: 'Março 2026'
  plan: SubscriptionPlan | null
  amount: number
  status: InvoiceStatus
  stripe_invoice_id: string | null
  stripe_payment_intent_id: string | null
  due_date: string | null       // formato 'YYYY-MM-DD'
  paid_at: string | null
  created_at: string
}

// ─── Tabela: support_tickets ──────────────────────────────────────────────────

export interface SupportTicket {
  id: string
  user_id: string
  subject: SupportSubject
  message: string
  status: SupportTicketStatus
  admin_reply: string | null
  created_at: string
  updated_at: string
}

// ─── Tabela: system_logs ──────────────────────────────────────────────────────

export interface SystemLog {
  id: string
  user_id: string | null    // pode ser NULL se usuário foi deletado
  user_name: string | null
  user_role: UserRole | null
  action: string
  details: string | null
  created_at: string
}

// ─── CaregiverPublic — tipo flat para exibição pública (JOIN caregiver_profiles + profiles) ───

export interface CaregiverPublic {
  id: string
  // De profiles
  full_name: string | null
  // De caregiver_profiles
  photo_url: string | null
  bio: string | null
  experience_years: number
  profissao_formacao: ProfissaoFormacao | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zona: 'zona_norte' | 'zona_sul' | 'zona_leste' | 'zona_oeste' | 'centro' | null
  cep: string | null
  price_per_hour: number | null
  price_per_day: number | null
  average_rating: number
  review_count: number
  specialties: string[]
  possui_cnh: boolean
  has_insurance: boolean
  professional_reg_number: string | null
  emergency_available: boolean
  whatsapp: string | null
  // Perfil complementar
  modalities: string[]
  idiomas: string[]
  // Flags de documentos (calculadas por trigger em caregiver_profiles)
  has_rg_cnh: boolean
  has_antecedentes: boolean
  has_certificado: boolean
  has_references: boolean
  // Disponibilidade
  is_available_for_new: boolean
}

// ─── Tipo Database (usado para tipar o cliente Supabase) ─────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      user_consents: {
        Row: UserConsent
        Insert: Omit<UserConsent, 'id' | 'accepted_at' | 'created_at'>
        Update: never
      }
      subscription_cancellation_feedback: {
        Row: SubscriptionCancellationFeedback
        Insert: Omit<SubscriptionCancellationFeedback, 'id' | 'created_at'>
        Update: never
      }
      caregiver_profiles: {
        Row: CaregiverProfile
        Insert: Pick<CaregiverProfile, 'id'>
        Update: Partial<Omit<CaregiverProfile, 'id' | 'created_at'>>
      }
      professional_references: {
        Row: ProfessionalReference
        Insert: Omit<ProfessionalReference, 'id' | 'created_at'>
        Update: Partial<Omit<ProfessionalReference, 'id' | 'created_at'>>
      }
      caregiver_documents: {
        Row: CaregiverDocument
        Insert: Omit<CaregiverDocument, 'id' | 'created_at'>
        Update: Partial<Omit<CaregiverDocument, 'id' | 'created_at'>>
      }
      caregiver_availability: {
        Row: CaregiverAvailability
        Insert: Omit<CaregiverAvailability, 'id' | 'created_at'>
        Update: Partial<Omit<CaregiverAvailability, 'id' | 'created_at'>>
      }
      family_profiles: {
        Row: FamilyProfile
        Insert: Pick<FamilyProfile, 'id'>
        Update: Partial<Omit<FamilyProfile, 'id' | 'created_at'>>
      }
      appointments: {
        Row: Appointment
        Insert: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Appointment, 'id' | 'created_at'>>
      }
      care_routines: {
        Row: CareRoutine
        Insert: Omit<CareRoutine, 'id' | 'recorded_at'> & {
          medication_items?: MedicationItem[]
          feeding_status?: FeedingStatus | null
          hygiene_done?: boolean | null
          mood?: MoodStatus | null
          items_running_low?: string[]
        }
        Update: Partial<Omit<CareRoutine, 'id' | 'recorded_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at' | 'caregiver_reply' | 'replied_at'>
        Update: Partial<Omit<Review, 'id' | 'created_at'>>
      }
      favorites: {
        Row: Favorite
        Insert: Omit<Favorite, 'id' | 'created_at'>
        Update: never
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'created_at'>
        Update: Partial<Omit<Invoice, 'id' | 'created_at'>>
      }
      support_tickets: {
        Row: SupportTicket
        Insert: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SupportTicket, 'id' | 'created_at'>>
      }
      system_logs: {
        Row: SystemLog
        Insert: Omit<SystemLog, 'id' | 'created_at'>
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: {
      search_caregivers_by_proximity: {
        Args: { p_lat: number; p_lng: number; p_radius_km?: number }
        Returns: { id: string; distance_km: number }[]
      }
      haversine_distance: {
        Args: { lat1: number; lng1: number; lat2: number; lng2: number }
        Returns: number
      }
    }
    Enums: Record<string, never>
  }
}
