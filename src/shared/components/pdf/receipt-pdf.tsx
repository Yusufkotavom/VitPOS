import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { formatCurrency } from '@/lib/format-currency'
import { formatDateTime } from '@/lib/date'
import type { PdfReceiptData, PdfCompanySettings } from './types'

const styles = StyleSheet.create({
  page: { padding: 12, fontSize: 8, fontFamily: 'Courier', color: '#000', lineHeight: 1.4, width: 226 },
  center: { textAlign: 'center' },
  bold: { fontWeight: 'bold' },
  companyName: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  infoText: { fontSize: 7, textAlign: 'center', color: '#333', marginBottom: 1 },
  divider: { borderTopWidth: 1, borderTopColor: '#000', borderStyle: 'dashed', marginVertical: 6 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, marginBottom: 2 },
  itemName: { fontSize: 7, fontWeight: 'bold', marginBottom: 1 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, marginBottom: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, marginBottom: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, marginBottom: 1 },
  footer: { textAlign: 'center', fontSize: 7, marginTop: 8 },
})

function fmt(n: number) {
  return formatCurrency(n)
}

export function ReceiptPDF({ data, settings }: { data: PdfReceiptData; settings: PdfCompanySettings }) {
  const paid = data.summary.paidTotal
  const shortage = data.summary.grandTotal - paid
  const isShort = shortage > 0

  return (
    <Document>
      <Page size={{ width: 226 }} style={styles.page}>
        <Text style={styles.companyName}>{settings.companyName}</Text>
        {settings.companyAddress && <Text style={styles.infoText}>{settings.companyAddress}</Text>}
        {settings.companyPhone && <Text style={styles.infoText}>Telp: {settings.companyPhone}</Text>}
        {settings.receiptHeader && <Text style={[styles.infoText, { fontStyle: 'italic', marginTop: 4 }]}>{settings.receiptHeader}</Text>}

        <View style={styles.divider} />

        <View style={styles.headerRow}>
          <Text>{formatDateTime(data.date)}</Text>
          <Text>Kasir: {data.cashierName}</Text>
        </View>
        <View style={styles.headerRow}>
          <Text>ID: {data.code}</Text>
          {data.customer.name !== 'Umum' && <Text>Pel: {data.customer.name}</Text>}
        </View>

        <View style={styles.divider} />

        {data.items.map((item, i) => (
          <View key={i}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemRow}>
              <Text>{item.qty} x {fmt(item.price)}</Text>
              <Text>{fmt(item.subtotal)}</Text>
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text>Subtotal</Text>
          <Text>{fmt(data.summary.subtotal)}</Text>
        </View>
        {data.summary.discount > 0 && (
          <View style={styles.summaryRow}>
            <Text>Diskon</Text>
            <Text>-{fmt(data.summary.discount)}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text>Total</Text>
          <Text>{fmt(data.summary.grandTotal)}</Text>
        </View>

        <View style={[styles.divider, { marginTop: 4 }]} />

        <View style={styles.paymentRow}>
          <Text>Bayar ({data.paymentMethod})</Text>
          <Text>{fmt(paid)}</Text>
        </View>
        {isShort ? (
          <View style={[styles.paymentRow, { fontWeight: 'bold' }]}>
            <Text>Kurang (DP)</Text>
            <Text>{fmt(shortage)}</Text>
          </View>
        ) : (
          <View style={[styles.paymentRow, { fontWeight: 'bold' }]}>
            <Text>Kembali</Text>
            <Text>{fmt(paid - data.summary.grandTotal)}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>{settings.receiptFooter}</Text>
        </View>
      </Page>
    </Document>
  )
}
