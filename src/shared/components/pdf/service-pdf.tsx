import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatDateTime } from '@/lib/date'
import { formatCurrency } from '@/lib/format-currency'
import type { PdfCompanySettings, PdfServiceData } from './types'
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
  invoiceTitle: { fontSize: 26, fontWeight: 'bold', letterSpacing: 1.2, marginBottom: 4 },
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
  leftSection: { width: '52%' },
  badge: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1.5, marginBottom: 8 },
  noteCard: { borderRadius: 12, borderWidth: 1, padding: 10, marginTop: 6 },
  termsTitle: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  termsText: { fontSize: 7 },
  totalsPanel: { width: '44%', borderRadius: 16, borderWidth: 1, padding: 12 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalsLabel: { fontSize: 8 },
  totalsValue: { fontSize: 8, fontWeight: 'bold' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 9, marginTop: 6, borderTopWidth: 1.5 },
  grandTotalLabel: { fontSize: 10, fontWeight: 'bold' },
  grandTotalValue: { fontSize: 13, fontWeight: 'bold' },
  paymentsSection: { marginTop: 4, marginBottom: 14, borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  paymentTitle: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, padding: 9 },
  paymentRow: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 7, paddingHorizontal: 10 },
  footer: { position: 'absolute', bottom: 24, left: 30, right: 30, borderTopWidth: 1, paddingTop: 9, textAlign: 'center', fontSize: 8 },
})

function fmt(n: number) {
  return formatCurrency(n)
}

function contrastSoft(theme: InvoiceThemeTokens) {
  return { color: theme.headerMutedText }
}

function ServicePage({
  data,
  settings,
  theme,
  lang,
}: {
  data: PdfServiceData
  settings: PdfCompanySettings
  theme: InvoiceThemeTokens
  lang: PdfLang
}) {
  const t = pdfLabels[lang]
  const remaining = Math.max(0, data.cost - (data.summary.paidTotal || 0))
  const showItemsTable = data.items && data.items.length > 0

  return (
    <Page size="A4" style={[baseStyles.page, { backgroundColor: theme.pageBg, color: theme.bodyText }]}>
      {/* Hero Header */}
      <View style={[baseStyles.hero, { backgroundColor: theme.headerBg }]}>
        <View style={[baseStyles.heroAccentBlock, { backgroundColor: theme.headerAccent }]} />
        <View style={[baseStyles.heroAccentStripe, { backgroundColor: theme.headerAccent }]} />
        <View style={baseStyles.heroTop}>
          <View style={baseStyles.companyInfo}>
            {settings.invoiceLogo ? (
              <Image src={settings.invoiceLogo} style={baseStyles.logo} />
            ) : (
              <Text style={[baseStyles.companyName, { color: theme.headerTextColor }]}>
                {settings.companyName}
              </Text>
            )}
            {settings.invoiceLogo ? (
              <Text style={[baseStyles.companyName, { color: theme.headerTextColor, fontSize: 13 }]}>
                {settings.companyName}
              </Text>
            ) : null}
            {settings.companyAddress ? (
              <Text style={[baseStyles.companySub, contrastSoft(theme)]}>{settings.companyAddress}</Text>
            ) : null}
            {settings.companyPhone ? (
              <Text style={[baseStyles.companySub, contrastSoft(theme)]}>
                {t.phone}: {settings.companyPhone}
              </Text>
            ) : null}
            {settings.companyTax ? (
              <Text style={[baseStyles.companySub, contrastSoft(theme)]}>
                {t.tax}: {settings.companyTax}
              </Text>
            ) : null}
          </View>
          <View style={baseStyles.invoiceMeta}>
            <Text style={[baseStyles.invoiceLabel, contrastSoft(theme)]}>{t.serviceLabel || 'DOKUMEN SERVIS'}</Text>
            <Text style={[baseStyles.invoiceTitle, { color: theme.titleColor }]}>{t.serviceTitle}</Text>
            <Text
              style={[
                baseStyles.invoiceCodePill,
                { backgroundColor: theme.headerAccent, color: theme.headerTextColor },
              ]}
            >
              {data.code}
            </Text>
            <Text style={[baseStyles.metaText, contrastSoft(theme)]}>{formatDateTime(data.date)}</Text>
          </View>
        </View>
      </View>

      {/* Info Cards Grid: Customer & Service Details */}
      <View style={baseStyles.infoGrid}>
        <View style={[baseStyles.infoCard, { backgroundColor: theme.cardBg, borderColor: theme.sectionBorder }]}>
          <Text style={[baseStyles.sectionEyebrow, { color: theme.accentColor }]}>{t.billTo}</Text>
          <Text style={[baseStyles.detailTitle, { color: theme.bodyText }]}>{data.customer.name}</Text>
          {data.customer.phone ? (
            <Text style={[baseStyles.detailText, { color: theme.mutedText }]}>{data.customer.phone}</Text>
          ) : null}
          {data.customer.address ? (
            <Text style={[baseStyles.detailText, { color: theme.mutedText }]}>{data.customer.address}</Text>
          ) : null}
        </View>

        <View style={[baseStyles.infoCard, { backgroundColor: theme.cardBg, borderColor: theme.sectionBorder }]}>
          <Text style={[baseStyles.sectionEyebrow, { color: theme.accentColor }]}>{t.serviceDetails}</Text>
          <Text style={[baseStyles.detailTitle, { color: theme.bodyText }]}>
            {t.device}: {data.device}
          </Text>
          {data.problem ? (
            <Text style={[baseStyles.detailText, { color: theme.mutedText }]}>
              {t.problem}: {data.problem}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Table: Line Items / Services */}
      <View style={[baseStyles.tableWrap, { backgroundColor: theme.cardBg, borderColor: theme.tableBorderColor }]}>
        <View style={[baseStyles.tableHeader, { backgroundColor: theme.tableHeaderBg }]}>
          <View style={baseStyles.colItem}>
            <Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>{t.itemsServices || t.item}</Text>
          </View>
          <View style={baseStyles.colQty}>
            <Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>{t.qty}</Text>
          </View>
          <View style={baseStyles.colPrice}>
            <Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>{t.price}</Text>
          </View>
          <View style={baseStyles.colTotal}>
            <Text style={{ fontWeight: 'bold', color: theme.tableHeaderText }}>{t.total}</Text>
          </View>
        </View>

        {showItemsTable ? (
          data.items!.map((item, i) => (
            <View
              key={i}
              style={[
                baseStyles.tableRow,
                {
                  borderTopColor: theme.tableBorderColor,
                  backgroundColor: i % 2 === 0 ? theme.cardBg : theme.cardSoftBg,
                },
              ]}
            >
              <View style={baseStyles.colItem}>
                <Text>{item.name}</Text>
              </View>
              <View style={baseStyles.colQty}>
                <Text>{item.qty}</Text>
              </View>
              <View style={baseStyles.colPrice}>
                <Text>{fmt(item.price)}</Text>
              </View>
              <View style={baseStyles.colTotal}>
                <Text style={{ fontWeight: 'bold' }}>{fmt(item.subtotal)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View
            style={[
              baseStyles.tableRow,
              { borderTopColor: theme.tableBorderColor, backgroundColor: theme.cardBg },
            ]}
          >
            <View style={baseStyles.colItem}>
              <Text>
                {t.itemsServices} - {data.device}
              </Text>
            </View>
            <View style={baseStyles.colQty}>
              <Text>1</Text>
            </View>
            <View style={baseStyles.colPrice}>
              <Text>{fmt(data.cost)}</Text>
            </View>
            <View style={baseStyles.colTotal}>
              <Text style={{ fontWeight: 'bold' }}>{fmt(data.cost)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Summary Area & Totals */}
      <View style={baseStyles.summaryArea}>
        <View style={baseStyles.leftSection}>
          <View
            style={[
              baseStyles.badge,
              {
                borderColor: remaining <= 0 ? '#10b981' : theme.accentColor,
                color: remaining <= 0 ? '#059669' : theme.accentColor,
                backgroundColor: remaining <= 0 ? '#ecfdf5' : theme.cardSoftBg,
              },
            ]}
          >
            <Text>
              {t.status}: {data.summary.status || (remaining <= 0 ? 'Lunas' : 'Belum Lunas')}
            </Text>
          </View>

          {data.warranty ? (
            <View
              style={[
                baseStyles.noteCard,
                {
                  backgroundColor: data.warranty.isExpired ? '#fef2f2' : theme.cardBg,
                  borderColor: data.warranty.isExpired ? '#fca5a5' : theme.sectionBorder,
                },
              ]}
            >
              <Text
                style={[
                  baseStyles.termsTitle,
                  { color: data.warranty.isExpired ? '#dc2626' : theme.accentColor },
                ]}
              >
                {data.warranty.isExpired ? t.warrantyExpired : t.warrantyActive} ({data.warranty.value}{' '}
                {data.warranty.unit})
              </Text>
              <Text style={[baseStyles.termsText, { color: theme.mutedText }]}>
                {t.validUntil}: {formatDateTime(data.warranty.endDate)}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            baseStyles.totalsPanel,
            { backgroundColor: theme.totalPanelBg, borderColor: theme.totalPanelBorder },
          ]}
        >
          <View style={baseStyles.totalsRow}>
            <Text style={[baseStyles.totalsLabel, { color: theme.mutedText }]}>{t.totalCost || t.subtotal}</Text>
            <Text style={baseStyles.totalsValue}>{fmt(data.cost)}</Text>
          </View>
          <View style={baseStyles.totalsRow}>
            <Text style={[baseStyles.totalsLabel, { color: theme.mutedText }]}>{t.paid}</Text>
            <Text style={baseStyles.totalsValue}>{fmt(data.summary.paidTotal || 0)}</Text>
          </View>
          <View style={[baseStyles.grandTotalRow, { borderTopColor: theme.totalPanelBorder }]}>
            <Text style={[baseStyles.grandTotalLabel, { color: theme.bodyText }]}>
              {remaining > 0 ? t.remainingBalance : t.totalCost}
            </Text>
            <Text style={[baseStyles.grandTotalValue, { color: remaining > 0 ? '#dc2626' : theme.accentColor }]}>
              {fmt(remaining > 0 ? remaining : data.cost)}
            </Text>
          </View>
        </View>
      </View>

      {/* Payment History Table (if payments exist) */}
      {data.payments && data.payments.length > 0 ? (
        <View
          style={[
            baseStyles.paymentsSection,
            { backgroundColor: theme.cardBg, borderColor: theme.tableBorderColor },
          ]}
        >
          <View style={{ backgroundColor: theme.tableHeaderBg }}>
            <Text style={[baseStyles.paymentTitle, { color: theme.tableHeaderText }]}>{t.paymentHistory}</Text>
          </View>
          {data.payments.map((p, i) => (
            <View
              key={i}
              style={[
                baseStyles.paymentRow,
                {
                  borderTopColor: theme.tableBorderColor,
                  backgroundColor: i % 2 === 0 ? theme.cardBg : theme.cardSoftBg,
                },
              ]}
            >
              <View style={{ width: '45%' }}>
                <Text style={{ fontSize: 8 }}>{formatDateTime(p.date)}</Text>
              </View>
              <View style={{ width: '25%' }}>
                <Text style={{ fontSize: 8, textTransform: 'capitalize' }}>{p.method}</Text>
              </View>
              <View style={{ width: '30%', textAlign: 'right' }}>
                <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{fmt(p.amount)}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Footer */}
      <View style={[baseStyles.footer, { borderTopColor: theme.footerBorder }]}>
        <Text style={{ color: theme.mutedText }}>{settings.receiptFooter || t.footerFallback}</Text>
      </View>
    </Page>
  )
}

export function ServicePDF({ data, settings }: { data: PdfServiceData; settings: PdfCompanySettings }) {
  const theme = invoiceThemes[settings.invoiceTheme] ?? invoiceThemes.klasik

  return (
    <Document>
      <ServicePage data={data} settings={settings} theme={theme} lang="id" />
      <ServicePage data={data} settings={settings} theme={theme} lang="en" />
    </Document>
  )
}
