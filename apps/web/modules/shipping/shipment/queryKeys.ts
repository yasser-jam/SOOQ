export const shipmentQueryKeys = {
  all: ["shipments"] as const,
  list: () => [...shipmentQueryKeys.all, "list"] as const,
  detail: (id: string) => [...shipmentQueryKeys.all, "detail", id] as const,
  events: (id: string) => [...shipmentQueryKeys.all, "events", id] as const,
}
