/**
 * One-shot script: run with
 *   pnpm exec jest themes/inject-rawaq-orders.spec.ts --testNamePattern=injects
 */
import fs from "node:fs";
import path from "node:path";

import {
  createRawaqCancelOrderZonePopup,
  createRawaqOrderDetailSitePage,
  createRawaqOrdersSitePage,
} from "../config/presets/orders-rawaq";

const themePath = path.join(__dirname, "theme-rawaq-furniture.json");

it("injects /orders pages into theme-rawaq-furniture.json", () => {
  const theme = JSON.parse(fs.readFileSync(themePath, "utf8"));

  const ordersPage = createRawaqOrdersSitePage();
  const orderDetailPage = createRawaqOrderDetailSitePage();
  const cancelPopup = createRawaqCancelOrderZonePopup();

  theme.pages = (theme.pages ?? []).filter(
    (page: { path?: string }) =>
      page.path !== "/orders" && page.path !== "/orders/:order-id"
  );
  theme.pages.push(ordersPage, orderDetailPage);

  const popups = theme.zones?.["root:zone-popup"] ?? [];
  const withoutCancel = popups.filter(
    (entry: { props?: { zoneKey?: string } }) =>
      entry?.props?.zoneKey !== "cancel-order"
  );
  theme.zones = {
    ...theme.zones,
    "root:zone-popup": [...withoutCancel, cancelPopup],
  };

  // theme-rawaq-furniture.json is stored with 1-space indent — keep it so the
  // diff is the injected pages only, not a whole-file reformat.
  fs.writeFileSync(themePath, `${JSON.stringify(theme, null, 1)}\n`, "utf8");
});
