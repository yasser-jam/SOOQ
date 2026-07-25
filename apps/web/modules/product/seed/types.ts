export type SeedPhase =
  | "idle"
  | "checking"
  | "categories"
  | "tags"
  | "attributes"
  | "products"
  | "collections"
  | "done"
  | "error"

export type SeedProgress = {
  phase: SeedPhase
  current: number
  total: number
  message: string
  errors: string[]
}
