"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Image as ImageIcon, Upload, X } from "lucide-react"
import { toast } from "sonner"

import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
import {
	createInvoiceLayout,
	getInvoiceLayout,
	updateInvoiceLayout,
} from "@/modules/order/invoice-layout/actions"
import VisibleFieldsEditor from "@/modules/order/invoice-layout/components/visible-fields-editor"
import {
	buildCreatePayload,
	buildUpdatePayload,
	initInvoiceLayoutFormValues,
	initInvoiceLayoutUpdate,
	invoiceLayoutFormDefaults,
} from "@/modules/order/invoice-layout/init"
import { invoiceLayoutQueryKeys } from "@/modules/order/invoice-layout/queryKeys"
import { invoiceLayoutFormSchema } from "@/modules/order/invoice-layout/schema"
import type { InvoiceLayoutFormValues } from "@/modules/order/invoice-layout/types"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { DialogClose } from "@workspace/ui/components/dialog"
import {
	Field as UiField,
	FieldError,
	FieldLabel,
} from "@workspace/ui/components/field"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"

export default function EditInvoiceLayoutPage() {
	const router = useRouter()
	const queryClient = useQueryClient()
	const params = useParams()
	const profileId = params?.["profile-id"]?.toString() ?? ""
	const isEdit = profileId !== "create"
	// File picked from disk — stays in memory until submit, then sent as the
	// `logo` part of the multipart request. The backend uploads it via
	// MediaUploadService and merges the resulting publicUrl into
	// visibleFieldsJson.logoUrl (see H3 in the FRONTEND_PAGES doc).
	const [logoFile, setLogoFile] = useState<File | null>(null)
	const fileInputRef = useRef<HTMLInputElement | null>(null)

	const form = useForm<InvoiceLayoutFormValues>({
		resolver: zodResolver(invoiceLayoutFormSchema) as never,
		defaultValues: invoiceLayoutFormDefaults,
	})

	const { data: profile, isLoading } = useQuery({
		queryKey: invoiceLayoutQueryKeys.detail(profileId),
		queryFn: () => getInvoiceLayout(profileId),
		enabled: isEdit,
	})

	useEffect(() => {
		if (!isEdit) {
			form.reset(invoiceLayoutFormDefaults)
			return
		}

		if (!profile) return

		form.reset(initInvoiceLayoutFormValues(profile))
	}, [profile, form, isEdit])

	const { isPending: isCreating, mutate: createMutation } = useMutation({
		mutationFn: createInvoiceLayout,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: invoiceLayoutQueryKeys.all })
			toast.success("تم إنشاء قالب الفاتورة بنجاح")
			router.push("/invoice-layouts")
		},
	})

	const { isPending: isUpdating, mutate: updateMutation } = useMutation({
		mutationFn: updateInvoiceLayout,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: invoiceLayoutQueryKeys.all })
			toast.success("تم حفظ التعديلات")
			router.push("/invoice-layouts")
		},
	})

	const handleSubmit = useCallback(
		(values: InvoiceLayoutFormValues) => {
			if (isEdit) {
				if (!profileId) return
				updateMutation(
					initInvoiceLayoutUpdate(
						profileId,
						buildUpdatePayload(values),
						logoFile
					)
				)
				return
			}

			createMutation({
				payload: buildCreatePayload(values),
				logoFile,
			})
		},
		[createMutation, isEdit, logoFile, profileId, updateMutation]
	)

	const isSubmitting = isCreating || isUpdating || isLoading
	const logoUrl = form.watch("visibleFields.logoUrl")
	const colorScheme = form.watch("visibleFields.colorScheme")

	// Local preview for a freshly-picked file — must be revoked on change /
	// unmount to avoid leaking blob URLs.
	const logoPreviewUrl = useMemo(
		() => (logoFile ? URL.createObjectURL(logoFile) : null),
		[logoFile]
	)
	useEffect(() => {
		if (!logoPreviewUrl) return
		return () => URL.revokeObjectURL(logoPreviewUrl)
	}, [logoPreviewUrl])

	const handleLogoUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0]
			// Reset the input so re-selecting the same file fires onChange again.
			event.target.value = ""
			if (!file) return

			// Backend accepts image/jpeg, image/png, image/webp; the form caps
			// at 5MB to match the multipart-handler limit.
			const allowed = ["image/jpeg", "image/png", "image/webp"]
			if (!allowed.includes(file.type)) {
				toast.error("الصور المسموحة: JPG، PNG، WebP")
				return
			}

			if (file.size > 5 * 1024 * 1024) {
				toast.error("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت")
				return
			}

			setLogoFile(file)
			// Clear any pasted/legacy URL — the new file is the source of truth
			// and the backend will overwrite logoUrl after upload.
			form.setValue("visibleFields.logoUrl", "", {
				shouldDirty: true,
				shouldValidate: true,
			})
		},
		[form]
	)

	const clearUploadedLogo = useCallback(() => {
		setLogoFile(null)
		form.setValue("visibleFields.logoUrl", "", {
			shouldDirty: true,
			shouldValidate: true,
		})
	}, [form])

	// Preview priority: local blob (just-picked) > stored URL (server-side).
	const displayLogo = logoPreviewUrl || logoUrl

	return (
		<PageDialog
			open
			onOpenChange={(open) => {
				if (!open) router.back()
			}}
			size="lg"
			title={isEdit ? "تعديل قالب الفاتورة" : "إضافة قالب فاتورة"}
			description="أعدّ ما يظهر على فاتورة PDF: الحقول، الألوان، النصوص، والشعار."
			actions={
				<>
					<DialogClose asChild>
						<Button variant="outline">إلغاء</Button>
					</DialogClose>
					<Button
						type="submit"
						form="invoice-layout-form"
						disabled={isSubmitting}
					>
						حفظ
					</Button>
				</>
			}
		>
			<form
				id="invoice-layout-form"
				className="grid gap-6"
				onSubmit={form.handleSubmit(handleSubmit)}
			>
				<section className="grid gap-4 rounded-2xl border bg-background p-4">
					<h3 className="text-base font-semibold text-foreground">
						الإعدادات الأساسية
					</h3>

					<Field
						name="profileName"
						control={form.control}
						label="اسم القالب"
						placeholder="مثال: قالب الفاتورة الرسمي"
						inputProps={{ disabled: isSubmitting }}
					/>

					<Controller
						name="isDefault"
						control={form.control}
						render={({ field }) => (
							<div className="flex items-start gap-3 rounded-xl border bg-card p-3">
								<Checkbox
									id="isDefault"
									checked={Boolean(field.value)}
									onCheckedChange={(checked) =>
										field.onChange(checked === true)
									}
									disabled={isSubmitting}
								/>
								<div className="flex flex-col gap-0.5">
									<Label htmlFor="isDefault" className="cursor-pointer">
										تعيين كقالب افتراضي
									</Label>
									<span className="text-xs text-muted-foreground">
										سيُستخدم هذا القالب لتوليد كل الفواتير الجديدة. تعيينه يلغي
										الافتراضي السابق تلقائياً.
									</span>
								</div>
							</div>
						)}
					/>
				</section>

				<section className="grid gap-4 rounded-2xl border bg-background p-4">
					<h3 className="text-base font-semibold text-foreground">
						هوية المتجر
					</h3>

					<div className="grid gap-4 sm:grid-cols-2">
						<Field
							name="visibleFields.storeName"
							control={form.control}
							label="اسم المتجر"
							placeholder="يظهر في رأس الفاتورة"
							inputProps={{ disabled: isSubmitting }}
						/>

						<UiField
							data-invalid={Boolean(
								form.formState.errors.visibleFields?.colorScheme
							)}
						>
							<FieldLabel htmlFor="colorScheme">لون التصميم</FieldLabel>
							<Controller
								name="visibleFields.colorScheme"
								control={form.control}
								render={({ field }) => (
									<div className="flex items-center gap-2">
										<input
											id="colorScheme"
											type="color"
											className="h-10 w-14 cursor-pointer rounded border"
											value={field.value ?? "#1A2B3C"}
											onChange={(event) => field.onChange(event.target.value)}
											disabled={isSubmitting}
										/>
										<input
											type="text"
											className="flex-1 rounded border bg-card px-3 py-2 font-mono text-sm"
											value={field.value ?? ""}
											onChange={(event) => field.onChange(event.target.value)}
											disabled={isSubmitting}
											placeholder="#1A2B3C"
											dir="ltr"
										/>
									</div>
								)}
							/>
							<FieldError
								errors={[form.formState.errors.visibleFields?.colorScheme]}
							/>
						</UiField>
					</div>

					{colorScheme ? (
						<div
							className="rounded-xl p-3 text-sm font-medium"
							style={{
								backgroundColor: `${colorScheme}20`,
								color: colorScheme,
							}}
						>
							معاينة: هذا اللون سيُستخدم في عناوين الفاتورة.
						</div>
					) : null}

					<UiField>
						<FieldLabel htmlFor="logoUrl">شعار المتجر</FieldLabel>
						<div className="space-y-4">
							{/* Logo Preview */}
							<div className="flex items-center gap-4">
								<div className="flex size-20 items-center justify-center overflow-hidden rounded-xl border bg-muted">
									{displayLogo ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={displayLogo}
											alt="شعار"
											className="size-full object-contain"
										/>
									) : (
										<ImageIcon className="size-6 text-muted-foreground" />
									)}
								</div>
								{displayLogo && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={clearUploadedLogo}
										disabled={isSubmitting}
									>
										<X className="size-4" />
										إزالة الشعار
									</Button>
								)}
							</div>

							{/* Upload Section */}
							<div className="space-y-2">
								<div className="text-sm font-medium">تحميل من الجهاز</div>
								<div className="flex items-center gap-3">
									<input
										ref={fileInputRef}
										type="file"
										id="logo-upload"
										accept="image/*"
										onChange={handleLogoUpload}
										disabled={isSubmitting}
										className="hidden"
									/>
									<Button
										type="button"
										variant="outline"
										onClick={() => fileInputRef.current?.click()}
										disabled={isSubmitting}
									>
										<Upload className="size-4" />
										اختر صورة
									</Button>
									<span className="text-xs text-muted-foreground">
										PNG, JPG, GIF (حتى 5 ميجابايت)
									</span>
								</div>
							</div>

							{/* URL Input Section */}
							<div className="space-y-2">
								<div className="text-sm font-medium">أو أدخل رابط الصورة</div>
								<Controller
									name="visibleFields.logoUrl"
									control={form.control}
									render={({ field }) => (
										<input
											id="logoUrl"
											type="url"
											className="w-full rounded border bg-card px-3 py-2 text-sm"
											value={field.value ?? ""}
											onChange={(event) => {
												field.onChange(event.target.value)
												setLogoFile(null) // Pasted URL takes priority
											}}
											disabled={isSubmitting}
											placeholder="https://example.com/logo.png"
											dir="ltr"
										/>
									)}
								/>
							</div>
						</div>
					</UiField>
				</section>

				<section className="grid gap-4 rounded-2xl border bg-background p-4">
					<h3 className="text-base font-semibold text-foreground">
						نصوص الفاتورة
					</h3>

					<UiField>
						<FieldLabel htmlFor="headerText">نص الترويسة</FieldLabel>
						<Controller
							name="visibleFields.headerText"
							control={form.control}
							render={({ field }) => (
								<Textarea
									id="headerText"
									{...field}
									value={field.value ?? ""}
									placeholder="نص يظهر أعلى الفاتورة"
									disabled={isSubmitting}
									className="min-h-20"
								/>
							)}
						/>
					</UiField>

					<UiField>
						<FieldLabel htmlFor="footerText">نص التذييل</FieldLabel>
						<Controller
							name="visibleFields.footerText"
							control={form.control}
							render={({ field }) => (
								<Textarea
									id="footerText"
									{...field}
									value={field.value ?? ""}
									placeholder="نص يظهر أسفل الفاتورة (شروط، شكر، إلخ)"
									disabled={isSubmitting}
									className="min-h-20"
								/>
							)}
						/>
					</UiField>

				</section>

				<section className="grid gap-4">
					<h3 className="text-base font-semibold text-foreground">
						الحقول المرئية على الفاتورة
					</h3>
					<VisibleFieldsEditor
						control={form.control}
						disabled={isSubmitting}
					/>
				</section>
			</form>
		</PageDialog>
	)
}
