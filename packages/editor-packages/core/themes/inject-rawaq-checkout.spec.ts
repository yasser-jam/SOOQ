/**
 * One-shot script: run with
 *   pnpm exec jest themes/inject-rawaq-checkout.spec.ts --testNamePattern=injects
 */
import fs from "node:fs";
import path from "node:path";

import { createRawaqCheckoutSitePage } from "../config/presets/checkout-rawaq";

const themePath = path.join(__dirname, "theme-rawaq-furniture.json");

it("injects the /checkout page into theme-rawaq-furniture.json", () => {
  const theme = JSON.parse(fs.readFileSync(themePath, "utf8"));

  const checkoutPage = createRawaqCheckoutSitePage();

  theme.pages = (theme.pages ?? []).filter(
    (page: { path?: string }) => page.path !== "/checkout"
  );
  theme.pages.push(checkoutPage);

  // theme-rawaq-furniture.json is stored with 1-space indent — keep it so the
  // diff is the injected page only, not a whole-file reformat.
  fs.writeFileSync(themePath, `${JSON.stringify(theme, null, 1)}\n`, "utf8");
});
