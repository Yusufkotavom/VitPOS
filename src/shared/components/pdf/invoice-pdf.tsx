import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { formatCurrency } from '@/lib/format-currency'
import type { PdfInvoiceData, PdfCompanySettings } from './types'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#374151', lineHeight: 1.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 15, marginBottom: 20 },
  companyInfo: { flexDirection: 'column', maxWidth: '60%' },
  companyName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  companySub: { color: '#4b5563', fontSize: 8, marginBottom: 2 },
  invoiceMeta: { alignItems: 'flex-end' },
  invoiceTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 5 },
  metaText: { fontSize: 8, color: '#4b5563', marginBottom: 2 },
  detailsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  billTo: { width: '48%' },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#374151', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 3, marginBottom: 6, textTransform: 'uppercase' },
  detailText: { fontSize: 8, color: '#4b5563', marginBottom: 2 },
  table: { marginTop: 10, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderBottomColor: '#d1d5db', paddingVertical: 6, paddingHorizontal: 8, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 6, paddingHorizontal: 8 },
  colItem: { width: '45%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  headerText: { fontWeight: 'bold', color: '#374151' },
  totalsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  stampContainer: { width: '50%' },
  badge: { borderWidth: 2, paddingVertical: 6, paddingHorizontal: 12, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', alignSelf: 'flex-start', marginTop: 10, borderRadius: 4 },
  badgePaid: { borderColor: '#16a34a', color: '#16a34a' },
  badgeUnpaid: { borderColor: '#dc2626', color: '#dc2626' },
  badgePartial: { borderColor: '#ca8a04', color: '#ca8a04' },
  totalsTable: { width: '40%' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalsRowBold: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#d1d5db', fontWeight: 'bold', fontSize: 10, color: '#111827' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10, textAlign: 'center', color: '#9ca3af', fontSize: 8 },
  termsContainer: { marginTop: 30, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10 },
  termsTitle: { fontSize: 8, fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', marginBottom: 4 },
  termsText: { fontSize: 7, color: '#6b7280' },
})

function fmt(n: number) {
  return formatCurrency(n)
}

function badgeStyle(status: string) {
  if (status === 'Lunas') return { ...styles.badge, ...styles.badgePaid }
  if (status === 'Belum Bayar') return { ...styles.badge, ...styles.badgeUnpaid }
  return { ...styles.badge, ...styles.badgePartial }
}

function badgeLabel(status: string) {
  if (status === 'Lunas') return 'LUNAS'
  if (status === 'Belum Bayar') return 'BELUM BAYAR'
  return 'DIBAYAR SEBAGIAN'
}

export function InvoicePDF({ data, settings }: { data: PdfInvoiceData; settings: PdfCompanySettings }) {
  const remaining = Math.max(0, data.summary.grandTotal - data.summary.paidTotal)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{settings.companyName}</Text>
            {settings.companyAddress && <Text style={styles.companySub}>{settings.companyAddress}</Text>}
            {settings.companyPhone && <Text style={styles.companySub}>Telp: {settings.companyPhone}</Text>}
            {settings.companyTax && <Text style={styles.companySub}>NPWP/NIB: {settings.companyTax}</Text>}
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.metaText}>{data.code}</Text>
            <Text style={styles.metaText}>{data.date}</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.billTo}>
            <Text style={styles.sectionTitle}>Tujuan Tagihan</Text>
            <Text style={[styles.detailText, { fontWeight: 'bold' }]}>{data.customer.name}</Text>
            {data.customer.phone && <Text style={styles.detailText}>{data.customer.phone}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colItem}><Text style={styles.headerText}>Item</Text></View>
            <View style={styles.colQty}><Text style={styles.headerText}>Qty</Text></View>
            <View style={styles.colPrice}><Text style={styles.headerText}>Harga</Text></View>
            <View style={styles.colTotal}><Text style={styles.headerText}>Total</Text></View>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colItem}><Text>{item.name}</Text></View>
              <View style={styles.colQty}><Text>{item.qty}</Text></View>
              <View style={styles.colPrice}><Text>{fmt(item.price)}</Text></View>
              <View style={styles.colTotal}><Text>{fmt(item.subtotal)}</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.totalsContainer}>
          <View style={styles.stampContainer}>
            <Text style={badgeStyle(data.summary.status)}>{badgeLabel(data.summary.status)}</Text>
          </View>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text>Subtotal</Text>
              <Text style={{ fontWeight: 'bold' }}>{fmt(data.summary.subtotal)}</Text>
            </View>
            {data.summary.discount > 0 && (
              <View style={styles.totalsRow}>
                <Text>Diskon</Text>
                <Text>-{fmt(data.summary.discount)}</Text>
              </View>
            )}
            <View style={styles.totalsRow}>
              <Text>Total</Text>
              <Text style={{ fontWeight: 'bold' }}>{fmt(data.summary.grandTotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>Dibayar</Text>
              <Text>{fmt(data.summary.paidTotal)}</Text>
            </View>
            {remaining > 0 && (
              <View style={styles.totalsRowBold}>
                <Text>Sisa Tagihan</Text>
                <Text>{fmt(remaining)}</Text>
              </View>
            )}
            {data.summary.change && data.summary.change > 0 && (
              <View style={styles.totalsRow}>
                <Text>Kembali</Text>
                <Text>{fmt(data.summary.change)}</Text>
              </View>
            )}
          </View>
        </View>

        {data.payments && data.payments.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.termsTitle}>Riwayat Pembayaran</Text>
            <View style={[styles.tableHeader, { marginTop: 5 }]}>
              <View style={{ width: '40%' }}><Text style={styles.headerText}>Tanggal</Text></View>
              <View style={{ width: '30%' }}><Text style={styles.headerText}>Metode</Text></View>
              <View style={{ width: '30%', textAlign: 'right' }}><Text style={styles.headerText}>Nominal</Text></View>
            </View>
            {data.payments.map((p, i) => (
              <View key={i} style={styles.tableRow}>
                <View style={{ width: '40%' }}><Text>{p.date}</Text></View>
                <View style={{ width: '30%' }}><Text style={{ textTransform: 'capitalize' }}>{p.method}</Text></View>
                <View style={{ width: '30%', textAlign: 'right' }}><Text>{fmt(p.amount)}</Text></View>
              </View>
            ))}
          </View>
        )}

        {(data.notes || settings.invoiceTerm) && (
          <View style={styles.termsContainer}>
            <Text style={styles.termsTitle}>Catatan</Text>
            <Text style={styles.termsText}>{data.notes || settings.invoiceTerm}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>{settings.receiptFooter || 'Terima kasih atas kepercayaan Anda.'}</Text>
        </View>
      </Page>
    </Document>
  )
}
