import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
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
  it('uses caregiver-oriented next-step copy for caregiver articles', () => {
    renderBlogPost('vagas-cuidador-idosos-jacarei')

    expect(
      screen.getByText('Use o guia para organizar melhor seu perfil e avance quando quiser se apresentar para famílias.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/ver profissionais disponíveis/i)).not.toBeInTheDocument()
  })
})
