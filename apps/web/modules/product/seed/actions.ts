import {
  createAttributeDefinition,
  listAttributeDefinitions,
} from "@/modules/product/attribute/actions"
import type {
  CreateAttributeInput,
  ProductAttributeDefinition,
  ProductAttributeValue,
} from "@/modules/product/attribute/types"
import {
  createProductCategory,
  listProductCategories,
} from "@/modules/product/category/actions"
import type { ProductCategory } from "@/modules/product/category/types"
import {
  addCollectionProduct,
  createCollectionRule,
  createProductCollection,
  evaluateCollectionRules,
  listProductCollections,
} from "@/modules/product/collection/actions"
import type { ProductCollection } from "@/modules/product/collection/types"
import {
  createProduct,
  listProducts,
} from "@/modules/product/product/actions"
import type {
  CategoryRef,
  CreateProductInput,
  TagRef,
} from "@/modules/product/product/types"
import {
  createProductTag,
  listProductTags,
} from "@/modules/product/tag/actions"
import type { ProductTag } from "@/modules/product/tag/types"

import {
  SEED_DATASET,
  type SeedAttributeDef,
  type SeedCategoryDef,
  type SeedCollectionDef,
  type SeedDataset,
  type SeedProductAttributeValue,
  type SeedProductDef,
  type SeedTagDef,
} from "./dataset"
import {
  DEFAULT_SEED_IMAGES,
  loadSeedImages,
  pickSeedImageFiles,
  type SeedImage,
  type SeedImageConfig,
} from "./seed-images"
import type { SeedProgress } from "./types"

export type SeedProgressCallback = (progress: SeedProgress) => void

/**
 * `false` turns a phase into a lookup-only pass: existing rows are mapped to
 * their ids, nothing is created. Used by the products-only run, which seeds
 * into a store whose categories/tags/attributes are already in place.
 */
type EnsureOptions = { createMissing: boolean }

const CREATE_MISSING: EnsureOptions = { createMissing: true }
const RESOLVE_ONLY: EnsureOptions = { createMissing: false }

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

const eqSlug = (a: string | undefined, b: string): boolean =>
  (a ?? "").trim().toLowerCase() === b.trim().toLowerCase()

/* ============================================================================
 * Categories
 * ==========================================================================*/

async function ensureCategories(
  defs: SeedCategoryDef[],
  progress: SeedProgressCallback,
  errors: string[],
  { createMissing }: EnsureOptions = CREATE_MISSING
): Promise<Map<string, string>> {
  progress({
    phase: "categories",
    current: 0,
    total: defs.length,
    message: "قراءة الفئات الحالية…",
    errors: [...errors],
  })

  let existing = await listProductCategories()
  const slugToId = new Map<string, string>()
  for (const c of existing) {
    if (c.slug && c.id) slugToId.set(c.slug.toLowerCase(), c.id)
  }

  if (!createMissing) return slugToId

  // Two passes: parents first, then children (so parentCategoryId resolves).
  const parents = defs.filter((c) => !c.parentSlug)
  const children = defs.filter((c) => !!c.parentSlug)
  const ordered = [...parents, ...children]

  let done = 0
  for (const def of ordered) {
    done++
    if (slugToId.has(def.slug.toLowerCase())) {
      progress({
        phase: "categories",
        current: done,
        total: ordered.length,
        message: `موجودة: ${def.nameAr}`,
        errors: [...errors],
      })
      continue
    }

    const parentId = def.parentSlug
      ? slugToId.get(def.parentSlug.toLowerCase()) ?? null
      : null

    progress({
      phase: "categories",
      current: done,
      total: ordered.length,
      message: `إنشاء فئة: ${def.nameAr}`,
      errors: [...errors],
    })

    try {
      await createProductCategory({
        nameAr: def.nameAr,
        nameEn: def.nameEn,
        slug: def.slug,
        descriptionAr: def.descriptionAr,
        descriptionEn: def.descriptionEn,
        parentCategoryId: parentId,
        sortOrder: def.sortOrder,
        isActive: true,
      })
    } catch (error) {
      errors.push(`فئة ${def.nameAr}: ${errorMessage(error, "unknown")}`)
      continue
    }

    // Refresh so children created in the same pass can find their parent.
    existing = await listProductCategories()
    slugToId.clear()
    for (const c of existing) {
      if (c.slug && c.id) slugToId.set(c.slug.toLowerCase(), c.id)
    }
  }

  return slugToId
}

/* ============================================================================
 * Tags
 * ==========================================================================*/

async function ensureTags(
  defs: SeedTagDef[],
  progress: SeedProgressCallback,
  errors: string[],
  { createMissing }: EnsureOptions = CREATE_MISSING
): Promise<Map<string, string>> {
  progress({
    phase: "tags",
    current: 0,
    total: defs.length,
    message: "قراءة الوسوم الحالية…",
    errors: [...errors],
  })

  const existing = await listProductTags()
  const slugToId = new Map<string, string>()
  const nameToId = new Map<string, string>()
  for (const t of existing) {
    if (t.id) {
      if (t.slug) slugToId.set(t.slug.toLowerCase(), t.id)
      if (t.tagName) nameToId.set(t.tagName.trim().toLowerCase(), t.id)
    }
  }

  const finalMap = new Map<string, string>() // seed-slug → id
  let done = 0

  for (const def of defs) {
    done++
    const existingId =
      slugToId.get(def.slug.toLowerCase()) ??
      nameToId.get(def.name.trim().toLowerCase())

    if (existingId) {
      finalMap.set(def.slug, existingId)
      progress({
        phase: "tags",
        current: done,
        total: defs.length,
        message: `موجود: ${def.name}`,
        errors: [...errors],
      })
      continue
    }

    if (!createMissing) continue

    progress({
      phase: "tags",
      current: done,
      total: defs.length,
      message: `إنشاء وسم: ${def.name}`,
      errors: [...errors],
    })

    try {
      await createProductTag({ tagName: def.name, slug: def.slug })
    } catch (error) {
      errors.push(`وسم ${def.name}: ${errorMessage(error, "unknown")}`)
      continue
    }

    const refreshed = await listProductTags()
    const found = refreshed.find(
      (t) =>
        eqSlug(t.slug, def.slug) ||
        (t.tagName ?? "").trim().toLowerCase() ===
          def.name.trim().toLowerCase()
    )
    if (found?.id) finalMap.set(def.slug, found.id)
  }

  return finalMap
}

/* ============================================================================
 * Attributes
 * ==========================================================================*/

type ResolvedAttribute = {
  attributeDefId: string
  /** seed option key → attributeOptionId */
  optionIdByKey: Map<string, string>
}

async function ensureAttributes(
  defs: SeedAttributeDef[],
  categoryIdBySlug: Map<string, string>,
  progress: SeedProgressCallback,
  errors: string[],
  { createMissing }: EnsureOptions = CREATE_MISSING
): Promise<Map<string, ResolvedAttribute>> {
  progress({
    phase: "attributes",
    current: 0,
    total: defs.length,
    message: "قراءة السمات الحالية…",
    errors: [...errors],
  })

  const scopeIds = new Set<string | null>()
  for (const def of defs) {
    const scopeId = def.categorySlug
      ? categoryIdBySlug.get(def.categorySlug.toLowerCase()) ?? null
      : null
    scopeIds.add(scopeId)
  }

  const attrsByScope = new Map<string | null, ProductAttributeDefinition[]>()
  for (const scopeId of scopeIds) {
    const list = await listAttributeDefinitions(scopeId ?? undefined)
    attrsByScope.set(scopeId, list)
  }

  const findByKey = (
    scopeId: string | null,
    key: string
  ): ProductAttributeDefinition | undefined =>
    (attrsByScope.get(scopeId) ?? []).find(
      (a) => (a.attributeKey ?? "").toLowerCase() === key.toLowerCase()
    )

  const result = new Map<string, ResolvedAttribute>()
  let done = 0

  for (const def of defs) {
    done++
    const scopeId = def.categorySlug
      ? categoryIdBySlug.get(def.categorySlug.toLowerCase()) ?? null
      : null

    let apiDef = findByKey(scopeId, def.attributeKey)

    if (!apiDef && !createMissing) {
      // Products referencing this attribute simply drop the value — the
      // definitions phase of a full seed is what creates them.
      continue
    }

    if (!apiDef) {
      progress({
        phase: "attributes",
        current: done,
        total: defs.length,
        message: `إنشاء سمة: ${def.nameAr}`,
        errors: [...errors],
      })

      const payload: CreateAttributeInput = {
        categoryId: scopeId,
        attributeNameAr: def.nameAr,
        attributeNameEn: def.nameEn,
        attributeKey: def.attributeKey,
        dataType: def.dataType,
        isRequired: def.isRequired ?? false,
        isFilterable: def.isFilterable ?? false,
        isVisibleOnStorefront: def.isVisibleOnStorefront ?? true,
        sortOrder: def.sortOrder ?? 0,
        options: (def.options ?? []).map((o, i) => ({
          optionValueAr: o.valueAr,
          optionValueEn: o.valueEn,
          sortOrder: i,
        })),
      }

      try {
        await createAttributeDefinition(payload)
      } catch (error) {
        errors.push(`سمة ${def.nameAr}: ${errorMessage(error, "unknown")}`)
        continue
      }

      const refreshed = await listAttributeDefinitions(scopeId ?? undefined)
      attrsByScope.set(scopeId, refreshed)
      apiDef = findByKey(scopeId, def.attributeKey)
    } else {
      progress({
        phase: "attributes",
        current: done,
        total: defs.length,
        message: `موجودة: ${def.nameAr}`,
        errors: [...errors],
      })
    }

    if (!apiDef?.attributeDefId) continue

    // Map seed option keys → real ids by matching English value (fallback Arabic).
    const optionIdByKey = new Map<string, string>()
    for (const seedOpt of def.options ?? []) {
      const match = (apiDef.options ?? []).find(
        (o) =>
          (o.optionValueEn ?? "").trim().toLowerCase() ===
            seedOpt.valueEn.trim().toLowerCase() ||
          (o.optionValueAr ?? "").trim() === seedOpt.valueAr.trim()
      )
      if (match?.attributeOptionId) {
        optionIdByKey.set(seedOpt.key, match.attributeOptionId)
      }
    }

    result.set(def.attributeKey, {
      attributeDefId: apiDef.attributeDefId,
      optionIdByKey,
    })
  }

  return result
}

/* ============================================================================
 * Products
 * ==========================================================================*/

/**
 * Slug/SKU suffix for a run that is allowed to re-add a catalog the store
 * already holds. Both are unique per tenant on the backend, so the dataset's
 * fixed values can only ever be inserted once — a second pass needs fresh
 * ones. Generated once per run so every product of the batch shares it.
 */
const randomRunSuffix = (): string =>
  Math.random().toString(36).slice(2, 7)

/** `""` (a plain seed) leaves the dataset's slugs and SKUs untouched. */
const withSuffix = (value: string, suffix: string): string =>
  suffix ? `${value}-${suffix}` : value

function buildProductPayload(
  def: SeedProductDef,
  categoryIdBySlug: Map<string, string>,
  tagIdBySlug: Map<string, string>,
  attributeBySeedKey: Map<string, ResolvedAttribute>,
  mediaFiles: File[],
  suffix: string
): CreateProductInput {
  const categories: CategoryRef[] = def.categorySlugs
    .map((slug) => {
      const id = categoryIdBySlug.get(slug.toLowerCase())
      return id ? ({ id } as CategoryRef) : null
    })
    .filter((c): c is CategoryRef => Boolean(c))

  const defaultCategoryId = categoryIdBySlug.get(
    def.defaultCategorySlug.toLowerCase()
  )

  const tags: TagRef[] = def.tagSlugs
    .map((slug) => {
      const id = tagIdBySlug.get(slug)
      return id ? ({ id } as TagRef) : null
    })
    .filter((t): t is TagRef => Boolean(t))

  const attributes: ProductAttributeValue[] = (def.attributes ?? [])
    .map((entry): ProductAttributeValue | null => {
      const resolved = attributeBySeedKey.get(entry.attributeKey)
      if (!resolved) return null
      if ("valueText" in entry) {
        return {
          attributeDefId: resolved.attributeDefId,
          valueText: entry.valueText,
        }
      }
      const optionIds = entry.optionKeys
        .map((k) => resolved.optionIdByKey.get(k))
        .filter((id): id is string => Boolean(id))
      if (optionIds.length === 0) return null
      return {
        attributeDefId: resolved.attributeDefId,
        attributeOptionIds: optionIds,
      }
    })
    .filter((v): v is ProductAttributeValue => Boolean(v))

  const variants =
    def.variants && def.variants.length > 0
      ? def.variants.map((v) => ({
          attributes: v.attributes,
          sku: withSuffix(v.sku, suffix.toUpperCase()),
          price: v.price ?? null,
          compareAtPrice: v.compareAtPrice ?? null,
          stockQty: v.stockQty,
          weightGrams: v.weightGrams ?? null,
          barcode: v.barcode ?? null,
          isActive: true,
        }))
      : [
          {
            // Backend rejects an empty variants list — send a single default
            // axis for simple products without matrix options.
            attributes: { "العنوان": "افتراضي" },
            sku: withSuffix(def.slug, suffix).toUpperCase(),
            price: def.basePrice,
            compareAtPrice: def.compareAtPrice,
            stockQty: 20,
            isActive: true,
          },
        ]

  const normalizedOptions = (def.options ?? []).map((opt, i) => ({
    optionNameAr: opt.optionNameAr,
    optionNameEn: opt.optionNameEn,
    sortOrder: i,
    values: opt.values.map((v, vi) => ({
      valueAr: v.valueAr,
      valueEn: v.valueEn,
      sortOrder: vi,
    })),
  }))

  const payload: CreateProductInput = {
    titleAr: def.titleAr,
    titleEn: def.titleEn,
    descriptionAr: def.descriptionAr,
    descriptionEn: def.descriptionEn,
    slug: withSuffix(def.slug, suffix),
    basePrice: def.basePrice,
    compareAtPrice: def.compareAtPrice,
    currencyCode: def.currencyCode,
    status: def.status,
    allowOversell: def.allowOversell ?? false,
    seoTitle: def.seoTitle ?? def.titleEn,
    seoDescription: def.seoDescription ?? def.descriptionEn.slice(0, 160),
    defaultCategoryId,
    categories,
    tags,
    // Multipart `files` parts. `mediaAssetIds` stays unset so the backend just
    // prepends the uploaded asset ids — there is nothing to preserve on create.
    mediaFiles,
    options: normalizedOptions,
    variants,
  }

  // EAV attributes are read by buildProductFormData via a cast — attach after
  // the typed literal so we don't fight the exported CreateProductInput shape.
  ;(payload as CreateProductInput & { attributes: ProductAttributeValue[] }).attributes =
    attributes

  return payload
}

async function ensureProducts(
  defs: SeedProductDef[],
  categoryIdBySlug: Map<string, string>,
  tagIdBySlug: Map<string, string>,
  attributeBySeedKey: Map<string, ResolvedAttribute>,
  progress: SeedProgressCallback,
  errors: string[],
  /** `""` seeds the dataset's own slugs/SKUs and skips products that exist. */
  suffix = "",
  imageConfig: SeedImageConfig = DEFAULT_SEED_IMAGES
): Promise<Map<string, string>> {
  const existing = await listProducts()
  const slugToId = new Map<string, string>()
  for (const p of existing.data ?? []) {
    if (p.slug && p.id) slugToId.set(p.slug.toLowerCase(), p.id)
  }

  progress({
    phase: "images",
    current: 0,
    total: defs.length,
    message: "تحضير صور المنتجات…",
    errors: [...errors],
  })

  // One fetch + JPEG conversion pass for the whole run; every product slices
  // its one or two pictures out of this shared pool.
  let images: SeedImage[] = []
  try {
    images = await loadSeedImages(imageConfig)
    if (images.length === 0) {
      errors.push(`صور: تعذّر تحميل أي صورة من public/${imageConfig.folder}`)
    }
  } catch (error) {
    errors.push(`صور: ${errorMessage(error, "unknown")}`)
  }

  let done = 0
  for (const def of defs) {
    done++
    const slug = withSuffix(def.slug, suffix)

    // A suffixed run is deliberately re-adding the catalog, so its slugs are
    // new by construction and nothing can match.
    if (slugToId.has(slug.toLowerCase())) {
      progress({
        phase: "products",
        current: done,
        total: defs.length,
        message: `موجود: ${def.titleAr}`,
        errors: [...errors],
      })
      continue
    }

    // Keyed on the dataset slug, not the suffixed one, so a product keeps the
    // same pictures across runs.
    const mediaFiles = pickSeedImageFiles(images, def.slug)

    progress({
      phase: "products",
      current: done,
      total: defs.length,
      message: `إنشاء منتج: ${def.titleAr} (${mediaFiles.length} صورة)`,
      errors: [...errors],
    })

    try {
      await createProduct(
        buildProductPayload(
          def,
          categoryIdBySlug,
          tagIdBySlug,
          attributeBySeedKey,
          mediaFiles,
          suffix
        )
      )
    } catch (error) {
      errors.push(`منتج ${def.titleAr}: ${errorMessage(error, "unknown")}`)
    }
  }

  // Refresh once at the end so collections can resolve product ids by slug.
  const refreshed = await listProducts()
  const idByActualSlug = new Map<string, string>()
  for (const p of refreshed.data ?? []) {
    if (p.slug && p.id) idByActualSlug.set(p.slug.toLowerCase(), p.id)
  }

  // Returned map is keyed by the DATASET slug — collections reference products
  // by that name and know nothing about this run's suffix.
  const result = new Map<string, string>()
  for (const def of defs) {
    const id =
      idByActualSlug.get(withSuffix(def.slug, suffix).toLowerCase()) ??
      idByActualSlug.get(def.slug.toLowerCase())
    if (id) result.set(def.slug.toLowerCase(), id)
  }
  return result
}

/* ============================================================================
 * Collections
 * ==========================================================================*/

async function ensureCollections(
  defs: SeedCollectionDef[],
  productIdBySlug: Map<string, string>,
  progress: SeedProgressCallback,
  errors: string[]
): Promise<void> {
  const existing = await listProductCollections()
  const slugToCollection = new Map<string, ProductCollection>()
  for (const c of existing) {
    if (c.collectionSlug) {
      slugToCollection.set(c.collectionSlug.toLowerCase(), c)
    }
  }

  let done = 0
  for (const def of defs) {
    done++
    progress({
      phase: "collections",
      current: done,
      total: defs.length,
      message: `مجموعة: ${def.name}`,
      errors: [...errors],
    })

    let collection = slugToCollection.get(def.slug.toLowerCase())

    if (!collection) {
      try {
        collection = await createProductCollection({
          collectionName: def.name,
          collectionSlug: def.slug,
          collectionType: def.type,
          descriptionAr: def.descriptionAr,
          descriptionEn: def.descriptionEn,
          isActive: true,
        })
      } catch (error) {
        errors.push(`مجموعة ${def.name}: ${errorMessage(error, "unknown")}`)
        continue
      }
    }

    if (!collection?.id) continue

    if (def.type === "MANUAL") {
      let sort = 0
      for (const productSlug of def.productSlugs) {
        const productId = productIdBySlug.get(productSlug.toLowerCase())
        if (!productId) {
          errors.push(
            `مجموعة ${def.name}: منتج غير موجود (${productSlug})`
          )
          continue
        }
        try {
          await addCollectionProduct(collection.id, {
            productId,
            sortOrder: sort++,
          })
        } catch (error) {
          // Duplicate links are fine on re-run — surface only the first message.
          const msg = errorMessage(error, "unknown")
          if (!/exist|already/i.test(msg)) {
            errors.push(`مجموعة ${def.name} / ${productSlug}: ${msg}`)
          }
        }
      }
    } else {
      for (const rule of def.rules) {
        try {
          await createCollectionRule(collection.id, rule)
        } catch (error) {
          errors.push(
            `قاعدة ${def.name} (${rule.fieldKey}=${rule.value}): ${errorMessage(error, "unknown")}`
          )
        }
      }
      try {
        await evaluateCollectionRules(collection.id)
      } catch (error) {
        errors.push(
          `تقييم ${def.name}: ${errorMessage(error, "unknown")}`
        )
      }
    }
  }
}

/* ============================================================================
 * Orchestrator
 * ==========================================================================*/

/**
 * Full seed pipeline: categories → tags → attributes → products → collections.
 * Each phase reports fine-grained progress; individual errors are collected
 * without aborting the pipeline so a partial seed still lands in the store.
 *
 * `dataset` defaults to the general demo catalog; pass `FURNITURE_SEED_DATASET`
 * (or any other `SeedDataset`) to seed a different catalog through the same
 * pipeline. Datasets may share categories/tags/attributes — anything that
 * already exists is reused instead of recreated.
 */
export async function runProductSeed(
  onProgress: SeedProgressCallback,
  dataset: SeedDataset = SEED_DATASET
): Promise<void> {
  const errors: string[] = []

  try {
    onProgress({
      phase: "checking",
      current: 0,
      total: 0,
      message: "بدء التهيئة…",
      errors: [],
    })

    const categoryIds = await ensureCategories(
      dataset.categories,
      onProgress,
      errors
    )

    const tagIds = await ensureTags(dataset.tags, onProgress, errors)

    const attributeMap = await ensureAttributes(
      dataset.attributes,
      categoryIds,
      onProgress,
      errors
    )

    const productIds = await ensureProducts(
      dataset.products,
      categoryIds,
      tagIds,
      attributeMap,
      onProgress,
      errors,
      "",
      dataset.imageConfig
    )

    await ensureCollections(
      dataset.collections,
      productIds,
      onProgress,
      errors
    )

    onProgress({
      phase: errors.length > 0 ? "error" : "done",
      current: 1,
      total: 1,
      message:
        errors.length > 0
          ? `اكتمل مع ${errors.length} خطأ`
          : "اكتمل الـ seeder بنجاح",
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

/**
 * Products-only pass for a store that has already been seeded once: the
 * categories/tags/attributes phases run in lookup-only mode (nothing is
 * created, ids are just resolved so products can reference them) and
 * collections are skipped entirely.
 *
 * Every product is created fresh with a random per-run slug/SKU suffix — the
 * dataset's own slugs are already taken in a seeded store, and both are unique
 * per tenant. So this always ADDS a full copy of the catalog rather than
 * backfilling the existing rows.
 */
export async function runProductsOnlySeed(
  onProgress: SeedProgressCallback,
  dataset: SeedDataset = SEED_DATASET
): Promise<void> {
  const errors: string[] = []
  const suffix = randomRunSuffix()

  try {
    onProgress({
      phase: "checking",
      current: 0,
      total: 0,
      message: `قراءة الفئات والوسوم والسمات الحالية… (لاحقة: ${suffix})`,
      errors: [],
    })

    const categoryIds = await ensureCategories(
      dataset.categories,
      onProgress,
      errors,
      RESOLVE_ONLY
    )

    const tagIds = await ensureTags(
      dataset.tags,
      onProgress,
      errors,
      RESOLVE_ONLY
    )

    const attributeMap = await ensureAttributes(
      dataset.attributes,
      categoryIds,
      onProgress,
      errors,
      RESOLVE_ONLY
    )

    await ensureProducts(
      dataset.products,
      categoryIds,
      tagIds,
      attributeMap,
      onProgress,
      errors,
      suffix,
      dataset.imageConfig
    )

    onProgress({
      phase: errors.length > 0 ? "error" : "done",
      current: 1,
      total: 1,
      message:
        errors.length > 0
          ? `اكتمل مع ${errors.length} خطأ`
          : `اكتملت إضافة المنتجات بنجاح (لاحقة: ${suffix})`,
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
