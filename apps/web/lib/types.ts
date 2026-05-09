export type FieldError = {
  field: string
  message: string
}

export type ApiResponse<T> = {
  success?: boolean
  data?: T
  message?: string | null
  timestamp?: number
  errorCode?: string
  fieldErrors?: FieldError[]
}

export type Page<T> = {
  content?: T[]
  totalElements?: number
  totalPages?: number
  number?: number
  size?: number
  first?: boolean
  last?: boolean
  empty?: boolean
}

export type PaginationMeta = {
  page: number
  size: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type PagedApiResponse<T> = {
  success?: boolean
  data?: T[]
  meta?: PaginationMeta
  message?: string | null
  timestamp?: number
  errorCode?: string
  fieldErrors?: FieldError[]
}
