"use client"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"

import { collectionQueryKeys } from "../queryKeys"
import { listCollectionRules } from "../actions"

type Props = {
  collectionId: string
  onCreate?: () => void
}

export default function RulesList({ collectionId, onCreate }: Props) {
  const { data: rules, isLoading } = useQuery({
    queryKey: collectionQueryKeys.rules(collectionId),
    queryFn: () => listCollectionRules(collectionId),
    enabled: Boolean(collectionId),
  })

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">قواعد التجميع</h3>
        <Button size="sm" onClick={onCreate}>إضافة قاعدة</Button>
      </div>

      {isLoading ? (
        <div>جارٍ التحميل...</div>
      ) : (
        <div className="flex flex-col gap-2">
          {rules && rules.length > 0 ? (
            rules.map((r, idx) => (
              <div key={idx} className="rounded border p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{r.fieldKey} {r.operator} {r.value}</div>
                  <div className="text-xs text-muted-foreground">{r.logicGroup}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">لا توجد قواعد بعد</div>
          )}
        </div>
      )}
    </Card>
  )
}
