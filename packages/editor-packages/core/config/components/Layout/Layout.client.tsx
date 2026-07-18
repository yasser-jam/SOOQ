import { CSSProperties, forwardRef } from "react";
import { useAppStore } from "@/core/store";
import {
  getViewportBucket,
  normalizeBreakpoints,
  parseViewportWidthForBucket,
  type BreakpointThemeProps,
  type ViewportBucket,
} from "../../theme";
import {
  type FloatPresetKey,
  getFloatInsetStyleFromPreset,
  insetCssValue,
  normalizeLayout,
  resolveLayoutAppearanceStyles,
  resolvePaddingBottom,
  resolvePaddingTop,
  type LayoutProps,
} from "./layout-shared";

export const Layout = forwardRef<HTMLDivElement, LayoutProps>(
  (
    { children, className, layout, style, puckIsEditing = false },
    ref
  ) => {
    const pt = resolvePaddingTop(layout) ?? "0px";
    const pb = resolvePaddingBottom(layout) ?? "0px";
    const norm = normalizeLayout(layout);
    const isFloat = norm.positionMode === "float";
    const floatPlacementMode = norm.floatPlacementMode ?? "preset";
    const useFixedPos = norm.floatUseFixedPosition !== false;

    const viewportW = useAppStore((s) => s.state.ui.viewports.current.width);
    const rootBp = useAppStore(
      (s) => s.state.data.root.props as Partial<BreakpointThemeProps> | undefined
    );

    const bp = normalizeBreakpoints({
      breakpointMobileMax: rootBp?.breakpointMobileMax,
      breakpointTabletMax: rootBp?.breakpointTabletMax,
    });
    const widthPx = puckIsEditing
      ? parseViewportWidthForBucket(viewportW)
      : 0;
    const bucket = puckIsEditing
      ? getViewportBucket(widthPx, bp)
      : ("desktop" as ViewportBucket);

    // In the editor, match live behaviour: hide the block entirely when it
    // is flagged off for the current canvas viewport (no placeholder badge).
    const hiddenAtViewport =
      (bucket === "mobile" && norm.hideOnMobile) ||
      (bucket === "tablet" && norm.hideOnTablet) ||
      (bucket === "desktop" && norm.hideOnDesktop);

    const hideByViewportInEditor = puckIsEditing && hiddenAtViewport;

    const floatStyle: CSSProperties = !isFloat
      ? { position: "static" }
      : {
          position: (useFixedPos ? "fixed" : "absolute") as "fixed" | "absolute",
          zIndex: 10,
          ...(floatPlacementMode === "preset"
            ? getFloatInsetStyleFromPreset(
                (norm.floatPreset ?? "top-left") as FloatPresetKey
              )
            : {
                top: insetCssValue(norm.fixedTop),
                right: insetCssValue(norm.fixedRight),
                bottom: insetCssValue(norm.fixedBottom),
                left: insetCssValue(norm.fixedLeft),
              }),
        };

    const appearanceStyle = resolveLayoutAppearanceStyles(norm);

    const displayMode = norm.displayMode;

    return (
      <div
        className={className}
        style={{
          gridColumn: layout?.spanCol
            ? `span ${Math.max(Math.min(layout.spanCol, 12), 1)}`
            : undefined,
          gridRow: layout?.spanRow
            ? `span ${Math.max(Math.min(layout.spanRow, 12), 1)}`
            : undefined,
          minWidth: 0,
          marginTop: layout?.marginTop ?? "0px",
          marginRight: layout?.marginRight ?? "0px",
          marginBottom: layout?.marginBottom ?? "0px",
          marginLeft: layout?.marginLeft ?? "0px",
          paddingTop: pt,
          paddingRight: layout?.paddingRight ?? "0px",
          paddingBottom: pb,
          paddingLeft: layout?.paddingLeft ?? "0px",
          flex: layout?.grow ? "1 1 0" : undefined,
          ...floatStyle,
          ...appearanceStyle,
          ...style,
          display: hideByViewportInEditor
            ? "none"
            : (style?.display ?? displayMode),
        }}
        ref={ref}
        data-puck-hide-mobile={norm.hideOnMobile ? "true" : undefined}
        data-puck-hide-tablet={norm.hideOnTablet ? "true" : undefined}
        data-puck-hide-desktop={norm.hideOnDesktop ? "true" : undefined}
      >
        {children}
      </div>
    );
  }
);

Layout.displayName = "Layout";
