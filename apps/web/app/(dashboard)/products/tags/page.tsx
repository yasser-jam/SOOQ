import ProductTagTable from "@/modules/product/tag/components/table"

export default function ProductsTagsPage() {
  return (
    <div className="container">
      <div className="my-6">
        <div className="page-title">وسوم المنتجات</div>
      </div>

      <ProductTagTable />
    </div>
  )
}
