import { type ReactNode } from 'react'

import { EmptyState } from '@/shared/components/feedback/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
      <div className="hidden overflow-hidden rounded-md border bg-background md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>
                    {column.render ? column.render(row) : String(row[column.key as keyof T] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
