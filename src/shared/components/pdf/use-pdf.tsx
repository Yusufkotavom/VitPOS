import { useCallback } from 'react'
import { pdf } from '@react-pdf/renderer'
import type { PdfData } from './types'
import { PdfDocument } from './pdf-document'
import { usePdfSettings } from './use-pdf-settings'

export function usePdf() {
  const settings = usePdfSettings()

  const generateBlob = useCallback(async (data: PdfData) => {
    const doc = <PdfDocument data={data} settings={settings} />
    const instance = pdf(doc)
    const blob = await instance.toBlob()
    return blob
  }, [settings])

  const downloadPdf = useCallback(async (data: PdfData, filename: string) => {
    const blob = await generateBlob(data)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }, [generateBlob])

  const printPdf = useCallback(async (data: PdfData) => {
    const blob = await generateBlob(data)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }, [generateBlob])

  return { downloadPdf, printPdf }
}
