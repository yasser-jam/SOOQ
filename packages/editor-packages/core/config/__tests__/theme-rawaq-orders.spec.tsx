/**
 * Guards the `/orders` pages injected into the Rawaq Furniture theme:
 * the block tree must stay behaviourally identical to the Meridian one
 * (same bindings, actions and section kinds — only the skin differs), and
 * the pages must render through `<Render>` off the shipped theme JSON.
 */
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Render } from "@/core";

import conf from "../index";
import { BoundDataProvider } from "../binding";
import { composePuckData, normalizeSiteData } from "../lib/site-data";

const themesDir = path.join(__dirname, "..", "..", "themes");

function loadTheme(file: string) {
  return JSON.parse(fs.readFileSync(path.join(themesDir, file), "utf8"));
}

const rawaq = loadTheme("theme-rawaq-furniture.json");
const meridian = loadTheme("theme-meridian-almarai.json");

const findPage = (theme: any, pagePath: string) =>
  theme.pages.find((page: any) => page.path === pagePath);

const findPopup = (theme: any, zoneKey: string) =>
  (theme.zones?.["root:zone-popup"] ?? []).find(
    (entry: any) => entry?.props?.zoneKey === zoneKey
  );

/** Props that carry behaviour rather than looks. */
const BEHAVIOUR_PROPS = [
  "valueContext",
  "dataCondition",
  "showCondition",
  "enumMap",
  "enumMapKey",
  "sectionKind",
  "buttonAction",
  "destinationType",
  "zoneKey",
  "zoneAction",
  "inputAction",
  "switchAction",
  "selectAction",
  "chipVariantMode",
  "inputType",
  "required",
  "link",
  "name",
];

/** Reduce a block tree to its structure + behaviour, dropping all styling. */
function behaviourSignature(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(behaviourSignature);
  if (!node || typeof node !== "object") return null;

  const block = node as { type?: string; props?: Record<string, unknown> };
  if (!block.type || !block.props) return null;

  const signature: Record<string, unknown> = { type: block.type };
  for (const key of BEHAVIOUR_PROPS) {
    if (key in block.props) signature[key] = block.props[key];
  }
  for (const slot of ["content", "cardTemplate", "slot"]) {
    const value = block.props[slot];
    if (value != null) signature[slot] = behaviourSignature(value);
  }
  return signature;
}

function collectBlocks(node: unknown, out: any[] = []): any[] {
  if (Array.isArray(node)) {
    node.forEach((entry) => collectBlocks(entry, out));
    return out;
  }
  if (!node || typeof node !== "object") return out;

  const block = node as { type?: string; props?: Record<string, unknown> };
  if (block.type && block.props) out.push(block);
  for (const value of Object.values(node as Record<string, unknown>)) {
    if (value && typeof value === "object") collectBlocks(value, out);
  }
  return out;
}

const ordersBlocks = collectBlocks([
  findPage(rawaq, "/orders")?.content,
  findPage(rawaq, "/orders/:order-id")?.content,
  findPopup(rawaq, "cancel-order"),
]);

/** Blocks in these pages read the session through TanStack Query. */
function renderTree(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const renderPage = (pagePath: string) => {
  const site = normalizeSiteData(rawaq);
  return renderTree(
    <Render
      config={conf as any}
      data={composePuckData(site, pagePath) as any}
    />
  );
};

describe("theme-rawaq-furniture /orders pages", () => {
  it("ships both order pages and the cancel-order popup", () => {
    expect(findPage(rawaq, "/orders")).toBeTruthy();
    expect(findPage(rawaq, "/orders/:order-id")?.dynamic).toBe(true);
    expect(findPopup(rawaq, "cancel-order")).toBeTruthy();
    // The theme's own login popup must survive the injection.
    expect(findPopup(rawaq, "login")).toBeTruthy();
  });

  it.each(["/orders", "/orders/:order-id"])(
    "keeps %s behaviourally identical to the Meridian implementation",
    (pagePath) => {
      expect(behaviourSignature(findPage(rawaq, pagePath).content)).toEqual(
        behaviourSignature(findPage(meridian, pagePath).content)
      );
    }
  );

  it("keeps the cancel-order popup behaviourally identical to Meridian's", () => {
    expect(behaviourSignature(findPopup(rawaq, "cancel-order"))).toEqual(
      behaviourSignature(findPopup(meridian, "cancel-order"))
    );
  });

  it("wears the Rawaq skin rather than the Meridian one", () => {
    const byType = (type: string) =>
      ordersBlocks.filter((block) => block.type === type);

    for (const section of byType("Section")) {
      expect(section.props.backgroundColor).toBe("#f7f2ea");
      expect(section.props.paddingHorizontal).toBe("32px");
    }
    // Cards are flat off-white with Rawaq's 4px radius — no drop shadows.
    for (const group of byType("Group")) {
      expect(group.props.backgroundColor).toBe("#fffdf9");
      expect(group.props.borderRadius).toBe("theme-md");
      expect(group.props.boxShadow).toBe("none");
    }
    for (const chip of byType("Chip")) {
      expect(chip.props.shape).toBe("square");
      // Status colours still come from the enum map, not a hard-coded swatch.
      expect(chip.props.chipVariantMode).toBe("theme");
    }
    for (const button of byType("ContentButton")) {
      expect(button.props.radius).toBe("theme-sm");
    }
    for (const heading of byType("ContentHeading")) {
      expect(heading.props.fontFamily).toBe("option1");
    }
    expect(findPopup(rawaq, "cancel-order").props.borderRadius).toBe("4px");
    expect(findPopup(rawaq, "cancel-order").props.is_active).toBe(false);
  });

  it("leaves no left-aligned text in an RTL theme", () => {
    for (const block of ordersBlocks) {
      expect(block.props.textAlign).not.toBe("left");
      expect(block.props.align).not.toBe("left");
    }
  });

  it("carries bilingual copy like the rest of the theme", () => {
    const signInHeading = ordersBlocks.find(
      (block) => (block.props.text as any)?.ar === "سجّل دخولك لعرض طلباتك."
    );
    expect(signInHeading?.props.text).toEqual({
      ar: "سجّل دخولك لعرض طلباتك.",
      en: "Sign in to view your orders.",
    });
  });

  it("renders /orders from the shipped theme JSON", () => {
    renderPage("/orders");

    const prompt = screen.getByText("سجّل دخولك لعرض طلباتك.");
    expect(
      screen.getByText(
        "يمكنك تسجيل الدخول برقم هاتفك لمتابعة طلباتك وإدارة حسابك."
      )
    ).toBeTruthy();
    // The header/footer zones carry their own "تسجيل الدخول" link, so scope the
    // lookup to the sign-in card this page renders.
    const card = prompt.closest("div[style*='background']") as HTMLElement;
    expect(within(card).getByText("تسجيل الدخول")).toBeTruthy();
  });

  it("renders /orders/:order-id from the shipped theme JSON", () => {
    renderPage("/orders/:order-id");
    expect(screen.getByText("سجّل دخولك لعرض تفاصيل الطلب.")).toBeTruthy();
  });

  it("still resolves the order bindings through the Rawaq card template", () => {
    const listSection = findPage(rawaq, "/orders").content.find(
      (section: any) => section.props.sectionKind === "customer-orders"
    );

    renderTree(
      <BoundDataProvider
        value={{
          data: {
            order: {
              orderId: "o-1",
              orderNumber: "ORD-1042",
              orderStatus: "PENDING",
              paymentStatus: "PAID",
              placedAt: "2026-08-01T10:00:00Z",
              total: 1250000,
              currencyCode: "SYP",
            },
          } as any,
          isLoading: false,
          isError: false,
          metadata: null,
          language: "ar",
          selectedVariantId: null,
          setSelectedVariantId: () => {},
        }}
      >
        <Render
          config={conf as any}
          data={
            {
              root: { props: {} },
              content: [listSection.props.cardTemplate[0]],
              zones: {},
            } as any
          }
        />
      </BoundDataProvider>
    );

    expect(screen.getByText("ORD-1042")).toBeTruthy();
    // Status chips keep reading their labels/colours from the enum maps.
    expect(screen.getByText("قيد الانتظار")).toBeTruthy();
    expect(screen.getByText("مدفوع")).toBeTruthy();
    expect(screen.getByText("عرض التفاصيل")).toBeTruthy();
  });
});
