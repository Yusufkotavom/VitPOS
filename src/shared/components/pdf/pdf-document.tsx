import type { PdfData, PdfCompanySettings } from './types'
import { InvoicePDF } from './invoice-pdf'
import { ServicePDF } from './service-pdf'
import { ReceiptPDF } from './receipt-pdf'
import { PaymentPDF } from './payment-pdf'
import { SalesOrderPDF } from './sales-order-pdf'

export function PdfDocument({ data, settings }: { data: PdfData; settings: PdfCompanySettings }) {
  switch (data.type) {
    case 'invoice':
      return <InvoicePDF data={data} settings={settings} />
    case 'service':
      return <ServicePDF data={data} settings={settings} />
    case 'receipt':
      return <ReceiptPDF data={data} settings={settings} />
    case 'payment':
      return <PaymentPDF data={data} settings={settings} />
    case 'sales-order':
      return <SalesOrderPDF data={data} settings={settings} />
  }
}
