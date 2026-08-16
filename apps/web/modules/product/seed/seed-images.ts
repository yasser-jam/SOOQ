/**
 * Demo imagery for the seeder.
 *
 * The files in `public/seed-images/` are AVIF, which the media pipeline does
 * not accept (`MEDIA_CONSTRAINTS.allowedTypes` is jpeg/png/webp only), so each
 * one is decoded and re-encoded to JPEG in the browser before it is attached
 * to a product. Fetch + convert happens once per page load; every product that
 * draws the same picture reuses the same `Blob`.
 *
 * Pictures are NOT matched to the product they land on — the seeder just needs
 * something to render in the grid.
 */

/** Filenames under `public/seed-images/`. Spaces/parens are URL-encoded on fetch. */
const SEED_IMAGE_FILENAMES = [
  "download.avif",
  "download (1).avif",
  "shopping.avif",
  "shopping (1).avif",
  "shopping (2).avif",
  "shopping (3).avif",
  "shopping (4).avif",
  "shopping (5).avif",
  "shopping (6).avif",
  "shopping (7).avif",
  "shopping (8).avif",
] as const

/** Longest edge of the re-encoded JPEG, in px. */
const MAX_EDGE = 1200
const JPEG_QUALITY = 0.85

export type SeedImage = {
  blob: Blob
  /** file extension matching `blob.type`, used to name the upload part */
  extension: string
}

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality))

async function loadSeedImage(filename: string): Promise<SeedImage | null> {
  let source: Blob
  try {
    const response = await fetch(`/seed-images/${encodeURIComponent(filename)}`)
    if (!response.ok) return null
    source = await response.blob()
  } catch {
    return null
  }

  // A rewrite/redirect in front of `public/` (an auth guard, say) answers 200
  // with an HTML body. Uploading that as a product image would "succeed" and
  // leave a broken picture behind, so reject anything that isn't an image.
  if (!source.type.startsWith("image/")) return null

  try {
    const bitmap = await createImageBitmap(source)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))

    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("2d context unavailable")

    // JPEG has no alpha channel — matte transparency to white instead of black.
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const jpeg = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY)
    if (jpeg) return { blob: jpeg, extension: "jpg" }
  } catch {
    // Browser can't decode AVIF — fall through and send the original bytes so
    // the failure surfaces as a backend error rather than a silent no-image.
  }

  return { blob: source, extension: "avif" }
}

let cachedImages: Promise<SeedImage[]> | null = null

/** Fetches + converts every seed image once, then serves the cached list. */
export async function loadSeedImages(): Promise<SeedImage[]> {
  cachedImages ??= Promise.all(SEED_IMAGE_FILENAMES.map(loadSeedImage)).then(
    (loaded) => loaded.filter((image): image is SeedImage => image !== null)
  )

  const images = await cachedImages
  // Nothing loaded (dev server restarted mid-fetch, files missing) — drop the
  // cache so the next seed run gets a fresh attempt instead of empty forever.
  if (images.length === 0) cachedImages = null
  return images
}

/** FNV-1a. Stable per slug, so a re-run gives a product the same pictures. */
const hashSlug = (slug: string): number => {
  let hash = 0x811c9dc5
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * Picks one or two distinct images for `slug` and wraps them as `File`s ready
 * for the multipart `files` parts. The choice is arbitrary but deterministic —
 * seeding twice into two stores puts the same pictures on the same product.
 */
export function pickSeedImageFiles(images: SeedImage[], slug: string): File[] {
  if (images.length === 0) return []

  const hash = hashSlug(slug)
  const first = hash % images.length
  const indices = [first]

  // Two pictures for roughly two thirds of the catalog. The offset lands in
  // 1..length-1, which guarantees the second pick differs from the first.
  if (images.length > 1 && hash % 3 !== 0) {
    indices.push((first + 1 + ((hash >>> 8) % (images.length - 1))) % images.length)
  }

  return indices.map((index, i) => {
    const image = images[index]!
    return new File([image.blob], `${slug}-${i + 1}.${image.extension}`, {
      type: image.blob.type,
    })
  })
}
