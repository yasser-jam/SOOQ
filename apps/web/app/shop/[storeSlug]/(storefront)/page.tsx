import { use } from "react"

type Params = Promise<{ storeSlug: string }>

export default function StorefrontHomePage({ params }: { params: Params }) {
  const { storeSlug } = use(params)

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-3xl font-semibold">
        متجر <span className="font-mono" dir="ltr">{storeSlug}</span>
      </h1>
      <p className="max-w-md text-muted-foreground">
        واجهة الزبون لهذا المتجر قيد التطوير. تابعنا قريبًا.
      </p>
    </main>
  )
}
