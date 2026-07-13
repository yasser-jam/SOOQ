"use client";
import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Plus,
  GripVertical,
  LayoutTemplate,
  Search,
} from "lucide-react";
import type { ComponentData } from "@/core/types";
import { useAppStore, useAppStoreApi } from "@/core/store";
import { rootDroppableId } from "@/core/lib/root-droppable-id";
import { getClassNameFactory } from "@/core/lib";
import { getFrame } from "@/core/lib/get-frame";
import { ZoneStoreContext } from "@/core/components/DropZone/context";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ShopifyOutlinePanel", styles);

// ─── Row ────────────────────────────────────────────────────────────────────

/** Scroll the canvas so the section is visible — Shopify's outline does this. */
const scrollCanvasToComponent = (id: string) => {
  const frameDoc = getFrame();
  if (!frameDoc) return;
  const safeId =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(id)
      : id;
  frameDoc
    .querySelector(`[data-puck-component="${safeId}"]`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

type SectionRowProps = {
  index: number;
  id: string;
  label: string;
  hidden: boolean;
  selected: boolean;
  rowCount: number;
  onReorder: (from: number, to: number) => void;
};

const SectionRow = React.memo(function SectionRow({
  index,
  id,
  label,
  hidden,
  selected,
  rowCount,
  onReorder,
}: SectionRowProps) {
  const dispatch = useAppStore((s) => s.dispatch);
  const storeApi = useAppStoreApi();
  const zoneStore = useContext(ZoneStoreContext);
  const [dropSide, setDropSide] = useState<"before" | "after" | null>(null);

  const select = () => {
    dispatch({
      type: "setUi",
      ui: { itemSelector: { index, zone: rootDroppableId } },
    });
    scrollCanvasToComponent(id);
  };

  const selectAt = (nextIndex: number) => {
    dispatch({
      type: "setUi",
      ui: { itemSelector: { index: nextIndex, zone: rootDroppableId } },
    });
  };

  const performToggleHidden = () => {
    const snapshot = storeApi.getState().state.data.content?.[index];
    if (!snapshot) return;
    dispatch({
      type: "replace",
      destinationZone: rootDroppableId,
      destinationIndex: index,
      data: {
        ...snapshot,
        props: {
          ...snapshot.props,
          visible: !hidden ? false : true,
        },
      },
      recordHistory: true,
    });
  };

  const toggleHidden = (e: React.MouseEvent) => {
    e.stopPropagation();
    performToggleHidden();
  };

  const performDuplicate = () => {
    dispatch({
      type: "duplicate",
      sourceIndex: index,
      sourceZone: rootDroppableId,
      recordHistory: true,
    });
  };

  const duplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    performDuplicate();
  };

  const performRemove = () => {
    dispatch({
      type: "remove",
      index,
      zone: rootDroppableId,
      recordHistory: true,
    });
  };

  const remove = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Skip a confirm() dialog — the action records history, so Cmd/Ctrl+Z
    // undoes it instantly. Shopify mirrors this pattern for section rows.
    performRemove();
  };

  const rowClass = [
    getClassName("sectionRow"),
    selected ? getClassName("sectionRow--selected") : "",
    hidden ? getClassName("sectionRow--hidden") : "",
    dropSide ? getClassName(`sectionRow--drop-${dropSide}`) : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rowClass}
      onClick={select}
      role="button"
      tabIndex={0}
      aria-keyshortcuts="ArrowUp ArrowDown Delete Control+D Meta+D H"
      // Hovering an outline row lights up the block on the canvas — same
      // mechanism the built-in LayerTree uses (D-6).
      onMouseEnter={() => zoneStore.setState({ hoveringComponent: id })}
      onMouseLeave={() => zoneStore.setState({ hoveringComponent: null })}
      // Drag-reorder within the outline (D-6): native HTML5 drag on the row,
      // dispatched as a Puck `reorder` on drop.
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(index));
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const rect = e.currentTarget.getBoundingClientRect();
        setDropSide(
          e.clientY < rect.top + rect.height / 2 ? "before" : "after"
        );
      }}
      onDragLeave={() => setDropSide(null)}
      onDrop={(e) => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData("text/plain"));
        setDropSide(null);
        if (!Number.isInteger(from) || from === index) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const before = e.clientY < rect.top + rect.height / 2;
        let to = before ? index : index + 1;
        if (from < to) to -= 1;
        if (to === from) return;
        onReorder(from, to);
      }}
      onDragEnd={() => setDropSide(null)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
          return;
        }

        // Plain arrows move the SELECTION; Ctrl/Cmd+arrows are the global
        // "move block" shortcut (use-canvas-shortcuts) — let those through.
        if (e.key === "ArrowUp" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          selectAt(Math.max(0, index - 1));
          return;
        }

        if (e.key === "ArrowDown" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          selectAt(Math.min(rowCount - 1, index + 1));
          return;
        }

        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          performRemove();
          return;
        }

        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
          e.preventDefault();
          performDuplicate();
          return;
        }

        if (!e.metaKey && !e.ctrlKey && e.key.toLowerCase() === "h") {
          e.preventDefault();
          performToggleHidden();
        }
      }}
      data-section-id={id}
    >
      <span className={getClassName("sectionHandle")} aria-hidden>
        <GripVertical size={12} />
      </span>
      <span className={getClassName("sectionIndex")}>{index + 1}</span>
      <span className={getClassName("sectionIcon")} aria-hidden>
        <LayoutTemplate size={13} />
      </span>
      <span className={getClassName("sectionLabel")} title={label}>
        {label}
      </span>
      <div
        className={getClassName("sectionActions")}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={getClassName("actionBtn")}
          onClick={toggleHidden}
          title={hidden ? "إظهار القسم" : "إخفاء القسم"}
          aria-label={hidden ? "إظهار القسم" : "إخفاء القسم"}
        >
          {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        <button
          type="button"
          className={getClassName("actionBtn")}
          onClick={duplicate}
          title="تكرار القسم"
          aria-label="تكرار القسم"
        >
          <Copy size={13} />
        </button>
        <button
          type="button"
          className={`${getClassName("actionBtn")} ${getClassName(
            "actionBtn--danger"
          )}`}
          onClick={remove}
          title="حذف القسم"
          aria-label="حذف القسم"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
});

// ─── List ───────────────────────────────────────────────────────────────────

type Props = {
  onAddSection: (insertAfterIndex?: number) => void;
};

/**
 * Top-level sections list for the Template group.
 *
 * Subscribes ONLY to what it renders: the slim `{id, type, label, visible}`
 * tuple for each top-level section, plus the current selection. Any edit that
 * doesn't change these fields (typing in a field, dragging a nested block,
 * switching pages in another tab) will not re-render this list.
 */
export function TemplateSectionList({ onAddSection }: Props) {
  const storeApi = useAppStoreApi();
  const dispatch = useAppStore((s) => s.dispatch);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();
  const hasActiveSearch = normalizedSearch.length > 0;

  const onReorder = React.useCallback(
    (from: number, to: number) => {
      dispatch({
        type: "reorder",
        sourceIndex: from,
        destinationIndex: to,
        destinationZone: rootDroppableId,
        recordHistory: true,
      });
      dispatch({
        type: "setUi",
        ui: { itemSelector: { index: to, zone: rootDroppableId } },
      });
    },
    [dispatch]
  );

  const selectedIndex = useAppStore((s) => {
    const sel = s.state.ui.itemSelector;
    if (!sel) return -1;
    if (sel.zone && sel.zone !== rootDroppableId) return -1;
    return sel.index ?? -1;
  });

  type Row = { id: string; label: string; visible: boolean };

  // Subscribe to the raw content array by reference — Puck's reducer keeps the
  // same array reference when nothing changes, so this produces zero extra
  // renders when the user is editing deep inside a section.
  const content = useAppStore(
    (s) => s.state.data.content as ComponentData[] | undefined
  );
  // Config is static for the lifetime of this editor instance.
  const components = useMemo(
    () => storeApi.getState().config.components,
    [storeApi]
  );

  // Derive the rows *after* subscription, so each re-render creates a fresh
  // mapped array but we don't trigger Zustand's subscription loop (which would
  // happen if we returned a new array object from the selector itself).
  const rows: Row[] = useMemo(() => {
    return (content ?? []).map((item) => {
      const def = components?.[item.type];
      const props = item.props as
        | { id?: string; name?: string; visible?: boolean }
        | undefined;
      const idFromProps = props?.id ?? item.type;
      const visible = props?.visible !== false;
      // Prefer the merchant-supplied `name` (e.g. "Hero", "Testimonials")
      // over the generic component label ("Section"). This makes the outline
      // scannable even when the page has six Sections in a row.
      const customName = (props?.name ?? "").trim();
      const label =
        customName ||
        (def as { label?: string } | undefined)?.label ||
        item.type;
      return { id: idFromProps, label, visible };
    });
  }, [content, components]);

  const visibleRowsCount = useMemo(
    () => rows.reduce((count, row) => count + (row.visible ? 1 : 0), 0),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const indexedRows = rows.map((row, index) => ({ row, index }));
    if (!hasActiveSearch) return indexedRows;

    return indexedRows.filter(({ row }) => {
      return (
        row.label.toLowerCase().includes(normalizedSearch) ||
        row.id.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [rows, hasActiveSearch, normalizedSearch]);

  // Canvas → outline: when the selection changes (e.g. by clicking a block
  // on the canvas), keep the matching row visible in the panel.
  useEffect(() => {
    if (selectedIndex < 0) return;
    const id = rows[selectedIndex]?.id;
    if (!id) return;
    const safeId =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(id)
        : id;
    listRef.current
      ?.querySelector(`[data-section-id="${safeId}"]`)
      ?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  const list = useMemo(
    () =>
      filteredRows.map(({ row, index }) => (
        <React.Fragment key={`${row.id}-${index}`}>
          <SectionRow
            index={index}
            id={row.id}
            label={row.label}
            hidden={!row.visible}
            selected={index === selectedIndex}
            rowCount={rows.length}
            onReorder={onReorder}
          />
          {/* Inline "add section" gap between rows. Visible on list hover. */}
          {!hasActiveSearch && index < rows.length - 1 && (
            <button
              type="button"
              className={getClassName("inlineAdd")}
              onClick={() => onAddSection(index + 1)}
              title="إضافة قسم هنا"
              aria-label={`إضافة قسم بعد الموضع ${index + 1}`}
            >
              <Plus size={10} />
              إضافة هنا
            </button>
          )}
        </React.Fragment>
      )),
    [
      filteredRows,
      hasActiveSearch,
      rows.length,
      selectedIndex,
      onAddSection,
      onReorder,
    ]
  );

  return (
    <div className={getClassName("sectionsList")} ref={listRef}>
      <div className={getClassName("sectionsToolbar")}>
        <div className={getClassName("sectionsStats")}>
          <span className={getClassName("sectionsStat")}>
            {rows.length} قسم
          </span>
          <span className={getClassName("sectionsStat")}>
            {visibleRowsCount} ظاهر
          </span>
        </div>

        <label className={getClassName("sectionsSearch")}>
          <Search size={12} aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث عن قسم"
            aria-label="ابحث عن قسم في الصفحة"
          />
        </label>
      </div>

      {filteredRows.length > 0 ? (
        list
      ) : hasActiveSearch ? (
        <div className={getClassName("sectionsNoResults")}>
          <p className={getClassName("sectionsNoResultsTitle")}>
            لا توجد أقسام تطابق "{search.trim()}"
          </p>
          <button
            type="button"
            className={getClassName("sectionsNoResultsClear")}
            onClick={() => setSearch("")}
          >
            مسح البحث
          </button>
        </div>
      ) : null}
    </div>
  );
}
