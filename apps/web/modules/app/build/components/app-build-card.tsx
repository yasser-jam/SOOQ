"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, CloudUpload, Download, Plus, RefreshCw, RotateCcw, Smartphone } from "lucide-react"
import { toast } from "sonner"

import { getTenantSlug } from "@/lib/tenant-slug"
import { getStoreSettingsQueryOptions } from "@/modules/store/settings/actions"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
	buildDetailQueryOptions,
	configStatusQueryOptions,
	createAndPublishNewConfig,
	createConfigPublishAndBuild,
	ensurePublishedConfig,
	initiateBuild,
	lastSuccessfulBuildQueryOptions,
	latestBuildQueryOptions,
	publishConfiguration,
	retryBuild,
} from "../actions"
import { bundleIdFor, mobileApiBaseUrl } from "../config"
import { appBuildKeys } from "../queryKeys"
import type { AppBuildJob, AppConfigJson } from "../types"
import { BuildStatusBadge } from "./build-status-badge"
import { CreateConfigDialog } from "./create-config-dialog"

const POLL_GIVE_UP_MS = 20 * 60 * 1000
const IN_FLIGHT: AppBuildJob["buildStatus"][] = ["QUEUED", "BUILDING"]

export function AppBuildCard() {
	const queryClient = useQueryClient()
	const { data: settings } = useQuery(getStoreSettingsQueryOptions())
	const { data: latestPage, isPending: isLatestPending } = useQuery(latestBuildQueryOptions())
	const { data: lastSuccessPage } = useQuery(lastSuccessfulBuildQueryOptions())
	const lastSuccessBuild = lastSuccessPage?.content?.[0]
	const [configDialogOpen, setConfigDialogOpen] = useState(false)

	const latest = latestPage?.content?.[0]
	const isInFlight = !!latest && IN_FLIGHT.includes(latest.buildStatus)

	const [now, setNow] = useState(() => Date.now())
	useEffect(() => {
		if (!isInFlight) return
		const id = window.setInterval(() => setNow(Date.now()), 30_000)
		return () => window.clearInterval(id)
	}, [isInFlight])

	const elapsedMs = latest?.queuedAt ? now - new Date(latest.queuedAt).getTime() : 0
	const gaveUpPolling = elapsedMs > POLL_GIVE_UP_MS

	const { data: detail } = useQuery({
		...buildDetailQueryOptions(latest?.appBuildJobId ?? "", { poll: isInFlight && !gaveUpPolling }),
		enabled: !!latest?.appBuildJobId && isInFlight,
		initialData: latest,
	})

	const current = (isInFlight ? detail : latest) ?? latest

	const appName = useMemo(
		() => settings?.storeName || settings?.profileNameAr || settings?.profileNameEn || "متجري",
		[settings]
	)

	const { data: configStatus } = useQuery(configStatusQueryOptions(appName))
	const unpublishedDraft = configStatus?.draft && !configStatus.published ? configStatus.draft : undefined

	const invalidate = () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: appBuildKeys.all }),
			queryClient.invalidateQueries({ queryKey: appBuildKeys.configStatus(appName) }),
			current ? queryClient.invalidateQueries({ queryKey: appBuildKeys.detail(current.appBuildJobId) }) : null,
		])

	const buildMutation = useMutation({
		mutationFn: async () => {
			const configVersionId = await ensurePublishedConfig(appName)
			return initiateBuild({ buildChannel: "BETA", configVersionId })
		},
		onSuccess: async () => {
			toast.success("تم بدء بناء التطبيق")
			await invalidate()
		},
		onError: () => toast.error("تعذّر بدء بناء التطبيق"),
	})

	const retryMutation = useMutation({
		mutationFn: (id: string) => retryBuild(id),
		onSuccess: async () => {
			toast.success("تتم إعادة المحاولة")
			await invalidate()
		},
		onError: () => toast.error("تعذّرت إعادة المحاولة"),
	})

	const publishMutation = useMutation({
		mutationFn: (id: string) => publishConfiguration(id),
		onSuccess: async () => {
			toast.success("تم نشر إعدادات التطبيق")
			await invalidate()
		},
		onError: () => toast.error("تعذّر نشر إعدادات التطبيق — حاول مرة أخرى"),
	})

	const restartMutation = useMutation({
		mutationFn: async () => {
			const configVersionId = await createAndPublishNewConfig(appName)
			return initiateBuild({ buildChannel: "BETA", configVersionId })
		},
		onSuccess: async () => {
			toast.success("تم إنشاء نسخة إعدادات جديدة وبدء بناء جديد")
			await invalidate()
		},
		onError: () => toast.error("تعذّر البدء من جديد"),
	})

	const createConfigMutation = useMutation({
		mutationFn: (configJson: AppConfigJson) => createConfigPublishAndBuild(configJson),
		onSuccess: async () => {
			toast.success("تم إنشاء الإعدادات ونشرها وبدء بناء جديد")
			setConfigDialogOpen(false)
			await invalidate()
		},
		onError: () => toast.error("تعذّر إنشاء الإعدادات أو بدء البناء"),
	})

	if (isLatestPending) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-40" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-9 w-full" />
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Smartphone className="size-4" />
					تطبيق الجوال
				</CardTitle>
				<CardDescription>
					{!current && "لم يتم إنشاء تطبيق جوال لمتجرك بعد."}
					{current && isInFlight && "جارٍ تجهيز نسخة تطبيق الجوال الخاصة بمتجرك."}
					{current && current.buildStatus === "SUCCESS" && "نسخة التطبيق جاهزة للتحميل."}
					{current && (current.buildStatus === "FAILED" || current.buildStatus === "CANCELLED" || current.buildStatus === "TIMEOUT") &&
						"فشلت آخر محاولة بناء للتطبيق."}
					{configStatus?.published && (
						<span className="mt-1 block text-xs text-muted-foreground">
							إصدار الإعدادات المنشور الحالي: v{configStatus.published.versionNumber}
						</span>
					)}
				</CardDescription>
				<CardAction className="flex items-center gap-2">
					{current && <BuildStatusBadge status={current.buildStatus} />}
					<Button
						size="sm"
						variant="outline"
						onClick={() => setConfigDialogOpen(true)}
						disabled={createConfigMutation.isPending}
					>
						<Plus className="size-4" />
						إعدادات جديدة
					</Button>
				</CardAction>
			</CardHeader>

			<CardContent className="space-y-4">
				{current && isInFlight && (
					<Alert>
						<RefreshCw className="size-4 animate-spin" />
						<AlertTitle>يتم البناء الآن</AlertTitle>
						<AlertDescription>يوجد بناء تطبيق قيد التنفيذ حالياً.</AlertDescription>
					</Alert>
				)}

				{lastSuccessBuild?.artifacts?.[0]?.downloadUrl && (
					<div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
						<span className="text-sm text-muted-foreground">
							آخر نسخة ناجحة{lastSuccessBuild.completedAt
								? ` — ${new Date(lastSuccessBuild.completedAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}`
								: ""}
						</span>
						<Button size="sm" variant="secondary" asChild>
							<a href={lastSuccessBuild.artifacts[0].downloadUrl} target="_blank" rel="noreferrer">
								<Download className="size-4" />
								تحميل آخر نسخة ناجحة
							</a>
						</Button>
					</div>
				)}

				{unpublishedDraft && (
					<Alert>
						<CloudUpload className="size-4" />
						<AlertTitle>إعدادات غير منشورة</AlertTitle>
						<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
							<span className="flex items-center gap-2">
								يوجد إصدار إعدادات لم يُنشر بعد — يلزم نشره قبل بدء بناء جديد.
								<Badge variant="outline">مسودة v{unpublishedDraft.versionNumber}</Badge>
							</span>
							<div className="flex items-center gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => publishMutation.mutate(unpublishedDraft.appConfigurationId)}
									disabled={publishMutation.isPending}
								>
									<CloudUpload className="size-4" />
									نشر الإعدادات
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => restartMutation.mutate()}
									disabled={restartMutation.isPending}
								>
									<RotateCcw className="size-4" />
									أو ابدأ بنسخة جديدة
								</Button>
							</div>
						</AlertDescription>
					</Alert>
				)}

				{!current && (
					<Button onClick={() => buildMutation.mutate()} disabled={buildMutation.isPending}>
						إنشاء التطبيق
					</Button>
				)}

				{current && isInFlight && !gaveUpPolling && (
					<div className="space-y-2">
						<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
						</div>
						<Button disabled variant="outline">
							جارٍ البناء...
						</Button>
					</div>
				)}

				{current && isInFlight && gaveUpPolling && (
					<Alert>
						<AlertTriangle className="size-4" />
						<AlertTitle>تأخر البناء</AlertTitle>
						<AlertDescription>
							لا يزال البناء قيد التنفيذ منذ فترة أطول من المعتاد. راجع الفريق التقني إذا استمر الأمر.
						</AlertDescription>
					</Alert>
				)}

				{current && current.buildStatus === "SUCCESS" && (
					<div className="flex flex-wrap items-center gap-2">
						{current.artifacts?.[0]?.downloadUrl && (
							<Button asChild>
								<a href={current.artifacts[0].downloadUrl} target="_blank" rel="noreferrer">
									<Download className="size-4" />
									تحميل APK
								</a>
							</Button>
						)}
						<Button
							variant="outline"
							onClick={() => buildMutation.mutate()}
							disabled={buildMutation.isPending}
						>
							<RefreshCw className="size-4" />
							إعادة البناء
						</Button>
					</div>
				)}

				{current &&
					(current.buildStatus === "FAILED" ||
						current.buildStatus === "CANCELLED" ||
						current.buildStatus === "TIMEOUT") && (
						<div className="space-y-3">
							{current.errorMessage && (
								<Alert variant="destructive">
									<AlertTriangle className="size-4" />
									<AlertDescription>{current.errorMessage}</AlertDescription>
								</Alert>
							)}
							<div className="flex flex-wrap items-center gap-2">
								<Button
									variant="outline"
									onClick={() => retryMutation.mutate(current.appBuildJobId)}
									disabled={retryMutation.isPending}
								>
									<RefreshCw className="size-4" />
									إعادة المحاولة
								</Button>
							</div>
						</div>
					)}
			</CardContent>

			<CreateConfigDialog
				open={configDialogOpen}
				onOpenChange={setConfigDialogOpen}
				defaultAppName={appName}
				defaultApiBaseUrl={configStatus?.desired.apiBaseUrl ?? mobileApiBaseUrl()}
				defaultIconUrl={configStatus?.published?.configJson.iconUrl}
				bundleId={bundleIdFor(getTenantSlug())}
				onSubmit={(configJson) => createConfigMutation.mutate(configJson)}
				isSubmitting={createConfigMutation.isPending}
			/>
		</Card>
	)
}
