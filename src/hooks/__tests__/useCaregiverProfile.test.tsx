import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useUploadCaregiverPhoto } from '@/hooks/useCaregiverProfile'
import { uploadAvatar } from '@/lib/upload-avatar'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'caregiver-1', email: 'caregiver@test.com' } }),
}))

vi.mock('@/lib/upload-avatar', () => ({
  uploadAvatar: vi.fn().mockResolvedValue('https://example.com/avatar.jpg?t=123'),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useUploadCaregiverPhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds a cache-busting query string when updating the caregiver profile photo', async () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    const { result } = renderHook(() => useUploadCaregiverPhoto(), { wrapper: createWrapper() })

    result.current.mutate(file)

    await waitFor(() => {
      expect(uploadAvatar).toHaveBeenCalledWith(file, 'caregiver-1', 'caregiver_profiles', { cacheBust: true })
    })
  })
})
