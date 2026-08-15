import type { DesignPlatform } from "./types"

export const designStudioKeys = {
  all: ["design-studio"] as const,
  templates: ["design-studio", "templates"] as const,
  template: (key: string) =>
    ["design-studio", "templates", key] as const,
  adminTemplates: ["design-studio", "admin-templates"] as const,
  mineTemplates: ["design-studio", "mine-templates"] as const,
  mineTemplate: (id: string) =>
    ["design-studio", "mine-templates", id] as const,
  draft: ["design-studio", "draft"] as const,
  versions: ["design-studio", "versions"] as const,
  publishedConfig: (tenantId: string, platform: DesignPlatform) =>
    ["design-studio", "published", tenantId, platform] as const,
}
