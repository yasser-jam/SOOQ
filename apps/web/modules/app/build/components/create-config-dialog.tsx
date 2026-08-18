"use client"

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { CloudUpload, Loader2 } from "lucide-react"
import { toast } from "sonner"

import ImageUploader, {
	type ImageUploaderState,
} from "@/components/system/image-uploader"
import { uploadMedia } from "@/modules/media/upload/actions"
import { validateImageFile } from "@/modules/media/upload/init"
import { MEDIA_CONSTRAINTS } from "@/modules/media/upload/types"
import { Button } from "@workspace/ui/components/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

import type { AppConfigJson } from "../types"

const ACCEPT_ATTR = MEDIA_CONSTRAINTS.allowedTypes.join(",")

/**
 * Rendered only while the dialog is open — Radix unmounts `DialogContent`'s
 * children on close, so this component's local state resets on every open
 * without needing an effect to sync it against `default*` props.
 */
function CreateConfigForm({
	onOpenChange,
	defaultAppName,
	defaultApiBaseUrl,
	defaultIconUrl,
	bundleId,
	onSubmit,
	isSubmitting,
}: {
	onOpenChange: (open: boolean) => void
	defaultAppName: string
	defaultApiBaseUrl: string
	defaultIconUrl?: string
	bundleId: string
	onSubmit: (configJson: AppConfigJson) => void
	isSubmitting: boolean
}) {
	const [appName, setAppName] = React.useState(defaultAppName)
	const [apiBaseUrl, setApiBaseUrl] = React.useState(defaultApiBaseUrl)
	const [iconUrl, setIconUrl] = React.useState(defaultIconUrl ?? "")
	const [error, setError] = React.useState<string | null>(null)
	const uploadingFileKeyRef = React.useRef<string | null>(null)

	const { isPending: isUploading, mutate: upload } = useMutation({
		mutationFn: uploadMedia,
		onSuccess: (response) => {
			const uploaded = response.items[0]
			if (!uploaded) {
				toast.error("لم يتم استلام رابط الصورة من الخادم")
				return
			}
			setIconUrl(uploaded.publicUrl)
			toast.success("تم رفع الأيقونة")
		},
	})

	const handleIconChange = React.useCallback(
		(state: ImageUploaderState) => {
			if (state.keptExistingIds.length === 0 && state.newFiles.length === 0) {
				setIconUrl("")
				return
			}

			const file = state.newFiles.at(-1)
			if (!file) return

			const fileKey = `${file.name}-${file.size}-${file.lastModified}`
			if (uploadingFileKeyRef.current === fileKey || isUploading) return
			uploadingFileKeyRef.current = fileKey

			const validation = validateImageFile(file)
			if (!validation.ok) {
				toast.error(validation.error)
				uploadingFileKeyRef.current = null
				return
			}

			upload([file], {
				onSettled: () => {
					uploadingFileKeyRef.current = null
				},
			})
		},
		[isUploading, upload]
	)

	const handleSubmit = () => {
		const trimmedName = appName.trim()
		const trimmedUrl = apiBaseUrl.trim()
		if (!trimmedName) {
			setError("اسم التطبيق مطلوب")
			return
		}
		if (!trimmedUrl) {
			setError("رابط الـ API مطلوب")
			return
		}
		setError(null)
		onSubmit({
			appName: trimmedName,
			apiBaseUrl: trimmedUrl,
			bundleId,
			...(iconUrl ? { iconUrl } : {}),
		})
	}

	return (
		<>
			<DialogHeader>
				<DialogTitle>إنشاء إعدادات تطبيق جديدة</DialogTitle>
				<DialogDescription>
					سيتم إنشاء نسخة إعدادات جديدة، نشرها، ثم بدء بناء تطبيق جديد مباشرة
					بهذه الإعدادات.
				</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-2">
				<Field>
					<FieldLabel htmlFor="app-config-name">اسم التطبيق</FieldLabel>
					<Input
						id="app-config-name"
						value={appName}
						onChange={(event) => setAppName(event.target.value)}
						placeholder="متجري"
					/>
				</Field>

				<Field>
					<FieldLabel htmlFor="app-config-api-base-url">
						رابط الـ API الأساسي
					</FieldLabel>
					<Input
						id="app-config-api-base-url"
						value={apiBaseUrl}
						onChange={(event) => setApiBaseUrl(event.target.value)}
						placeholder="https://example.com"
						dir="ltr"
					/>
				</Field>

				<Field>
					<FieldLabel>أيقونة التطبيق</FieldLabel>
					<ImageUploader
						key={iconUrl || "app-icon-empty"}
						existing={iconUrl ? [{ id: "app-icon", url: iconUrl }] : []}
						maxFiles={1}
						maxSize={MEDIA_CONSTRAINTS.maxBytes}
						accept={ACCEPT_ATTR}
						onChange={handleIconChange}
						disabled={isUploading}
						replaceMode
						showPrimaryBadge={false}
						showRemainingCount={false}
						subHint={null}
						dropzoneTitle={iconUrl ? "استبدال الأيقونة" : "رفع الأيقونة"}
						formatHint="JPG أو PNG أو WebP، حتى 5 ميغابايت."
						triggerLabel={iconUrl ? "استبدال الأيقونة" : "اختر أيقونة"}
						existingLabel="الأيقونة الحالية"
					/>
				</Field>

				{error ? <p className="text-sm text-destructive">{error}</p> : null}
			</div>

			<DialogFooter>
				<Button variant="outline" onClick={() => onOpenChange(false)}>
					إلغاء
				</Button>
				<Button onClick={handleSubmit} disabled={isSubmitting || isUploading}>
					{isSubmitting ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<CloudUpload className="size-4" />
					)}
					إنشاء ونشر وبدء البناء
				</Button>
			</DialogFooter>
		</>
	)
}

export function CreateConfigDialog({
	open,
	onOpenChange,
	defaultAppName,
	defaultApiBaseUrl,
	defaultIconUrl,
	bundleId,
	onSubmit,
	isSubmitting,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	defaultAppName: string
	defaultApiBaseUrl: string
	defaultIconUrl?: string
	bundleId: string
	onSubmit: (configJson: AppConfigJson) => void
	isSubmitting: boolean
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				{open && (
					<CreateConfigForm
						onOpenChange={onOpenChange}
						defaultAppName={defaultAppName}
						defaultApiBaseUrl={defaultApiBaseUrl}
						defaultIconUrl={defaultIconUrl}
						bundleId={bundleId}
						onSubmit={onSubmit}
						isSubmitting={isSubmitting}
					/>
				)}
			</DialogContent>
		</Dialog>
	)
}
