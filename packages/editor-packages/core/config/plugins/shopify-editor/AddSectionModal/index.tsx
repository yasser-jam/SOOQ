"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X, Search, ArrowLeft, Loader2 } from "lucide-react";
import { getClassNameFactory } from "@/core/lib";
import { rootDroppableId } from "@/core/lib/root-droppable-id";
import { getItem } from "@/core/lib/data/get-item";
import { resolveAndReplaceData } from "@/core/lib/data/resolve-and-replace-data";
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
import {
  collectionExternalField,
  type CollectionPickerRef,
} from "@/modules/product/collection/data-store";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("AddSectionModal", styles);

type Props = {
  open: boolean;
  onClose: () => void;
  insertIndex?: number;
};

type TabFilter = "all" | SectionCategory;

// ─── Collection picker state ──────────────────────────────────────────────────

type CollectionRow = {
  id: string;
  name: string;
  productCount: number;
};

function ensureSectionStarterPayload(
  payload: ReturnType<SectionPreset["build"]>
): ReturnType<SectionPreset["build"]> {
  if (payload.type !== "Section") return payload;

  const props = payload.props as Record<string, unknown>;
  const rawName = props.name;
  const rawContent = props.content;

  const hasName = typeof rawName === "string" && rawName.trim().length > 0;
  const hasContent = Array.isArray(rawContent);

  if (hasName && hasContent) return payload;

  return {
    ...payload,
    props: {
      ...props,
      name: hasName ? rawName : DEFAULT_SECTION_NAME,
      content: hasContent ? rawContent : createSectionStarterContent(),
    },
  };
}

// ─── Collection Picker Step ───────────────────────────────────────────────────

type CollectionPickerStepProps = {
  preset: SectionPreset;
  onBack: () => void;
  onInsert: (collection: CollectionPickerRef) => void;
  isInserting: boolean;
};

function CollectionPickerStep({
  preset,
  onBack,
  onInsert,
  isInserting,
}: CollectionPickerStepProps) {
  const [query, setQuery] = useState("");
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<CollectionPickerRef | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch collection list once on mount
  useEffect(() => {
    setIsLoading(true);
    collectionExternalField
      .fetchList({ query: "", filters: {} })
      .then((rows) => {
        setCollections(rows as CollectionRow[]);
      })
      .catch(() => setCollections([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [collections, query]);

  const configField = preset.configFields?.[0];
  const placeholder = configField?.placeholder ?? "ابحث عن مجموعة…";

  return (
    <>
      {/* Step header */}
      <div className={getClassName("configHeader")}>
        <button
          type="button"
          className={getClassName("backBtn")}
          onClick={onBack}
          disabled={isInserting}
          aria-label="Back to sections"
        >
          <ArrowLeft size={16} />
          <span>رجوع</span>
        </button>
        <div className={getClassName("configPresetLabel")}>
          <span className={getClassName("configPresetIcon")}>{preset.icon}</span>
          {preset.label}
        </div>
      </div>

      {/* Collection search */}
      <div className={getClassName("configSearchWrap")}>
        <Search size={14} className={getClassName("searchIcon")} />
        <input
          ref={searchRef}
          type="text"
          className={getClassName("search")}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isInserting}
          dir="auto"
        />
      </div>

      {/* Collection list */}
      <div className={getClassName("configList")}>
        {isLoading ? (
          <div className={getClassName("configLoading")}>
            <Loader2 size={18} className={getClassName("spin")} />
            <span>جاري تحميل المجموعات…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={getClassName("configEmpty")}>
            لا توجد مجموعات تطابق "{query}".
          </div>
        ) : (
          filtered.map((collection) => {
            const isSelected = selected?.id === collection.id;
            return (
              <button
                key={collection.id}
                type="button"
                className={`${getClassName("collectionRow")} ${
                  isSelected ? getClassName("collectionRow--selected") : ""
                }`}
                onClick={() =>
                  setSelected(
                    collectionExternalField.mapProp!(collection) as CollectionPickerRef
                  )
                }
                disabled={isInserting}
              >
                <span className={getClassName("collectionName")}>
                  {collection.name}
                </span>
                <span className={getClassName("collectionCount")}>
                  {collection.productCount} منتج
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className={getClassName("configFooter")}>
        {selected && (
          <span className={getClassName("configSelectedLabel")}>
            {selected.name}
            {selected.productCount != null && ` · ${selected.productCount} منتج`}
          </span>
        )}
        <button
          type="button"
          className={getClassName("insertBtn")}
          disabled={!selected || isInserting}
          onClick={() => selected && onInsert(selected)}
        >
          {isInserting ? (
            <>
              <Loader2 size={14} className={getClassName("spin")} />
              <span>جاري التحميل…</span>
            </>
          ) : (
            "إضافة القسم"
          )}
        </button>
      </div>
    </>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function AddSectionModal({ open, onClose, insertIndex }: Props) {
  const dispatch = useAppStore((s) => s.dispatch);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isInsertingRef = useRef(false);

  // Config step state
  const [configuringPreset, setConfiguringPreset] =
    useState<SectionPreset | null>(null);
  const [isInserting, setIsInserting] = useState(false);

  const storeApi = useAppStoreApi();

  // Reset on close
  useEffect(() => {
    if (open) {
      isInsertingRef.current = false;
      setConfiguringPreset(null);
      setIsInserting(false);
      const id = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
    setSearch("");
    setTab("all");
    setConfiguringPreset(null);
    setIsInserting(false);
  }, [open]);

  // Close on Escape (only when not in insert config step)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (configuringPreset) {
          setConfiguringPreset(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, configuringPreset]);

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

  /** Dispatch a fully-built payload immediately. */
  const dispatchPayload = useCallback(
    async (payload: ReturnType<SectionPreset["build"]>) => {
      const normalized = ensureSectionStarterPayload(payload);
      const currentLength =
        storeApi.getState().state.data.content?.length ?? 0;
      const idx =
        typeof insertIndex === "number"
          ? Math.min(Math.max(insertIndex, 0), currentLength)
          : currentLength;

      onClose();

      dispatch({
        type: "insert",
        componentType: normalized.type,
        destinationZone: rootDroppableId,
        destinationIndex: idx,
        props: normalized.props,
        recordHistory: true,
      });

      dispatch({
        type: "setUi",
        ui: { itemSelector: { index: idx, zone: rootDroppableId } },
      });

      const itemData = getItem(
        { index: idx, zone: rootDroppableId },
        storeApi.getState().state
      );
      if (itemData) {
        await resolveAndReplaceData(itemData, storeApi.getState, "insert");
      }
    },
    [dispatch, storeApi, insertIndex, onClose]
  );

  /** Handle a regular (non-configurable) preset click. */
  const handlePick = useCallback(
    (preset: SectionPreset) => {
      if (isInsertingRef.current) return;

      // Configurable preset → go to config step instead of inserting immediately
      if (preset.configFields && preset.configFields.length > 0) {
        setConfiguringPreset(preset);
        return;
      }

      isInsertingRef.current = true;

      if (process.env.NODE_ENV !== "production") {
        assertSerializable(preset);
      }

      void dispatchPayload(preset.build());
    },
    [dispatchPayload]
  );

  /**
   * Called when the user has selected a collection in the config step.
   * Inserts the section shell; Section.resolveData loads product cards.
   */
  const handleCollectionInsert = useCallback(
    (preset: SectionPreset, collection: CollectionPickerRef) => {
      if (isInsertingRef.current) return;
      isInsertingRef.current = true;
      setIsInserting(true);

      void (async () => {
        try {
          const payload = preset.build({
            collection,
            collectionName: collection.name,
          });
          await dispatchPayload(payload);
        } finally {
          setIsInserting(false);
          setConfiguringPreset(null);
        }
      })();
    },
    [dispatchPayload]
  );

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={getClassName("overlay")}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isInserting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Add section"
    >
      <div className={getClassName("dialog")}>
        {/* ── Config step ───────────────────────────────────────────────── */}
        {configuringPreset ? (
          <CollectionPickerStep
            preset={configuringPreset}
            onBack={() => setConfiguringPreset(null)}
            onInsert={(collection) =>
              handleCollectionInsert(configuringPreset, collection)
            }
            isInserting={isInserting}
          />
        ) : (
          <>
            {/* ── Catalog step ────────────────────────────────────────── */}
            {/* Header */}
            <div className={getClassName("header")}>
              <div className={getClassName("titleGroup")}>
                <h2 className={getClassName("title")}>إضافة قسم</h2>
                <p className={getClassName("subtitle")}>
                  اختر قسماً جاهزاً — يمكنك تخصيص كل عنصر فيه لاحقاً.
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
                  placeholder="ابحث في الأقسام…"
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
                    {t === "all" ? "الكل" : CATEGORY_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {showQuickPicks && quickPicks.length > 0 && (
              <div className={getClassName("quickPicks")}>
                <span className={getClassName("quickPicksLabel")}>
                  Quick start
                </span>
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
                  لا توجد أقسام تطابق "{search}". جرّب كلمة بحث أخرى.
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
                      مسح عوامل التصفية
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
                      <div className={getClassName("thumbIcon")}>
                        {preset.icon}
                      </div>
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
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
