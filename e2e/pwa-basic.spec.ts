import { expect, test } from '@playwright/test'

test.describe('PWA basic metadata', () => {
  test('serves manifest and offline fallback', async ({ page }) => {
    await page.goto('/')

    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(manifestHref).toBe('/manifest.webmanifest')

    const manifestResponse = await page.request.get('/manifest.webmanifest')
    expect(manifestResponse.ok()).toBe(true)
    const manifest = await manifestResponse.json()
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3)
    expect(manifest.shortcuts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Criar perfil de cuidador', url: '/para-cuidadores' }),
      ]),
    )

    const offlineResponse = await page.request.get('/offline.html')
    expect(offlineResponse.ok()).toBe(true)
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0f766e')
  })

  test('serves service worker script with safe cache rules', async ({ page }) => {
    const response = await page.request.get('/sw.js')
    expect(response.ok()).toBe(true)
    const source = await response.text()
    expect(source).toContain('BLOCKED_HOSTS')
    expect(source).toContain('supabase.co')
    expect(source).toContain('Authorization')
    expect(source).toContain('/offline.html')
    expect(source).toContain('/para-cuidadores')
  })

  test('serves the public caregivers landing route directly', async ({ page }) => {
    await page.goto('/para-cuidadores')

    await expect(
      page.getByRole('heading', {
        name: 'Crie seu perfil gratuito e seja encontrado por famílias da sua região',
      }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Criar perfil grátis' }).first()).toBeVisible()
  })

  test('registers the service worker and caches only app shell assets', async ({ page }) => {
    await page.goto('/')

    const cacheSnapshot = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready
      const cacheNames = await caches.keys()
      const requests = (
        await Promise.all(
          cacheNames.map(async (cacheName) => {
            const cache = await caches.open(cacheName)
            return cache.keys()
          }),
        )
      ).flat()

      return {
        scriptUrl: registration.active?.scriptURL ?? registration.installing?.scriptURL ?? '',
        cacheNames,
        cachedUrls: requests.map((request) => request.url),
      }
    })

    expect(cacheSnapshot.scriptUrl).toContain('/sw.js')
    expect(cacheSnapshot.cacheNames.some((cacheName) => cacheName.includes('app-shell'))).toBe(true)
    expect(cacheSnapshot.cachedUrls.some((url) => url.endsWith('/offline.html'))).toBe(true)
    expect(cacheSnapshot.cachedUrls.some((url) => url.endsWith('/manifest.webmanifest'))).toBe(true)

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
    ]) {
      expect(cacheSnapshot.cachedUrls.some((url) => url.includes(blocked))).toBe(false)
    }
  })

  test('shows the offline fallback when a controlled page reloads without network', async ({ page, context }) => {
    await page.goto('/')
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })

    await page.reload()
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)

    await context.setOffline(true)
    await page.reload({ waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Sem conexao' })).toBeVisible()
  })
})
