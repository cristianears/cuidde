import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'

describe('PWA service worker', () => {
  const readServiceWorker = () => readFileSync('public/sw.js', 'utf8')

  it('precache includes only public app shell assets', () => {
    expect(existsSync('public/sw.js')).toBe(true)

    const source = readServiceWorker()

    expect(source).toContain("'/para-cuidadores'")
    expect(source).toContain("'/offline.html'")
    expect(source).toContain("'/manifest.webmanifest'")
    expect(source).toContain("'/logo.png'")
    expect(source).toContain("'/pwa-icon-192.png'")
    expect(source).toContain("'/pwa-icon-512.png'")
  })

  it('never caches private or third-party runtime data', () => {
    expect(existsSync('public/sw.js')).toBe(true)

    const source = readServiceWorker()

    for (const blocked of [
      'supabase.co',
      'api.stripe.com',
      'js.stripe.com',
      'hooks.stripe.com',
      'accounts.google.com',
      'maps.googleapis.com',
      'viacep.com.br',
      'nominatim.openstreetmap.org',
      '/auth',
      '/rest/v1',
      '/storage/v1',
      '/functions/v1',
      '/realtime',
      'Authorization',
    ]) {
      expect(source).toContain(blocked)
    }
  })

  it('handles navigation with an offline fallback', () => {
    expect(existsSync('public/sw.js')).toBe(true)

    const source = readServiceWorker()

    expect(source).toContain('request.mode === "navigate"')
    expect(source).toContain("caches.match('/offline.html')")
  })
})
