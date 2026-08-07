import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatDateTime } from '@/lib/date'
import type { PdfCompanySettings, PdfDeliveryNoteData } from './types'
import type { InvoiceThemeTokens } from './invoice-themes'
import { invoiceThemes } from './invoice-themes'
import { pdfLabels, type PdfLang } from './pdf-labels'

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
  colItem: { width: '70%' },
  colQty: { width: '15%', textAlign: 'center' },
  colUnit: { width: '15%', textAlign: 'center' },
  noteCard: { borderRadius: 12, borderWidth: 1, padding: 10, marginTop: 8 },
  termsTitle: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  termsText: { fontSize: 7 },
  signRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 60 },
  signBlock: { width: '38%' },
  signLine: { borderBottomWidth: 1, borderBottomColor: '#111827', marginBottom: 6 },
  signLabel: { fontSize: 8, marginBottom: 2 },
  signName: { fontSize: 8, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 24, left: 30, right: 30, borderTopWidth: 1, paddingTop: 9, textAlign: 'center', fontSize: 8 },
})

function contrastSoft(theme: InvoiceThemeTokens) {
  return { color: theme.headerMutedText }
}

function DeliveryNotePage({ data, settings, theme, lang }: { data: PdfDeliveryNoteData; settings: PdfCompanySettings; theme: InvoiceThemeTokens; lang: PdfLang }) {
  const t = pdfLabels[lang]

  return (
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
            {settings.companyPhone ? <Text style={[baseStyles.companySub, contrastSoft(theme)]}>{t.phone}: {settings.companyPhone}</Text> : null}
          </View>
          <View style={baseStyles.invoiceMeta}>
            <Text style={[baseStyles.invoiceLabel, contrastSoft(theme)]}>{t.deliveryLabel}</Text>
            <Text style={[baseStyles.invoiceTitle, { color: theme.titleColor }]}>{t.deliveryTitle}</Text>
            <Text style={[baseStyles.invoiceCodePill, { backgroundColor: theme.headerAccent, color: theme.headerTextColor }]}>{data.code}</Text>
            <Text style={[baseStyles.metaText, contrastSoft(theme)]}>{formatDateTime(data.date)}</Text>
          </View>
        </View>
      </View>

      <View style={baseStyles.infoGrid}>
        <View style={[baseStyles.infoCard, { backgroundColor: theme.cardBg, borderColor: theme.sectionBorder }]}>
          <Text style={[baseStyles.sectionEyebrow, { color: theme.accentColor }]}>{t.sender}</Text>
          <Text style={[baseStyles.detailTitle, { color: theme.bodyText }]}>{settings.companyName}</Text>
          {settings.companyAddress ? <Text style={[baseStyles.detailText, { color: theme.mutedText, fontSize: 7, lineHeight: 1.5 }]}>{settings.companyAddress}</Text> : null}
        </View>
        <View style={[baseStyles.infoCard, { backgroundColor: theme.cardSoftBg, borderColor: theme.sectionBorder }]}>
          <Text style={[baseStyles.sectionEyebrow, { color: theme.accentColor }]}>{t.shipTo}</Text>
          <Text style={[baseStyles.detailTitle, { color: theme.bodyText }]}>{data.customer.name}</Text>
          {data.customer.address ? <Text style={[baseStyles.detailText, { color: theme.mutedText, fontSize: 7, lineHeight: 1.5 }]}>{data.customer.address}</Text> : null}
          {data.customer.phone ? <Text style={[baseStyles.detailText, { color: theme.mutedText }]}>{data.customer.phone}</Text> : null}
        </View>
      </View>

      <View style={[baseStyles.tableWrap, { backgroundColor: theme.cardBg, borderColor: theme.tableBorderColor }]}>
        <View style={[baseStyles.tableHeader, { backgroundColor: theme.tableHeaderBg }]}>
          <View style={baseStyles.colItem}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>{t.item}</Text></View>
          <View style={baseStyles.colQty}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>{t.qty}</Text></View>
          <View style={baseStyles.colUnit}><Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>Pcs</Text></View>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={[baseStyles.tableRow, { borderTopColor: theme.tableBorderColor, backgroundColor: i % 2 === 0 ? theme.cardBg : theme.cardSoftBg }]}>
            <View style={baseStyles.colItem}><Text>{item.name}</Text></View>
            <View style={baseStyles.colQty}><Text>{item.qty}</Text></View>
            <View style={baseStyles.colUnit}><Text></Text></View>
          </View>
        ))}
      </View>

      {data.notes ? (
        <View style={[baseStyles.noteCard, { backgroundColor: theme.cardBg, borderColor: theme.sectionBorder }]}>
          <Text style={[baseStyles.termsTitle, { color: theme.accentColor }]}>{t.noteLabel}</Text>
          <Text style={[baseStyles.termsText, { color: theme.mutedText }]}>{data.notes}</Text>
        </View>
      ) : null}

      <View style={baseStyles.signRow}>
        <View style={baseStyles.signBlock}>
          <Text style={[baseStyles.signLabel, { color: theme.mutedText }]}>{lang === 'id' ? 'Pengirim' : 'Sender'}</Text>
          <View style={[baseStyles.signLine, { borderBottomColor: theme.bodyText }]} />
          <Text style={[baseStyles.signName, { color: theme.bodyText }]}>{settings.companyName}</Text>
        </View>
        <View style={baseStyles.signBlock}>
          <Text style={[baseStyles.signLabel, { color: theme.mutedText }]}>{lang === 'id' ? 'Penerima' : 'Receiver'}</Text>
          <View style={[baseStyles.signLine, { borderBottomColor: theme.bodyText }]} />
          <Text style={[baseStyles.signName, { color: theme.bodyText }]}>{data.customer.name}</Text>
        </View>
      </View>

      <View style={[baseStyles.footer, { borderTopColor: theme.footerBorder }]}>
        <Text style={{ color: theme.mutedText }}>{settings.receiptFooter || t.footerFallback}</Text>
      </View>
    </Page>
  )
}

export function DeliveryNotePDF({ data, settings }: { data: PdfDeliveryNoteData; settings: PdfCompanySettings }) {
  const theme = invoiceThemes[settings.invoiceTheme] ?? invoiceThemes.klasik

  return (
    <Document>
      <DeliveryNotePage data={data} settings={settings} theme={theme} lang="id" />
      <DeliveryNotePage data={data} settings={settings} theme={theme} lang="en" />
    </Document>
  )
}
