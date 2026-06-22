"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Globe, FileText, Hash, Link as LinkIcon } from "lucide-react";
import { AutoField, FieldLabel, type CustomField } from "@/core";
import { getClassNameFactory } from "@/core/lib";
import {
  PAGES_UPDATED_EVENT,
  getAllPages,
} from "../../pages";
import styles from "./styles.module.css";
const getClassName = getClassNameFactory("LinkField", styles);

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * A single navigation target.
 *
 * The discriminated-union shape is chosen so the JSON is:
 *   - self-describing (AI agents can distinguish page vs. external vs. anchor)
 *   - serialisable (no functions, no symbols)
 *   - resolvable at render time without hitting the editor runtime
 *
 * Stored in `store_config.json` at `block.props.link`. No derived data (like
 * the final href string) is persisted — downstream renderers call
 * `resolveLinkHref` to derive it.
 */
export type LinkValue =
  | { kind: "none" }
  | { kind: "page"; pageId: string; newTab?: boolean }
  | { kind: "external"; url: string; newTab?: boolean }
  | { kind: "anchor"; hash: string };

export const EMPTY_LINK: LinkValue = { kind: "none" };

// ─── Resolution helpers (used by render functions) ──────────────────────────

/**
 * Turn a `LinkValue` into an `href` string the renderer can attach to `<a>`.
 * Returns `null` when there is no link (render sites should treat `null` as
 * "render plain text, no anchor").
 */
export function resolveLinkHref(link: LinkValue | undefined | null): string | null {
  if (!link) return null;
  switch (link.kind) {
    case "page":
      // pageId === the canonical path (`/`, `/cart`, `/products/:slug`).
      return link.pageId || null;
    case "external":
      return (link.url || "").trim() || null;
    case "anchor": {
      const h = (link.hash || "").trim();
      if (!h) return null;
      return h.startsWith("#") ? h : `#${h}`;
    }
    case "none":
    default:
      return null;
  }
}

/**
 * Target attribute. Only returned when the caller explicitly opted in via
 * `newTab: true` and the link has an actual destination.
 */
export function resolveLinkTarget(
  link: LinkValue | undefined | null
): "_blank" | undefined {
  if (!link) return undefined;
  if ((link.kind === "page" || link.kind === "external") && link.newTab) {
    return "_blank";
  }
  return undefined;
}

/** rel attribute that pairs with `target="_blank"` for security. */
export function resolveLinkRel(
  link: LinkValue | undefined | null
): string | undefined {
  return resolveLinkTarget(link) === "_blank"
    ? "noopener noreferrer"
    : undefined;
}

/**
 * Backward-compatibility bridge. Older blocks persisted `href: string`. New
 * blocks persist `link: LinkValue`. Render functions can pass both and the
 * helper picks whichever is non-empty, preferring the structured value.
 */
export function resolveHrefLegacy(
  link: LinkValue | undefined | null,
  legacyHref: string | undefined | null
): string | null {
  const fromLink = resolveLinkHref(link);
  if (fromLink) return fromLink;
  const trimmed = (legacyHref ?? "").trim();
  if (!trimmed || trimmed === "#") return null;
  return trimmed;
}

// ─── Custom field component ────────────────────────────────────────────────

type LinkFieldRenderProps = {
  name: string;
  value: LinkValue | undefined;
  onChange: (value: LinkValue) => void;
  readOnly?: boolean;
  field: { label?: string };
};

function LinkFieldRender({
  name: _name,
  value,
  onChange,
  readOnly,
  field,
}: LinkFieldRenderProps) {
  const current: LinkValue = value ?? EMPTY_LINK;

  const [pageOptions, setPageOptions] = useState(() =>
    getAllPages().map((p) => ({
      label: p.label + (p.dynamic ? "  •  dynamic" : ""),
      value: p.examplePath ?? p.path,
    }))
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const refreshPageOptions = () => {
      setPageOptions(
        getAllPages().map((p) => ({
          label: p.label + (p.dynamic ? "  •  dynamic" : ""),
          value: p.examplePath ?? p.path,
        }))
      );
    };

    refreshPageOptions();

    window.addEventListener(PAGES_UPDATED_EVENT, refreshPageOptions);
    window.addEventListener("storage", refreshPageOptions);

    return () => {
      window.removeEventListener(PAGES_UPDATED_EVENT, refreshPageOptions);
      window.removeEventListener("storage", refreshPageOptions);
    };
  }, []);

  const resolvedPageOptions = useMemo(() => {
    const currentPageId = current.kind === "page" ? current.pageId : "";

    if (current.kind !== "page") {
      return pageOptions;
    }

    const hasCurrent = pageOptions.some((o) => o.value === currentPageId);
    if (hasCurrent || !currentPageId) {
      return pageOptions;
    }

    return [
      {
        label: `${currentPageId}  •  missing`,
        value: currentPageId,
      },
      ...pageOptions,
    ];
  }, [current.kind, current, pageOptions]);

  const setKind = (kind: LinkValue["kind"]) => {
    if (kind === current.kind) return;
    switch (kind) {
      case "none":
        onChange({ kind: "none" });
        break;
      case "page":
        onChange({ kind: "page", pageId: pageOptions[0]?.value ?? "/" });
        break;
      case "external":
        onChange({ kind: "external", url: "" });
        break;
      case "anchor":
        onChange({ kind: "anchor", hash: "" });
        break;
    }
  };

  return (
    <FieldLabel label={field.label ?? "Link"} icon={<LinkIcon size={14} />}>
      <div className={getClassName()}>
        <div className={getClassName("kindTabs")}>
          <KindTab
            active={current.kind === "none"}
            onClick={() => setKind("none")}
            disabled={readOnly}
            label="None"
            icon={null}
          />
          <KindTab
            active={current.kind === "page"}
            onClick={() => setKind("page")}
            disabled={readOnly}
            label="Page"
            icon={<FileText size={13} />}
          />
          <KindTab
            active={current.kind === "external"}
            onClick={() => setKind("external")}
            disabled={readOnly}
            label="URL"
            icon={<Globe size={13} />}
          />
          <KindTab
            active={current.kind === "anchor"}
            onClick={() => setKind("anchor")}
            disabled={readOnly}
            label="Anchor"
            icon={<Hash size={13} />}
          />
        </div>

        {current.kind === "page" && (
          <div className={getClassName("row")}>
            <AutoField
              field={{
                type: "select",
                label: "Page",
                options: resolvedPageOptions,
              }}
              readOnly={readOnly}
              value={current.pageId}
              onChange={(pageId) =>
                onChange({ ...current, pageId: String(pageId) })
              }
            />
            <label className={getClassName("checkRow")}>
              <input
                type="checkbox"
                checked={!!current.newTab}
                disabled={readOnly}
                onChange={(e) =>
                  onChange({ ...current, newTab: e.target.checked })
                }
              />
              <span>Open in new tab</span>
            </label>
          </div>
        )}

        {current.kind === "external" && (
          <div className={getClassName("row")}>
            <AutoField
              field={{ type: "text", label: "URL" }}
              readOnly={readOnly}
              value={current.url}
              onChange={(url) =>
                onChange({ ...current, url: String(url ?? "") })
              }
            />
            <label className={getClassName("checkRow")}>
              <input
                type="checkbox"
                checked={!!current.newTab}
                disabled={readOnly}
                onChange={(e) =>
                  onChange({ ...current, newTab: e.target.checked })
                }
              />
              <span>Open in new tab</span>
            </label>
          </div>
        )}

        {current.kind === "anchor" && (
          <div className={getClassName("row")}>
            <AutoField
              field={{
                type: "text",
                label: "Anchor (without #)",
              }}
              readOnly={readOnly}
              value={current.hash.replace(/^#/, "")}
              onChange={(hash) =>
                onChange({ ...current, hash: String(hash ?? "") })
              }
            />
          </div>
        )}

        {current.kind === "none" && (
          <div className={getClassName("hint")}>
            No link — element renders as plain text.
          </div>
        )}
      </div>
    </FieldLabel>
  );
}

function KindTab({
  active,
  onClick,
  disabled,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${getClassName("kindTab")} ${
        active ? getClassName("kindTab--active") : ""
      }`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ─── Factory ────────────────────────────────────────────────────────────────

/**
 * Use this in block `fields` maps:
 *
 *   fields: {
 *     link: linkField({ label: "Primary link" }),
 *   }
 */
export function linkField(opts: { label?: string } = {}): CustomField<LinkValue> {
  return {
    type: "custom",
    label: opts.label ?? "Link",
    render: ({ name, value, onChange, readOnly }) => (
      <LinkFieldRender
        name={name}
        value={value as LinkValue | undefined}
        onChange={onChange}
        readOnly={readOnly}
        field={{ label: opts.label }}
      />
    ),
  } as CustomField<LinkValue>;
}
