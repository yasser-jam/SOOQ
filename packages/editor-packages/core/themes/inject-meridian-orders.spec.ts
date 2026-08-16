/**
 * One-shot script: run with
 *   pnpm exec jest themes/inject-meridian-orders.spec.ts --testNamePattern=injects
 */
import fs from "node:fs";
import path from "node:path";

import {
  createMeridianCancelOrderZonePopup,
  createMeridianOrderDetailSitePage,
  createMeridianOrdersSitePage,
} from "../config/presets/orders-meridian";

const themePath = path.join(__dirname, "theme-meridian-almarai.json");

it("injects /orders pages into theme-meridian-almarai.json", () => {
  const theme = JSON.parse(fs.readFileSync(themePath, "utf8"));

  const ordersPage = createMeridianOrdersSitePage();
  const orderDetailPage = createMeridianOrderDetailSitePage();
  const cancelPopup = createMeridianCancelOrderZonePopup();

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

  fs.writeFileSync(themePath, `${JSON.stringify(theme, null, 2)}\n`, "utf8");
});
