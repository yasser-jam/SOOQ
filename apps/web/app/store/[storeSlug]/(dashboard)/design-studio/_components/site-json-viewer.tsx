"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { SiteData } from "@/core/config/lib/site-data"

type SectionTone = "root" | "zones" | "pages" | "default"

const SECTION_META: Record<
  string,
  { label: string; tone: SectionTone }
> = {
  root: { label: "Root (theme / shell)", tone: "root" },
  zones: { label: "Zones", tone: "zones" },
  pages: { label: "Pages", tone: "pages" },
}

function formatPrimitive(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value)
  if (value === null) return "null"
  return String(value)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function nodeSummary(value: unknown): string {
  if (Array.isArray(value)) return `${value.length} items`
  if (isPlainObject(value)) return `${Object.keys(value).length} keys`
  return formatPrimitive(value)
}

function pageLabel(page: unknown, index: number): string {
  if (!isPlainObject(page)) return `Page ${index}`
  const name = typeof page.name === "string" ? page.name : null
  const path = typeof page.path === "string" ? page.path : null
  const slug = typeof page.slug === "string" ? page.slug : null
  return name || path || slug || `Page ${index}`
}

type JumpTarget = {
  id: string
  label: string
  tone: SectionTone
  depth: number
}

function buildJumpTargets(site: SiteData): JumpTarget[] {
  const targets: JumpTarget[] = [
    { id: "json-sec-root", label: "root", tone: "root", depth: 0 },
    { id: "json-sec-zones", label: "zones", tone: "zones", depth: 0 },
    { id: "json-sec-pages", label: "pages", tone: "pages", depth: 0 },
  ]

  for (const zoneKey of Object.keys(site.zones ?? {})) {
    targets.push({
      id: `json-zone-${zoneKey}`,
      label: zoneKey,
      tone: "zones",
      depth: 1,
    })
  }

  site.pages.forEach((page, index) => {
    targets.push({
      id: `json-page-${index}`,
      label: pageLabel(page, index),
      tone: "pages",
      depth: 1,
    })
  })

  return targets
}

function JsonNode({
  name,
  value,
  path,
  depth,
  open,
  onToggle,
  sectionId,
  tone,
  forcedOpenPaths,
}: {
  name?: string
  value: unknown
  path: string
  depth: number
  open: boolean
  onToggle: (path: string) => void
  sectionId?: string
  tone?: SectionTone
  forcedOpenPaths: Set<string>
}) {
  const isArray = Array.isArray(value)
  const isObject = isPlainObject(value)
  const isExpandable = isArray || isObject

  if (!isExpandable) {
    return (
      <div
        className="SiteJsonNode SiteJsonNode--leaf"
        style={{ paddingInlineStart: depth * 14 }}
      >
        {name != null ? <span className="SiteJsonNode-key">{name}</span> : null}
        {name != null ? <span className="SiteJsonNode-colon">: </span> : null}
        <span
          className={`SiteJsonNode-value SiteJsonNode-value--${typeof value}`}
        >
          {formatPrimitive(value)}
        </span>
      </div>
    )
  }

  const entries = isArray
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value)

  const braceOpen = isArray ? "[" : "{"
  const braceClose = isArray ? "]" : "}"
  const resolvedTone = tone ?? "default"

  return (
    <div
      id={sectionId}
      className={`SiteJsonNode SiteJsonNode--branch SiteJsonNode--${resolvedTone}`}
    >
      <button
        type="button"
        className="SiteJsonNode-toggle"
        style={{ paddingInlineStart: depth * 14 }}
        onClick={() => onToggle(path)}
        aria-expanded={open}
      >
        <span className="SiteJsonNode-chevron" aria-hidden>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        {name != null ? <span className="SiteJsonNode-key">{name}</span> : null}
        {name != null ? <span className="SiteJsonNode-colon">: </span> : null}
        <span className="SiteJsonNode-brace">{braceOpen}</span>
        {!open ? (
          <span className="SiteJsonNode-summary"> {nodeSummary(value)} </span>
        ) : null}
        {!open ? (
          <span className="SiteJsonNode-brace">{braceClose}</span>
        ) : null}
      </button>

      {open ? (
        <div className="SiteJsonNode-children">
          {entries.map(([childKey, childValue]) => {
            const childPath = `${path}.${childKey}`
            const childSectionId =
              path === "zones"
                ? `json-zone-${childKey}`
                : path === "pages" && /^\d+$/.test(childKey)
                  ? `json-page-${childKey}`
                  : undefined

            const childName =
              path === "pages" && /^\d+$/.test(childKey)
                ? `[${childKey}] ${pageLabel(childValue, Number(childKey))}`
                : childKey

            return (
              <JsonNodeControlled
                key={childPath}
                name={childName}
                value={childValue}
                path={childPath}
                depth={depth + 1}
                sectionId={childSectionId}
                tone={resolvedTone}
                forcedOpenPaths={forcedOpenPaths}
              />
            )
          })}
          <div
            className="SiteJsonNode-closeBrace"
            style={{ paddingInlineStart: depth * 14 }}
          >
            <span className="SiteJsonNode-brace">{braceClose}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** Owns open/closed state for one path; reads expand-all / jump forced opens. */
function JsonNodeControlled({
  name,
  value,
  path,
  depth,
  sectionId,
  tone,
  forcedOpenPaths,
  defaultOpen,
}: {
  name?: string
  value: unknown
  path: string
  depth: number
  sectionId?: string
  tone?: SectionTone
  forcedOpenPaths: Set<string>
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen ?? depth < 1)

  useEffect(() => {
    if (forcedOpenPaths.has(path)) {
      setOpen(true)
    }
  }, [forcedOpenPaths, path])

  useEffect(() => {
    if (defaultOpen != null) {
      setOpen(defaultOpen)
    }
  }, [defaultOpen])

  return (
    <JsonNode
      name={name}
      value={value}
      path={path}
      depth={depth}
      open={open}
      onToggle={(p) => {
        if (p === path) setOpen((prev) => !prev)
      }}
      sectionId={sectionId}
      tone={tone}
      forcedOpenPaths={forcedOpenPaths}
    />
  )
}

export function SiteJsonViewer({ site }: { site: SiteData }) {
  const jumpTargets = useMemo(() => buildJumpTargets(site), [site])
  const [topOpen, setTopOpen] = useState<Record<string, boolean>>({
    root: true,
    zones: true,
    pages: true,
  })
  const [forcedOpenPaths, setForcedOpenPaths] = useState<Set<string>>(
    () => new Set(["root", "zones", "pages"])
  )

  const scrollTo = useCallback((id: string) => {
    const nextForced = new Set<string>(["root", "zones", "pages"])

    if (id.startsWith("json-zone-")) {
      const zoneKey = id.slice("json-zone-".length)
      nextForced.add("zones")
      nextForced.add(`zones.${zoneKey}`)
      setTopOpen((prev) => ({ ...prev, zones: true }))
    } else if (id.startsWith("json-page-")) {
      const pageIndex = id.slice("json-page-".length)
      nextForced.add("pages")
      nextForced.add(`pages.${pageIndex}`)
      setTopOpen((prev) => ({ ...prev, pages: true }))
    } else if (id === "json-sec-root") {
      setTopOpen((prev) => ({ ...prev, root: true }))
    } else if (id === "json-sec-zones") {
      setTopOpen((prev) => ({ ...prev, zones: true }))
    } else if (id === "json-sec-pages") {
      setTopOpen((prev) => ({ ...prev, pages: true }))
    }

    setForcedOpenPaths(nextForced)

    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
  }, [])

  const topEntries = useMemo(
    () =>
      (["root", "zones", "pages"] as const).map((key) => ({
        key,
        value: site[key],
        meta: SECTION_META[key],
      })),
    [site]
  )

  return (
    <div className="SiteJsonViewer" dir="ltr">
      <aside className="SiteJsonViewer-nav" aria-label="JSON sections">
        <p className="SiteJsonViewer-navTitle">Jump to</p>
        <ul className="SiteJsonViewer-navList">
          {jumpTargets.map((target) => (
            <li key={target.id}>
              <button
                type="button"
                className={`SiteJsonViewer-navBtn SiteJsonViewer-navBtn--${target.tone}`}
                style={{ paddingInlineStart: 8 + target.depth * 12 }}
                onClick={() => scrollTo(target.id)}
              >
                {target.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="SiteJsonViewer-navActions">
          <button
            type="button"
            className="SiteJsonViewer-navAction"
            onClick={() => {
              setTopOpen({ root: true, zones: true, pages: true })
              setForcedOpenPaths(new Set(["root", "zones", "pages"]))
            }}
          >
            Expand sections
          </button>
          <button
            type="button"
            className="SiteJsonViewer-navAction"
            onClick={() => {
              setTopOpen({ root: false, zones: false, pages: false })
              setForcedOpenPaths(new Set())
            }}
          >
            Collapse sections
          </button>
        </div>
      </aside>

      <div className="SiteJsonViewer-tree">
        <div className="SiteJsonNode-brace">{"{"}</div>
        {topEntries.map(({ key, value, meta }) => (
          <div
            key={key}
            id={`json-sec-${key}`}
            className={`SiteJsonSection SiteJsonSection--${meta.tone}`}
          >
            <JsonNodeControlled
              name={key}
              value={value}
              path={key}
              depth={0}
              defaultOpen={topOpen[key] !== false}
              tone={meta.tone}
              forcedOpenPaths={forcedOpenPaths}
            />
          </div>
        ))}
        <div className="SiteJsonNode-brace">{"}"}</div>
      </div>
    </div>
  )
}
