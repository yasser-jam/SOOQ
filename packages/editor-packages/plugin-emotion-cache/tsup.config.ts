import { defineConfig } from "tsup";
import tsupconfig from "../tsup-config";

export default defineConfig({
  ...tsupconfig,
  external: [
    ...(Array.isArray(tsupconfig.external) ? tsupconfig.external : []),
    "@emotion/cache",
    "@emotion/react",
  ],
});
