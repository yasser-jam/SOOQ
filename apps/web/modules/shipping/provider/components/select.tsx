"use client"

import { Control, Controller } from "react-hook-form"
import { listShippingProviders } from "../actions"
import { shippingProviderQueryKeys } from "../queryKeys"
import { FieldError, FieldLabel } from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Field as UiField } from "@workspace/ui/components/field"
import { useQuery } from "@tanstack/react-query"

type ShippingProviderSelectProps = {
  control: any
  disabled?: boolean
}

export default function ShippingProviderSelect({
  control,
}: ShippingProviderSelectProps) {
  const { data: providers, isLoading: isProvidersLoading } = useQuery({
    queryKey: shippingProviderQueryKeys.all,
    queryFn: listShippingProviders,
  })

  return (
    <>
      <Controller
        name="shippingProviderId"
        control={control}
        render={({ field, fieldState }) => (
          <UiField data-invalid={fieldState.invalid}>
            <FieldLabel>مزود الشحن</FieldLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={isProvidersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر مزود الشحن" />
              </SelectTrigger>
              <SelectContent>
                {(providers ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id ?? ""}>
                    {p.providerName ?? p.providerCode ?? "-"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </UiField>
        )}
      />
    </>
  )
}
