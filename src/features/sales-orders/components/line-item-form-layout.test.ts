import { createElement } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PurchaseForm } from '@/features/purchases/components/purchase-form'
import { ReturnForm } from '@/features/returns/components/return-form'
import { SalesOrderForm } from '@/features/sales-orders/components/sales-order-form'

const t = (key: string) => {
  const translations: Record<string, string> = {
    'sales_orders.item_name_aria_label': 'Nama item {index}',
    'sales_orders.item_qty_aria_label': 'Qty item {index}',
    'sales_orders.item_price_aria_label': 'Harga item {index}',
    'purchases.item_name_aria_label': 'Nama item {index}',
    'purchases.item_qty_aria_label': 'Qty item {index}',
    'purchases.item_price_aria_label': 'Harga item {index}',
    'returns.item_name_label': 'Nama item {n}',
    'returns.item_qty_label': '{"n"}',
    'returns.item_price_label': '{"n"}',
    'common.qty': 'Qty',
    'common.price': 'Harga',
    'common.cancel': 'Batal',
    'common.date': 'Tanggal',
    'common.status': 'Status',
    'common.customer': 'Pelanggan',
    'common.name': 'Nama',
    'common.discount': 'Diskon',
    'common.tax': 'Pajak',
    'sales_orders.form_info_title': 'Info invoice',
    'sales_orders.form_info_description': 'Nomor invoice, pelanggan, tanggal, dan status.',
    'sales_orders.invoice_number_label': 'Nomor invoice',
    'sales_orders.invoice_number_placeholder': 'INV-20260608-001',
    'sales_orders.customer_name_placeholder': 'Nama pelanggan',
    'sales_orders.order_items': 'Item pesanan',
    'sales_orders.order_items_description': 'Tambah produk atau jasa yang dipesan.',
    'sales_orders.discount_tax_section_title': 'Diskon & pajak',
    'sales_orders.discount_tax_section_description': 'Potongan dan pajak diterapkan ke subtotal.',
    'sales_orders.add_item': '+ Tambah item',
    'purchases.info': 'Info pembelian',
    'purchases.info_description': 'Nomor PO, supplier, tanggal, dan status.',
    'purchases.po_number_label': 'Nomor PO',
    'purchases.po_number_placeholder': 'PO-20260608-001',
    'purchases.supplier_label': 'Supplier',
    'purchases.supplier_name_placeholder': 'Nama supplier',
    'purchases.items': 'Item pembelian',
    'purchases.items_description': 'Tambah produk yang dipesan dari supplier.',
    'purchases.add_item': '+ Tambah item',
    'returns.form_info_title': 'Info retur',
    'returns.form_info_description': 'Nomor retur, referensi, dan tanggal.',
    'returns.code_label': 'Nomor retur',
    'returns.code_placeholder': 'Otomatis jika kosong',
    'returns.reference_label': 'Kode referensi',
    'returns.reference_placeholder': 'INV/PO asal',
    'returns.items_title': 'Item Retur',
    'returns.add_item': '+ Tambah item',
    'returns.save_local_description': 'Retur tersimpan lokal dulu...',
    'returns.delete_title': 'Hapus retur',
    'returns.delete_confirm': 'Hapus retur',
    'returns.delete_description': 'Retur {{code}} akan dihapus...',
    'returns.edit_title': 'Ubah retur',
    'returns.create_title': 'Buat retur baru',
    'returns.create': 'Buat retur',
  }
  const resolved = translations[key]
  if (!resolved) return key
  return resolved.replace(/\{(\w+)\}/g, '1')
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t }),
}))

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
