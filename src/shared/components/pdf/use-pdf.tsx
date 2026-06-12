import { useCallback } from 'react'
import { pdf } from '@react-pdf/renderer'
import type { PdfData } from './types'
import { PdfDocument } from './pdf-document'
import { usePdfSettings } from './use-pdf-settings'
import { Capacitor } from '@capacitor/core'

declare const window: Window & { __TAURI_INTERNALS__?: Record<string, unknown>, __TAURI__?: Record<string, unknown> }

const isTauri = typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function tryShareFile(blob: Blob, filename: string): Promise<boolean> {
  if (typeof navigator.canShare !== 'function' || typeof navigator.share !== 'function') return false
  const file = new File([blob], filename, { type: 'application/pdf' })
  if (!navigator.canShare({ files: [file] })) return false
  try {
    await navigator.share({ files: [file] })
    return true
  } catch {
    return false
  }
}

async function saveFileTauri(blob: Blob, defaultName: string) {
  const { save } = await import('@tauri-apps/plugin-dialog')
  const { writeFile } = await import('@tauri-apps/plugin-fs')

  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  })
  if (!path) return false

  const buffer = await blob.arrayBuffer()
  await writeFile(path, new Uint8Array(buffer))
  return true
}

async function openFileTauri(blob: Blob) {
  const { appDataDir, join } = await import('@tauri-apps/api/path')
  const { writeFile } = await import('@tauri-apps/plugin-fs')
  const { invoke } = await import('@tauri-apps/api/core')

  const dir = await appDataDir()
  const filePath = await join(dir, `print-${Date.now()}.pdf`)
  const buffer = await blob.arrayBuffer()
  await writeFile(filePath, new Uint8Array(buffer))
  await invoke('open_file_native', { path: filePath })
}

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
    const name = `${filename}.pdf`

    if (isTauri) {
      await saveFileTauri(blob, name)
    } else if (isCapacitor) {
      if (!(await tryShareFile(blob, name))) {
        await downloadBlob(blob, name)
      }
    } else {
      await downloadBlob(blob, name)
    }
  }, [generateBlob])

  const printPdf = useCallback(async (data: PdfData) => {
    const blob = await generateBlob(data)
    const name = `print-${Date.now()}.pdf`

    if (isTauri) {
      await openFileTauri(blob)
    } else if (isCapacitor) {
      if (!(await tryShareFile(blob, name))) {
        await downloadBlob(blob, name)
      }
    } else {
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    }
  }, [generateBlob])

  return { downloadPdf, printPdf }
}
