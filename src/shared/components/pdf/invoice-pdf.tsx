import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatDateTime } from '@/lib/date'
import { formatCurrency } from '@/lib/format-currency'
import type { PdfCompanySettings, PdfInvoiceData } from './types'
import type { InvoiceThemeTokens } from './invoice-themes'
import { invoiceThemes } from './invoice-themes'

const baseStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica', lineHeight: 1.45 },
  hero: { borderRadius: 18, padding: 20, marginBottom: 16, minHeight: 124, position: 'relative', overflow: 'hidden' },
  heroAccentBlock: { position: 'absolute', right: -34, top: -48, width: 150, height: 150, borderRadius: 75, opacity: 0.26 },
  heroAccentStripe: { position: 'absolute', right: 0, bottom: 0, width: 180, height: 12, opacity: 0.85 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 20 },
  companyInfo: { maxWidth: '58%' },
  logo: { width: 126, maxHeight: 42, marginBottom: 8, objectFit: 'contain' },
  companyName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, letterSpacing: 0.2 },
  companySub: { fontSize: 8, marginBottom: 2 },
  invoiceMeta: { alignItems: 'flex-end', minWidth: 180 },
  invoiceLabel: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 4 },
  invoiceTitle: { fontSize: 28, fontWeight: 'bold', letterSpacing: 1.2, marginBottom: 4 },
  invoiceCodePill: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12, marginTop: 6, fontSize: 8, fontWeight: 'bold' },
  metaText: { fontSize: 8, marginTop: 4 },
  infoGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  infoCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, minHeight: 74 },
  sectionEyebrow: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 1.1, fontWeight: 'bold', marginBottom: 5 },
  detailTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  detailText: { fontSize: 8, marginBottom: 2 },
  tableWrap: { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  tableHeader: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 10, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderTopWidth: 1 },
  colItem: { width: '45%' },
  colQty: { width: '13%', textAlign: 'center' },
  colPrice: { width: '21%', textAlign: 'right' },
  colTotal: { width: '21%', textAlign: 'right' },
  summaryArea: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 14 },
  stampContainer: { width: '48%' },
  badge: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1.5, marginBottom: 10 },
  noteCard: { borderRadius: 12, borderWidth: 1, padding: 10, marginTop: 8 },
  totalsPanel: { width: '44%', borderRadius: 16, borderWidth: 1, padding: 12 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalsLabel: { fontSize: 8 },
  totalsValue: { fontSize: 8, fontWeight: 'bold' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 9, marginTop: 6, borderTopWidth: 1.5 },
  grandTotalLabel: { fontSize: 10, fontWeight: 'bold' },
  grandTotalValue: { fontSize: 13, fontWeight: 'bold' },
  paymentsSection: { marginTop: 4, marginBottom: 12, borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  paymentTitle: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, padding: 10 },
  paymentRow: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 7, paddingHorizontal: 10 },
  termsContainer: { borderRadius: 12, borderWidth: 1, padding: 10, marginTop: 8 },
  termsTitle: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  termsText: { fontSize: 7 },
  footer: { position: 'absolute', bottom: 24, left: 30, right: 30, borderTopWidth: 1, paddingTop: 9, textAlign: 'center', fontSize: 8 },
})

function fmt(n: number) {
  return formatCurrency(n)
}

function badgeColor(theme: InvoiceThemeTokens, status: string) {
  if (status === 'Lunas') return theme.badgePaid
  if (status === 'Belum Bayar') return theme.badgeUnpaid
  return theme.badgePartial
}

function badgeLabel(status: string) {
  if (status === 'Lunas') return 'LUNAS'
  if (status === 'Belum Bayar') return 'BELUM BAYAR'
  return 'DIBAYAR SEBAGIAN'
}

function contrastSoft(theme: InvoiceThemeTokens) {
  return { color: theme.headerMutedText }
}

export function InvoicePDF({ data, settings }: { data: PdfInvoiceData; settings: PdfCompanySettings }) {
  const theme = invoiceThemes[settings.invoiceTheme] ?? invoiceThemes.klasik
  const remaining = Math.max(0, data.summary.grandTotal - data.summary.paidTotal)
  const statusColor = badgeColor(theme, data.summary.status)

  return (
    <Document>
      <Page size="A4" style={[baseStyles.page, { backgroundColor: theme.pageBg, color: theme.bodyText }]}> 
        <View style={[baseStyles.hero, { backgroundColor: theme.headerBg }]}> 
          <View style={[baseStyles.heroAccentBlock, { backgroundColor: theme.headerAccent }]} />
          <View style={[baseStyles.heroAccentStripe, { backgroundColor: theme.headerAccent }]} />
          <View style={baseStyles.heroTop}>
            <View style={baseStyles.companyInfo}>
              {settings.invoiceLogo ? (
                <Image src={settings.invoiceLogo} style={baseStyles.logo} />
              ) : (
                <Text style={[baseStyles.companyName, { color: theme.headerTextColor }]}>{settings.companyName}</Text>
              )}
              {settings.invoiceLogo ? <Text style={[baseStyles.companyName, { color: theme.headerTextColor, fontSize: 13 }]}>{settings.companyName}</Text> : null}
              {settings.companyAddress ? <Text style={[baseStyles.companySub, contrastSoft(theme)]}>{settings.companyAddress}</Text> : null}
              {settings.companyPhone ? <Text style={[baseStyles.companySub, contrastSoft(theme)]}>Telp: {settings.companyPhone}</Text> : null}
              {settings.companyTax ? <Text style={[baseStyles.companySub, contrastSoft(theme)]}>NPWP/NIB: {settings.companyTax}</Text> : null}
            </View>
            <View style={baseStyles.invoiceMeta}>
              <Text style={[baseStyles.invoiceLabel, contrastSoft(theme)]}>Dokumen Penagihan</Text>
              <Text style={[baseStyles.invoiceTitle, { color: theme.titleColor }]}>INVOICE</Text>
              <Text style={[baseStyles.invoiceCodePill, { backgroundColor: theme.headerAccent, color: theme.headerTextColor }]}>{data.code}</Text>
              <Text style={[baseStyles.metaText, contrastSoft(theme)]}>{formatDateTime(data.date)}</Text>
            </View>
          </View>
        </View>

        <View style={baseStyles.infoGrid}>
          <View style={[baseStyles.infoCard, { backgroundColor: theme.cardBg, borderColor: theme.sectionBorder }]}> 
            <Text style={[baseStyles.sectionEyebrow, { color: theme.accentColor }]}>Tujuan Tagihan</Text>
            <Text style={[baseStyles.detailTitle, { color: theme.bodyText }]}>{data.customer.name}</Text>
            {data.customer.phone ? <Text style={[baseStyles.detailText, { color: theme.mutedText }]}>{data.customer.phone}</Text> : null}
          </View>
          <View style={[baseStyles.infoCard, { backgroundColor: theme.cardSoftBg, borderColor: theme.sectionBorder }]}> 
            <Text style={[baseStyles.sectionEyebrow, { color: theme.accentColor }]}>Ringkasan Cepat</Text>
            <Text style={[baseStyles.detailText, { color: theme.mutedText }]}>Status: {badgeLabel(data.summary.status)}</Text>
            <Text style={[baseStyles.detailText, { color: theme.mutedText }]}>Total: {fmt(data.summary.grandTotal)}</Text>
            <Text style={[baseStyles.detailText, { color: theme.mutedText }]}>Sisa: {fmt(remaining)}</Text>
          </View>
        </View>

        <View style={[baseStyles.tableWrap, { backgroundColor: theme.cardBg, borderColor: theme.tableBorderColor }]}> 
          <View style={[baseStyles.tableHeader, { backgroundColor: theme.tableHeaderBg }]}> 
            <View style={baseStyles.colItem}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Item</Text></View>
            <View style={baseStyles.colQty}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Qty</Text></View>
            <View style={baseStyles.colPrice}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Harga</Text></View>
            <View style={baseStyles.colTotal}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Total</Text></View>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={[baseStyles.tableRow, { borderTopColor: theme.tableBorderColor, backgroundColor: i % 2 === 0 ? theme.cardBg : theme.cardSoftBg }]}> 
              <View style={baseStyles.colItem}><Text>{item.name}</Text></View>
              <View style={baseStyles.colQty}><Text>{item.qty}</Text></View>
              <View style={baseStyles.colPrice}><Text>{fmt(item.price)}</Text></View>
              <View style={baseStyles.colTotal}><Text style={{ fontWeight: 'bold' }}>{fmt(item.subtotal)}</Text></View>
            </View>
          ))}
        </View>

        <View style={baseStyles.summaryArea}>
          <View style={baseStyles.stampContainer}>
            <Text style={[baseStyles.badge, { borderColor: statusColor, color: statusColor, backgroundColor: theme.cardBg }]}>{badgeLabel(data.summary.status)}</Text>
            {(data.notes || settings.invoiceTerm) ? (
              <View style={[baseStyles.noteCard, { backgroundColor: theme.cardBg, borderColor: theme.sectionBorder }]}> 
                <Text style={[baseStyles.termsTitle, { color: theme.accentColor }]}>Catatan</Text>
                <Text style={[baseStyles.termsText, { color: theme.mutedText }]}>{data.notes || settings.invoiceTerm}</Text>
              </View>
            ) : null}
          </View>
          <View style={[baseStyles.totalsPanel, { backgroundColor: theme.totalPanelBg, borderColor: theme.totalPanelBorder }]}> 
            <View style={baseStyles.totalsRow}><Text style={[baseStyles.totalsLabel, { color: theme.mutedText }]}>Subtotal</Text><Text style={baseStyles.totalsValue}>{fmt(data.summary.subtotal)}</Text></View>
            {data.summary.discount > 0 ? <View style={baseStyles.totalsRow}><Text style={[baseStyles.totalsLabel, { color: theme.mutedText }]}>Diskon</Text><Text style={baseStyles.totalsValue}>-{fmt(data.summary.discount)}</Text></View> : null}
            <View style={baseStyles.totalsRow}><Text style={[baseStyles.totalsLabel, { color: theme.mutedText }]}>Dibayar</Text><Text style={baseStyles.totalsValue}>{fmt(data.summary.paidTotal)}</Text></View>
            {data.summary.change != null && data.summary.change > 0 ? <View style={baseStyles.totalsRow}><Text style={[baseStyles.totalsLabel, { color: theme.mutedText }]}>Kembali</Text><Text style={baseStyles.totalsValue}>{fmt(data.summary.change)}</Text></View> : null}
            <View style={[baseStyles.grandTotalRow, { borderTopColor: theme.totalPanelBorder }]}> 
              <Text style={[baseStyles.grandTotalLabel, { color: theme.bodyText }]}>{remaining > 0 ? 'Sisa Tagihan' : 'Total'}</Text>
              <Text style={[baseStyles.grandTotalValue, { color: theme.accentColor }]}>{fmt(remaining > 0 ? remaining : data.summary.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {data.payments && data.payments.length > 0 ? (
          <View style={[baseStyles.paymentsSection, { backgroundColor: theme.cardBg, borderColor: theme.tableBorderColor }]}> 
            <Text style={[baseStyles.paymentTitle, { color: theme.accentColor, backgroundColor: theme.cardSoftBg }]}>Riwayat Pembayaran</Text>
            <View style={[baseStyles.tableHeader, { backgroundColor: theme.tableHeaderBg }]}> 
              <View style={{ width: '40%' }}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Tanggal</Text></View>
              <View style={{ width: '30%' }}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Metode</Text></View>
              <View style={{ width: '30%', textAlign: 'right' }}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Nominal</Text></View>
            </View>
            {data.payments.map((p, i) => (
              <View key={i} style={[baseStyles.paymentRow, { borderTopColor: theme.tableBorderColor }]}> 
                <View style={{ width: '40%' }}><Text>{formatDateTime(p.date)}</Text></View>
                <View style={{ width: '30%' }}><Text style={{ textTransform: 'capitalize' }}>{p.method}</Text></View>
                <View style={{ width: '30%', textAlign: 'right' }}><Text>{fmt(p.amount)}</Text></View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[baseStyles.footer, { borderTopColor: theme.footerBorder }]}> 
          <Text style={{ color: theme.mutedText }}>{settings.receiptFooter || 'Terima kasih atas kepercayaan Anda.'}</Text>
        </View>
      </Page>
    </Document>
  )
}
