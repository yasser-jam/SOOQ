export type SeedPhase =
  | "idle"
  | "checking"
  | "categories"
  | "tags"
  | "products"
  | "done"
  | "error"

export type SeedProgress = {
  phase: SeedPhase
  current: number
  total: number
  message: string
  errors: string[]
}

export type SeedProductSource = {
  id: number
  title: string
  description: string
  category: string
  price: number
  discountPercentage: number
  stock: number
  tags: string[]
  sku: string
  weight: number
  images: string[]
  thumbnail: string
  meta?: {
    barcode?: string
  }
}

export type SeedProductsFile = {
  products: SeedProductSource[]
}
