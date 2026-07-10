import {
  createProductCategory,
  listProductCategories,
} from "@/modules/product/category/actions"
import type { ProductCategory } from "@/modules/product/category/types"
import { createProduct, listProducts } from "@/modules/product/product/actions"
import type { CreateProductInput } from "@/modules/product/product/types"
import {
  createProductTag,
  listProductTags,
} from "@/modules/product/tag/actions"
import type { ProductTag } from "@/modules/product/tag/types"
import { slugify } from "@/components/system/creatable-select"

import {
  CATEGORY_META,
  CATEGORY_SLUG_ALIASES,
  KNOWN_CATEGORY_IDS,
  KNOWN_TAG_IDS,
} from "./constants"
import seedFile from "./products.json"
import type {
  SeedProductSource,
  SeedProductsFile,
  SeedProgress,
} from "./types"

const seedData = seedFile as SeedProductsFile

export type SeedProgressCallback = (progress: SeedProgress) => void

const errorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) return error.message
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message
  }
  return fallback
}

const toSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .slice(0, 100)

const unique = <T>(items: T[]): T[] => [...new Set(items)]

const collectRequiredCategorySlugs = (
  products: SeedProductSource[]
): string[] => unique(products.map((p) => p.category).filter(Boolean))

const collectRequiredTagNames = (products: SeedProductSource[]): string[] =>
  unique(products.flatMap((p) => p.tags ?? []).filter(Boolean))

const categoryMatchesSlug = (
  category: ProductCategory,
  neededSlug: string
): boolean => {
  const aliases = CATEGORY_SLUG_ALIASES[neededSlug] ?? [neededSlug]
  const slug = (category.slug ?? "").toLowerCase()
  const knownId = KNOWN_CATEGORY_IDS[neededSlug]
  return aliases.includes(slug) || (!!knownId && category.id === knownId)
}

const tagMatchesName = (tag: ProductTag, name: string): boolean => {
  const neededSlug = slugify(name)
  const knownId = KNOWN_TAG_IDS[neededSlug]
  const tagSlug = (tag.slug ?? "").toLowerCase()
  const tagNameSlug = slugify(tag.tagName ?? "")
  return (
    tagSlug === neededSlug ||
    tagNameSlug === neededSlug ||
    (!!knownId && tag.id === knownId)
  )
}

const findCategory = (
  categories: ProductCategory[],
  neededSlug: string
): ProductCategory | undefined =>
  categories.find((c) => categoryMatchesSlug(c, neededSlug))

const findTag = (
  tags: ProductTag[],
  name: string
): ProductTag | undefined => tags.find((t) => tagMatchesName(t, name))

async function fetchImageAsFile(url: string): Promise<File | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    const filename = url.split("/").pop()?.split("?")[0] || "image.webp"
    return new File([blob], filename, {
      type: blob.type || "image/webp",
    })
  } catch {
    return null
  }
}

function buildCompareAtPrice(price: number, discountPercentage: number): number {
  if (!discountPercentage || discountPercentage <= 0) return price
  const ratio = 1 - discountPercentage / 100
  if (ratio <= 0) return price
  return Number((price / ratio).toFixed(2))
}

function buildProductPayload(
  product: SeedProductSource,
  categoryId: string,
  tagIds: string[],
  mediaFiles: File[]
): CreateProductInput {
  const title = product.title.trim()
  const description = product.description.trim()
  const compareAtPrice = buildCompareAtPrice(
    product.price,
    product.discountPercentage
  )

  return {
    titleAr: title,
    titleEn: title,
    descriptionAr: description,
    descriptionEn: description,
    slug: `${toSlug(title)}-${product.id}`,
    basePrice: product.price,
    compareAtPrice,
    currencyCode: "USD",
    status: "ACTIVE",
    allowOversell: false,
    seoTitle: title,
    seoDescription: description.slice(0, 160),
    defaultCategoryId: categoryId,
    categories: [{ id: categoryId }],
    tags: tagIds.map((id) => ({ id })),
    mediaFiles,
    variants: [
      {
        // Backend rejects empty attributes maps — use a single default axis
        // for simple (non-matrix) seed products.
        attributes: { العنوان: "افتراضي" },
        sku: product.sku,
        price: product.price,
        compareAtPrice,
        stockQty: product.stock,
        weightGrams:
          typeof product.weight === "number"
            ? Math.max(1, Math.round(product.weight * 100))
            : null,
        barcode: product.meta?.barcode ?? null,
        isActive: true,
      },
    ],
  }
}

/**
 * Ensures every category referenced by the seed file exists.
 * Creates missing ones, then returns a slug → id map.
 */
export async function ensureSeedCategories(
  requiredSlugs: string[],
  onProgress?: SeedProgressCallback
): Promise<Map<string, string>> {
  let categories = await listProductCategories()
  const map = new Map<string, string>()
  const missing = requiredSlugs.filter((slug) => !findCategory(categories, slug))

  onProgress?.({
    phase: "categories",
    current: 0,
    total: missing.length,
    message:
      missing.length === 0
        ? "كل الفئات موجودة"
        : `إنشاء ${missing.length} فئة ناقصة…`,
    errors: [],
  })

  for (let i = 0; i < missing.length; i++) {
    const slug = missing[i]!
    const meta = CATEGORY_META[slug] ?? {
      nameAr: slug,
      nameEn: slug,
      descriptionAr: slug,
      descriptionEn: slug,
    }

    onProgress?.({
      phase: "categories",
      current: i + 1,
      total: missing.length,
      message: `إنشاء فئة: ${meta.nameEn}`,
      errors: [],
    })

    await createProductCategory({
      nameAr: meta.nameAr,
      nameEn: meta.nameEn,
      slug,
      descriptionAr: meta.descriptionAr,
      descriptionEn: meta.descriptionEn,
      parentCategoryId: null,
      sortOrder: i,
      isActive: true,
    })
  }

  if (missing.length > 0) {
    categories = await listProductCategories()
  }

  for (const slug of requiredSlugs) {
    const found = findCategory(categories, slug)
    if (!found?.id) {
      throw new Error(`Category not found after ensure: ${slug}`)
    }
    map.set(slug, found.id)
  }

  return map
}

/**
 * Ensures every tag referenced by the seed file exists.
 * Creates missing ones, then returns a name → id map.
 */
export async function ensureSeedTags(
  requiredNames: string[],
  onProgress?: SeedProgressCallback
): Promise<Map<string, string>> {
  let tags = await listProductTags()
  const map = new Map<string, string>()
  const missing = requiredNames.filter((name) => !findTag(tags, name))

  onProgress?.({
    phase: "tags",
    current: 0,
    total: missing.length,
    message:
      missing.length === 0
        ? "كل الوسوم موجودة"
        : `إنشاء ${missing.length} وسم ناقص…`,
    errors: [],
  })

  for (let i = 0; i < missing.length; i++) {
    const name = missing[i]!
    const slug = slugify(name)

    onProgress?.({
      phase: "tags",
      current: i + 1,
      total: missing.length,
      message: `إنشاء وسم: ${name}`,
      errors: [],
    })

    await createProductTag({
      tagName: name,
      slug,
    })
  }

  if (missing.length > 0) {
    tags = await listProductTags()
  }

  for (const name of requiredNames) {
    const found = findTag(tags, name)
    if (!found?.id) {
      throw new Error(`Tag not found after ensure: ${name}`)
    }
    map.set(name, found.id)
  }

  return map
}

/**
 * Creates seed products with resolved category/tag ids.
 * Skips products whose slug already exists.
 */
export async function createSeedProducts(
  products: SeedProductSource[],
  categoryIds: Map<string, string>,
  tagIds: Map<string, string>,
  onProgress?: SeedProgressCallback
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const existing = await listProducts()
  const existingSlugs = new Set(
    (existing.data ?? []).map((p) => (p.slug ?? "").toLowerCase())
  )

  const errors: string[] = []
  let created = 0
  let skipped = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]!
    const slug = `${toSlug(product.title)}-${product.id}`

    onProgress?.({
      phase: "products",
      current: i + 1,
      total: products.length,
      message: `منتج ${i + 1}/${products.length}: ${product.title}`,
      errors: [...errors],
    })

    if (existingSlugs.has(slug.toLowerCase())) {
      skipped++
      continue
    }

    const categoryId = categoryIds.get(product.category)
    if (!categoryId) {
      errors.push(`${product.title}: missing category ${product.category}`)
      continue
    }

    const resolvedTagIds = (product.tags ?? [])
      .map((name) => tagIds.get(name))
      .filter((id): id is string => Boolean(id))

    const imageUrls = unique(
      [product.thumbnail, ...(product.images ?? [])].filter(Boolean)
    )
    const mediaFiles: File[] = []
    for (const url of imageUrls.slice(0, 3)) {
      const file = await fetchImageAsFile(url)
      if (file) mediaFiles.push(file)
    }

    try {
      await createProduct(
        buildProductPayload(product, categoryId, resolvedTagIds, mediaFiles)
      )
      created++
      existingSlugs.add(slug.toLowerCase())
    } catch (error) {
      errors.push(
        `${product.title}: ${errorMessage(error, "unknown create error")}`
      )
    }
  }

  return { created, skipped, errors }
}

/**
 * Full seed pipeline: check → ensure categories → ensure tags → create products.
 */
export async function runProductSeed(
  onProgress: SeedProgressCallback
): Promise<void> {
  const products = seedData.products ?? []
  const errors: string[] = []

  try {
    onProgress({
      phase: "checking",
      current: 0,
      total: 0,
      message: "التحقق من الفئات والوسوم…",
      errors: [],
    })

    const requiredCategories = collectRequiredCategorySlugs(products)
    const requiredTags = collectRequiredTagNames(products)

    const categoryIds = await ensureSeedCategories(
      requiredCategories,
      onProgress
    )
    const tagIds = await ensureSeedTags(requiredTags, onProgress)

    const result = await createSeedProducts(
      products,
      categoryIds,
      tagIds,
      onProgress
    )
    errors.push(...result.errors)

    onProgress({
      phase: errors.length > 0 ? "error" : "done",
      current: products.length,
      total: products.length,
      message: `تم: إنشاء ${result.created}، تخطي ${result.skipped}${
        errors.length ? `، أخطاء ${errors.length}` : ""
      }`,
      errors,
    })
  } catch (error) {
    const message = errorMessage(error, "فشل تشغيل الـ seeder")
    onProgress({
      phase: "error",
      current: 0,
      total: 0,
      message,
      errors: [message, ...errors],
    })
  }
}

export { seedData }
