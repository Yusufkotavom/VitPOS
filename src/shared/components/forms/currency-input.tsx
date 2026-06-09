import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "value"> {
  value?: number | string
  onValueChange?: (value: number) => void
  prefix?: string
}

type InputChangeEvent = React.ChangeEvent<HTMLInputElement>

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, onChange, prefix, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("")

    React.useEffect(() => {
      if (value === undefined || value === null) {
        setDisplayValue("")
        return
      }

      const numStr = value.toString()
      // format to standard id-ID standard
      setDisplayValue(formatNumber(numStr))
    }, [value])

    const formatNumber = (val: string) => {
      // Remove all non-numeric characters except minus
      const numericString = val.replace(/[^0-9-]/g, "")
      if (!numericString || numericString === "-") return numericString

      return new Intl.NumberFormat("id-ID").format(parseInt(numericString, 10))
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value
      const numericString = rawValue.replace(/[^0-9-]/g, "")
      
      const formattedValue = formatNumber(numericString)
      setDisplayValue(formattedValue)
      
      if (onValueChange) {
        const parsed = parseInt(numericString, 10)
        onValueChange(isNaN(parsed) ? 0 : parsed)
      }
      
      if (onChange) {
        // Create a synthetic event with the unformatted numeric string
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: numericString
          }
        } as InputChangeEvent
        onChange(syntheticEvent)
      }
    }

    return (
      <div className="relative w-full">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          className={cn(prefix && "pl-8", className)}
          {...props}
        />
      </div>
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"
