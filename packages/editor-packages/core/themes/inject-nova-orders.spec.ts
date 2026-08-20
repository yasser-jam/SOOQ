/**
 * One-shot script: run with
 *   pnpm exec jest themes/inject-nova-orders.spec.ts --testNamePattern=injects
 */
import fs from "node:fs";
import path from "node:path";

import {
  createNovaCancelOrderZonePopup,
  createNovaOrderDetailSitePage,
  createNovaOrdersSitePage,
} from "../config/presets/orders-nova";

const themePath = path.join(__dirname, "theme-nova-electronics.json");

it("injects /orders pages into theme-nova-electronics.json", () => {
  const theme = JSON.parse(fs.readFileSync(themePath, "utf8"));

  const ordersPage = createNovaOrdersSitePage();
  const orderDetailPage = createNovaOrderDetailSitePage();
  const cancelPopup = createNovaCancelOrderZonePopup();

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

  // theme-nova-electronics.json is stored with 2-space indent — keep it so
  // the diff is the injected pages only, not a whole-file reformat.
  fs.writeFileSync(themePath, `${JSON.stringify(theme, null, 2)}\n`, "utf8");
});
