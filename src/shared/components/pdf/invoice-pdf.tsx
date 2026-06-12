import { Document, Page, StyleSheet, Text, View, Image } from '@react-pdf/renderer'
import { formatCurrency } from '@/lib/format-currency'
import { formatDateTime } from '@/lib/date'
import type { PdfInvoiceData, PdfCompanySettings } from './types'
import type { InvoiceThemeTokens } from './invoice-themes'
import { invoiceThemes } from './invoice-themes'

const baseStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#374151', lineHeight: 1.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, paddingBottom: 15, marginBottom: 20 },
  companyInfo: { flexDirection: 'column', maxWidth: '60%' },
  companyName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  companySub: { fontSize: 8, marginBottom: 2 },
  invoiceMeta: { alignItems: 'flex-end' },
  invoiceTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  metaText: { fontSize: 8, marginBottom: 2 },
  detailsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  billTo: { width: '48%' },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', borderBottomWidth: 1, paddingBottom: 3, marginBottom: 6, textTransform: 'uppercase' },
  detailText: { fontSize: 8, marginBottom: 2 },
  table: { marginTop: 10, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 6, paddingHorizontal: 8, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 6, paddingHorizontal: 8 },
  colItem: { width: '45%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  totalsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  stampContainer: { width: '50%' },
  badge: { borderWidth: 2, paddingVertical: 6, paddingHorizontal: 12, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', alignSelf: 'flex-start', marginTop: 10, borderRadius: 4 },
  totalsTable: { width: '40%' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalsRowBold: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, fontWeight: 'bold', fontSize: 10, color: '#111827' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, paddingTop: 10, textAlign: 'center', fontSize: 8 },
  termsContainer: { marginTop: 30, borderTopWidth: 1, paddingTop: 10 },
  termsTitle: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  termsText: { fontSize: 7 },
  paymentRow: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 5, paddingHorizontal: 8 },
  logo: { width: 120, height: 'auto', marginBottom: 4 },
  logoPlaceholder: { width: 120, height: 40, backgroundColor: '#f3f4f6', borderRadius: 4, marginBottom: 4, justifyContent: 'center', alignItems: 'center' },
})

function fmt(n: number) {
  return formatCurrency(n)
}

function badgeStyle(theme: InvoiceThemeTokens, status: string) {
  const borderColor = status === 'Lunas' ? theme.badgePaid : status === 'Belum Bayar' ? theme.badgeUnpaid : theme.badgePartial
  return { ...baseStyles.badge, borderColor, color: borderColor }
}

function badgeLabel(status: string) {
  if (status === 'Lunas') return 'LUNAS'
  if (status === 'Belum Bayar') return 'BELUM BAYAR'
  return 'DIBAYAR SEBAGIAN'
}

export function InvoicePDF({ data, settings }: { data: PdfInvoiceData; settings: PdfCompanySettings }) {
  const theme = invoiceThemes[settings.invoiceTheme] ?? invoiceThemes.klasik
  const remaining = Math.max(0, data.summary.grandTotal - data.summary.paidTotal)

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <View style={[baseStyles.header, { borderBottomColor: theme.headerAccent }]}>
          <View style={baseStyles.companyInfo}>
            {settings.invoiceLogo ? (
              <Image src={settings.invoiceLogo} style={baseStyles.logo} />
            ) : (
              <Text style={[baseStyles.companyName, { color: theme.headerTextColor }]}>{settings.companyName}</Text>
            )}
            <View style={{ flexDirection: 'column', gap: 2 }}>
              {settings.companyAddress && <Text style={[baseStyles.companySub, { color: theme.headerTextColor === '#ffffff' || theme.headerTextColor === '#f8fafc' || theme.headerTextColor === '#fef2f2' ? '#cbd5e1' : '#4b5563' }]}>{settings.companyAddress}</Text>}
              {settings.companyPhone && <Text style={[baseStyles.companySub, { color: theme.headerTextColor === '#ffffff' || theme.headerTextColor === '#f8fafc' || theme.headerTextColor === '#fef2f2' ? '#cbd5e1' : '#4b5563' }]}>Telp: {settings.companyPhone}</Text>}
              {settings.companyTax && <Text style={[baseStyles.companySub, { color: theme.headerTextColor === '#ffffff' || theme.headerTextColor === '#f8fafc' || theme.headerTextColor === '#fef2f2' ? '#cbd5e1' : '#4b5563' }]}>NPWP/NIB: {settings.companyTax}</Text>}
            </View>
          </View>
          <View style={baseStyles.invoiceMeta}>
            <Text style={[baseStyles.invoiceTitle, { color: theme.titleColor }]}>INVOICE</Text>
            <Text style={[baseStyles.metaText, { color: theme.headerTextColor === '#ffffff' || theme.headerTextColor === '#f8fafc' || theme.headerTextColor === '#fef2f2' ? '#cbd5e1' : '#4b5563' }]}>{data.code}</Text>
            <Text style={[baseStyles.metaText, { color: theme.headerTextColor === '#ffffff' || theme.headerTextColor === '#f8fafc' || theme.headerTextColor === '#fef2f2' ? '#cbd5e1' : '#4b5563' }]}>{formatDateTime(data.date)}</Text>
          </View>
        </View>

        <View style={baseStyles.detailsContainer}>
          <View style={baseStyles.billTo}>
            <Text style={[baseStyles.sectionTitle, { color: theme.accentColor, borderBottomColor: theme.tableBorderColor }]}>Tujuan Tagihan</Text>
            <Text style={[baseStyles.detailText, { fontWeight: 'bold', color: '#111827' }]}>{data.customer.name}</Text>
            {data.customer.phone && <Text style={[baseStyles.detailText, { color: '#4b5563' }]}>{data.customer.phone}</Text>}
          </View>
        </View>

        <View style={baseStyles.table}>
          <View style={[baseStyles.tableHeader, { backgroundColor: theme.tableHeaderBg, borderBottomColor: theme.tableBorderColor }]}>
            <View style={baseStyles.colItem}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Item</Text></View>
            <View style={baseStyles.colQty}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Qty</Text></View>
            <View style={baseStyles.colPrice}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Harga</Text></View>
            <View style={baseStyles.colTotal}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Total</Text></View>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={[baseStyles.tableRow, { borderBottomColor: theme.tableBorderColor }]}>
              <View style={baseStyles.colItem}><Text>{item.name}</Text></View>
              <View style={baseStyles.colQty}><Text>{item.qty}</Text></View>
              <View style={baseStyles.colPrice}><Text>{fmt(item.price)}</Text></View>
              <View style={baseStyles.colTotal}><Text>{fmt(item.subtotal)}</Text></View>
            </View>
          ))}
        </View>

        <View style={baseStyles.totalsContainer}>
          <View style={baseStyles.stampContainer}>
            <Text style={badgeStyle(theme, data.summary.status)}>{badgeLabel(data.summary.status)}</Text>
          </View>
          <View style={baseStyles.totalsTable}>
            <View style={baseStyles.totalsRow}>
              <Text>Subtotal</Text>
              <Text style={{ fontWeight: 'bold' }}>{fmt(data.summary.subtotal)}</Text>
            </View>
            {data.summary.discount > 0 && (
              <View style={baseStyles.totalsRow}>
                <Text>Diskon</Text>
                <Text>-{fmt(data.summary.discount)}</Text>
              </View>
            )}
            <View style={baseStyles.totalsRow}>
              <Text>Total</Text>
              <Text style={{ fontWeight: 'bold' }}>{fmt(data.summary.grandTotal)}</Text>
            </View>
            <View style={baseStyles.totalsRow}>
              <Text>Dibayar</Text>
              <Text>{fmt(data.summary.paidTotal)}</Text>
            </View>
            {remaining > 0 && (
              <View style={[baseStyles.totalsRowBold, { borderTopColor: theme.tableBorderColor }]}>
                <Text>Sisa Tagihan</Text>
                <Text>{fmt(remaining)}</Text>
              </View>
            )}
            {data.summary.change && data.summary.change > 0 && (
              <View style={baseStyles.totalsRow}>
                <Text>Kembali</Text>
                <Text>{fmt(data.summary.change)}</Text>
              </View>
            )}
          </View>
        </View>

        {data.payments && data.payments.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={[baseStyles.termsTitle, { color: theme.accentColor }]}>Riwayat Pembayaran</Text>
            <View style={[baseStyles.tableHeader, { backgroundColor: theme.tableHeaderBg, borderBottomColor: theme.tableBorderColor, marginTop: 5 }]}>
              <View style={{ width: '40%' }}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Tanggal</Text></View>
              <View style={{ width: '30%' }}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Metode</Text></View>
              <View style={{ width: '30%', textAlign: 'right' }}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Nominal</Text></View>
            </View>
            {data.payments.map((p, i) => (
              <View key={i} style={[baseStyles.paymentRow, { borderBottomColor: theme.tableBorderColor }]}>
                <View style={{ width: '40%' }}><Text>{formatDateTime(p.date)}</Text></View>
                <View style={{ width: '30%' }}><Text style={{ textTransform: 'capitalize' }}>{p.method}</Text></View>
                <View style={{ width: '30%', textAlign: 'right' }}><Text>{fmt(p.amount)}</Text></View>
              </View>
            ))}
          </View>
        )}

        {(data.notes || settings.invoiceTerm) && (
          <View style={[baseStyles.termsContainer, { borderTopColor: theme.tableBorderColor }]}>
            <Text style={[baseStyles.termsTitle, { color: theme.accentColor }]}>Catatan</Text>
            <Text style={[baseStyles.termsText, { color: '#6b7280' }]}>{data.notes || settings.invoiceTerm}</Text>
          </View>
        )}

        <View style={[baseStyles.footer, { borderTopColor: theme.footerBorder }]}>
          <Text style={{ color: '#9ca3af' }}>{settings.receiptFooter || 'Terima kasih atas kepercayaan Anda.'}</Text>
        </View>
      </Page>
    </Document>
  )
}
