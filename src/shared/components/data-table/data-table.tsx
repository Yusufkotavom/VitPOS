import { type ReactNode, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

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
  sortable?: boolean
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
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description="Data akan muncul di sini setelah tersedia." />
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = a[sortConfig.key as keyof T]
    const bValue = b[sortConfig.key as keyof T]

    if (aValue === bValue) return 0
    if (aValue == null) return 1
    if (bValue == null) return -1

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
    }

    const result = String(aValue).localeCompare(String(bValue), 'id', { numeric: true })
    return sortConfig.direction === 'asc' ? result : -result
  })

  const toggleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key !== key) return { key, direction: 'asc' }
      if (current.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
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
      <div className={mobileRender ? "hidden overflow-hidden rounded-md border bg-background md:block" : "overflow-x-auto rounded-md border bg-background"}>
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
              {columns.map((column) => {
                const key = String(column.key)
                const isSorted = sortConfig?.key === key

                return (
                  <TableHead key={key}>
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className="flex items-center gap-1 font-medium hover:text-foreground"
                      >
                        {column.header}
                        {isSorted ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row) => (
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
      {!mobileRender && (
        <style>{`
          /* We don't want JSON block rendering on mobile if table is responsive */
        `}</style>
      )}
        {mobileRender && data.map((row) => (
          <div key={row.id} className="relative rounded-2xl border bg-background p-4 shadow-sm md:hidden">
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
            {mobileRender(row)}
          </div>
        ))}
      </div>
    </>
  )
}
