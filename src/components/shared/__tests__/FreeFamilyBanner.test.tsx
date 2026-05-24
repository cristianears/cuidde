import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FreeFamilyBanner from '../FreeFamilyBanner'

const role: 'family' | 'caregiver' | 'admin' | null = 'family'
let subscriptionStatus: 'free' | 'active' | 'past_due' | 'canceled' | 'incomplete' | null = 'incomplete'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ role }),
}))

vi.mock('@/hooks/useFamilyProfile', () => ({
  useFamilyProfile: () => ({
    data: subscriptionStatus === null ? null : { subscription_status: subscriptionStatus },
  }),
}))

describe('FreeFamilyBanner', () => {
  it('shows the plan warning for family profiles without active access', () => {
    render(
      <MemoryRouter>
        <FreeFamilyBanner />
      </MemoryRouter>,
    )

    expect(screen.getByText(/assine e tenha acesso ilimitado/i)).toBeInTheDocument()
  })

  it('hides the plan warning for active families', () => {
    subscriptionStatus = 'active'

    render(
      <MemoryRouter>
        <FreeFamilyBanner />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/assine e tenha acesso ilimitado/i)).not.toBeInTheDocument()
  })
})
