import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { SettingsNav } from '@/features/settings/components/settings-nav'

describe('SettingsNav', () => {
  it('shows the billing tab on the canonical settings route', () => {
    render(
      <MemoryRouter>
        <SettingsNav />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /langganan/i })).toHaveAttribute('href', '/settings/billing')
  })
})
