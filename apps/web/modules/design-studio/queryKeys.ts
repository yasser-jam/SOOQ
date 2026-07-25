import type { DesignPlatform } from "./types"

export const designStudioKeys = {
  all: ["design-studio"] as const,
  templates: ["design-studio", "templates"] as const,
  template: (key: string) =>
    ["design-studio", "templates", key] as const,
  draft: ["design-studio", "draft"] as const,
  versions: ["design-studio", "versions"] as const,
  publishedConfig: (tenantId: string, platform: DesignPlatform) =>
    ["design-studio", "published", tenantId, platform] as const,
}
