import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelpPage } from '@/features/help/pages/help-page'

describe('HelpPage', () => {
  it('renders knowledge base categories and articles with search filtering', () => {
    render(
      <MemoryRouter>
        <HelpPage />
      </MemoryRouter>
    )

    // Heading & search
    expect(screen.getByText(/Pusat Bantuan & Panduan Praktis/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Cari topik panduan/i)).toBeInTheDocument()

    // Key guide categories
    expect(screen.getByText('Servis HP & Komputer')).toBeInTheDocument()
    expect(screen.getByText('Percetakan & ATK')).toBeInTheDocument()
    expect(screen.getByText('Lacak Servis Mandiri')).toBeInTheDocument()

    // Test search filter
    const searchInput = screen.getByPlaceholderText(/Cari topik panduan/i)
    fireEvent.change(searchInput, { target: { value: 'garansi' } })

    expect(screen.getByText(/Manajemen Garansi Servis/i)).toBeInTheDocument()
  })
})
