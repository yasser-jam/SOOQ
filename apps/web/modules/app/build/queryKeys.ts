export const appBuildKeys = {
	all: ["app", "builds"] as const,
	list: () => ["app", "builds", "list"] as const,
	configStatus: (appName: string) => ["app", "configurations", "status", appName] as const,
}
