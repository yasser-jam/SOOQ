export const tenantKeys = {
  all: ["platform", "tenants"] as const,
  detail: (tenantId: string) => [...tenantKeys.all, tenantId] as const,
}
