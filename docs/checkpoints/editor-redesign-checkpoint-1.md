# Editor Redesign — Checkpoint 1 (properties panel + palette)

**Status: ready for your testing (rev 2)** · 2026-07-14 · branch `editor-improvement`

> **Rev 2 — feedback fixes (verified live in the editor):**
> 1. **لون الخلفية now works.** Root cause: the Radix Popover portal misplaced
>    its content at the viewport corner, and its 264px panel was wider than the
>    ~220px sidebar. The picker now expands **inline** inside the field (like
>    the approved mockup) — opened, picked أساسي, value applied, undone. ✓
> 2. **لون النص is a normal color picker** (native picker + hex input, no theme
>    panel) — `PlainColorInput` in `ThemeColorField/`, used by the shared
>    اللون field. Old `theme-<key>` values display as their current theme hex;
>    edits persist plain hex (verified: heading turned red on canvas, undone). ✓
> 3. **Gaps between inputs**: border designer rows now have 16px spacing with
>    dashed separators; spacing segments tightened for the narrow panel. ✓

Implements the approved design (rev 2 of the mockup): six function tabs, the
unified theme-color field, named spacing levels from the theme scale, the
visual border designer in its own tab, the columns slider, the live overlay
demo, and colored avatars in the blocks palette. The plugins sidebar
(الأقسام/المناطق/الصفحات/الإعدادات) is untouched, as agreed.

**No data migration.** Every stored format is unchanged: paddings stay px
strings, colors stay hex / `theme-<key>` refs, the overlay stays `rgba(...)`.
Old saved pages load and edit exactly as before — only the controls changed.

---

## 1. Six function tabs (was: المحتوى/التصميم/متقدم buttons)

`components/Puck/components/Fields/{field-groups.ts,index.tsx,styles.module.css}`

- Tabs: **المحتوى / التخطيط / الخلفية / الخط / الحدود / متقدم** — icon over a
  small label, each with a fixed accent color, active tab gets a colored
  underline. Tabs with no fields for the selected block hide automatically.
- A tinted strip under the tab bar carries the active tab's color + name.
- Classification is name-based with `metadata.group` override per field
  (legacy `group: "style"` still accepted → maps to الخلفية).

## 2. Unified color field — `config/fields/ThemeColorField/`

Used for **لون الخلفية** (Section), **لون الحد** (border designer), and the
shared **اللون** field used by 15 content blocks (`content/color-fields.tsx`
now renders through it).

- Closed: chip + color name + value. Open (shadcn Popover): the 8 theme
  colors *by name with their live values from your theme*, plus أبيض/شفاف
  where relevant, a custom picker + hex input, and a **live preview strip**
  (text-over-background / colored text / colored frame depending on context).
- Two value modes keep storage untouched: raw hex (`Section.backgroundColor`)
  and `theme-<key>` refs (content blocks).

## 3. Named spacing levels — `config/fields/SpacingField/`

Replaces the px dropdowns for Section's المسافة من الأعلى/الأسفل/الجانبين
and فجوة الشبكة:

- Segmented control: **بدون / ضيقة / متوسطة / واسعة / مخصص**, with the px
  value shown as a small hint (e.g. «متوسطة · 48px»).
- The level→px map is the new **سلّم المسافات** in theme settings
  (`SpacingScaleProps` in `config/theme.ts`, editable under
  الإعدادات ← المظهر ← سلّم المسافات; included in "reset to defaults").
- A stored value that matches no level shows as مخصص with the classic px
  select — nothing saved becomes uneditable. Section defaults land on-scale
  (80px = واسعة, 24px = متوسطة) — spec-covered.

## 4. Border designer in its own tab — `config/fields/BorderField/`

- نمط الحد drawn on the buttons (بدون/متصل/متقطع), السماكة and استدارة
  الزوايا as named levels, لون الحد via the unified color field, الظل
  (بدون/من النسق + درجة), and a live preview box.
- **New:** `layout.borderRadius` prop (default `0px`) — rounding now applies
  to any block with layout, in editor and storefront.
- Under the hood it edits the existing `layout.*` border/shadow keys through
  a portal field (`layoutBorder`, never persisted itself); the old border/
  shadow rows inside the Layout box field are hidden everywhere.
  `hideLayoutBorder` blocks (button, accordion, …) get no border tab.

## 5. Columns + overlay — `config/fields/{ColumnsField,OverlayField}/`

- **أعمدة المحتوى**: slider 1–6 with a live mini-grid preview; the mobile
  columns field is gone from the panel (stored value still renders; returns
  with the mobile builder).
- **التغطية فوق الصورة**: live demo (uses the section's actual background
  image when set), three base chips (داكن/الأساسي/فاتح) + intensity slider
  in % — writes the same `rgba()` string.

## 6. Blocks palette avatars — `components/Drawer/block-icons.tsx`

Every palette row gets an icon in a colored tile by category — sky=تخطيط,
violet=عناصر, teal=المتجر, amber=العميل — the same families as the tab
colors, so both sidebars share one visual language.

---

## How to test

1. `pnpm --filter web dev` → editor at
   `/store/sooq-store/design-studio/theme-1/edit`.
2. Select a **قسم** → check the six tabs, switch through them, confirm each
   field landed in the right tab (paddings+width+columns in التخطيط; bg
   color/image/overlay in الخلفية; لون النص in الخط; the designer in الحدود;
   المعرف/الرؤية in متقدم).
3. الخلفية ← لون الخلفية: pick theme colors, watch the preview strip, try a
   custom hex, then check the canvas.
4. التخطيط: switch levels on المسافة من الأعلى → canvas updates; open
   الإعدادات ← المظهر ← سلّم المسافات, change «متوسطة», reselect the section
   → the same stored px now labels as مخصص until you re-pick a level.
5. الحدود: enable متصل, thickness/radius/color, watch preview + canvas;
   check radius applies in the storefront too (publish → port 3001).
6. الخلفية ← التغطية: set a background image, drag the intensity slider.
7. Select a **عنوان** → اللون field in الخط tab shows the new picker with
   theme names.
8. Blocks palette (العناصر) → colored avatar icons per category.

## Verification done here

- 43 jest suites / 332 tests green (16 new: scale mapping, overlay
  round-trip, color describe/swatches, columns clamp, 6-group classification).
- `tsc` (web project): zero new errors vs HEAD (pre-existing fork debt
  unchanged — verified by stash-baseline comparison).
- Editor route compiles and serves 200 with the new code (browser-pane tools
  were unavailable this session, so interactive clicking is on you — the
  list above is the full script).

## Follow-ups (not in this checkpoint)

- Named size/weight segments for heading/paragraph (fields exist, still
  selects; they now at least live in the الخط tab).
- The big spacing diagram from the mockup (canvas itself is the live
  preview; revisit if you miss it).
- Palette category colors ↔ tab colors mapping doc in `BLOCKS.md`.
