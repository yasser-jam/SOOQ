/**
 * Plain-JS jest config (the previous jest.config.ts needed ts-node, which is
 * not installed — the suite could never run).
 *
 * Path aliases mirror apps/web/tsconfig.json: `@/core` → this package,
 * `@/modules|lib|config` → apps/web (the fork still imports app code; see
 * roadmap C2-4 for the planned inversion).
 */
const config = {
  testEnvironment: "jsdom",

  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowJs: true,
          resolveJsonModule: true,
          module: "commonjs",
          moduleResolution: "node",
          target: "es2022",
          strict: false,
          skipLibCheck: true,
          isolatedModules: true,
        },
        diagnostics: false,
      },
    ],
  },

  setupFiles: ["<rootDir>/test/setup.ts"],

  // pnpm nests real packages under node_modules/.pnpm/<pkg>/node_modules/<name>,
  // so the ignore pattern must skip `.pnpm` and match on the inner segment.
  transformIgnorePatterns: [
    "/node_modules/(?!\\.pnpm/)(?!(?:@preact/signals-core|@preact/signals-react|@dnd-kit|uuid)/)",
  ],

  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "\\.(png|jpg|jpeg|gif|svg|webp)$": "<rootDir>/test/file-stub.js",
    "^lucide-react/dynamicIconImports$": "<rootDir>/test/lucide-dynamic-stub.js",
    "^@/core$": "<rootDir>/index.ts",
    "^@/core/(.*)$": "<rootDir>/$1",
    "^@/modules/(.*)$": "<rootDir>/../../../apps/web/modules/$1",
    "^@/lib/(.*)$": "<rootDir>/../../../apps/web/lib/$1",
    "^@/config/(.*)$": "<rootDir>/../../../apps/web/config/$1",
    "^@/components/(.*)$": "<rootDir>/../../../apps/web/components/$1",
    "^@workspace/ui/(.*)$": "<rootDir>/../../ui/src/$1",
    "^@shared-components$": "<rootDir>/../../ui/src/components",
  },

  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};

export default config;
