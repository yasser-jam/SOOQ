# AI Action Map — the closed set of moves an LLM may request

**Status:** design doc, step 1 of 3 (map → rule set → implementer).
**Goal:** give a small model a *finite, closed* vocabulary of editor moves. It never writes
code, never invents a prop name. It emits `{action, target, value}` triples; a deterministic
implementer resolves each triple to a Puck dispatch.

Everything below is extracted from the live editor code, not invented. File references are
`packages/editor-packages/core/...` unless stated otherwise.

---

## 0. The whole editor collapses to 5 primitives

This is the load-bearing insight. There are ~63 blocks and ~500 distinct fields, but every
mutation in the editor goes through exactly one of five dispatches
([reducer/actions.tsx](../packages/editor-packages/core/reducer/actions.tsx)):

| # | Primitive | Puck dispatch | Touches | Implementer entry point |
|---|---|---|---|---|
| P1 | **Set a block prop** | `replace` | one block's `props[key]` | `useBlockPatch()` — [property-plugins/hooks.ts:44](../packages/editor-packages/core/config/property-plugins/hooks.ts#L44) |
| P2 | **Set a layout sub-prop** | `replace` | one block's `props.layout[key]` | `useLayoutPatch()` — [hooks.ts:89](../packages/editor-packages/core/config/property-plugins/hooks.ts#L89) |
| P3 | **Set a theme/root prop** | `replaceRoot` | `data.root.props[key]` | pattern at [SettingsPanel/index.tsx:59](../packages/editor-packages/core/config/plugins/settings/SettingsPanel/index.tsx#L59) |
| P4 | **Restructure** | `move` / `reorder` / `duplicate` / `remove` / `insert` | the tree | raw `dispatch()` |
| P5 | **Select** | `setUi` | `ui.itemSelector` | `dispatch({type:"setUi", ui:{itemSelector}})` |

P1 and P2 are the same dispatch — P2 just merges into the nested `layout` object first. Both
must go through `resolveComponentData(…, "replace")` before dispatching, or `resolveData`
migrations and bound-data hooks are skipped.

**So the AI's job is never "how to change it" — only *which primitive, which key, which value*.**

---

## 1. Addressing: "where to apply"

### Block identity
Every block carries `props.id`, generated as `` `${type}-${uuidv4()}` ``
([lib/generate-id.ts](../packages/editor-packages/core/lib/generate-id.ts)). The id is
self-describing — `ContentButton-a3f2…` tells you the block type without a tree lookup. That
means **the AI can be handed just an id and still know what fields are legal.**

`getSelectorForId(state, id)` → `{zone, index}`
([lib/get-selector-for-id.ts](../packages/editor-packages/core/lib/get-selector-for-id.ts)),
where `zone` is the compound `` `${parentId}:${zoneName}` ``. The implementer never needs the
AI to supply a zone or index for P1/P2 — it derives them from the id.

### Target vocabulary for the AI (3 values only)
| Target | Meaning |
|---|---|
| `selected` | the currently selected block (`ui.itemSelector` → `selectedItem`) |
| `<block-id>` | an explicit id the host injected into the prompt |
| `theme` | the site root (P3) |

The user's stated flow — *"I select a button and say change this color to red"* — is the
`selected` case, which is the one to build first.

### Site scoping (implementer concern, not the AI's)
A change lands in a `SitePage.content` inside `SiteData`
([config/lib/site-data.ts](../packages/editor-packages/core/config/lib/site-data.ts):
`SiteData = { root, zones, pages[] }`). Theme (P3) is on `SiteData.root` and is **global —
every page, every zone**. Shell zones (`zone-header`, `zone-footer`, `zone-drawer`,
`zone-popup`, `zone-bottom-sheet` — [config/shell-zones.ts](../packages/editor-packages/core/config/shell-zones.ts))
are also site-wide. Blocks in a page's `default-zone` are page-scoped. The AI should not
reason about this; the implementer just dispatches and `applyPuckSave` routes it.

---

## 2. Layer A — Theme moves (P3, global)

All of these are flat keys on `data.root.props`, typed as `FullThemeProps`
([config/theme.ts:866](../packages/editor-packages/core/config/theme.ts#L866)). Every one is
independently settable — exactly the "change theme props one by one" the map needs.

### A1. Colors — 8 keys, value = hex
`primary` `surface` `success` `warning` `error` `dark` `text` `neutral`
Defaults at [theme.ts:330](../packages/editor-packages/core/config/theme.ts#L330).
Each becomes `--theme-color-<key>`. **10 further tokens are derived automatically**
(`background`, `border`, `muted`, `text-muted`, `primaryMuted`, `primaryHover`, `focusRing`, …
via `computeDerivedColorThemeVars`) — the AI must **never** target those; they are computed.

### A2. Fonts — 3 slots, value = a font key from a fixed registry
`bodyFont` `fontOption1` `fontOption2`
Legal values: the 18 `value`s in `FONT_OPTIONS` — `system`, `cairo`, `tajawal`, `almarai`,
`ibm-plex-sans-arabic`, `noto-sans-arabic`, `readex-pro`, `rubik`, `changa`, `el-messiri`,
`amiri`, `noto-naskh-arabic`, `scheherazade-new`, `inter`, `roboto`, `open-sans`, `dm-sans`,
`space-grotesk`. Arabic-capable subset = `ARABIC_FONT_OPTIONS` (first 13).

### A3. Radius scale — 6 steps, value = CSS length
`radiusNone` `radiusSm` `radiusMd` `radiusLg` `radiusXl` `radiusFull`
(`0`, `8px`, `12px`, `18px`, `24px`, `9999px`)

### A4. Text size scale — 6 steps
`textSizeXs` `textSizeSm` `textSizeMd` `textSizeLg` `textSizeXl` `textSize2xl`

### A5. Font weight scale — 6 steps
`fontWeightLight` `fontWeightNormal` `fontWeightMedium` `fontWeightSemibold` `fontWeightBold`
`fontWeightBolder` (values are weight strings, e.g. `"600"`)

### A6. Line height scale — 3 steps
`lineHeightTight` `lineHeightNormal` `lineHeightRelaxed`

### A7. Button size scale — 3 sizes × 4 dimensions = 12 keys
`button{Sm,Md,Lg}{Height,PaddingX,PaddingY,FontSize}`

### A8. Button variants — 3 variants × 4 aspects = 12 keys
`buttonVariant{Primary,Secondary,Error}{Bg,Fg,Radius,Size}`
Defaults at [theme.ts:830](../packages/editor-packages/core/config/theme.ts#L830).

### A9. Spacing scale — 2 axes × 3 levels = 6 keys
`spacing{Vertical,Side}{Narrow,Medium,Wide}` — the px behind ضيقة/متوسطة/واسعة in Section.

### A10. Badge — 2 keys, enum
`badgeShape`: `pill` | `rounded` | `square` · `badgeStyle`: `solid` | `outline` | `soft`

### A11. Shell variants — 2 keys, enum
`headerVariant` / `footerVariant`: `default` | `commerce`

### A12. Breakpoints — 2 keys, integer px
`breakpointMobileMax` (default 767) · `breakpointTabletMax` (default 1023)
Clamped by `normalizeBreakpoints` (mobile 320–2000, tablet forced > mobile).

### A13. Locale — 3 keys, enum
`direction`: `rtl` | `ltr` · `language`: `ar` | `en` · `currency`: `SYP` | `USD` | `EUR`

> **Theme total: 68 independently settable keys.** All flat, all on one object, all P3.

---

## 3. Layer B — Layout moves (P2, universal across 47 blocks)

`layout` is a single nested object every layout-aware block carries
([config/components/Layout/layout-shared.ts](../packages/editor-packages/core/config/components/Layout/layout-shared.ts)).
It is injected by `withLayout()` (45 blocks) or `layoutPlugin()` (Button, ContentImage).
**This is the highest-leverage layer: one action definition works on almost every block.**

| Group | Keys | Value format |
|---|---|---|
| Padding | `paddingTop` `paddingRight` `paddingBottom` `paddingLeft` | px string, clamped 0–999 by `toPx()` |
| Margin | `marginTop` `marginRight` `marginBottom` `marginLeft` | px string, clamped 0–999 |
| Border | `borderWidth` `borderStyle` `borderColor` `borderRadius` | px string / `solid`\|`dashed`\|`none` / hex / px string |
| Shadow | `shadowMode` `shadowPreset` `shadowOffsetX` `shadowOffsetY` `shadowBlur` `shadowSpread` `shadowColor` | `none`\|`preset`\|`custom` / `sm`\|`md`\|`lg`\|`xl` / px (offsets & spread allow negative) / CSS color |
| Grid span | `spanCol` `spanRow` | integer; max 12 under a `Grid` parent, max 6 under `Section`, **not applicable elsewhere** |
| Flex | `grow` | boolean; **only meaningful under a `Flex` parent** |
| Display | `displayMode` | `block` \| `flex` \| `grid` |
| Position | `positionMode` | `static` \| `float` |
| Float mode | `floatCssPosition` | `absolute` \| `fixed` \| `sticky` |
| Float anchor | `floatPlacementMode` + `floatPreset` | `preset`\|`custom` + one of 8: `top-left` `top-middle` `top-right` `middle-left` `middle-right` `bottom-left` `bottom-middle` `bottom-right` |
| Float insets | `fixedTop` `fixedRight` `fixedBottom` `fixedLeft` | `auto` or `0%`–`100%` in 5% steps (`PERCENT_INSET_OPTIONS`) |
| Responsive | `hideOnMobile` `hideOnTablet` `hideOnDesktop` | boolean, resolved against theme breakpoints |

**33 keys.** Defaults in `defaultLayoutValue` ([layout-shared.ts:102](../packages/editor-packages/core/config/components/Layout/layout-shared.ts#L102)).

Three traps the implementer must handle (the AI must not):
- `floatUseFixedPosition` is **deprecated**; `normalizeLayout` keeps it in sync with
  `floatCssPosition`. Never emit it.
- `padding` (unsided) is **deprecated**; write the four sided keys.
- Setting `borderStyle: "none"` zeroes the border regardless of `borderWidth`, but
  `borderRadius` still applies.

**Availability caveat:** the `layout` field's UI hides controls per parent
(`resolveLayoutFieldForParent`), and `Button`/`ContentImage` get no border tab at all. But the
props are still read by the renderer — writing `layout.borderRadius` on a Button *will* take
visual effect even though no panel exposes it. Decide deliberately whether the AI is allowed
to exceed the UI's surface. **Recommendation: allow it** — it's the AI's main advantage over
clicking, and the value is still schema-valid.

---

## 4. Layer C — Block content moves (P1, per block type)

63 registered blocks ([config/index.tsx:193-265](../packages/editor-packages/core/config/index.tsx#L193)).
Handing a small model 63 schemas is a losing game. The fix:

> **The AI emits a *semantic slot*, not a prop name. The implementer owns the
> `(slot, blockType) → propName` table.**

The same user intent maps to different prop names per block — this is exactly the mapping the
model should not have to memorise:

| Semantic slot | Prop name varies by block |
|---|---|
| main text | `text` (ContentHeading, ContentParagraph, Text, Heading) · `label` (ContentButton, Button) · `title` (ContentLink, Card, AppBar, SiteHeader) · `heading` (Accordion) · `message` (Blank) |
| text color | `color` (ContentHeading/Paragraph/Text/ContentLink) · `textColor` (ContentButton, Chip, Accordion, CategoryTree, SiteHeader/Footer, SiteDrawerShell) · `foregroundColor` (AppBar) · `colorMode`+`colorFixed` (ContentIcon, ContentDivider, Heading) |
| background color | `bgColor` (ContentButton, Chip) · `backgroundColor` (Accordion, AppBar, Group, RowGroup, Section, SiteHeader/Footer, Zone*) |
| corner radius | `radius` (ContentButton, ContentImage, ImageGallery, ProductImageCarousel, Chip, VideoEmbed) · `borderRadius` (Group, RowGroup, ProductImage, Zone*) · **or** `layout.borderRadius` (universal) |
| size | `buttonSize` (ContentButton) · `fontSize` (text blocks) · `size` (ContentIcon, Space, VideoEmbed, Heading) · `iconSize` (CartIconButton) |
| gap | `gap` (Flex, Grid, Group, RowGroup, ButtonGroup, CategoryTree, CartList, CartSection, ImageGallery, Wishlist) · `gridGap` (Section) |
| alignment | `align` / `textAlign` (via `alignField`: `right`\|`center`\|`left`) · `justifyContent` / `alignItems` (flex containers) |
| visibility | `visible` (Section, SiteHeader/Footer, SideDrawer) · `is_active` (Zone*) · `enabled` (SiteDrawerShell) · **or** `layout.hideOn*` (universal) |

**Recommendation: ship v1 with a 12-slot semantic vocabulary**, resolved by a table covering
the ~12 blocks a merchant actually points at (ContentButton, ContentHeading, ContentParagraph,
Text, ContentImage, ContentLink, ContentIcon, Section, Group, RowGroup, Flex, Grid). That
covers the stated use case ("select a button, make it red and bigger") with a table small
enough to hand-verify. Extend block-by-block afterwards.

### Value formats the implementer must produce (the "no invention" contract)
These are non-obvious and are where a naive model would guess wrong:

- **`colorField`** (bgColor/textColor/color/backgroundColor on most blocks) — accepts a plain
  hex (`#ef4444`) **or** the legacy token `theme-<colorKey>`. Defaults ship as `theme-primary`
  / `theme-surface`; the first edit persists plain hex
  ([content/color-fields.tsx:54](../packages/editor-packages/core/config/content/color-fields.tsx#L54)).
  → AI emits a colour *name*; implementer maps name → hex.
- **`themeFixedSelectField`** (radius, fontSize, fontWeight, lineHeight, buttonSize, gap) —
  either `theme-<step>` **or a bare number string with no unit**. `resolveRadius("8")` → `8px`.
  Emitting `"8px"` here is a bug (it renders `8pxpx`).
- **`buttonSize` fixed form** — pipe-joined 4-tuple `height|padX|padY|fontSize` (unitless), or
  `theme-sm|md|lg`.
- **Bilingual fields** (`bilingualTextField`) — value is `{ar: string, en: string}`, not a
  string. Used for every user-visible label. A plain string is tolerated on read but should
  not be written.
- **`contentColorFields` triplet** (Heading, ContentIcon, ContentDivider) — setting a colour
  requires **two** props: `colorMode: "fixed"` **and** `colorFixed: "#ef4444"`. A single-prop
  write silently does nothing if mode is still `theme`. → the implementer must expand one
  semantic action into two props; the AI still emits one action.

---

## 5. Layer D — Structural moves (P4)

| Move | Dispatch | Args |
|---|---|---|
| Reorder within zone | `reorder` | `sourceIndex`, `destinationIndex`, `destinationZone` |
| Move across zones | `move` | `sourceIndex`, `sourceZone`, `destinationIndex`, `destinationZone` |
| Duplicate | `duplicate` | `sourceIndex`, `sourceZone` |
| Delete | `remove` | `index`, `zone` |
| Insert | `insert` | `componentType`, `destinationZone`, `destinationIndex`, optional `props` |

For the AI, expose only the relative forms — `move_up`, `move_down`, `duplicate`, `delete` —
targeting `selected`. The implementer computes indices from `getSelectorForId`. Absolute
zone/index addressing is an invitation to hallucinate.

`insert` is the one structural move that lets the AI name a block type. Gate it against the
registry keys and note that zone blocks (`SiteHeader`, `SiteFooter`, `SiteDrawerShell`,
`ZoneDrawer`, `ZonePopup`, `ZoneBottomSheet`) carry
`ZONE_BLOCK_PERMISSIONS = {insert:false, duplicate:false, drag:false, delete:false}` — the AI
must never emit structural moves for those types.

---

## 6. Proposed AI-facing vocabulary (the closed list)

Roughly 40 verbs. Every one maps to exactly one primitive.

**Theme (P3)** — `set_theme_color(key, color)` · `set_theme_font(slot, font)` ·
`set_theme_radius(step, size)` · `set_theme_text_size(step, size)` ·
`set_theme_font_weight(step, weight)` · `set_theme_line_height(step, value)` ·
`set_theme_button_size(size, dimension, value)` · `set_theme_button_variant(variant, aspect, value)` ·
`set_theme_spacing(axis, level, value)` · `set_theme_badge(aspect, value)` ·
`set_theme_shell(slot, variant)` · `set_theme_breakpoint(which, px)` · `set_locale(aspect, value)` ·
`reset_theme`

**Layout (P2)** — `set_padding(side, value)` · `set_margin(side, value)` ·
`set_border_radius(value)` · `set_border(aspect, value)` · `set_shadow(preset)` ·
`set_span(axis, n)` · `set_grow(bool)` · `set_display(mode)` · `set_position(mode)` ·
`set_float_anchor(preset)` · `set_float_mode(css_position)` · `set_inset(side, value)` ·
`set_device_visibility(device, bool)`

**Block (P1)** — `set_text(value)` · `set_text_color(color)` · `set_background_color(color)` ·
`set_font_size(value)` · `set_font_weight(value)` · `set_line_height(value)` ·
`set_font_family(slot)` · `set_align(value)` · `set_size(value)` · `set_variant(value)` ·
`set_gap(value)` · `set_columns(n)` · `set_link(url)` · `set_icon(name)` ·
`set_image(url)` · `toggle_visible(bool)`

**Structure (P4/P5)** — `move_up` · `move_down` · `duplicate` · `delete` · `insert(type)` ·
`select(id)`

Every verb takes `target` ∈ {`selected`, `<id>`, `theme`}. Sides are
`top|right|bottom|left|all|x|y`. Sizes are a 6-step enum (`none|sm|md|lg|xl|full` for radius,
`xs|sm|md|lg|xl|2xl` for text) **or** an integer — never a raw CSS string. Colors are
enumerated names, resolved to hex by the implementer.

---

## 7. Open decisions before writing the rule set

1. **"Make it bigger" is genuinely ambiguous** — font size? button size? padding? width? Pick
   one resolution per block type in the slot table (recommend: text blocks → `fontSize`,
   buttons → `buttonSize`, containers → `layout.padding`) and make it deterministic rather
   than asking the model to disambiguate.
2. **Radius has two homes** — the block's own `radius` prop and `layout.borderRadius`. Both
   render. Recommend: prefer the block prop when the block has one (it participates in the
   theme scale), fall back to `layout.borderRadius`. One rule, applied by the implementer.
3. **Relative values** ("a bit bigger", "darker") require reading current state. The
   implementer already has it via `selectedItem.props` — decide whether the AI may emit
   `increase`/`decrease` deltas or must always emit absolutes. Deltas are friendlier and
   equally safe since the implementer clamps.
4. **The 2-action cap.** Taking "the first 2" is fine as a v1 guard, but prefer rejecting the
   whole response when it exceeds the cap over silently truncating — a truncated
   `colorMode`+`colorFixed` pair produces a no-op that looks like a bug.
5. **Undo.** `recordHistory: true` is what makes Ctrl+Z work. Every AI-applied batch should be
   one history entry so a user can revert the whole instruction, not half of it.

---

## 8. Scale summary

| Layer | Primitive | Settable keys | Blocks affected |
|---|---|---|---|
| Theme | P3 | 68 | all (global) |
| Layout | P2 | 33 | 47 |
| Block content | P1 | ~500 raw → **12 semantic slots** | 63 |
| Structure | P4/P5 | 6 | all |

The AI sees ~40 verbs. The implementer owns three lookup tables (colour names → hex, semantic
slot → prop per block, size enum → value). Nothing else is required.
