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
import { getFrame } from "@/core/lib/get-frame";
import { ZoneStoreContext } from "@/core/components/DropZone/context";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
} from "@workspace/ui/components/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group";
import { cn } from "@workspace/ui/lib/utils";

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
    performRemove();
  };

  return (
    <div
      className={cn(
        "group/row flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted/60",
        selected && "bg-primary/10 ring-2 ring-inset ring-primary/20",
        hidden && "[&_[data-slot=section-label]]:opacity-50 [&_[data-slot=section-label]]:line-through",
        dropSide === "before" && "shadow-[inset_0_2px_0_0] shadow-primary",
        dropSide === "after" && "shadow-[inset_0_-2px_0_0] shadow-primary"
      )}
      onClick={select}
      role="button"
      tabIndex={0}
      aria-keyshortcuts="ArrowUp ArrowDown Delete Control+D Meta+D H"
      onMouseEnter={() => zoneStore.setState({ hoveringComponent: id })}
      onMouseLeave={() => zoneStore.setState({ hoveringComponent: null })}
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
      <span className="shrink-0 cursor-grab text-muted-foreground/60" aria-hidden>
        <GripVertical size={12} />
      </span>
      <span className="shrink-0 text-[11px] text-muted-foreground">
        {index + 1}
      </span>
      <span className="flex shrink-0 items-center text-muted-foreground" aria-hidden>
        <LayoutTemplate size={13} />
      </span>
      <span
        data-slot="section-label"
        className="min-w-0 flex-1 truncate font-medium text-foreground"
        title={label}
      >
        {label}
      </span>
      <div
        className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={toggleHidden}
          title={hidden ? "إظهار القسم" : "إخفاء القسم"}
          aria-label={hidden ? "إظهار القسم" : "إخفاء القسم"}
        >
          {hidden ? <EyeOff /> : <Eye />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={duplicate}
          title="تكرار القسم"
          aria-label="تكرار القسم"
        >
          <Copy />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 hover:bg-destructive/10 hover:text-destructive"
          onClick={remove}
          title="حذف القسم"
          aria-label="حذف القسم"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
});

type Props = {
  onAddSection: (insertAfterIndex?: number) => void;
};

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

  const content = useAppStore(
    (s) => s.state.data.content as ComponentData[] | undefined
  );
  const components = useMemo(
    () => storeApi.getState().config.components,
    [storeApi]
  );

  const rows: Row[] = useMemo(() => {
    return (content ?? []).map((item) => {
      const def = components?.[item.type];
      const props = item.props as
        | { id?: string; name?: string; visible?: boolean }
        | undefined;
      const idFromProps = props?.id ?? item.type;
      const visible = props?.visible !== false;
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
          {!hasActiveSearch && index < rows.length - 1 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-5 w-full opacity-0 transition-opacity group-hover/sections:opacity-70 hover:!opacity-100"
              onClick={() => onAddSection(index + 1)}
              title="إضافة قسم هنا"
              aria-label={`إضافة قسم بعد الموضع ${index + 1}`}
            >
              <Plus data-icon="inline-start" />
              إضافة هنا
            </Button>
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
    <div className="group/sections flex flex-col" ref={listRef}>
      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-background/95 px-1 py-2 backdrop-blur-sm">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary-tonal" className="text-[10px]">
            {rows.length} قسم
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {visibleRowsCount} ظاهر
          </Badge>
        </div>

        <InputGroup className="h-8">
          <InputGroupAddon align="inline-start">
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث عن قسم"
            aria-label="ابحث عن قسم في الصفحة"
          />
        </InputGroup>
      </div>

      {filteredRows.length > 0 ? (
        <div className="flex flex-col py-1">{list}</div>
      ) : hasActiveSearch ? (
        <Card className="mx-1 mt-2 border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
            <CardDescription className="text-xs">
              لا توجد أقسام تطابق "{search.trim()}"
            </CardDescription>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSearch("")}
            >
              مسح البحث
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
