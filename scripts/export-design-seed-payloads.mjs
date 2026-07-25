#!/usr/bin/env node
/**
 * Emits `POST /admin/design/apply-template`-shaped seed payloads for the
 * design templates we still ship in the client bundle.
 *
 * The builtin templates in `packages/editor-packages/core/themes` only exist
 * because the DSN backend's seeded templates have empty `templateJson`. Hand
 * the output of this script to whoever owns the seed data; once the backend
 * serves real payloads, both the builtin catalog and this script can go.
 *
 * Usage: node scripts/export-design-seed-payloads.mjs [outDir]
 */

import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const SCHEMA_VERSION = "1.0"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const themesDir = join(
  repoRoot,
  "packages/editor-packages/core/themes"
)

/** Mirrors `builtinThemeCatalog` in the themes module. */
const templates = [
  {
    templateKey: "builtin-sooq-modern",
    templateName: "سوق مودرن",
    industryType: "general",
    file: "theme-sooq-modern.json",
  },
]

const outDir = resolve(process.argv[2] ?? join(repoRoot, "dist/design-seed"))

await mkdir(outDir, { recursive: true })

const manifest = []

for (const template of templates) {
  const raw = await readFile(join(themesDir, template.file), "utf8")
  const siteData = JSON.parse(raw)

  const payload = {
    templateKey: template.templateKey,
    templateName: template.templateName,
    industryType: template.industryType,
    schemaVersion: SCHEMA_VERSION,
    templateJson: {
      web: siteData,
      mobile: {},
    },
  }

  const outFile = join(outDir, `${template.templateKey}.json`)
  const serialized = JSON.stringify(payload, null, 2)
  await writeFile(outFile, serialized, "utf8")

  manifest.push({
    templateKey: template.templateKey,
    templateName: template.templateName,
    pages: Array.isArray(siteData.pages) ? siteData.pages.length : 0,
    bytes: Buffer.byteLength(serialized, "utf8"),
    file: `${template.templateKey}.json`,
  })
}

await writeFile(
  join(outDir, "manifest.json"),
  JSON.stringify({ schemaVersion: SCHEMA_VERSION, templates: manifest }, null, 2),
  "utf8"
)

console.log(`Wrote ${manifest.length} seed payload(s) to ${outDir}`)
for (const entry of manifest) {
  const kb = (entry.bytes / 1024).toFixed(1)
  console.log(
    `  ${entry.templateKey.padEnd(24)} pages=${String(entry.pages).padStart(2)}  ${kb} KB`
  )
}
