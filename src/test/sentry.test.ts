import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BrowserOptions } from '@sentry/react'

const { init } = vi.hoisted(() => ({ init: vi.fn() }))

vi.mock('@sentry/react', () => ({
  init,
  reactRouterBrowserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
  breadcrumbsIntegration: vi.fn(() => ({ name: 'Breadcrumbs' })),
  consoleIntegration: vi.fn(() => ({ name: 'Console' })),
}))

describe('Sentry configuration', () => {
  beforeEach(() => {
    vi.resetModules()
    init.mockClear()
    vi.stubEnv('VITE_SENTRY_DSN', '')
  })

  afterEach(() => vi.unstubAllEnvs())

  it('does not start telemetry without a DSN', async () => {
    await import('@/lib/sentry')
    expect(init).not.toHaveBeenCalled()
  })

  it('strips authentication and personal request data before sending events', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@o0.ingest.sentry.io/1')
    await import('@/lib/sentry')
    const options = init.mock.calls[0][0] as BrowserOptions
    const event = options.beforeSend!({
      type: undefined,
      user: { email: 'private@example.com' },
      request: {
        url: 'https://icuide.com.br/auth/callback?code=secret#access_token=secret',
        query_string: 'code=secret',
        headers: { Authorization: 'Bearer secret' },
        cookies: { session: 'secret' },
        data: { password: 'secret' },
      },
    }, {})
    expect(event).toEqual({ request: { url: 'https://icuide.com.br/auth/callback' } })
    expect(options.dataCollection).toMatchObject({
      userInfo: false, httpHeaders: false, cookies: false, httpBodies: [], urlQueryParams: false,
    })
    expect(options.tracePropagationTargets).toEqual([])
  })

  it('removes URL credentials from navigation breadcrumbs and HTTP spans', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@o0.ingest.sentry.io/1')
    await import('@/lib/sentry')
    const options = init.mock.calls[0][0] as BrowserOptions
    expect(options.beforeBreadcrumb!({
      category: 'navigation',
      data: { from: '/login?email=private', to: '/auth/callback#access_token=secret' },
    }, {})).toMatchObject({ data: { from: '/login', to: '/auth/callback' } })
    expect(options.beforeSendSpan!({
      trace_id: 'trace', span_id: 'span', start_timestamp: 0, end_timestamp: 1,
      status: 'ok', is_segment: false, name: 'GET https://example.com?token=secret',
      attributes: { 'http.url': 'https://example.com?token=secret' },
    })).toMatchObject({ name: 'GET https://example.com', attributes: { 'http.url': 'https://example.com' } })
  })
})
