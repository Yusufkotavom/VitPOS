import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FormSelectProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: Path<TFieldValues>
  label?: string
  options: { label: string; value: string }[]
  placeholder?: string
}

export function FormSelect<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = 'Pilih...',
}: FormSelectProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className="flex flex-col gap-1 space-y-0">
          {label && <FieldLabel>{label}</FieldLabel>}
          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
            <SelectTrigger aria-invalid={Boolean(fieldState.error)}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.filter((option) => option.value !== "").map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
