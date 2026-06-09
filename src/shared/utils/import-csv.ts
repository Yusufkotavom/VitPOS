export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        current.push(field)
        field = ''
      } else if (ch === '\r') {
        // skip CR, wait for LF
      } else if (ch === '\n') {
        current.push(field)
        rows.push(current)
        current = []
        field = ''
      } else {
        field += ch
      }
    }
  }

  if (field.length > 0 || current.length > 0) {
    current.push(field)
    rows.push(current)
  }

  if (rows.length === 0) return []

  const headers = rows[0].map(h => h.trim())
  return rows.slice(1).filter(row => row.some(cell => cell.trim() !== '')).map(row => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = (row[i] ?? '').trim()
    })
    return obj
  })
}

export function readCsvFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      resolve(parseCsv(text))
    }
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsText(file, 'utf-8')
  })
}
