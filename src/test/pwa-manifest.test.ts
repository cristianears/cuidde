import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'

describe('PWA manifest', () => {
  const readManifest = () => JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'))

  it('declares installable app metadata for Cuidde', () => {
    expect(existsSync('public/manifest.webmanifest')).toBe(true)

    const manifest = readManifest()

    expect(manifest.name).toBe('ditti - Cuidadores de idosos')
    expect(manifest.short_name).toBe('ditti')
    expect(manifest.start_url).toBe('/')
    expect(manifest.scope).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.background_color).toBe('#ffffff')
    expect(manifest.theme_color).toBe('#0f766e')
    expect(manifest.lang).toBe('pt-BR')
  })

  it('references required install icons', () => {
    expect(existsSync('public/manifest.webmanifest')).toBe(true)

    const manifest = readManifest()

    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' }),
        expect.objectContaining({ src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' }),
        expect.objectContaining({
          src: '/pwa-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        }),
      ]),
    )

    for (const icon of manifest.icons) {
      expect(existsSync(`public/${icon.src.replace(/^\//, '')}`)).toBe(true)
    }
  })
})
