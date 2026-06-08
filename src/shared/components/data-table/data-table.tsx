import { type ReactNode } from 'react'

import { EmptyState } from '@/shared/components/feedback/empty-state'

type Column<T> = {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  mobileRender,
  emptyTitle = 'Belum ada data',
}: {
  columns: Column<T>[]
  data: T[]
  mobileRender?: (row: T) => ReactNode
  emptyTitle?: string
}) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description="Data akan muncul di sini setelah tersedia." />
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border bg-background md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="px-4 py-3 font-medium">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-t">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-4 py-3 align-middle">
                    {column.render ? column.render(row) : String(row[column.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:hidden">
        {data.map((row) => (
          <div key={row.id} className="rounded-2xl border bg-background p-4 shadow-sm">
            {mobileRender ? mobileRender(row) : <pre className="text-xs">{JSON.stringify(row, null, 2)}</pre>}
          </div>
        ))}
      </div>
    </>
  )
}
