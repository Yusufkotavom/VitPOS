import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PullToRefresh } from '@/shared/components/feedback/pull-to-refresh'

describe('PullToRefresh', () => {
  it('calls onRefresh when user pulls down past threshold', () => {
    const onRefresh = vi.fn()
    render(<PullToRefresh onRefresh={onRefresh} isRefreshing={false}><div>Konten</div></PullToRefresh>)
    const wrapper = screen.getByTestId('pull-to-refresh')
    fireEvent.touchStart(wrapper, { touches: [{ clientY: 10 }] })
    fireEvent.touchMove(wrapper, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(wrapper)
    expect(onRefresh).toHaveBeenCalled()
  })
})
