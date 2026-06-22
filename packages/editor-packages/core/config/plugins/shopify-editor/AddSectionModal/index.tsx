"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X, Search } from "lucide-react";
import { getClassNameFactory } from "@/core/lib";
import { rootDroppableId } from "@/core/lib/root-droppable-id";
import { useAppStore, useAppStoreApi } from "@/core/store";
import {
  assertSerializable,
  sectionCatalog,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type SectionPreset,
  type SectionCategory,
} from "../section-catalog";
import {
  DEFAULT_SECTION_NAME,
  createSectionStarterContent,
} from "../../../blocks/Section/starter-data";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("AddSectionModal", styles);

type Props = {
  open: boolean;
  onClose: () => void;
  /** Where to insert the new section in the root content array (defaults: end). */
  insertIndex?: number;
};

type TabFilter = "all" | SectionCategory;

function ensureSectionStarterPayload(
  payload: ReturnType<SectionPreset["build"]>
): ReturnType<SectionPreset["build"]> {
  if (payload.type !== "Section") return payload;

  const props = payload.props as Record<string, unknown>;
  const rawName = props.name;
  const rawContent = props.content;

  const hasName = typeof rawName === "string" && rawName.trim().length > 0;
  const hasContent = Array.isArray(rawContent) && rawContent.length > 0;

  if (hasName && hasContent) {
    return payload;
  }

  return {
    ...payload,
    props: {
      ...props,
      name: hasName ? rawName : DEFAULT_SECTION_NAME,
      content: hasContent ? rawContent : createSectionStarterContent(),
    },
  };
}

/**
 * Shopify-style Add Section modal.
 *
 * Persistence invariant: every insertion is a dispatch through the Puck
 * reducer (`insert`), so the result is in `data.content` and therefore in
 * `store_config.json`. No editor-only state is introduced.
 *
 * Performance: we use the atomic `insert` action (targeted walkAppState on
 * the insertion path) rather than `setData` (full-tree walk). We also move
 * selection to the newly inserted section to reduce the next click.
 */
export function AddSectionModal({ open, onClose, insertIndex }: Props) {
  // We read dispatch directly from the app store so we can round-trip
  // through the reducer (same mechanism users drag-drop uses). This is the
  // pattern the rest of the demo uses (see SettingsPanel, html-block-palette).
  const dispatch = useAppStore((s) => s.dispatch);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Guard against double-insertion from React StrictMode double-invoking the
  // setData updater, or from rapid double-clicks. A ref (not state) avoids
  // re-renders and ensures the lock is observable synchronously.
  const isInsertingRef = useRef(false);

  // Focus search on open; reset filters on close.
  useEffect(() => {
    if (open) {
      isInsertingRef.current = false;
      const id = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
    setSearch("");
    setTab("all");
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered: SectionPreset[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sectionCatalog.filter((p) => {
      if (tab !== "all" && p.category !== tab) return false;
      if (!q) return true;
      return (
        p.label.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    });
  }, [search, tab]);

  const visibleTabs: TabFilter[] = useMemo(() => {
    const present = new Set<SectionCategory>(
      sectionCatalog.map((p) => p.category)
    );
    return ["all", ...CATEGORY_ORDER.filter((c) => present.has(c))];
  }, []);

  const quickPicks = useMemo(() => {
    return ["hero-band", "two-column", "faq-accordion"]
      .map((id) => sectionCatalog.find((preset) => preset.id === id))
      .filter((preset) => !!preset) as SectionPreset[];
  }, []);

  const showQuickPicks = tab === "all" && search.trim() === "";

  // Read content length from the store, but only when we actually need it
  // (inside the click handler). `useAppStoreApi()` returns the underlying
  // Zustand store — calling `.getState()` on it is imperative and does NOT
  // subscribe this modal to state changes. Avoids re-renders every time
  // something changes elsewhere in the editor.
  const storeApi = useAppStoreApi();

  const handlePick = useCallback(
    (preset: SectionPreset) => {
      if (isInsertingRef.current) return; // swallow double-fire
      isInsertingRef.current = true;

      if (process.env.NODE_ENV !== "production") {
        assertSerializable(preset);
      }

      const payload = ensureSectionStarterPayload(preset.build());
      const currentLength = storeApi.getState().state.data.content?.length ?? 0;
      const idx =
        typeof insertIndex === "number"
          ? Math.min(Math.max(insertIndex, 0), currentLength)
          : currentLength;

      // Close first, then insert and move selection to the new row so the
      // merchant can edit immediately.
      onClose();

      dispatch({
        type: "insert",
        componentType: payload.type,
        destinationZone: rootDroppableId,
        destinationIndex: idx,
        // The props field is merged over Section.defaultProps inside
        // insertAction; nested slot content (e.g. the Bound block a
        // Commerce preset wraps) is populated with ids by populateIds.
        props: payload.props,
        recordHistory: true,
      });

      dispatch({
        type: "setUi",
        ui: { itemSelector: { index: idx, zone: rootDroppableId } },
      });
    },
    [dispatch, storeApi, insertIndex, onClose]
  );

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={getClassName("overlay")}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Add section"
    >
      <div className={getClassName("dialog")}>
        {/* Header */}
        <div className={getClassName("header")}>
          <div className={getClassName("titleGroup")}>
            <h2 className={getClassName("title")}>Add section</h2>
            <p className={getClassName("subtitle")}>
              Pick a pre-built section. You can customize every block afterward.
            </p>
          </div>
          <button
            type="button"
            className={getClassName("close")}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className={getClassName("toolbar")}>
          <div className={getClassName("searchWrap")}>
            <Search size={14} className={getClassName("searchIcon")} />
            <input
              ref={searchInputRef}
              type="text"
              className={getClassName("search")}
              placeholder="Search sections…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered.length > 0) {
                  e.preventDefault();
                  handlePick(filtered[0]!);
                }
              }}
              dir="ltr"
            />
          </div>

          <div className={getClassName("categoryTabs")}>
            {visibleTabs.map((t) => (
              <button
                key={t}
                type="button"
                className={`${getClassName("tab")} ${
                  tab === t ? getClassName("tab--active") : ""
                }`.trim()}
                onClick={() => setTab(t)}
              >
                {t === "all" ? "All" : CATEGORY_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {showQuickPicks && quickPicks.length > 0 && (
          <div className={getClassName("quickPicks")}>
            <span className={getClassName("quickPicksLabel")}>Quick start</span>
            <div className={getClassName("quickPicksList")}>
              {quickPicks.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={getClassName("quickPick")}
                  onClick={() => handlePick(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card grid */}
        <div className={getClassName("grid")}>
          {filtered.length === 0 ? (
            <div className={getClassName("empty")}>
              No sections match "{search}". Try a different search term.
              <div className={getClassName("emptyActions")}>
                <button
                  type="button"
                  className={getClassName("emptyActionBtn")}
                  onClick={() => {
                    setSearch("");
                    setTab("all");
                    searchInputRef.current?.focus();
                  }}
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            filtered.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={getClassName("card")}
                onClick={() => handlePick(preset)}
              >
                <div
                  className={getClassName("thumb")}
                  style={{ background: preset.gradient }}
                >
                  <div className={getClassName("thumbIcon")}>{preset.icon}</div>
                </div>
                <div className={getClassName("cardBody")}>
                  <span className={getClassName("cardLabel")}>
                    {preset.label}
                  </span>
                  <span className={getClassName("cardDesc")}>
                    {preset.description}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
