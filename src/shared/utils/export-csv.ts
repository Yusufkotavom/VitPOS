export interface CsvColumn<T> {
  header: string;
  key: keyof T | string;
}

export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  const needsQuotes = str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r') || str.includes(' ');
  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsvString<T>(columns: CsvColumn<T>[], data: T[]): string {
  const headers = columns.map(col => escapeCsvField(col.header)).join(',');
  const rows = data.map(item => {
    return columns.map(col => {
      // Access value safely
      const val = (item as Record<string, unknown>)[col.key as string];
      return escapeCsvField(val);
    }).join(',');
  });
  return [headers, ...rows].join('\n');
}

export function exportToCsv<T>(filename: string, columns: CsvColumn<T>[], data: T[]): void {
  const csvContent = exportToCsvString(columns, data);
  if (typeof window === 'undefined') {
    return;
  }
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
