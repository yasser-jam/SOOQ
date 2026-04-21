export const tagQueryKeys = {
  all: ["list-tags"] as const,
  detail: (id: string) => [...tagQueryKeys.all, id] as const,
}