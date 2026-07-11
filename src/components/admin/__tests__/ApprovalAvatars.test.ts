import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const listSource = readFileSync(resolve(__dirname, '../ApprovalCaregiverList.tsx'), 'utf8')
const detailSource = readFileSync(resolve(__dirname, '../ApprovalDetailPanel.tsx'), 'utf8')

describe('Admin approval avatars', () => {
  it('uses Avatar fallback in the review list instead of raw img tags', () => {
    expect(listSource).toContain('AvatarFallback')
    expect(listSource).toContain('getInitials')
    expect(listSource).not.toContain('<img')
  })

  it('uses Avatar fallback in the review detail panel instead of raw img tags', () => {
    expect(detailSource).toContain('AvatarFallback')
    expect(detailSource).toContain('getInitials')
    expect(detailSource).not.toContain('<img')
  })
})
