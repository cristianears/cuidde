import { describe, expect, it, vi } from 'vitest'
import { existsSync } from 'node:fs'

const loadRegisterServiceWorker = async () => {
  expect(existsSync('src/lib/register-service-worker.ts')).toBe(true)
  const modulePath = '../lib/register-service-worker'
  return import(/* @vite-ignore */ modulePath)
}

describe('registerServiceWorker', () => {
  it('does nothing when service workers are unavailable', async () => {
    const { registerServiceWorker } = await loadRegisterServiceWorker()

    const result = await registerServiceWorker({
      navigatorLike: {},
      locationLike: { protocol: 'https:', hostname: 'app.example.com' },
    })

    expect(result).toBe('unsupported')
  })

  it('does nothing on non-secure non-localhost origins', async () => {
    const { registerServiceWorker } = await loadRegisterServiceWorker()
    const register = vi.fn()

    const result = await registerServiceWorker({
      navigatorLike: { serviceWorker: { register } },
      locationLike: { protocol: 'http:', hostname: 'example.com' },
    })

    expect(result).toBe('insecure-origin')
    expect(register).not.toHaveBeenCalled()
  })

  it('registers sw.js on https origins', async () => {
    const { registerServiceWorker } = await loadRegisterServiceWorker()
    const update = vi.fn().mockResolvedValue(undefined)
    const postMessage = vi.fn()
    const register = vi.fn().mockResolvedValue({
      update,
      waiting: { postMessage },
    })

    const result = await registerServiceWorker({
      navigatorLike: { serviceWorker: { register } },
      locationLike: { protocol: 'https:', hostname: 'app.example.com' },
    })

    expect(result).toBe('registered')
    expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/', updateViaCache: 'none' })
    expect(update).toHaveBeenCalled()
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
  })
})
