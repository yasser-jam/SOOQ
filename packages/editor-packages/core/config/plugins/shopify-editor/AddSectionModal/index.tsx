"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search, ArrowLeft, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import { rootDroppableId } from "@/core/lib/root-droppable-id";
import { getItem } from "@/core/lib/data/get-item";
import { resolveAndReplaceData } from "@/core/lib/data/resolve-and-replace-data";
import { useAppStore, useAppStoreApi } from "@/core/store";
import { applyZonePreset } from "../../../lib/apply-zone-preset";
import { ROOT_ZONE_HEADER, ROOT_ZONE_FOOTER } from "../../../shell-zones";
import {
  assertSerializable,
  sectionCatalog,
  zoneSectionCatalog,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type SectionPreset,
  type CatalogEntry,
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

type Props = {
  open: boolean;
  onClose: () => void;
  insertIndex?: number;
};

const ALL_ENTRIES: CatalogEntry[] = [...sectionCatalog, ...zoneSectionCatalog];

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

// ─── Preset card ────────────────────────────────────────────────────────────

function PresetCard({
  entry,
  onPick,
}: {
  entry: CatalogEntry;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-start transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className="flex h-20 items-center justify-center border-b border-border/70"
        style={{ background: entry.gradient }}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-background/85 text-foreground/80 shadow-sm">
          {entry.icon}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground">
            {entry.label}
          </span>
          {entry.kind === "zone" && (
            <Badge variant="outline" className="h-4 shrink-0 px-1.5 text-[10px]">
              الموقع بالكامل
            </Badge>
          )}
        </div>
        <span className="line-clamp-2 text-xs text-muted-foreground">
          {entry.description}
        </span>
      </div>
    </button>
  );
}

function PresetGrid({
  entries,
  emptyHint,
  onPick,
}: {
  entries: CatalogEntry[];
  emptyHint: string;
  onPick: (entry: CatalogEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        {emptyHint}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {entries.map((entry) => (
        <PresetCard key={entry.id} entry={entry} onPick={() => onPick(entry)} />
      ))}
    </div>
  );
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
      <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isInserting}
          aria-label="رجوع لقائمة الأقسام"
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          <ArrowLeft size={14} />
          رجوع
        </button>
        <DialogTitle className="flex items-center gap-2 text-base">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            {preset.icon}
          </span>
          {preset.label}
        </DialogTitle>
        <DialogDescription className="sr-only">
          اختر مجموعة لربطها بهذا القسم
        </DialogDescription>
      </DialogHeader>

      <div className="relative border-b border-border px-5 py-3">
        <Search
          size={14}
          className="pointer-events-none absolute start-8 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isInserting}
          dir="auto"
          className="h-9 ps-8 text-sm"
        />
      </div>

      <div className="flex min-h-[200px] flex-1 flex-col gap-1.5 overflow-y-auto px-5 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            جاري تحميل المجموعات…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            لا توجد مجموعات تطابق &quot;{query}&quot;.
          </div>
        ) : (
          filtered.map((collection) => {
            const isSelected = selected?.id === collection.id;
            return (
              <button
                key={collection.id}
                type="button"
                disabled={isInserting}
                onClick={() =>
                  setSelected(
                    collectionExternalField.mapProp!(collection) as CollectionPickerRef
                  )
                }
                className={cn(
                  "flex w-full items-center justify-between rounded-md border border-border bg-background px-3.5 py-2.5 text-start text-sm transition hover:border-primary/40 hover:bg-muted disabled:pointer-events-none disabled:opacity-60",
                  isSelected && "border-primary bg-primary/5 ring-2 ring-primary/20"
                )}
              >
                <span className="font-medium text-foreground">
                  {collection.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {collection.productCount} منتج
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/40 px-5 py-3.5">
        {selected && (
          <span className="flex-1 truncate text-xs font-medium text-foreground">
            {selected.name}
            {selected.productCount != null && ` · ${selected.productCount} منتج`}
          </span>
        )}
        <button
          type="button"
          disabled={!selected || isInserting}
          onClick={() => selected && onInsert(selected)}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isInserting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              جاري التحميل…
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
  const storeApi = useAppStoreApi();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<SectionCategory>(CATEGORY_ORDER[0]!);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isInsertingRef = useRef(false);

  const [configuringPreset, setConfiguringPreset] =
    useState<SectionPreset | null>(null);
  const [isInserting, setIsInserting] = useState(false);

  useEffect(() => {
    if (open) {
      isInsertingRef.current = false;
      setConfiguringPreset(null);
      setIsInserting(false);
      const id = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
    setSearch("");
    setTab(CATEGORY_ORDER[0]!);
    setConfiguringPreset(null);
    setIsInserting(false);
  }, [open]);

  const searchResults: CatalogEntry[] | null = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return ALL_ENTRIES.filter(
      (entry) =>
        entry.label.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.id.toLowerCase().includes(q)
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<SectionCategory, CatalogEntry[]>();
    for (const category of CATEGORY_ORDER) map.set(category, []);
    for (const entry of ALL_ENTRIES) map.get(entry.category)?.push(entry);
    return map;
  }, []);

  const quickPicks = useMemo(() => {
    return ["hero-band", "two-column", "faq-accordion"]
      .map((id) => sectionCatalog.find((preset) => preset.id === id))
      .filter((preset): preset is SectionPreset => !!preset);
  }, []);

  const showQuickPicks = !configuringPreset && !searchResults;

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

  /** Handle a preset/zone card click from the catalog grid. */
  const handlePick = useCallback(
    (entry: CatalogEntry) => {
      if (isInsertingRef.current) return;

      if (entry.kind === "zone") {
        isInsertingRef.current = true;
        onClose();
        applyZonePreset(
          entry.zoneTarget === "header" ? ROOT_ZONE_HEADER : ROOT_ZONE_FOOTER,
          entry.preset,
          storeApi
        );
        isInsertingRef.current = false;
        return;
      }

      // Configurable preset → go to config step instead of inserting immediately
      if (entry.configFields && entry.configFields.length > 0) {
        setConfiguringPreset(entry);
        return;
      }

      isInsertingRef.current = true;

      if (process.env.NODE_ENV !== "production") {
        assertSerializable(entry);
      }

      void dispatchPayload(entry.build());
    },
    [dispatchPayload, onClose, storeApi]
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

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        if (isInserting) return;
        if (configuringPreset) {
          setConfiguringPreset(null);
          return;
        }
        onClose();
      }}
    >
      <DialogContent
        size="lg"
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[900px]"
      >
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
            <DialogHeader className="border-b border-border px-5 py-4">
              <DialogTitle>إضافة قسم</DialogTitle>
              <DialogDescription>
                اختر قسماً جاهزاً — يمكنك تخصيص كل عنصر فيه لاحقاً.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 px-5 pt-4">
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchResults && searchResults.length > 0) {
                      e.preventDefault();
                      handlePick(searchResults[0]!);
                    }
                  }}
                  placeholder="ابحث في الأقسام…"
                  dir="auto"
                  className="h-9 ps-8 text-sm"
                />
              </div>

              {showQuickPicks && quickPicks.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    البداية السريعة
                  </span>
                  {quickPicks.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePick(preset)}
                      className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-muted"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {searchResults ? (
                <PresetGrid
                  entries={searchResults}
                  emptyHint={`لا توجد أقسام تطابق "${search}". جرّب كلمة بحث أخرى.`}
                  onPick={handlePick}
                />
              ) : (
                <Tabs
                  value={tab}
                  onValueChange={(value) => setTab(value as SectionCategory)}
                >
                  <TabsList className="mb-4 w-full">
                    {CATEGORY_ORDER.map((category) => (
                      <TabsTrigger
                        key={category}
                        value={category}
                        className="flex-1"
                      >
                        {CATEGORY_LABELS[category]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {CATEGORY_ORDER.map((category) => (
                    <TabsContent key={category} value={category} className="mt-0">
                      <PresetGrid
                        entries={grouped.get(category) ?? []}
                        emptyHint="لا توجد قوالب في هذه الفئة بعد."
                        onPick={handlePick}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
