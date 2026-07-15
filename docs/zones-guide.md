# Zones Guide

Zones are persistent UI regions that live outside the page content tree. They provide the site shell — header, footer, mobile navigation drawer, popup, and bottom sheet — each stored independently in `SiteData.zones` and rendered around every page.

---

## Zone Types

| Zone | Key | Block type | Mobile only? | Description |
|---|---|---|---|---|
| Header | `zone-header` | `Section` | No | Fixed top region; uses preset Sections |
| Footer | `zone-footer` | `Section` | No | Fixed bottom region; uses preset Sections |
| Drawer | `zone-drawer` | `ZoneDrawer` | Yes | Side panel, slides in from left/right |
| Popup | `zone-popup` | `ZonePopup` | No | Centered modal dialog |
| Bottom Sheet | `zone-bottom-sheet` | `ZoneBottomSheet` | Yes | Panel that rises from the bottom |

**Header and footer** are *preset zones*: their zone root contains one or more `Section` blocks exactly like the page content area. You pick a preset from the Zones panel and then freely edit the content inside it.

**Drawer, popup, and bottom sheet** are *overlay zones*: each root contains exactly one shell block (`ZoneDrawer`, `ZonePopup`, or `ZoneBottomSheet`). The shell block wraps a `slot` DropZone where you place content blocks.

---

## Drag Isolation

Zone content and page content are fully isolated — blocks cannot cross the zone boundary via drag-and-drop. This is enforced at the DropZone level:

- The `zone-header` and `zone-footer` root DropZones use `allow: ["Section"]`, so only Section blocks can be dropped in.
- The `default-zone` (page content) root also uses `allow: ["Section"]`.
- Every Section's inner `content` slot uses `disallow: ["Section", ...ZONE_BLOCK_TYPES]` — no nested Sections and no zone shell blocks can enter the content area.
- Zone shell sections have `drag: false` permission so they cannot be picked up and moved out of their zone.

The result: you can add new Sections to the header/footer zones (the palette will show them), and you can freely edit content inside those Sections, but the zone's root Section stays locked in place. A page Section cannot be dragged into the header, and the header Section cannot be dragged into the page.

---

## Adding Content to Zones

### Header / Footer

1. Open the **Zones** panel in the editor sidebar.
2. Click **Header** or **Footer** to preview it.
3. Select a preset to apply a starter layout.
4. Click any block inside the header/footer on the canvas to select and edit it — the Properties panel on the right shows its fields.
5. Drag blocks from the palette into the header/footer Section's content slot to add new content.
6. Multiple Sections can exist inside a zone root — each acts as a separate horizontal band.

### Drawer / Bottom Sheet

1. Open the **Zones** panel and click **Drawer** or **Bottom Sheet**.
2. Select a preset to add the shell block with starter content.
3. Click blocks inside the shell's `slot` to edit them.
4. Add new content blocks by dragging from the palette into the slot.

---

## Zone Events

Zone overlays (drawer, popup, bottom-sheet) are controlled by a custom DOM event system.

```ts
// packages/editor-packages/core/config/lib/zone-events.ts
dispatchZoneEvent(zoneKey: string, action: "open" | "close" | "toggle"): void
toggleZone(zoneKey: string): void  // shorthand for toggle
```

Event: `sooq:zone` with `{ detail: { key, action } }` — handled by the ZoneDrawer / ZonePopup / ZoneBottomSheet render in `apps/store`.

HTML attribute `data-sooq-zone-toggle="<zoneKey>"` on any element also triggers a toggle when clicked.

---

## Wiring a Burger Menu Button

The `ContentButton` block supports zone events natively:

1. Add a `ContentButton` inside your header Section.
2. In the Properties panel → **المحتوى** tab:
   - Set **الوجهة** to `منطقة` (zone).
   - Set **مفتاح المنطقة** to `site-drawer`.
   - Set **إجراء المنطقة** to `تبديل` (toggle).
3. Optionally set the label to `☰` for a visual burger icon.

When clicked on the storefront, the button dispatches `dispatchZoneEvent("site-drawer", "toggle")`, which opens or closes the `ZoneDrawer` with `key="site-drawer"`.

---

## Mobile-Only Zones

`ZoneDrawer` and `ZoneBottomSheet` have an `is_mobile_only` prop (default `true`). When true, the block renders with `display: none` at desktop widths in the storefront via a CSS media query.

In the **editor**, these zones are always visible when selected in the Zones panel (the shell block forces itself visible for editing via `useZoneEditorPreview`). Switching the editor canvas to mobile width (via the viewport picker) shows the correct live behavior.

---

## Responsive Header Pattern

The **"رأس متجاوب — قائمة جوال"** preset (`logo-right-burger-left`) implements a responsive header without any custom block:

```
Section
└── RowGroup (space-between, align: center)
    ├── ContentHeading  — brand name (always visible)
    ├── Group (nav links) — layout.hideOnMobile: true  → hidden on mobile
    └── Group (cart icon + burger button)
            └── CartIconButton
            └── ContentButton  — layout.hideOnDesktop: true → hidden on desktop
                    destinationType: "zone"
                    zoneKey: "site-drawer"
                    zoneAction: "toggle"
```

- On **desktop**: brand + nav links + cart icon
- On **mobile**: brand + cart icon + burger button (☰)

The `layout.hideOnMobile` / `layout.hideOnDesktop` props on any block render `data-puck-hide-mobile` / `data-puck-hide-desktop` attributes, which the theme's global CSS applies `display: none` at the appropriate breakpoint.

### Recommended setup

1. Apply the **"رأس متجاوب"** header preset.
2. Apply the **"درج جوال — تجاري"** drawer preset (uses `key: "site-drawer"`).
3. The burger button in the header will toggle the drawer automatically on mobile.

---

## Preset System

Zone presets live in `packages/editor-packages/core/config/presets/`:

| File | Zone |
|---|---|
| `header-layouts.ts` | Header layouts + builder |
| `footer.ts` | Footer presets |
| `drawer.ts` | Drawer presets |
| `bottom-sheet.ts` | Bottom-sheet presets |
| `zone-shell.ts` | Shared factory helpers (`createHeaderBrandTitle`, `createBurgerButton`, etc.) |
| `shell-defaults.ts` | Default nav links and footer columns |
| `types.ts` | `ZonePreset`, `HeaderPresetLayout` types |

### Adding a new header preset

1. Add a `HeaderLayoutId` value to `HeaderPresetLayout` in `types.ts`.
2. Add a `HeaderLayoutOption` entry to `HEADER_LAYOUT_OPTIONS` in `header-layouts.ts`.
3. Add a `case` to the `switch` in `buildHeaderZoneSection`.

### Adding a new drawer preset

Add a `ZonePreset` entry to `ZONE_DRAWER_PRESETS` in `drawer.ts`. Use factory helpers from `zone-shell.ts` and `shared.ts`. The `componentData.props.key` must match the `zoneKey` used in the button that toggles it.

---

## Zone Registry

`packages/editor-packages/core/config/lib/zone-registry.ts` exports `ZONE_DEFINITIONS` — the source of truth for every zone's id, key, block type, Zones panel title/icon, and preset category. The Zones plugin reads this array to render the panel and `applyZonePreset` uses it to place presets into the correct DropZone.

---

## SiteData Storage

Zone content is stored in `SiteData.zones`:

```ts
type SiteData = {
  root: RootData;
  zones: Record<SiteZoneKey, ComponentData[]>;
  pages: SitePage[];
};
```

Each zone key (`"zone-header"`, `"zone-footer"`, `"zone-drawer"`, …) maps to an array of top-level block nodes. Persistence is currently localStorage (`puck-demo:<storeSlug>:site`). Backend sync is a known gap.
