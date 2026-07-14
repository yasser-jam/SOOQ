# Property Plugins Architecture

> **Status:** Phase 1 complete — infrastructure + 2 migrated blocks (`Button`, `ContentImage`).
> Remaining ~53 blocks still use legacy `withLayout` + name-based field grouping.

The properties sidebar (المحتوى / التخطيط / الخلفية / الخط / الحدود / متقدم) is
refactored so each tab is a **plugin** that blocks explicitly register. A block
declares which tabs it needs; the Fields panel renders only those tabs and binds
JSON props through the same Puck `resolve-and-replace` pipeline.

---

## 1. Core concepts

### Property plugin

A plugin is one properties tab. It owns:

| Piece | Purpose |
|---|---|
| `id` | Stable plugin identifier (e.g. `"image"`, `"layout"`) |
| `group` | Tab slot — one of the six canonical groups |
| `label` / `icon` / `color` | Tab chrome in the sidebar |
| `fields` | Puck fields tagged with `metadata.group` |
| `defaults` | Default prop values merged into `defaultProps` |
| `resolveFields` | Dynamic field resolution (parent context, conditional fields) |
| `wrapRender` | HOC around the block render (layout shell) |

```typescript
// packages/editor-packages/core/config/property-plugins/types.ts
export type PropertyPlugin = {
  id: string;
  group: PropertyPluginGroup;
  label: string;
  icon: LucideIcon;
  color: { color: string; tint: string };
  fields?: Record<string, Field>;
  defaults?: Record<string, unknown>;
  resolveFields?: (...) => Record<string, Field> | Promise<...>;
  wrapRender?: React.FC<{ children; componentProps }>;
};
```

### `createBlock`

Blocks register plugins instead of a flat `fields` map:

```typescript
import { createBlock, buttonBlockPlugins } from "../../property-plugins";

export const Button = createBlock<ButtonProps>({
  label: "الزر",
  propertyPlugins: buttonBlockPlugins(buttonContentFields),
  defaultProps: { ... },
  resolveFields: (data, params) => filterFields(params.fields, data),
  render: (props) => <_Button ... />,
});
```

`createBlock` merges plugin fields (tagging each with `metadata.group`), chains
`resolveFields`, composes `wrapRender` wrappers, and stores
`metadata.propertyPlugins` on the resulting `ComponentConfig`.

### Binding hooks

Custom field UIs read/write the selected block's JSON through shared hooks:

| Hook | Use |
|---|---|
| `useBlockProps()` | Full props object for selected block |
| `useBlockProp(key)` | Single prop value |
| `useBlockPatch()` | Patch one or more props via Puck dispatch |
| `useLayout()` | Normalized `layout` prop (border designer, etc.) |
| `useLayoutPatch()` | Patch nested `layout.*` keys |

```typescript
// Example: border designer reads layout, writes patches
const layout = useLayout();
const patch = useLayoutPatch();
await patch({ borderWidth: "2px", borderStyle: "solid" });
```

Location: `config/property-plugins/hooks.ts`

---

## 2. Available plugins

| Factory | Tab (group) | What it provides |
|---|---|---|
| `contentPlugin(fields)` | المحتوى | Block-specific content fields (text, links, actions) |
| `imagePlugin(fields)` | المحتوى | Image-specific fields (src, alt, objectFit, radius) — replaces `contentPlugin` for image blocks |
| `layoutPlugin(options?)` | التخطيط | `layout` field + `Layout` render wrapper; parent-aware span/grow |
| `borderPlugin()` | الحدود | `layoutBorder` portal field (border designer) |
| `backgroundPlugin(fields)` | الخلفية | Background color, image, overlay |
| `typographyPlugin(fields)` | الخط | Align, color, font size/weight |
| `advancedPlugin(fields)` | متقدم | anchorId, visible, metadata, binding hints |

### Convenience bundles

```typescript
// Most text/media blocks
standardContentPlugins(contentFields, layoutOptions?)
// → contentPlugin + layoutPlugin + borderPlugin

// Image blocks (no float position)
imageBlockPlugins(imageFields, layoutOptions?)
// → imagePlugin + layoutPlugin({ showPosition: false }) + borderPlugin

// Buttons / compact controls (no border tab)
buttonBlockPlugins(contentFields, layoutOptions?)
// → contentPlugin + layoutPlugin
```

### Layout plugin options

```typescript
layoutPlugin({
  showPosition: false,     // hide floating-position controls
  showSpanCol: true,       // grid column span
  showGrow: true,          // flex grow
  floatViewportFixed: true,
  // ... LayoutVisibility flags
})
```

Parent type (`Grid` / `Section` / `Flex`) still drives span/grow defaults
inside `layoutPlugin.resolveFields` — same behaviour as the old `withLayout`.

---

## 3. How the sidebar renders tabs

```
Block selected
    ↓
Fields panel reads config.metadata.propertyPlugins
    ↓
resolvePropertyTabs(fieldsMap, plugins)
    ↓
One tab per group that has fields → render tab bar + active pane
    ↓
AutoField onChange → useBlockPatch / Puck dispatch → JSON updated
```

**Legacy fallback:** blocks without `metadata.propertyPlugins` still use
name-based classification from `field-groups.ts` (unchanged behaviour).

Files:
- `config/property-plugins/group-fields.ts` — tab resolution
- `components/Puck/components/Fields/index.tsx` — tab UI

---

## 4. Migration pattern

### Before (legacy)

```typescript
const Inner: ComponentConfig<Props> = { fields: {...}, render: ... };
const WithLayoutBlock = withLayout(Inner);
export const Block = {
  ...WithLayoutBlock,
  resolveFields: (data, params) => hideLayoutBorder(...),
};
```

### After (plugin-based)

```typescript
export const Block = createBlock<Props>({
  propertyPlugins: [
    contentPlugin({ title: { type: "text" } }),
    layoutPlugin(),
    borderPlugin(),
  ],
  defaultProps: { ... },
  render: (props) => <MyComponent ... />,
});
```

### Opt-out patterns

| Old helper | Plugin equivalent |
|---|---|
| `hideLayoutBorder(f)` | Omit `borderPlugin()` |
| `hideLayoutPosition(f)` | `layoutPlugin({ showPosition: false })` |
| `omitLayoutField(f)` | Omit `layoutPlugin()` and `borderPlugin()` |

---

## 5. Block → plugin registry

**Migrated (2):**

| Block | Plugins |
|---|---|
| **Button** | `contentPlugin`, `layoutPlugin` |
| **ContentImage** | `imagePlugin`, `layoutPlugin({ showPosition: false })`, `borderPlugin` |

**Legacy — target plugin assignment:**

### Shell & zones (no layout/border)

| Block | Plugins |
|---|---|
| SiteHeader | `contentPlugin`, `backgroundPlugin`, `typographyPlugin`, `advancedPlugin` |
| SiteFooter | `contentPlugin`, `backgroundPlugin`, `typographyPlugin`, `advancedPlugin` |
| ZoneDrawer | `contentPlugin`, `backgroundPlugin`, `advancedPlugin` |
| ZonePopup | `contentPlugin`, `backgroundPlugin`, `advancedPlugin` |
| ZoneBottomSheet | `contentPlugin`, `backgroundPlugin`, `advancedPlugin` |
| SiteDrawerShell | `contentPlugin`, `backgroundPlugin`, `typographyPlugin`, `advancedPlugin` |

### Layout containers

| Block | Plugins |
|---|---|
| Section | `layoutPlugin`, `borderPlugin`, `backgroundPlugin`, `typographyPlugin`, `advancedPlugin` |
| Group | `contentPlugin`, `layoutPlugin`, `borderPlugin`, `backgroundPlugin`, `advancedPlugin` |
| RowGroup | `contentPlugin`, `layoutPlugin`, `borderPlugin`, `backgroundPlugin` |
| Grid | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| Flex | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| Card | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| Sidebar | `contentPlugin`, `layoutPlugin`, `borderPlugin`, `backgroundPlugin`, `advancedPlugin` |
| SideDrawer | `contentPlugin`, `layoutPlugin`, `borderPlugin`, `advancedPlugin` |

### Typography-rich content

| Block | Plugins |
|---|---|
| Heading | `contentPlugin`, `typographyPlugin`, `layoutPlugin`, `borderPlugin` |
| Text | `contentPlugin`, `typographyPlugin`, `layoutPlugin({ showPosition: false })`, `borderPlugin` |
| ContentHeading | `contentPlugin`, `typographyPlugin`, `layoutPlugin({ showPosition: false })`, `borderPlugin` |
| ContentParagraph | `contentPlugin`, `typographyPlugin`, `layoutPlugin({ showPosition: false })`, `borderPlugin` |
| RichText | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| Hero | `contentPlugin`, `typographyPlugin`, `layoutPlugin`, `borderPlugin` |

### Images & media

| Block | Plugins |
|---|---|
| ContentImage | ✅ migrated — `imagePlugin`, `layoutPlugin({ showPosition: false })`, `borderPlugin` |
| ProductImage | `imagePlugin`, `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| ImageGallery | `imagePlugin`, `layoutPlugin({ showPosition: false })`, `borderPlugin` |
| ProductImageCarousel | `imagePlugin` only |
| VideoEmbed | `contentPlugin`, `typographyPlugin` — no layout/border |
| Logos | `contentPlugin`, `layoutPlugin`, `borderPlugin` |

### Buttons & compact controls (no border tab)

| Block | Plugins |
|---|---|
| Button | ✅ migrated — `contentPlugin`, `layoutPlugin` |
| ContentButton | `contentPlugin`, `backgroundPlugin`, `typographyPlugin`, `layoutPlugin` |
| ButtonGroup | `contentPlugin`, `backgroundPlugin`, `typographyPlugin`, `layoutPlugin` |
| Accordion | `contentPlugin`, `backgroundPlugin`, `typographyPlugin`, `layoutPlugin({ showPosition: false })` |
| CartIconButton | `contentPlugin`, `typographyPlugin` — no layout |

### Store & commerce

| Block | Plugins |
|---|---|
| ProductsGrid | `contentPlugin`, `layoutPlugin`, `borderPlugin`, `advancedPlugin` |
| ProductCard | same as Group |
| ProductInfo | `contentPlugin`, `typographyPlugin`, `layoutPlugin`, `borderPlugin` |
| ProductVariants | `contentPlugin` only |
| CategoryListMenu | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| ProductSearchMenu | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| CartSection | `contentPlugin`, `layoutPlugin`, `borderPlugin`, `advancedPlugin` |
| CartList | `contentPlugin`, `layoutPlugin`, `borderPlugin`, `advancedPlugin` |
| CartItem | same as Group |
| CartQuantity | `typographyPlugin`, `layoutPlugin`, `borderPlugin` |
| CheckoutForm | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| OrderHistory | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| Wishlist | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| Testimonials | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| ContactForm | `contentPlugin`, `layoutPlugin`, `borderPlugin` |

### Misc content blocks

| Block | Plugins |
|---|---|
| ContentLink | `contentPlugin`, `typographyPlugin`, `layoutPlugin`, `borderPlugin` |
| ContentInput | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| ContentDivider | `contentPlugin`, `typographyPlugin`, `layoutPlugin`, `borderPlugin` |
| ContentIcon | `contentPlugin`, `typographyPlugin`, `layoutPlugin`, `borderPlugin` |
| ContentHtml | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| NavMenu | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| Stats | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| Template | `contentPlugin`, `layoutPlugin`, `borderPlugin` |
| Space | `contentPlugin` only — no layout/border |

---

## 6. File map

```
config/property-plugins/
├── types.ts           # PropertyPlugin, BlockConfig types
├── registry.ts        # Tab labels, colors, icons (six groups)
├── hooks.ts           # useBlockProps, useLayout, useLayoutPatch, …
├── content.ts         # contentPlugin()
├── image.ts           # imagePlugin()
├── layout.tsx         # layoutPlugin() + Layout wrapRender
├── border.ts          # borderPlugin()
├── background.ts      # backgroundPlugin()
├── typography.ts      # typographyPlugin()
├── advanced.ts        # advancedPlugin()
├── create-block.tsx   # createBlock() factory
├── group-fields.ts    # resolvePropertyTabs()
├── index.ts           # public exports + convenience bundles
└── __tests__/
    └── group-fields.spec.ts
```

Related (unchanged for now, used by legacy blocks):
- `config/components/Layout/index.tsx` — `withLayout` (to be retired per-block)
- `components/Puck/components/Fields/field-groups.ts` — legacy name-based grouping

---

## 7. Migration checklist (per block)

1. Extract `fields` into plugin calls matching the table above.
2. Replace `withLayout(Inner)` with `layoutPlugin()` (+ `borderPlugin()` if applicable).
3. Move `resolveFields` conditionals into `createBlock({ resolveFields })` or a plugin's `resolveFields`.
4. Remove `hideLayoutBorder` / `hideLayoutPosition` wrappers — express as plugin options instead.
5. Verify tabs in the editor: only registered groups appear.
6. Confirm JSON shape unchanged (no data migration needed).

**Suggested migration order:**
1. Content primitives (Heading, Text, ContentParagraph) — validates typography split
2. Section — validates background + advanced split
3. Button family (ContentButton, ButtonGroup, Accordion) — validates no-border pattern
4. Remaining blocks in palette category batches

---

## 8. Example: Button (migrated)

```typescript
// config/blocks/Button/index.tsx
export const Button = createBlock<ButtonProps>({
  label: "الزر",
  propertyPlugins: buttonBlockPlugins({
    label: { type: "text", contentEditable: true },
    buttonAction: { type: "select", ... },
    link: linkField({ label: "الوجهة" }),
    variant: { type: "radio", ... },
  }),
  resolveFields: (data, params) =>
    filterButtonHrefFields(params.fields, data),
  render: (props) => <_Button ... />,
});
```

Tabs shown: **المحتوى** (label, action, link, variant) + **التخطيط** (layout box).
No **الحدود** tab — border plugin not registered.

## 9. Example: ContentImage (migrated)

```typescript
export const ContentImage = createBlock<ContentImageProps>({
  label: "صورة",
  propertyPlugins: imageBlockPlugins({
    src: { type: "text", label: "رابط الصورة" },
    alt: { type: "text", label: "نص بديل" },
    objectFit: { type: "select", ... },
    radius: themeFixedSelectField({ ... }),
    maxWidth: { type: "text", label: "العرض الأقصى" },
  }),
  render: (props) => <img ... />,
});
```

Tabs shown: **المحتوى** (image fields via `imagePlugin`) + **التخطيط** (no float) + **الحدود**.

---

*Last updated: 2026-07-14*
