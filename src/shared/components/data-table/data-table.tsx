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
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: {
  columns: Column<T>[]
  data: T[]
  mobileRender?: (row: T) => ReactNode
  emptyTitle?: string
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description="Data akan muncul di sini setelah tersedia." />
  }

  const toggleAll = () => {
    if (!onSelectionChange) return
    if (selectedIds.length === data.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(data.map(d => d.id))
    }
  }

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-md border bg-background md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[50px]">
                  <input 
                    type="checkbox" 
                    className="size-4 rounded border-gray-300"
                    checked={selectedIds.length === data.length && data.length > 0}
                    onChange={toggleAll}
                  />
                </TableHead>
              )}
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
                {selectable && (
                  <TableCell>
                    <input 
                      type="checkbox" 
                      className="size-4 rounded border-gray-300"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleRow(row.id)}
                    />
                  </TableCell>
                )}
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
        {selectable && data.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1">
            <input 
              type="checkbox" 
              className="size-4 rounded border-gray-300"
              id="select-all-mobile"
              checked={selectedIds.length === data.length}
              onChange={toggleAll}
            />
            <label htmlFor="select-all-mobile" className="text-sm text-muted-foreground">Pilih semua</label>
          </div>
        )}
        {data.map((row) => (
          <div key={row.id} className="relative rounded-2xl border bg-background p-4 shadow-sm">
            {selectable && (
              <div className="absolute right-4 top-4 z-10">
                <input 
                  type="checkbox" 
                  className="size-5 rounded border-gray-300"
                  checked={selectedIds.includes(row.id)}
                  onChange={() => toggleRow(row.id)}
                />
              </div>
            )}
            {mobileRender ? mobileRender(row) : <pre className="text-xs">{JSON.stringify(row, null, 2)}</pre>}
          </div>
        ))}
      </div>
    </>
  )
}
