import type { ReactNode } from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { CONTROL } from "./styles"

/** "Zona horaria ......... [Tierra · UTC−6 ▾]" row of the Preferencias card. */
export function PreferenceRow({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-white/15 py-4 last:border-b-0">
      <span id={`${id}-label`} className="text-lg font-medium text-white">
        {label}
      </span>
      {children}
    </div>
  )
}

export interface Option {
  value: string
  label: string
  disabled?: boolean
}

/** Glass-styled base-ui Select labelled by its PreferenceRow. */
export function PreferenceSelect({
  id,
  value,
  options,
  onChange,
}: {
  id: string
  value: string
  options: Option[]
  onChange: (value: string) => void
}) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(v) => {
        if (v != null) onChange(v)
      }}
    >
      <SelectTrigger id={id} aria-labelledby={`${id}-label`} className={CONTROL}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
