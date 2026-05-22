import {
  Droplets,
  Pill,
  UtensilsCrossed,
  Activity,
  Stethoscope,
  Eye,
  MoreHorizontal,
  FileText,
} from 'lucide-react'
import type {
  AppointmentStatus,
  CareShift,
  CareType,
  FeedingStatus,
  MoodStatus,
} from '@/types/database'

// ─── Tipos de cuidado ─────────────────────────────────────────────────────────

export const careTypeLabels: Record<CareType, { label: string; icon: typeof FileText }> = {
  hygiene: { label: 'Higiene pessoal', icon: Droplets },
  medication: { label: 'Medicamentos', icon: Pill },
  feeding: { label: 'Alimentação e Hidratação', icon: UtensilsCrossed },
  mobility: { label: 'Mobilização', icon: Activity },
  appointments: { label: 'Consultas', icon: Stethoscope },
  monitoring: { label: 'Monitoramento', icon: Eye },
  other: { label: 'Outros', icon: MoreHorizontal },
}

// ─── Turnos ───────────────────────────────────────────────────────────────────

export const shiftLabels: Record<CareShift, string> = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  night: 'Noite',
}

// ─── Status de alimentação ────────────────────────────────────────────────────

export const feedingLabels: Record<FeedingStatus, { text: string; color: string }> = {
  full: { text: 'Comeu tudo', color: 'text-green-600 dark:text-green-400' },
  partial: { text: 'Comeu pouco', color: 'text-amber-600 dark:text-amber-400' },
  refused: { text: 'Recusou', color: 'text-red-600 dark:text-red-400' },
}

// ─── Hidratação ──────────────────────────────────────────────────────────────

export const hydrationLabels: Record<string, string> = {
  under200: '< 200ml',
  '200to500': '200–500ml',
  '500to1000': '500ml–1L',
  over1000: '> 1L',
}

// ─── Humor ────────────────────────────────────────────────────────────────────

export const moodLabels: Record<MoodStatus, { text: string; emoji: string }> = {
  agitated: { text: 'Agitado', emoji: '😟' },
  calm: { text: 'Calmo', emoji: '😊' },
  sleepy: { text: 'Sonolento', emoji: '😴' },
  anxious: { text: 'Ansioso', emoji: '😰' },
  communicative: { text: 'Comunicativo', emoji: '🗣️' },
  cheerful: { text: 'Bem-disposto', emoji: '😄' },
}

// ─── Status de agendamento ────────────────────────────────────────────────────

export const appointmentStatusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  finalizado: { label: 'Finalizado', className: 'bg-muted text-muted-foreground border-border' },
  pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-700 border-red-200' },
}

// ─── Parser de observações (campo "Outros") ───────────────────────────────────

export function parseObservations(obs: string | null): {
  otherDescription: string | null
  cleanObs: string | null
} {
  if (!obs) return { otherDescription: null, cleanObs: null }
  const match = obs.match(/^\[Outros\]\s*([^\n]+)/)
  const otherDescription = match ? match[1] : null
  const cleanObs = obs.replace(/^\[Outros\]\s*[^\n]+\n?/, '').trim() || null
  return { otherDescription, cleanObs }
}
