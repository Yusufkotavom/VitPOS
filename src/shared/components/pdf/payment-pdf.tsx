import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { formatCurrency } from '@/lib/format-currency'
import type { PdfPaymentData, PdfCompanySettings } from './types'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#374151', lineHeight: 1.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 15, marginBottom: 20 },
  companyInfo: { flexDirection: 'column', maxWidth: '60%' },
  companyName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  companySub: { color: '#4b5563', fontSize: 8, marginBottom: 2 },
  metaSection: { alignItems: 'flex-end' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 5 },
  metaText: { fontSize: 8, color: '#4b5563', marginBottom: 2 },
  detailsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  customerInfo: { width: '48%' },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#374151', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 3, marginBottom: 6, textTransform: 'uppercase' },
  detailText: { fontSize: 8, color: '#4b5563', marginBottom: 2 },
  detailBold: { fontSize: 8, color: '#4b5563', marginBottom: 2, fontWeight: 'bold' },
  paymentDetails: { width: '48%', textAlign: 'right' },
  totalsSection: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 15, flexDirection: 'row', justifyContent: 'flex-end' },
  totalsTable: { width: '40%' },
  rowNormal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, fontSize: 9 },
  rowBold: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#d1d5db', fontWeight: 'bold', fontSize: 12, color: '#111827' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10, textAlign: 'center', color: '#9ca3af', fontSize: 8 },
})

function fmt(n: number) {
  return formatCurrency(n)
}

export function PaymentPDF({ data, settings }: { data: PdfPaymentData; settings: PdfCompanySettings }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{settings.companyName}</Text>
            {settings.companyAddress && <Text style={styles.companySub}>{settings.companyAddress}</Text>}
            {settings.companyPhone && <Text style={styles.companySub}>Telp: {settings.companyPhone}</Text>}
          </View>
          <View style={styles.metaSection}>
            <Text style={styles.title}>BUKTI PEMBAYARAN</Text>
            <Text style={styles.metaText}>{data.ref}</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.customerInfo}>
            <Text style={styles.detailBold}>{data.customer.name}</Text>
            <Text style={styles.detailText}>No Invoice: {data.invoiceCode}</Text>
          </View>
          <View style={styles.paymentDetails}>
            <Text style={styles.detailText}>Tanggal: {data.date}</Text>
            <Text style={styles.detailText}>Metode: {data.method}</Text>
            <Text style={styles.detailText}>Status: {data.status}</Text>
          </View>
        </View>

        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.rowNormal}>
              <Text>Total Invoice</Text>
              <Text style={{ fontWeight: 'bold' }}>{fmt(data.invoiceTotal)}</Text>
            </View>
            <View style={styles.rowBold}>
              <Text>Dibayar</Text>
              <Text>{fmt(data.amount)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Terima kasih atas kepercayaan Anda.</Text>
        </View>
      </Page>
    </Document>
  )
}
