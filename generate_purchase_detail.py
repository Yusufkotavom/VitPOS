import re

with open('src/features/sales-orders/pages/sales-order-detail-page.tsx', 'r') as f:
    code = f.read()

# Replace imports
code = code.replace("import { useSalesOrder } from '@/features/sales-orders/hooks/use-sales-order'", 
                    "import { usePurchase } from '@/features/purchases/hooks/use-purchase'")
code = code.replace("import { deleteSalesOrder, recordSalesOrderPayment } from '@/features/sales-orders/services/sales-order-finance.service'",
                    "import { recordPurchasePayment } from '@/features/purchases/services/purchase-payment.service'\nimport { receivePurchaseOrder, syncSupplierPurchaseMetrics } from '@/features/purchases/services/purchase-receiving.service'\nimport { purchaseRepository } from '@/services/local-db/repository'")
code = code.replace("import { salesOrderRepository } from '@/services/local-db/repository'", "")

# Replace Component name
code = code.replace('SalesOrderDetailPage', 'PurchaseDetailPage')
code = code.replace('useSalesOrder(id)', 'usePurchase(id)')
code = code.replace('salesOrderRepository', 'purchaseRepository')
code = code.replace('salesOrderId', 'purchaseId')
code = code.replace('Sales Order tidak ditemukan', 'Purchase Order tidak ditemukan')
code = code.replace('sales-orders', 'purchases')

# Replace customer specific things
code = code.replace('order.customerId', 'order.supplierId')
code = code.replace('order.customerName', 'order.supplierName')
code = code.replace('const invoiceCustomer', 'const invoiceSupplier')
code = code.replace('localDb.customers.get', 'localDb.suppliers.get')
code = code.replace('invoiceCustomer?.phone', 'invoiceSupplier?.phone')
code = code.replace('order.customerName', 'order.supplierName')

# Fix status mapping
status_tone_func = """function tone(status: string) {
  if (status === 'Diterima') return 'success'
  if (status === 'Dikirim') return 'info'
  if (status === 'Batal') return 'danger'
  return 'warning'
}"""
code = re.sub(r'function tone\(status: string\) \{[\s\S]*?\}', status_tone_func, code)

# Payment logic
code = code.replace("recordSalesOrderPayment(order.id, amount, payMethod as 'tunai' | 'qris' | 'kartu' | 'transfer' | 'e-wallet' | 'piutang')",
                    "recordPurchasePayment(order.id, amount, payMethod, 'Pembelian')")

# Delete logic
delete_logic = """    if (!order) return
    try {
      const supplierId = order.supplierId
      await purchaseRepository.remove(order.id)
      if (supplierId) {
        await syncSupplierPurchaseMetrics(supplierId)
      }
      toast.success('PO dihapus')
      setDeleteOpen(false)
    } catch (error) {
      toast.error(`Gagal menghapus: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }"""
code = re.sub(r'async function handleDelete\(\) \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}\s*\}', 'async function handleDelete() {\n' + delete_logic + '\n  }', code)

# WhatsApp logic: we need to adapt supplier.phone
# Just change toast messages
code = code.replace("'Pelanggan tidak memiliki nomor WhatsApp'", "'Supplier tidak memiliki nomor WhatsApp'")
code = code.replace("'Nomor WhatsApp pelanggan tidak ditemukan'", "'Nomor WhatsApp supplier tidak ditemukan'")
code = code.replace("customer_name: order.supplierName,", "customer_name: order.supplierName,") # wait, supplierName is mapped to customer_name for template, which is fine

# Edit save logic
# order in this context is purchase
edit_save_replace = """      await purchaseRepository.upsert({
        ...order,
        items: items.map(i => ({
          id: i.id,
          tenantId: order.tenantId,
          purchaseId: order.id,
          productId: order.items.find((item) => item.id === i.id)?.productId ?? '',
          name: i.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
        })),
        subtotal,
        grandTotal,
        version: order.version + 1,
        updatedAt: new Date().toISOString(),
      })"""
code = re.sub(r'await salesOrderRepository\.upsert\(\{[\s\S]*?\}\)', edit_save_replace, code)


# Replace invoice with PO strings
code = code.replace('Invoice dihapus', 'PO dihapus')
code = code.replace('Hapus invoice', 'Hapus PO')
code = code.replace('Terima Pembayaran', 'Bayar ke Supplier')

# Replace `invoiceData` rendering
# Add "Terima Barang" button
action_buttons_replace = """    <div className="flex flex-wrap items-center gap-2">
      {order.status !== 'Diterima' && order.status !== 'Batal' && (
        <Button variant="outline" size="sm" onClick={async () => {
          try {
            await receivePurchaseOrder(order)
            toast.success('Barang diterima')
            refetch()
          } catch(e: any) {
            toast.error(e.message)
          }
        }}>
          Terima Barang
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={() => invoiceData && printPdf(invoiceData)}>
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>
      <Button variant="outline" size="sm" onClick={() => invoiceData && downloadPdf(invoiceData, `PO-${order?.code || 'download'}`)}>
        <Download className="mr-2 h-4 w-4" />
        PDF
      </Button>
      <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={handleWhatsApp}>
        <MessageSquare className="mr-2 h-4 w-4" />
        WA
      </Button>
      {editing ? (
        <>
          <Button variant="outline" size="sm" onClick={cancelEditing}>
            <XIcon className="mr-2 h-4 w-4" />
            Batal
          </Button>
          <Button size="sm" onClick={saveEditing}>
            <CheckIcon className="mr-2 h-4 w-4" />
            Simpan
          </Button>
        </>
      ) : (
        <>
          <Button variant="outline" size="sm" onClick={startEditing}>
            <PencilIcon className="mr-2 h-4 w-4" />
            Ubah
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        </>
      )}
    </div>"""

code = re.sub(r'<div className="flex flex-wrap items-center gap-2">[\s\S]*?</div>\s*\)', action_buttons_replace + '\n  )', code)

with open('src/features/purchases/pages/purchase-detail-page.tsx', 'w') as f:
    f.write(code)

print("done")
