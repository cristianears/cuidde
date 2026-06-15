import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import CaregiverSolicitations from '../CaregiverSolicitations'
import type { AppointmentWithNames } from '@/hooks/useAppointments'

const source = readFileSync(resolve(__dirname, '../CaregiverSolicitations.tsx'), 'utf8')

const mockAppointments = vi.hoisted(() => ({
  data: [] as AppointmentWithNames[],
}))

const mockUnreadCounts = vi.hoisted(() => ({
  data: {
    totalUnreadMessages: 0,
    pendingUnreadMessages: 0,
    appointmentUnreadMessages: 0,
    unreadByAppointment: {} as Record<string, number>,
    newSolicitations: 0,
    updatedSolicitations: 0,
  },
}))

vi.mock('@/components/shared/AppSidebar', () => ({
  default: () => <aside data-testid="sidebar" />,
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'caregiver-1', email: 'cuidador@test.com' } }),
}))

vi.mock('@/hooks/useCaregiverProfile', () => ({
  useCaregiverProfile: () => ({ data: { profiles: { full_name: 'Cuidador Teste' } } }),
}))

vi.mock('@/hooks/useAppointments', () => ({
  useAppointments: () => ({ data: mockAppointments.data, isLoading: false }),
  useUpdateAppointmentStatus: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useUnreadCounts', () => ({
  markSolicitationsSeen: vi.fn(),
  useUnreadCounts: () => ({ data: mockUnreadCounts.data }),
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CaregiverSolicitations />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('CaregiverSolicitations', () => {
  beforeEach(() => {
    mockAppointments.data = []
    mockUnreadCounts.data = {
      totalUnreadMessages: 0,
      pendingUnreadMessages: 0,
      appointmentUnreadMessages: 0,
      unreadByAppointment: {},
      newSolicitations: 0,
      updatedSolicitations: 0,
    }
  })

  it('mostra badge de mensagem nao lida no chat da solicitacao pendente', () => {
    mockAppointments.data = [
      {
        id: 'appointment-1',
        family_id: 'family-1',
        caregiver_id: 'caregiver-1',
        caregiver_name: 'Cuidador Teste',
        family_name: 'Familia Silva',
        elderly_name: 'Dona Maria',
        type: 'plantao',
        status: 'pendente',
        start_date: '2026-05-21',
        end_date: null,
        description: null,
        family_notes: null,
        modality: null,
        cancel_reason: null,
        created_at: '2026-05-20T12:00:00Z',
        updated_at: '2026-05-20T12:00:00Z',
      } as AppointmentWithNames,
    ]
    mockUnreadCounts.data = {
      totalUnreadMessages: 1,
      pendingUnreadMessages: 1,
      appointmentUnreadMessages: 0,
      unreadByAppointment: { 'appointment-1': 1 },
      newSolicitations: 0,
      updatedSolicitations: 0,
    }

    renderPage()

    expect(screen.getByRole('button', { name: /chat/i })).toHaveTextContent('1')
  })

  it('renderiza foto da familia no avatar da solicitacao', () => {
    expect(source).toContain('AvatarImage')
    expect(source).toContain('appointment.family_photo')
    expect(source).toContain('alt={appointment.family_name ?? "Família"}')
  })

  it('mantem o card de solicitacao legivel no mobile sem estourar as acoes', () => {
    expect(source).toContain('flex flex-col gap-3 sm:flex-row sm:items-start')
    expect(source).toContain('grid grid-cols-[1fr_auto] items-start gap-2')
    expect(source).toContain('grid grid-cols-2 gap-2 pt-2 sm:flex sm:flex-wrap')
    expect(source).toContain('col-span-2 w-full gap-1.5 relative sm:col-span-1 sm:w-auto')
  })
})
