import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AppErrorDialog } from '@/shared/components/feedback/app-error-dialog'

describe('AppErrorDialog', () => {
  it('calls retry action from Coba Lagi', async () => {
    const onRetry = vi.fn()
    render(<AppErrorDialog open error={new Error('Network failed')} isRetrying={false} onOpenChange={() => {}} onRetry={onRetry} />)
    expect(screen.getByText('Ada kendala memuat data')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    expect(onRetry).toHaveBeenCalled()
  })
})
