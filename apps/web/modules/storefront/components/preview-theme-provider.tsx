"use client";

import { ReactNode, useLayoutEffect, useMemo } from "react";
import {
	DEFAULT_THEME,
	getGoogleFontsUrl,
	normalizeBreakpoints,
	type FullThemeProps,
} from "@/core/config/theme";

type PreviewThemeProviderProps = {
	rootProps?: Partial<FullThemeProps>;
	children: ReactNode;
};

/**
 * Loads the theme's Google Fonts and exposes the responsive breakpoint px
 * values on `:root` (the one thing `Section`'s `readMobileBreakpointPx()`
 * must read off `document.documentElement`).
 *
 * Everything else — colors, fonts, badge/scale/button-variant vars, and the
 * full-bleed background — is already applied correctly and safely by
 * `<Root>` itself (`packages/editor-packages/core/config/root.tsx`) as
 * `style={themeVars}` on its own wrapper div, which cascades to descendant
 * blocks via normal CSS inheritance and unmounts cleanly with React. This
 * component must NOT also write those to `:root`/`body`: that write is
 * global and outlives navigation (client-side routing doesn't reload
 * `document.head`), which previously bled the previewed theme's colors into
 * the admin dashboard after leaving a preview.
 */
export function PreviewThemeProvider({
	rootProps,
	children,
}: PreviewThemeProviderProps) {
	const bodyFont = (rootProps?.bodyFont ?? DEFAULT_THEME.bodyFont) as string;
	const fontOption1 = (rootProps?.fontOption1 ??
		DEFAULT_THEME.fontOption1) as string;
	const fontOption2 = (rootProps?.fontOption2 ??
		DEFAULT_THEME.fontOption2) as string;

	const googleFontsUrl = getGoogleFontsUrl([bodyFont, fontOption1, fontOption2]);

	const bp = useMemo(
		() =>
			normalizeBreakpoints({
				breakpointMobileMax: rootProps?.breakpointMobileMax,
				breakpointTabletMax: rootProps?.breakpointTabletMax,
			}),
		[rootProps?.breakpointMobileMax, rootProps?.breakpointTabletMax]
	);

	useLayoutEffect(() => {
		const doc = document;

		let styleEl = doc.getElementById("puck-theme-vars") as HTMLStyleElement | null;
		if (!styleEl) {
			styleEl = doc.createElement("style");
			styleEl.id = "puck-theme-vars";
			doc.head.appendChild(styleEl);
		}

		const nextCss = `
      :root {
        --theme-bp-mobile-max: ${bp.breakpointMobileMax}px;
        --theme-bp-tablet-max: ${bp.breakpointTabletMax}px;
      }
      html {
        scroll-behavior: smooth;
      }
    `;

		if (styleEl.textContent !== nextCss) {
			styleEl.textContent = nextCss;
		}

		let linkEl = doc.getElementById("puck-theme-fonts") as HTMLLinkElement | null;
		if (googleFontsUrl) {
			if (!linkEl) {
				const pre1 = doc.createElement("link");
				pre1.id = "puck-theme-fonts-preconnect-1";
				pre1.rel = "preconnect";
				pre1.href = "https://fonts.googleapis.com";
				doc.head.appendChild(pre1);

				const pre2 = doc.createElement("link");
				pre2.id = "puck-theme-fonts-preconnect-2";
				pre2.rel = "preconnect";
				pre2.href = "https://fonts.gstatic.com";
				pre2.crossOrigin = "anonymous";
				doc.head.appendChild(pre2);

				linkEl = doc.createElement("link");
				linkEl.id = "puck-theme-fonts";
				linkEl.rel = "stylesheet";
				doc.head.appendChild(linkEl);
			}
			if (linkEl.href !== googleFontsUrl) {
				linkEl.href = googleFontsUrl;
			}
		}
	}, [googleFontsUrl, bp.breakpointMobileMax, bp.breakpointTabletMax]);

	return <>{children}</>;
}
