"use client"

import { useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { Download, Search, X } from "lucide-react"
import { toast } from "sonner"

import FilterMenu from "@/components/system/filter-menu"
import {
  exportAdminCustomersCsv,
  listAdminCustomers,
} from "@/modules/customer/customer/actions"
import CustomersTable from "@/modules/customer/customer/components/table"
import {
  DEFAULT_CUSTOMER_SORT,
  toCustomerSearchRequest,
} from "@/modules/customer/customer/init"
import { DEFAULT_CUSTOMERS_PAGE_SIZE } from "@/modules/customer/customer/model"
import type {
  AdminCustomerSearchRequest,
  CustomerSearchFormValues,
} from "@/modules/customer/customer/types"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

const SEARCH_DEBOUNCE_MS = 400

const parseBoolean = (value: string | null): boolean | undefined => {
  if (value === null) return undefined
  if (value === "true") return true
  if (value === "false") return false
  return undefined
}

const parseNumber = (value: string | null): number | undefined => {
  if (value === null || value === "") return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

const formValuesFromUrl = (
  searchParams: URLSearchParams
): CustomerSearchFormValues => ({
  q: searchParams.get("q") ?? undefined,
  minSpend: parseNumber(searchParams.get("minSpend")),
  maxSpend: parseNumber(searchParams.get("maxSpend")),
  hasOrders: parseBoolean(searchParams.get("hasOrders")),
  optedInEmail: parseBoolean(searchParams.get("optedInEmail")),
  optedInSms: parseBoolean(searchParams.get("optedInSms")),
  sort: searchParams.get("sort") ?? DEFAULT_CUSTOMER_SORT,
  page: parseNumber(searchParams.get("page")) ?? 0,
  size: parseNumber(searchParams.get("size")) ?? DEFAULT_CUSTOMERS_PAGE_SIZE,
})

const writeFormValuesToUrl = (
  values: CustomerSearchFormValues
): URLSearchParams => {
  const usp = new URLSearchParams()
  if (values.q && values.q.trim()) usp.set("q", values.q.trim())
  if (values.minSpend !== undefined) usp.set("minSpend", String(values.minSpend))
  if (values.maxSpend !== undefined) usp.set("maxSpend", String(values.maxSpend))
  if (values.hasOrders !== undefined)
    usp.set("hasOrders", String(values.hasOrders))
  if (values.optedInEmail !== undefined)
    usp.set("optedInEmail", String(values.optedInEmail))
  if (values.optedInSms !== undefined)
    usp.set("optedInSms", String(values.optedInSms))
  if (values.sort && values.sort !== DEFAULT_CUSTOMER_SORT)
    usp.set("sort", values.sort)
  if (values.page && values.page > 0) usp.set("page", String(values.page))
  return usp
}

const countActiveFilters = (values: CustomerSearchFormValues): number => {
  let n = 0
  if (values.minSpend !== undefined) n++
  if (values.maxSpend !== undefined) n++
  if (values.hasOrders !== undefined) n++
  if (values.optedInEmail !== undefined) n++
  if (values.optedInSms !== undefined) n++
  return n
}

export default function CustomersPageView() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlValues = useMemo(
    () => formValuesFromUrl(searchParams),
    [searchParams]
  )

  // `key={urlValues.q}` on the input below resets its internal value when the
  // URL changes externally (clear-filters, back/forward nav), so we don't need
  // a separate React state mirror.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pushValues = (next: CustomerSearchFormValues) => {
    const usp = writeFormValuesToUrl(next)
    const query = usp.toString()
    router.replace(query ? `?${query}` : "?", { scroll: false })
  }

  const handleSearchChange = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pushValues({ ...urlValues, q: value, page: 0 })
    }, SEARCH_DEBOUNCE_MS)
  }

  const handlePageChange = (pageIndex: number) => {
    pushValues({ ...urlValues, page: pageIndex })
  }

  const handleSortChange = (sort: string) => {
    pushValues({ ...urlValues, sort, page: 0 })
  }

  const handleFilterChange = (
    patch: Partial<CustomerSearchFormValues>
  ) => {
    pushValues({ ...urlValues, ...patch, page: 0 })
  }

  const handleClearFilters = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    router.replace("?", { scroll: false })
  }

  const requestParams: AdminCustomerSearchRequest = useMemo(
    () => toCustomerSearchRequest(urlValues),
    [urlValues]
  )

  const exportMutation = useMutation({
    mutationFn: exportAdminCustomersCsv,
    onSuccess: () => toast.success("تم تنزيل ملف العملاء بنجاح"),
    onError: () =>
      toast.error("تعذّر تصدير CSV. حاول مرة أخرى أو راجع الفلاتر."),
  })

  const activeFilterCount = countActiveFilters(urlValues)
  const hasAnyFilter =
    activeFilterCount > 0 || (urlValues.q && urlValues.q.trim().length > 0)

  // Eager prefetch on mount so the table renders immediately. Not strictly
  // required (the table runs its own query), but lets us reuse the cached
  // result when the user toggles filters quickly.
  useEffect(() => {
    listAdminCustomers(requestParams).catch(() => undefined)
  }, [requestParams])

  return (
    <div className="container my-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="page-title">العملاء</div>

        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => exportMutation.mutate(requestParams)}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? "جاري التصدير…" : "تصدير CSV"}
          <Download data-icon="inline-end" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search
            data-icon="inline-start"
            className="absolute top-1/2 start-3 -translate-y-1/2 size-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            key={urlValues.q ?? ""}
            type="search"
            placeholder="ابحث بالاسم أو رقم الهاتف…"
            defaultValue={urlValues.q ?? ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="ps-9"
            aria-label="بحث العملاء"
          />
        </div>

        <FilterMenu>
          <FieldGroup>
            <Field orientation="horizontal">
              <Checkbox
                id="filter-has-orders"
                checked={urlValues.hasOrders === true}
                onCheckedChange={(checked) =>
                  handleFilterChange({
                    hasOrders: checked === true ? true : undefined,
                  })
                }
              />
              <FieldLabel htmlFor="filter-has-orders">
                لديه طلبات فقط
              </FieldLabel>
            </Field>

            <Field>
              <FieldLabel htmlFor="filter-min-spend">الإنفاق من</FieldLabel>
              <FieldContent>
                <Input
                  id="filter-min-spend"
                  type="number"
                  min={0}
                  placeholder="0"
                  inputMode="numeric"
                  value={urlValues.minSpend ?? ""}
                  onChange={(e) =>
                    handleFilterChange({
                      minSpend:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="filter-max-spend">الإنفاق إلى</FieldLabel>
              <FieldContent>
                <Input
                  id="filter-max-spend"
                  type="number"
                  min={0}
                  placeholder="—"
                  inputMode="numeric"
                  value={urlValues.maxSpend ?? ""}
                  onChange={(e) =>
                    handleFilterChange({
                      maxSpend:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="filter-opted-email"
                checked={urlValues.optedInEmail === true}
                onCheckedChange={(checked) =>
                  handleFilterChange({
                    optedInEmail: checked === true ? true : undefined,
                  })
                }
              />
              <FieldLabel htmlFor="filter-opted-email">
                موافق على بريد التسويق
              </FieldLabel>
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="filter-opted-sms"
                checked={urlValues.optedInSms === true}
                onCheckedChange={(checked) =>
                  handleFilterChange({
                    optedInSms: checked === true ? true : undefined,
                  })
                }
              />
              <FieldLabel htmlFor="filter-opted-sms">
                موافق على SMS التسويقي
              </FieldLabel>
            </Field>
          </FieldGroup>
        </FilterMenu>

        {hasAnyFilter ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-1 text-xs text-muted-foreground"
          >
            <X className="size-3" />
            إزالة الفلاتر
          </Button>
        ) : null}

        {activeFilterCount > 0 ? (
          <span className="text-xs text-muted-foreground">
            {activeFilterCount} فلتر نشط
          </span>
        ) : null}
      </div>

      <CustomersTable
        params={requestParams}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />
    </div>
  )
}
