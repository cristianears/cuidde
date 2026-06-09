import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../AppointmentChat.tsx'), 'utf8')

describe('appointment chat mobile layout regressions', () => {
  it('uses the visual viewport height to avoid iOS keyboard overflow', () => {
    expect(source).toContain('window.visualViewport')
    expect(source).toContain('--chat-viewport-height')
    expect(source).toContain('h-[var(--chat-viewport-height,100dvh)]')
    expect(source).toContain('overflow-hidden bg-background')
    expect(source).not.toContain('flex flex-col h-screen bg-background')
  })

  it('keeps the message list and composer inside the fixed chat frame', () => {
    expect(source).toContain('min-h-0 flex-1 overflow-y-auto')
    expect(source).toContain('shrink-0 bg-card border-t')
    expect(source).toContain('env(safe-area-inset-bottom)')
    expect(source).not.toContain('sticky bottom-0')
  })
})
