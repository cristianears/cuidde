import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { COOKIE_CONSENT_KEY } from '@/lib/cookie-consent'
import BlogPost from '../BlogPost'

vi.mock('@/components/Header', () => ({ default: () => <div /> }))
vi.mock('@/components/Footer', () => ({ default: () => <div /> }))
vi.mock('@/hooks/useSeo', () => ({ useSeo: vi.fn() }))

function renderBlogPost(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/blog/${slug}`]}>
      <Routes>
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('BlogPost', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.dataLayer = []
  })

  it('records the current article once when consent is accepted after landing', () => {
    const { unmount } = renderBlogPost('vagas-cuidador-idosos-jacarei')
    expect(window.dataLayer).toEqual([])
    window.localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected')
    act(() => window.dispatchEvent(new CustomEvent('cuidde-cookie-consent', { detail: 'rejected' })))
    expect(window.dataLayer).toEqual([])
    window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    act(() => window.dispatchEvent(new CustomEvent('cuidde-cookie-consent', { detail: 'accepted' })))
    act(() => window.dispatchEvent(new CustomEvent('cuidde-cookie-consent', { detail: 'accepted' })))
    const articleEvents = () => window.dataLayer?.filter((entry) => (entry as { event?: string }).event === 'blog_article_view')
    expect(articleEvents()).toEqual([expect.objectContaining({ blog_slug: 'vagas-cuidador-idosos-jacarei' })])
    unmount()
    act(() => window.dispatchEvent(new CustomEvent('cuidde-cookie-consent', { detail: 'accepted' })))
    expect(articleEvents()).toHaveLength(1)
  })
  it('uses caregiver-oriented next-step copy for caregiver articles', () => {
    renderBlogPost('vagas-cuidador-idosos-jacarei')

    expect(
      screen.getByText('Use o guia para organizar melhor seu perfil e avance quando quiser se apresentar para famílias.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/ver profissionais disponíveis/i)).not.toBeInTheDocument()
  })
})
