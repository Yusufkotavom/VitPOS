import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComboboxProps<T> {
  items: readonly T[]
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

const ComboboxContext = React.createContext<{
  search: string
  setSearch: (s: string) => void
  open: boolean
  setOpen: (o: boolean) => void
  selectedValue: string
  setSelectedValue: (v: string) => void
  items: readonly unknown[]
} | null>(null)

export function Combobox<T>({
  items,
  value,
  onValueChange,
  children,
  className,
}: ComboboxProps<T>) {
  const [search, setSearch] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(value || "")
  
  const selectedValue = value !== undefined ? value : internalValue

  const handleSelect = React.useCallback((val: string) => {
    if (value === undefined) setInternalValue(val)
    setSearch(val)
    onValueChange?.(val)
    setOpen(false)
  }, [value, onValueChange])

  return (
    <ComboboxContext.Provider value={{ search, setSearch, open, setOpen, selectedValue: selectedValue, setSelectedValue: handleSelect, items }}>
      <div className={cn("relative w-full", className)}>
        {children}
      </div>
    </ComboboxContext.Provider>
  )
}

export function ComboboxInput({
  id,
  placeholder,
  className,
  value,
  onChange,
}: {
  id?: string
  placeholder?: string
  className?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const context = React.useContext(ComboboxContext)
  if (!context) throw new Error("ComboboxInput must be used within Combobox")

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value !== undefined ? value : context.search}
        onChange={(e) => {
          context.setSearch(e.target.value)
          context.setOpen(true)
          onChange?.(e)
        }}
        onFocus={() => context.setOpen(true)}
        className={cn(
          "h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    </div>
  )
}

export function ComboboxContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const context = React.useContext(ComboboxContext)
  if (!context) throw new Error("ComboboxContent must be used within Combobox")

  const ref = React.useRef<HTMLDivElement>(null)
  const setOpen = context.setOpen

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [setOpen])

  if (!context.open) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-md outline-none animate-in fade-in-80",
        className
      )}
    >
      {children}
    </div>
  )
}

export function ComboboxEmpty({
  children,
}: {
  children: React.ReactNode
}) {
  const context = React.useContext(ComboboxContext)
  if (!context) throw new Error("ComboboxEmpty must be used within Combobox")

  return <div className="py-6 text-center text-sm text-muted-foreground">{children}</div>
}

export function ComboboxList({
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: (item: any) => React.ReactNode
}) {
  const context = React.useContext(ComboboxContext)
  if (!context) throw new Error("ComboboxList must be used within Combobox")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = context.items.filter((item: any) => {
    if (!context.search) return true
    const searchLow = context.search.toLowerCase()
    if (typeof item === 'string') return item.toLowerCase().includes(searchLow)
    if (item && typeof item === 'object') {
      return Object.values(item).some((val) => String(val).toLowerCase().includes(searchLow))
    }
    return false
  })

  return <div className="space-y-1">{filtered.map((item, i) => React.cloneElement(children(item) as React.ReactElement, { key: i }))}</div>
}

export function ComboboxItem({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const context = React.useContext(ComboboxContext)
  if (!context) throw new Error("ComboboxItem must be used within Combobox")

  return (
    <button
      type="button"
      onClick={() => context.setSelectedValue(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        context.selectedValue === value && "bg-accent text-accent-foreground",
        className
      )}
    >
      {children}
    </button>
  )
}
