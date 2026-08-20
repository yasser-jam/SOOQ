/**
 * One-shot script: run with
 *   pnpm exec jest themes/inject-nova-products-settings-restyle.spec.ts --testNamePattern=restyles
 *
 * `/products`, `/products/:product-slug` and `/settings` were copy-pasted
 * from theme-rawaq-furniture.json and still carry rawaq's literal cream/olive
 * hex colors (`#f7f2ea` / `#fffdf9` / `#efe6d8`) and one of rawaq's
 * placeholder product images. This script:
 *   1. Sweeps those three pages, replacing rawaq's hex values with nova's own
 *      dark-navy tokens (page `#0b0f1a`, card `#141a2e`, alt `#0f1424`) and
 *      the rawaq-worded placeholder image with nova's own.
 *   2. Rebuilds `/products` to use a category-tree sidebar (the already
 *      registered but unused `CategoryTree` block) instead of the flat
 *      category pill row, so it stops looking like a rawaq clone.
 */
import fs from "node:fs";
import path from "node:path";

type Node = { type?: string; props?: Record<string, unknown> };

const themePath = path.join(__dirname, "theme-nova-electronics.json");

const COLOR_MAP: Record<string, string> = {
  "#f7f2ea": "#0b0f1a",
  "#fffdf9": "#141a2e",
  "#efe6d8": "#0f1424",
};

const RAWAQ_PLACEHOLDER =
  "https://placehold.co/600x600/efe6d8/5f6f52?text=%D9%82%D8%B7%D8%B9%D8%A9";
const NOVA_PLACEHOLDER =
  "https://placehold.co/600x600/141a2e/4f6df5?text=%D9%85%D9%86%D8%AA%D8%AC";

function recolor(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(recolor);
    return;
  }
  if (!node || typeof node !== "object") return;
  const record = node as Node;
  const props = record.props;
  if (props) {
    // Catch every literal rawaq hex, whatever prop it's sitting in
    // (Section/Group.backgroundColor, Chip.bgColor, icon colorFixed, ...).
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === "string" && value in COLOR_MAP) {
        props[key] = COLOR_MAP[value];
      }
    }
    if (typeof props.src === "string" && props.src === RAWAQ_PLACEHOLDER) {
      props.src = NOVA_PLACEHOLDER;
    }
    if (record.type === "Section") {
      props.theme = "dark";
    }
    for (const key of ["content", "cardTemplate", "slot"]) {
      if (props[key] != null) recolor(props[key]);
    }
  }
}

function findById(node: unknown, id: string): Node | null {
  if (Array.isArray(node)) {
    for (const entry of node) {
      const found = findById(entry, id);
      if (found) return found;
    }
    return null;
  }
  if (!node || typeof node !== "object") return null;
  const record = node as Node;
  if (record.props?.id === id) return record;
  if (record.props?.content != null) return findById(record.props.content, id);
  return null;
}

function removeById(list: Node[], id: string): Node | null {
  const index = list.findIndex((entry) => entry.props?.id === id);
  if (index === -1) return null;
  return list.splice(index, 1)[0]!;
}

function buildProductsLayoutSection(gridSection: Node, paginationGroup: Node): Node {
  // Narrow the grid from 4 columns to 2 to fit the new half-width column.
  gridSection.props!.columns = 2;

  const categorySidebar: Node = {
    type: "Group",
    props: {
      id: "Group-products-category-sidebar",
      direction: "column",
      gap: 16,
      alignItems: "stretch",
      justifyContent: "flex-start",
      wrap: "nowrap",
      backgroundColor: "#141a2e",
      backgroundImage: "",
      backgroundOverlayColor: "",
      padding: "24px",
      borderRadius: "theme-md",
      boxShadow: "none",
      product: null,
      metadata: null,
      language: "ar",
      content: [
        {
          type: "ContentHeading",
          props: {
            id: "Heading-products-category-sidebar",
            text: { ar: "الفئات", en: "Categories" },
            level: "3",
            textAlign: "right",
            fontFamily: "option1",
            fontSize: "theme-lg",
            fontWeight: "theme-bold",
            lineHeight: "theme-tight",
            fontStyle: "normal",
            textTransform: "none",
            color: "theme-text",
          },
        },
        {
          type: "CategoryTree",
          props: {
            id: "CategoryTree-products",
            textColor: "theme-text",
            activeColor: "theme-primary",
            fontSize: "theme-md",
            gap: 8,
            indentStep: 16,
            showProductCount: true,
          },
        },
      ],
    },
  };

  const contentColumn: Node = {
    type: "Group",
    props: {
      id: "Group-products-content-column",
      direction: "column",
      gap: 24,
      alignItems: "stretch",
      justifyContent: "flex-start",
      wrap: "nowrap",
      backgroundColor: "",
      backgroundImage: "",
      backgroundOverlayColor: "",
      padding: "0px",
      borderRadius: "theme-none",
      boxShadow: "none",
      product: null,
      metadata: null,
      language: "ar",
      content: [gridSection, paginationGroup],
    },
  };

  return {
    type: "Section",
    props: {
      id: "Section-products-layout",
      name: "الفئات والمنتجات (Categories + grid)",
      visible: true,
      anchorId: "",
      paddingTop: "0px",
      paddingBottom: "0px",
      paddingHorizontal: "0px",
      backgroundColor: "#0b0f1a",
      backgroundImage: "",
      backgroundOverlayColor: "",
      theme: "dark",
      maxWidth: "1280px",
      columns: 2,
      columnsMobile: 1,
      gridGap: "24px",
      content: [categorySidebar, contentColumn],
    },
  };
}

it("restyles /products, /products/:product-slug and /settings for nova", () => {
  const theme = JSON.parse(fs.readFileSync(themePath, "utf8"));
  const pages: Record<string, { content: Node[] }> = {};
  for (const p of ["/products", "/products/:product-slug", "/settings"]) {
    const page = (theme.pages ?? []).find(
      (entry: { path?: string }) => entry.path === p
    );
    if (!page) throw new Error(`${p} page not found`);
    pages[p] = page;
  }

  // 1. Color + placeholder sweep across all three pages.
  for (const page of Object.values(pages)) {
    recolor(page.content);
  }

  // 2. /products: swap the flat category ButtonGroup for a CategoryTree
  //    sidebar next to the product grid. Idempotent: skip if a previous run
  //    already built the layout (this script re-runs on every `pnpm test`
  //    along with the other one-shot injection scripts).
  const productsSection = findById(pages["/products"]!.content, "Section-products-page");
  if (!productsSection?.props) throw new Error("Section-products-page not found");
  const topContent = productsSection.props.content as Node[];

  if (!findById(topContent, "Section-products-layout")) {
    removeById(topContent, "ButtonGroup-products-categories");
    const gridSection = removeById(topContent, "Section-products-grid");
    const paginationGroup = removeById(topContent, "ButtonGroup-products-pagination");
    if (!gridSection || !paginationGroup) {
      throw new Error("products grid or pagination not found");
    }
    topContent.push(buildProductsLayoutSection(gridSection, paginationGroup));
  }

  fs.writeFileSync(themePath, `${JSON.stringify(theme, null, 2)}\n`, "utf8");
});
