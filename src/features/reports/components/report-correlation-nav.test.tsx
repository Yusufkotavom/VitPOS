import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ReportCorrelationNav } from '@/features/reports/components/report-correlation-nav'

describe('ReportCorrelationNav', () => {
  it('renders links and preserves active date query parameters', () => {
    render(
      <MemoryRouter initialEntries={['/reports/sales?from=2026-01-01&to=2026-01-31']}>
        <ReportCorrelationNav
          links={[
            { to: '/reports/payments', label: 'Laporan Pembayaran', hint: 'Cek uang masuk' },
            { to: '/reports/profit-loss', label: 'Laba Rugi' },
          ]}
        />
      </MemoryRouter>,
    )

    const paymentLink = screen.getByRole('link', { name: /Laporan Pembayaran/i })
    expect(paymentLink.getAttribute('href')).toBe('/reports/payments?from=2026-01-01&to=2026-01-31')

    const plLink = screen.getByRole('link', { name: /Laba Rugi/i })
    expect(plLink.getAttribute('href')).toBe('/reports/profit-loss?from=2026-01-01&to=2026-01-31')
  })

  it('preserves existing query parameters when appending dates', () => {
    render(
      <MemoryRouter initialEntries={['/reports/sales?from=2026-01-01&to=2026-01-31']}>
        <ReportCorrelationNav
          links={[
            { to: '/reports/payments?tab=receivables', label: 'Piutang Usaha' },
          ]}
        />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: /Piutang Usaha/i })
    expect(link.getAttribute('href')).toBe('/reports/payments?tab=receivables&from=2026-01-01&to=2026-01-31')
  })
})
