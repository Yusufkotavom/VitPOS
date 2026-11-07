import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LandingPage } from '@/features/marketing/pages/landing-page'

describe('LandingPage', () => {
  it('renders marketing hero and service niche value propositions', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    // Verify Brand
    expect(screen.getAllByText('KOTACOM').length).toBeGreaterThan(0)
    expect(screen.getByText(/Bukan Sekadar Kasir/i)).toBeInTheDocument()

    // Verify Service Niches
    expect(screen.getByText('Toko Servis HP & Gadget')).toBeInTheDocument()
    expect(screen.getByText('Servis Laptop, PC & Printer')).toBeInTheDocument()
    expect(screen.getByText('Percetakan, Banner & ATK')).toBeInTheDocument()

    // Verify Pricing & Call to Actions
    expect(screen.getByText(/Paket Berlangganan yang Ramah/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Coba Gratis/i).length).toBeGreaterThan(0)
  })
})
