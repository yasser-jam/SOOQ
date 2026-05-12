"use client"

import { Checkbox } from "@workspace/ui/components/checkbox"

import {
  PERMISSION_GROUPS,
  type AssignablePermission,
} from "../permissions"

type PermissionsPickerProps = {
  value: AssignablePermission[]
  onChange: (next: AssignablePermission[]) => void
  disabled?: boolean
}

export default function PermissionsPicker({
  value,
  onChange,
  disabled,
}: PermissionsPickerProps) {
  const selected = new Set(value)

  const toggle = (permission: AssignablePermission, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(permission)
    else next.delete(permission)
    onChange(Array.from(next))
  }

  return (
    <div className="grid gap-5">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.key} className="grid gap-2">
          <h3 className="text-sm font-semibold">{group.title}</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {group.permissions.map((permission) => {
              const checked = selected.has(permission.value)
              const id = `perm-${permission.value}`
              return (
                <label
                  key={permission.value}
                  htmlFor={id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border bg-muted/20 p-3 hover:bg-muted/40"
                >
                  <Checkbox
                    id={id}
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(value) => toggle(permission.value, Boolean(value))}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      {permission.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {permission.description}
                    </span>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
