import type { InvoiceThemeName } from './types'

export type InvoiceThemeTokens = {
  id: InvoiceThemeName
  headerBg: string
  headerTextColor: string
  headerAccent: string
  titleColor: string
  accentColor: string
  tableHeaderBg: string
  tableHeaderText: string
  tableBorderColor: string
  badgePaid: string
  badgeUnpaid: string
  badgePartial: string
  footerBorder: string
  sectionBorder: string
}

export const invoiceThemes: Record<InvoiceThemeName, InvoiceThemeTokens> = {
  klasik: {
    id: 'klasik',
    headerBg: '#ffffff',
    headerTextColor: '#111827',
    headerAccent: '#1e3a8a',
    titleColor: '#1e3a8a',
    accentColor: '#2563eb',
    tableHeaderBg: '#eff6ff',
    tableHeaderText: '#1e40af',
    tableBorderColor: '#bfdbfe',
    badgePaid: '#16a34a',
    badgeUnpaid: '#dc2626',
    badgePartial: '#ca8a04',
    footerBorder: '#e5e7eb',
    sectionBorder: '#e5e7eb',
  },
  korporat: {
    id: 'korporat',
    headerBg: '#0f172a',
    headerTextColor: '#f8fafc',
    headerAccent: '#d97706',
    titleColor: '#d97706',
    accentColor: '#f59e0b',
    tableHeaderBg: '#fefce8',
    tableHeaderText: '#92400e',
    tableBorderColor: '#fde68a',
    badgePaid: '#16a34a',
    badgeUnpaid: '#dc2626',
    badgePartial: '#d97706',
    footerBorder: '#cbd5e1',
    sectionBorder: '#e2e8f0',
  },
  modern: {
    id: 'modern',
    headerBg: '#0d9488',
    headerTextColor: '#ffffff',
    headerAccent: '#14b8a6',
    titleColor: '#ffffff',
    accentColor: '#0d9488',
    tableHeaderBg: '#f0fdfa',
    tableHeaderText: '#0f766e',
    tableBorderColor: '#99f6e4',
    badgePaid: '#16a34a',
    badgeUnpaid: '#dc2626',
    badgePartial: '#ca8a04',
    footerBorder: '#ccfbf1',
    sectionBorder: '#e5e7eb',
  },
  eksekutif: {
    id: 'eksekutif',
    headerBg: '#7f1d1d',
    headerTextColor: '#fef2f2',
    headerAccent: '#fca5a5',
    titleColor: '#fca5a5',
    accentColor: '#b91c1c',
    tableHeaderBg: '#fef2f2',
    tableHeaderText: '#991b1b',
    tableBorderColor: '#fecaca',
    badgePaid: '#16a34a',
    badgeUnpaid: '#dc2626',
    badgePartial: '#b91c1c',
    footerBorder: '#fecaca',
    sectionBorder: '#fecaca',
  },
}
