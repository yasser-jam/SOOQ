export const appBuildKeys = {
	all: ["app", "builds"] as const,
	list: (status?: string) => ["app", "builds", "list", status ?? "any"] as const,
	lastSuccess: ["app", "builds", "list", "SUCCESS"] as const,
	detail: (id: string) => ["app", "builds", "detail", id] as const,
	configs: ["app", "configurations"] as const,
	configStatus: (appName: string) => ["app", "configurations", "status", appName] as const,
}
