"use client";
import { ChangeEvent, useId } from "react";
import { getClassNameFactory } from "@/core/lib";
import styles from "./styles.module.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  type EdgeKey,
  FLOAT_PRESET_OPTIONS,
  type FloatPresetKey,
  type LayoutCustomField,
  type LayoutFieldProps,
  normalizeLayout,
  parsePx,
  parseShadowPx,
  PERCENT_INSET_OPTIONS,
  SHADOW_NUMBER_FIELDS,
  SHADOW_PRESET_CSS,
  type ShadowPresetKey,
  clampShadowPx,
  toPx,
} from "./layout-shared";
import { visibilityField } from "../../fields/VisibilityToggle";

const getClassName = getClassNameFactory("Layout", styles);

export function LayoutBoxField({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: LayoutCustomField;
  value: LayoutFieldProps;
  onChange: (value: LayoutFieldProps) => void;
  readOnly?: boolean;
}) {
  const floatGroupId = useId();
  const layout = normalizeLayout(value);

  const updateLayout = (partial: Partial<LayoutFieldProps>) => {
    onChange({ ...layout, ...partial });
  };

  const onEdgeNumberChange =
    (key: EdgeKey) => (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      if (raw === "") {
        updateLayout({ [key]: "0px" });
        return;
      }
      const n = parseInt(raw, 10);
      if (Number.isNaN(n)) return;
      updateLayout({ [key]: toPx(n) });
    };

  const edgeVal = (key: EdgeKey) => String(parsePx(layout[key]));

  const positionMode = layout.positionMode ?? "static";
  const floatPlacementMode = layout.floatPlacementMode ?? "preset";
  const floatPreset = layout.floatPreset ?? "top-left";
  const useFixedPos = layout.floatUseFixedPosition !== false;
  const showPosition = field.showPosition !== false;
  const floatPresetOptions =
    field.floatPresetFilter != null && field.floatPresetFilter.length > 0
      ? FLOAT_PRESET_OPTIONS.filter((o) => field.floatPresetFilter!.includes(o.value))
      : FLOAT_PRESET_OPTIONS;
  const floatViewportFixed = field.floatViewportFixed === true;
  const hideFloatCustom = field.hideFloatCustom === true || floatViewportFixed;

  return (
    <div className={getClassName("boxField")}>
      {field.showGrow && (
        <div className={getClassName("layoutControls")}>
          <label className={getClassName("controlItem")}>
            <span>Grow</span>
            <select
              value={layout.grow ? "true" : "false"}
              onChange={(event) =>
                updateLayout({ grow: event.target.value === "true" })
              }
              disabled={readOnly}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>
        </div>
      )}

      {field.showVisibility !== false &&
        visibilityField.render({
        field: visibilityField,
        name: "visibility",
        id: "visibility",
        value: {
          showOnMobile: !layout.hideOnMobile,
          showOnTablet: !layout.hideOnTablet,
          showOnDesktop: !layout.hideOnDesktop,
        },
        onChange: (vis: { showOnMobile: boolean; showOnTablet: boolean; showOnDesktop: boolean }) => {
          updateLayout({
            hideOnMobile: !vis.showOnMobile,
            hideOnTablet: !vis.showOnTablet,
            hideOnDesktop: !vis.showOnDesktop,
          });
        },
        readOnly,
      })}

      {showPosition && (
        <>
          <label className={getClassName("controlItem")}>
            <span>الموضع</span>
            <Select
              value={positionMode}
              onValueChange={(v) => {
                const next: Partial<LayoutFieldProps> = {
                  positionMode: v as "static" | "float",
                };
                if (v === "float" && floatViewportFixed) {
                  next.floatUseFixedPosition = true;
                  next.floatPlacementMode = "preset";
                }
                updateLayout(next);
              }}
              disabled={readOnly}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="اختر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="static">ثابت</SelectItem>
                <SelectItem value="float">عائم</SelectItem>
              </SelectContent>
            </Select>
          </label>

          {positionMode === "float" && (
            <div className={getClassName("floatPanel")}>
              {!floatViewportFixed && (
                <>
                  <label className={getClassName("floatSwitch")}>
                    <input
                      type="checkbox"
                      checked={useFixedPos}
                      onChange={(event) =>
                        updateLayout({ floatUseFixedPosition: event.target.checked })
                      }
                      disabled={readOnly}
                    />
                    <span>موضع ثابت (نافذة العرض)</span>
                  </label>
                  <p className={getClassName("floatHint")}>
                    عند الإيقاف يستخدم <code>position: absolute</code> (بالنسبة للعنصر الأب).
                  </p>
                </>
              )}

              {!hideFloatCustom && (
                <div
                  className={getClassName("floatModeRow")}
                  role="radiogroup"
                  aria-label="وضعية التعويم"
                >
                  <label className={getClassName("floatModeOption")}>
                    <input
                      type="radio"
                      name={`floatPlacementMode-${floatGroupId}`}
                      checked={floatPlacementMode === "preset"}
                      onChange={() =>
                        updateLayout({ floatPlacementMode: "preset" })
                      }
                      disabled={readOnly}
                    />
                    <span>موضع مسبق</span>
                  </label>
                  <label className={getClassName("floatModeOption")}>
                    <input
                      type="radio"
                      name={`floatPlacementMode-${floatGroupId}`}
                      checked={floatPlacementMode === "custom"}
                      onChange={() =>
                        updateLayout({ floatPlacementMode: "custom" })
                      }
                      disabled={readOnly}
                    />
                    <span>إزاحة مخصصة</span>
                  </label>
                </div>
              )}

              {(hideFloatCustom || floatPlacementMode === "preset") && (
                <label className={getClassName("controlItem")}>
                  <span>{floatViewportFixed ? "الزاوية" : "المرساة"}</span>
                  <Select
                    value={floatPreset}
                    onValueChange={(v) =>
                      updateLayout({
                        floatPreset: v as FloatPresetKey,
                        floatUseFixedPosition: floatViewportFixed ? true : layout.floatUseFixedPosition,
                        floatPlacementMode: "preset",
                      })
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      {floatPresetOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              )}

              {!hideFloatCustom && floatPlacementMode === "custom" && (
                <div className={getClassName("fixedGrid")}>
                  <span className={getClassName("fixedGridLabel")}>
                    الإزاحة (auto أو %)
                  </span>
                  <div className={getClassName("fixedGridInputs")}>
                    {(
                      [
                        ["fixedTop", "أعلى"],
                        ["fixedRight", "يمين"],
                        ["fixedBottom", "أسفل"],
                        ["fixedLeft", "يسار"],
                      ] as const
                    ).map(([key, label]) => {
                      const raw = layout[key];
                      const v = raw ?? "auto";
                      const known = PERCENT_INSET_OPTIONS.includes(v);
                      return (
                        <label key={key} className={getClassName("fixedCell")}>
                          <span>{label}</span>
                          <select
                            className={getClassName("insetSelect")}
                            value={known ? v : v}
                            onChange={(event) =>
                              updateLayout({ [key]: event.target.value })
                            }
                            disabled={readOnly}
                            aria-label={`الإزاحة ${label}`}
                          >
                            {!known && (
                              <option value={v}>
                                {v} (قديم)
                              </option>
                            )}
                            {PERCENT_INSET_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt === "auto" ? "تلقائي" : opt}
                              </option>
                            ))}
                          </select>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {(field.showBorder !== false || field.showShadow !== false) && (
      <div className={getClassName("appearanceSection")}>
        {field.showBorder !== false && (
          <>
            <div className={getClassName("appearanceTitle")}>الحدود</div>
            <div className={getClassName("appearanceRow")}>
              <label className={getClassName("controlItem")}>
                <span>العرض</span>
                <input
                  type="number"
                  min={0}
                  max={32}
                  className={getClassName("edgeInput")}
                  value={String(parsePx(layout.borderWidth))}
                  onChange={(event) => {
                    const raw = event.target.value;
                    if (raw === "") {
                      updateLayout({ borderWidth: "0px" });
                      return;
                    }
                    const n = parseInt(raw, 10);
                    if (Number.isNaN(n)) return;
                    updateLayout({ borderWidth: toPx(Math.min(32, n)) });
                  }}
                  disabled={readOnly}
                  aria-label="عرض الحدود"
                />
              </label>
              <label className={getClassName("controlItem")}>
                <span>النمط</span>
                <select
                  value={layout.borderStyle}
                  onChange={(event) =>
                    updateLayout({
                      borderStyle: event.target.value as LayoutFieldProps["borderStyle"],
                    })
                  }
                  disabled={readOnly}
                >
                  <option value="solid">متصل</option>
                  <option value="dashed">متقطع</option>
                  <option value="none">بدون</option>
                </select>
              </label>
            </div>
            <label className={getClassName("controlItem")}>
              <span>اللون</span>
              <div className={getClassName("colorRow")}>
                <input
                  type="color"
                  className={getClassName("colorPicker")}
                  value={
                    /^#[0-9A-Fa-f]{6}$/.test(layout.borderColor)
                      ? layout.borderColor
                      : "#cbd5e1"
                  }
                  onChange={(event) => updateLayout({ borderColor: event.target.value })}
                  disabled={readOnly}
                  aria-label="لون الحدود"
                />
                <input
                  type="text"
                  className={getClassName("textInput")}
                  value={layout.borderColor}
                  onChange={(event) => updateLayout({ borderColor: event.target.value })}
                  disabled={readOnly}
                  spellCheck={false}
                />
              </div>
            </label>
          </>
        )}

        {field.showShadow !== false && (
        <>
        <div className={getClassName("appearanceTitle")}>الظل</div>
        <label className={getClassName("controlItem")}>
          <span>النمط</span>
          <Select
            value={layout.shadowMode === "none" ? "none" : "preset"}
            onValueChange={(v) =>
              updateLayout({
                shadowMode: v as LayoutFieldProps["shadowMode"],
              })
            }
            disabled={readOnly}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="اختر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون</SelectItem>
              <SelectItem value="preset">من النسق</SelectItem>
            </SelectContent>
          </Select>
        </label>
        {layout.shadowMode === "preset" && (
          <label className={getClassName("controlItem")}>
            <span>الدرجة</span>
            <Select
              value={layout.shadowPreset}
              onValueChange={(v) =>
                updateLayout({
                  shadowPreset: v as ShadowPresetKey,
                })
              }
              disabled={readOnly}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="اختر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">صغير</SelectItem>
                <SelectItem value="md">متوسط</SelectItem>
                <SelectItem value="lg">كبير</SelectItem>
                <SelectItem value="xl">كبير جداً</SelectItem>
              </SelectContent>
            </Select>
          </label>
        )}
        {layout.shadowMode !== "none" && (
          <div className={getClassName("shadowPreviewWrap")}>
            <span className={getClassName("shadowPreviewLabel")}>معاينة</span>
            <div
              className={getClassName("shadowPreview")}
              style={{
                boxShadow:
                  layout.shadowMode === "preset"
                    ? SHADOW_PRESET_CSS[layout.shadowPreset ?? "md"]
                    : `${layout.shadowOffsetX} ${layout.shadowOffsetY} ${layout.shadowBlur} ${layout.shadowSpread} ${layout.shadowColor}`,
              }}
            />
          </div>
        )}
        </>
        )}
      </div>
      )}

      {/* الهوامش والحشوة — سيتم إعادة تصميمها لاحقاً */}
      {/* 
      <div className={getClassName("boxModelKey")} aria-hidden>
        <span className={getClassName("keyItemMargin")}>
          <span className={getClassName("keySwatchMargin")} />
          Margin
        </span>
        <span className={getClassName("keySep")}>·</span>
        <span className={getClassName("keyItemPadding")}>
          <span className={getClassName("keySwatchPadding")} />
          Padding
        </span>
        <span className={getClassName("keySep")}>·</span>
        <span className={getClassName("keyItemElement")}>
          <span className={getClassName("keySwatchElement")} />
          Element
        </span>
      </div>

      <div className={getClassName("marginFrame")}>
        <div className={getClassName("mt")}>
          <input
            type="number"
            min={0}
            max={999}
            className={getClassName("edgeInput")}
            value={edgeVal("marginTop")}
            onChange={onEdgeNumberChange("marginTop")}
            disabled={readOnly}
            aria-label="Margin top"
          />
        </div>

        <div className={getClassName("midRow")}>
          <div className={getClassName("ml")}>
            <input
              type="number"
              min={0}
              max={999}
              className={`${getClassName("edgeInput")} ${getClassName("mlInput")}`}
              value={edgeVal("marginLeft")}
              onChange={onEdgeNumberChange("marginLeft")}
              disabled={readOnly}
              aria-label="Margin left"
            />
          </div>

          <div className={getClassName("paddingFrame")}>
            <div className={getClassName("pt")}>
              <input
                type="number"
                min={0}
                max={999}
                className={getClassName("edgeInput")}
                value={edgeVal("paddingTop")}
                onChange={onEdgeNumberChange("paddingTop")}
                disabled={readOnly}
                aria-label="Padding top"
              />
            </div>
            <div className={getClassName("paddingMid")}>
              <div className={getClassName("pl")}>
                <input
                  type="number"
                  min={0}
                  max={999}
                  className={`${getClassName("edgeInput")} ${getClassName("plInput")}`}
                  value={edgeVal("paddingLeft")}
                  onChange={onEdgeNumberChange("paddingLeft")}
                  disabled={readOnly}
                  aria-label="Padding left"
                />
              </div>
              <div className={getClassName("elementCore")}>Element</div>
              <div className={getClassName("pr")}>
                <input
                  type="number"
                  min={0}
                  max={999}
                  className={`${getClassName("edgeInput")} ${getClassName("prInput")}`}
                  value={edgeVal("paddingRight")}
                  onChange={onEdgeNumberChange("paddingRight")}
                  disabled={readOnly}
                  aria-label="Padding right"
                />
              </div>
            </div>
            <div className={getClassName("pb")}>
              <input
                type="number"
                min={0}
                max={999}
                className={getClassName("edgeInput")}
                value={edgeVal("paddingBottom")}
                onChange={onEdgeNumberChange("paddingBottom")}
                disabled={readOnly}
                aria-label="Padding bottom"
              />
            </div>
          </div>

          <div className={getClassName("mr")}>
            <input
              type="number"
              min={0}
              max={999}
              className={`${getClassName("edgeInput")} ${getClassName("mrInput")}`}
              value={edgeVal("marginRight")}
              onChange={onEdgeNumberChange("marginRight")}
              disabled={readOnly}
              aria-label="Margin right"
            />
          </div>
        </div>

        <div className={getClassName("mb")}>
          <input
            type="number"
            min={0}
            max={999}
            className={getClassName("edgeInput")}
            value={edgeVal("marginBottom")}
            onChange={onEdgeNumberChange("marginBottom")}
            disabled={readOnly}
            aria-label="Margin bottom"
          />
        </div>
      </div>
      */}
    </div>
  );
}
