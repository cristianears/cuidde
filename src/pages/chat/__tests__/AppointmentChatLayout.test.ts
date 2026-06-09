import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../AppointmentChat.tsx'), 'utf8')

describe('appointment chat mobile layout regressions', () => {
  it('uses a stable dynamic viewport height without manually shrinking the iOS keyboard frame', () => {
    expect(source).toContain('h-[100dvh]')
    expect(source).toContain('overflow-hidden bg-background')
    expect(source).not.toContain('window.visualViewport')
    expect(source).not.toContain('--chat-viewport-height')
    expect(source).not.toContain('flex flex-col h-screen bg-background')
  })

  it('keeps the message list and composer inside the fixed chat frame', () => {
    expect(source).toContain('min-h-0 flex-1 overflow-y-auto')
    expect(source).toContain('shrink-0 bg-card border-t')
    expect(source).toContain('env(safe-area-inset-bottom)')
    expect(source).toContain('flex w-full min-w-0 items-end gap-2')
    expect(source).toContain('min-w-0 flex-1 resize-none text-base')
    expect(source).toContain('focus-visible:ring-0')
    expect(source).toContain('h-11 w-11 shrink-0')
    expect(source).not.toContain('items-end gap-2 overflow-hidden')
    expect(source).not.toContain('sticky bottom-0')
  })
})
