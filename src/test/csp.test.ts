import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

describe('index.html CSP', () => {
  const html = readFileSync('index.html', 'utf8')

  it('permite a geracao de PDF pelo @react-pdf/renderer no navegador', () => {
    expect(html).toContain("script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://js.stripe.com")
    expect(html).toContain("connect-src 'self' data:")
  })
})
