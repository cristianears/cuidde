import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FamilyMatches from '../FamilyMatches'
import type { AppointmentWithNames } from '@/hooks/useAppointments'

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
  useAuth: () => ({ user: { id: 'family-1', email: 'familia@test.com', user_metadata: {} } }),
}))

vi.mock('@/hooks/useFamilyProfile', () => ({
  useFamilyProfile: () => ({ data: { profiles: { full_name: 'Familia Teste' } } }),
}))

vi.mock('@/hooks/useAppointments', () => ({
  useAppointments: () => ({ data: mockAppointments.data, isLoading: false }),
}))

vi.mock('@/hooks/useUnreadCounts', () => ({
  markMatchesSeen: vi.fn(),
  useUnreadCounts: () => ({ data: mockUnreadCounts.data }),
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FamilyMatches />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('FamilyMatches', () => {
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
        caregiver_name: 'Cuidadora Ana',
        family_name: 'Familia Teste',
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

    expect(screen.getByRole('link', { name: /chat/i })).toHaveTextContent('1')
  })
})
