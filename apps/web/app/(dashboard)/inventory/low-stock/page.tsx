import LowStockList from "@/modules/inventory/components/low-stock-list"

export default function LowStockPage() {
  return (
    <div className="container">
      <div className="my-6 flex flex-col gap-1">
        <div className="page-title">المخزون المنخفض</div>
        <p className="text-sm text-muted-foreground">
          متغيّرات تجاوزت حدّ التنبيه. أدخل رقم المنتج للاستعراض.
        </p>
      </div>

      <LowStockList />
    </div>
  )
}
