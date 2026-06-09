import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { formatCurrency } from '@/lib/format-currency'
import type { PdfServiceData, PdfCompanySettings } from './types'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#374151', lineHeight: 1.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 15, marginBottom: 20 },
  companyInfo: { flexDirection: 'column', maxWidth: '60%' },
  companyName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  companySub: { color: '#4b5563', fontSize: 8, marginBottom: 2 },
  metaSection: { alignItems: 'flex-end' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 5 },
  metaText: { fontSize: 8, color: '#4b5563', marginBottom: 2 },
  detailsContainer: { marginBottom: 25 },
  customerSection: { marginBottom: 15 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#374151', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 3, marginBottom: 6, textTransform: 'uppercase' },
  detailText: { fontSize: 8, color: '#4b5563', marginBottom: 2 },
  detailBold: { fontSize: 8, color: '#4b5563', marginBottom: 2, fontWeight: 'bold' },
  problemBox: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4, padding: 10, marginTop: 5, marginBottom: 20 },
  problemText: { fontSize: 7, color: '#6b7280', lineHeight: 1.6 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderBottomColor: '#d1d5db', paddingVertical: 6, paddingHorizontal: 8, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 6, paddingHorizontal: 8 },
  colDesc: { width: '70%' },
  colCost: { width: '30%', textAlign: 'right' },
  headerText: { fontWeight: 'bold', color: '#374151' },
  totalsSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalsTable: { width: '40%' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalsRowBold: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#d1d5db', fontWeight: 'bold', fontSize: 10, color: '#111827' },
  statusBadge: { fontSize: 8, color: '#6b7280', marginTop: 4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10, textAlign: 'center', color: '#9ca3af', fontSize: 8 },
})

function fmt(n: number) {
  return formatCurrency(n)
}

export function ServicePDF({ data, settings }: { data: PdfServiceData; settings: PdfCompanySettings }) {
  const remaining = Math.max(0, data.cost - data.summary.paidTotal)

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
            <Text style={styles.title}>SERVICE ORDER</Text>
            <Text style={styles.metaText}>{data.code}</Text>
            <Text style={styles.metaText}>{data.date}</Text>
            <Text style={styles.statusBadge}>Status: {data.summary.status}</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.customerSection}>
            <Text style={styles.sectionTitle}>Pelanggan</Text>
            <Text style={styles.detailBold}>{data.customer.name}</Text>
            {data.customer.phone && <Text style={styles.detailText}>{data.customer.phone}</Text>}
          </View>

          <View style={{ marginBottom: 15 }}>
            <Text style={styles.sectionTitle}>Detail Servis</Text>
            <Text style={styles.detailBold}>Perangkat: {data.device}</Text>
            <View style={styles.problemBox}>
              <Text style={styles.problemText}>{data.problem}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 10 }}>
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}><Text style={styles.headerText}>Deskripsi</Text></View>
            <View style={styles.colCost}><Text style={styles.headerText}>Biaya</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.colDesc}><Text>Jasa Servis - {data.device}</Text></View>
            <View style={styles.colCost}><Text>{fmt(data.cost)}</Text></View>
          </View>
        </View>

        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRowBold}>
              <Text>Total Biaya</Text>
              <Text>{fmt(data.cost)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>Dibayar</Text>
              <Text>{fmt(data.summary.paidTotal)}</Text>
            </View>
            {remaining > 0 && (
              <View style={styles.totalsRowBold}>
                <Text>Sisa</Text>
                <Text>{fmt(remaining)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Terima kasih atas kepercayaan Anda.</Text>
        </View>
      </Page>
    </Document>
  )
}
