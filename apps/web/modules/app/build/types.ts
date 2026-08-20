export type BuildStatus =
	| "QUEUED"
	| "BUILDING"
	| "SUCCESS"
	| "FAILED"
	| "CANCELLED"
	| "TIMEOUT"

export type BuildChannel = "INTERNAL" | "BETA" | "PRODUCTION"

export type AppBuildArtifact = {
	downloadUrl: string
	fileName?: string | null
	fileHash?: string | null
	fileSizeBytes?: number | null
}

export type AppBuildJob = {
	appBuildJobId: string
	ciRunId?: string | null
	buildChannel?: BuildChannel
	configVersionId?: string
	buildStatus: BuildStatus
	queuedAt?: string | null
	completedAt?: string | null
	errorMessage?: string | null
	artifacts?: AppBuildArtifact[]
}

export type AppConfigJson = {
	appName: string
	apiBaseUrl: string
	bundleId: string
	iconUrl?: string
	config_url?: string
	tenant_id?: string | null
	[key: string]: unknown
}

export type AppConfiguration = {
	appConfigurationId: string
	schemaVersion: string
	configJson: AppConfigJson
	versionNumber: number
	isPublished: boolean
	createdAt?: string | null
	publishedAt?: string | null
}
