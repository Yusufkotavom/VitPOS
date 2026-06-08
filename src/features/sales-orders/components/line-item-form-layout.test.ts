import { createElement } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PurchaseForm } from '@/features/purchases/components/purchase-form'
import { ReturnForm } from '@/features/returns/components/return-form'
import { SalesOrderForm } from '@/features/sales-orders/components/sales-order-form'

describe('line item forms mobile layout and accessibility', () => {
  afterEach(() => cleanup())

  it('sales order line item fields have accessible names', () => {
    render(createElement(SalesOrderForm, { submitLabel: 'Simpan', onCancel: vi.fn(), onSubmit: vi.fn() }))

    expect(screen.getByLabelText('Nama item 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Qty item 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Harga item 1')).toBeInTheDocument()
  })

  it('purchase line item fields have accessible names', () => {
    render(createElement(PurchaseForm, { submitLabel: 'Simpan', onCancel: vi.fn(), onSubmit: vi.fn() }))

    expect(screen.getByLabelText('Nama item 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Qty item 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Harga item 1')).toBeInTheDocument()
  })

  it('return line item fields have accessible names', () => {
    render(createElement(ReturnForm, { submitLabel: 'Simpan', onCancel: vi.fn(), onSubmit: vi.fn() }))

    expect(screen.getByLabelText('Nama item 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Qty item 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Harga item 1')).toBeInTheDocument()
  })
})
