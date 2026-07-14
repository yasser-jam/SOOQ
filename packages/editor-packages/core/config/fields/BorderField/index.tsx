"use client";
import React, { useCallback } from "react";
import { useAppStore, useAppStoreApi } from "@/core/store";
import { getSelectorForId } from "@/core/lib/get-selector-for-id";
import { rootDroppableId } from "@/core/lib/root-droppable-id";
import { cn } from "@workspace/ui/lib/utils";
import {
  normalizeLayout,
  parsePx,
  toPx,
  SHADOW_PRESET_CSS,
  type LayoutFieldProps,
  type ShadowPresetKey,
} from "../../components/Layout/layout-shared";
import { ThemeColorPicker } from "../ThemeColorField";

/**
 * The «الحدود» tab: a visual border designer replacing the number/select rows
 * that used to live inside the Layout box field. Style options are drawn on
 * the buttons themselves, thickness and rounding use named levels, the color
 * uses the unified ThemeColorPicker, and a preview box reflects the result.
 *
 * The border values live inside the shared `layout` prop (borderWidth /
 * borderStyle / borderColor / borderRadius / shadow*), so this field is a
 * "portal": its own prop (`layoutBorder`) is never persisted — reads and
 * writes go straight to the sibling `layout` prop through the same
 * resolve-and-replace pipeline the regular fields panel uses.
 */

const useLayoutValue = (): Required<LayoutFieldProps> => {
  const layout = useAppStore(
    (s) => (s.selectedItem?.props as { layout?: LayoutFieldProps })?.layout
  );
  return normalizeLayout(layout);
};

const useLayoutPatch = () => {
  const appStore = useAppStoreApi();

  return useCallback(
    async (patch: Partial<LayoutFieldProps>) => {
      const { dispatch, selectedItem, resolveComponentData } =
        appStore.getState();
      if (!selectedItem) return;

      const currentLayout =
        ((selectedItem.props as { layout?: LayoutFieldProps }).layout ??
          {}) as LayoutFieldProps;
      const newProps = {
        ...selectedItem.props,
        layout: { ...currentLayout, ...patch },
      };

      const resolved = await resolveComponentData(
        { ...selectedItem, props: newProps },
        "replace"
      );

      const selector = getSelectorForId(
        appStore.getState().state,
        selectedItem.props.id
      );
      if (!selector) return;

      dispatch({
        type: "replace",
        destinationIndex: selector.index,
        destinationZone: selector.zone || rootDroppableId,
        data: resolved.node,
      });
    },
    [appStore]
  );
};

const STYLE_OPTIONS: Array<{
  value: LayoutFieldProps["borderStyle"];
  label: string;
}> = [
  { value: "none", label: "بدون" },
  { value: "solid", label: "متصل" },
  { value: "dashed", label: "متقطع" },
];

const WIDTH_OPTIONS = [
  { px: 1, label: "رفيع" },
  { px: 2, label: "متوسط" },
  { px: 4, label: "سميك" },
];

const RADIUS_OPTIONS = [
  { px: 0, label: "حادة" },
  { px: 10, label: "ناعمة" },
  { px: 24, label: "دائرية" },
];

const Seg = ({
  children,
  active,
  onClick,
  readOnly,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  readOnly?: boolean;
  title?: string;
}) => (
  <button
    type="button"
    disabled={readOnly}
    aria-pressed={active}
    onClick={onClick}
    title={title}
    className={cn(
      "flex-1 rounded-md px-1 py-1 text-[11px] font-bold text-muted-foreground transition-colors",
      "disabled:cursor-not-allowed disabled:opacity-60",
      active && "bg-white text-foreground shadow-sm"
    )}
  >
    {children}
  </button>
);

const SegRow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-1 rounded-lg bg-muted p-[3px]">{children}</div>
);

const FieldRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-2 border-b border-dashed border-border/70 pb-4 last:border-b-0 last:pb-0">
    <div className="text-xs font-bold text-foreground/80">{label}</div>
    {children}
  </div>
);

function BorderDesigner({ readOnly }: { readOnly?: boolean }) {
  const layout = useLayoutValue();
  const patch = useLayoutPatch();

  const width = parsePx(layout.borderWidth);
  const radius = parsePx(layout.borderRadius);
  const noBorder = layout.borderStyle === "none" || width === 0;

  const widthKnown = WIDTH_OPTIONS.some((o) => o.px === width);
  const radiusKnown = RADIUS_OPTIONS.some((o) => o.px === radius);

  const enableBorder = (style: LayoutFieldProps["borderStyle"]) => {
    patch({
      borderStyle: style,
      // Coming from "none"/0 width: give the border a visible width at once.
      ...(width === 0 ? { borderWidth: "1px" } : {}),
    });
  };

  const previewBorder = noBorder
    ? "1.5px dashed #e2e7f0"
    : `${Math.max(width, 1)}px ${layout.borderStyle} ${layout.borderColor}`;
  const previewShadow =
    layout.shadowMode === "preset"
      ? SHADOW_PRESET_CSS[layout.shadowPreset ?? "md"]
      : undefined;

  return (
    <div className="flex flex-col gap-4 pt-1" dir="rtl">
      <FieldRow label="نمط الحد">
        <div className="grid grid-cols-3 gap-1.5">
          {STYLE_OPTIONS.map((opt) => {
            const active =
              opt.value === "none" ? noBorder : !noBorder && layout.borderStyle === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={readOnly}
                aria-pressed={active}
                onClick={() =>
                  opt.value === "none"
                    ? patch({ borderStyle: "none" })
                    : enableBorder(opt.value)
                }
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border border-border bg-white px-1 pb-1 pt-2 transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  active && "border-primary ring-1 ring-primary"
                )}
              >
                <span
                  className="block h-0 w-4/5"
                  style={
                    opt.value === "none"
                      ? {
                          height: 3,
                          background:
                            "repeating-linear-gradient(90deg,#e2e7f0 0 4px, transparent 4px 8px)",
                        }
                      : {
                          borderTop: `3px ${opt.value} #55617a`,
                        }
                  }
                />
                <span
                  className={cn(
                    "text-[10px] font-bold text-muted-foreground",
                    active && "text-primary"
                  )}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </FieldRow>

      {!noBorder && (
        <>
          <FieldRow label="السماكة">
            <SegRow>
              {WIDTH_OPTIONS.map((opt) => (
                <Seg
                  key={opt.px}
                  active={width === opt.px}
                  readOnly={readOnly}
                  title={`${opt.px}px`}
                  onClick={() => patch({ borderWidth: toPx(opt.px) })}
                >
                  {opt.label}
                </Seg>
              ))}
              {!widthKnown ? (
                <Seg active readOnly={readOnly} onClick={() => {}}>
                  {width}px
                </Seg>
              ) : null}
            </SegRow>
          </FieldRow>

          <FieldRow label="لون الحد">
            <ThemeColorPicker
              value={layout.borderColor}
              onChange={(v) => patch({ borderColor: v })}
              readOnly={readOnly}
              context="border"
              valueMode="hex"
            />
          </FieldRow>
        </>
      )}

      <FieldRow label="استدارة الزوايا">
        <SegRow>
          {RADIUS_OPTIONS.map((opt) => (
            <Seg
              key={opt.px}
              active={radius === opt.px}
              readOnly={readOnly}
              title={`${opt.px}px`}
              onClick={() => patch({ borderRadius: toPx(opt.px) })}
            >
              {opt.label}
            </Seg>
          ))}
          {!radiusKnown ? (
            <Seg active readOnly={readOnly} onClick={() => {}}>
              {radius}px
            </Seg>
          ) : null}
        </SegRow>
      </FieldRow>

      <FieldRow label="الظل">
        <SegRow>
          <Seg
            active={layout.shadowMode === "none"}
            readOnly={readOnly}
            onClick={() => patch({ shadowMode: "none" })}
          >
            بدون
          </Seg>
          <Seg
            active={layout.shadowMode === "preset"}
            readOnly={readOnly}
            onClick={() => patch({ shadowMode: "preset" })}
          >
            من النسق
          </Seg>
          {layout.shadowMode === "custom" ? (
            <Seg active readOnly={readOnly} onClick={() => {}}>
              مخصص
            </Seg>
          ) : null}
        </SegRow>
        {layout.shadowMode === "preset" ? (
          <SegRow>
            {(["sm", "md", "lg", "xl"] as ShadowPresetKey[]).map((key) => (
              <Seg
                key={key}
                active={(layout.shadowPreset ?? "md") === key}
                readOnly={readOnly}
                onClick={() => patch({ shadowPreset: key })}
              >
                {key === "sm"
                  ? "صغير"
                  : key === "md"
                    ? "متوسط"
                    : key === "lg"
                      ? "كبير"
                      : "كبير جداً"}
              </Seg>
            ))}
          </SegRow>
        ) : null}
      </FieldRow>

      <FieldRow label="المعاينة">
        <div
          className="grid h-16 place-items-center bg-slate-50 text-[11px] font-bold text-muted-foreground transition-all"
          style={{
            border: previewBorder,
            borderRadius: radius,
            boxShadow: previewShadow,
          }}
        >
          هكذا سيبدو إطار العنصر
        </div>
      </FieldRow>
    </div>
  );
}

/**
 * The `layoutBorder` field withLayout registers for every block that shows
 * borders. Its prop value is never written — see the module docs above.
 */
export const borderDesignField = {
  type: "custom" as const,
  label: "الحدود والزوايا",
  metadata: { group: "border" },
  render: (props: any) => {
    const { readOnly, Label } = props;
    return (
      <Label label="الحدود والزوايا" readOnly={readOnly}>
        <BorderDesigner readOnly={readOnly} />
      </Label>
    );
  },
};
