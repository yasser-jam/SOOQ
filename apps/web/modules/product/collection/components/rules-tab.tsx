"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  createCollectionRule,
  deleteCollectionRule,
  evaluateCollectionRules,
  getProductCollection,
} from "@/modules/product/collection/actions"
import { collectionQueryKeys } from "@/modules/product/collection/queryKeys"
import type { CollectionRule } from "@/modules/product/collection/types"

const FIELD_OPTIONS = [
  { value: "tag", label: "وسم" },
  { value: "category", label: "فئة" },
  { value: "title", label: "العنوان" },
  { value: "price", label: "السعر" },
  { value: "stock", label: "المخزون" },
] as const

const OPERATOR_OPTIONS = [
  { value: "equals", label: "يساوي" },
  { value: "not_equals", label: "لا يساوي" },
  { value: "contains", label: "يحتوي" },
  { value: "greater_than", label: "أكبر من" },
  { value: "less_than", label: "أصغر من" },
] as const

type Props = {
  collectionId: string
}

export default function RulesTab({ collectionId }: Props) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState({
    fieldKey: "tag",
    operator: "equals",
    value: "",
    logicGroup: "AND" as "AND" | "OR",
  })

  const { data: collection, isPending } = useQuery({
    queryKey: collectionQueryKeys.detail(collectionId),
    queryFn: () => getProductCollection(collectionId),
  })

  const rules: CollectionRule[] =
    ((collection as unknown as { rules?: CollectionRule[] })?.rules) ?? []

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: collectionQueryKeys.detail(collectionId),
    })
    queryClient.invalidateQueries({
      queryKey: collectionQueryKeys.preview(collectionId),
    })
  }

  const { mutate: addRule, isPending: isAdding } = useMutation({
    mutationFn: () =>
      createCollectionRule(collectionId, {
        fieldKey: draft.fieldKey,
        operator: draft.operator,
        value: draft.value.trim(),
        logicGroup: draft.logicGroup,
      }),
    onSuccess: () => {
      toast.success("تم إضافة القاعدة")
      setDraft({ ...draft, value: "" })
      invalidate()
    },
  })

  const { mutate: removeRule } = useMutation({
    mutationFn: (ruleId: string) =>
      deleteCollectionRule(collectionId, ruleId),
    onSuccess: () => {
      toast.success("تم حذف القاعدة")
      invalidate()
    },
  })

  const { mutate: evaluate, isPending: isEvaluating } = useMutation({
    mutationFn: () => evaluateCollectionRules(collectionId),
    onSuccess: () => {
      toast.success("تم تطبيق القواعد على المجموعة")
      invalidate()
      queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.products(collectionId, 0),
      })
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border p-4 flex flex-col gap-3">
        <p className="text-sm font-medium">إضافة قاعدة جديدة</p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.5fr_auto] gap-2 items-end">
          <Select
            value={draft.fieldKey}
            onValueChange={(v) => setDraft({ ...draft, fieldKey: v })}
            disabled={isAdding}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={draft.operator}
            onValueChange={(v) => setDraft({ ...draft, operator: v })}
            disabled={isAdding}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATOR_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
            placeholder="القيمة"
            disabled={isAdding}
          />
          <Button
            type="button"
            onClick={() => addRule()}
            disabled={!draft.value.trim() || isAdding}
          >
            {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            أضف
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          منطق الدمج بين القواعد:
          <Select
            value={draft.logicGroup}
            onValueChange={(v) =>
              setDraft({ ...draft, logicGroup: v as "AND" | "OR" })
            }
            disabled={isAdding}
          >
            <SelectTrigger className="h-7 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
      ) : rules.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            لا توجد قواعد بعد. أضف قاعدة لتعريف أيّ منتجات تنتمي تلقائياً.
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {rules.map((r) => (
              <li
                key={r.collectionRuleId}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Badge variant="outline">{r.logicGroup}</Badge>
                <span className="text-sm">
                  <span className="font-medium">
                    {FIELD_OPTIONS.find((f) => f.value === r.fieldKey)?.label ??
                      r.fieldKey}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {OPERATOR_OPTIONS.find((o) => o.value === r.operator)?.label ??
                      r.operator}
                  </span>{" "}
                  <Badge variant="secondary">{r.value}</Badge>
                </span>
                <div className="flex-1" />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    r.collectionRuleId && removeRule(r.collectionRuleId)
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground flex-1">
              "تطبيق" يحفظ المنتجات المطابقة في المجموعة.
            </p>
            <Button
              type="button"
              onClick={() => evaluate()}
              disabled={isEvaluating}
            >
              {isEvaluating ? <Loader2 className="size-4 animate-spin" /> : null}
              تطبيق القواعد الآن
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
