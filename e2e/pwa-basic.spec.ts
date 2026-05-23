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
  })
})
