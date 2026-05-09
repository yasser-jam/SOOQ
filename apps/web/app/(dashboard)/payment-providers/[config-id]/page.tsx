"use client"

import { useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { ShieldAlert } from "lucide-react"

import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
import {
	createPaymentProvider,
	getPaymentProvider,
	updatePaymentProvider,
} from "@/modules/payment/provider/actions"
import {
	buildCreatePaymentProviderPayload,
	buildUpdatePaymentProviderPayload,
	initPaymentProviderFormValues,
	initPaymentProviderUpdate,
	paymentProviderFormDefaults,
} from "@/modules/payment/provider/init"
import {
	CREDENTIAL_FIELD_LABELS,
	ENVIRONMENT_LABELS,
	LANG_LABELS,
	PAYMENT_PROVIDER_CATALOG,
	SETTINGS_FIELD_LABELS,
	isKnownProviderCode,
	type PaymentProviderCode,
} from "@/modules/payment/provider/model"
import { paymentProviderQueryKeys } from "@/modules/payment/provider/queryKeys"
import { paymentProviderFormSchema } from "@/modules/payment/provider/schema"
import type {
	PaymentCredentials,
	PaymentProviderFormValues,
	PaymentSettings,
} from "@/modules/payment/provider/types"
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { DialogClose } from "@workspace/ui/components/dialog"
import {
	Field as UiField,
	FieldError,
	FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select"

const PROVIDER_CODES = Object.keys(
	PAYMENT_PROVIDER_CATALOG
) as PaymentProviderCode[]

export default function EditPaymentProviderPage() {
	const router = useRouter()
	const queryClient = useQueryClient()
	const params = useParams()
	const configId = params?.["config-id"]?.toString() ?? ""
	const isEdit = configId !== "create"

	const form = useForm<PaymentProviderFormValues>({
		resolver: zodResolver(paymentProviderFormSchema) as never,
		defaultValues: paymentProviderFormDefaults,
	})

	const { data: provider, isLoading } = useQuery({
		queryKey: paymentProviderQueryKeys.detail(configId),
		queryFn: () => getPaymentProvider(configId),
		enabled: isEdit,
	})

	useEffect(() => {
		if (!isEdit) {
			form.reset(paymentProviderFormDefaults)
			return
		}

		if (!provider) return

		form.reset(initPaymentProviderFormValues(provider))
	}, [provider, form, isEdit])

	const { isPending: isCreating, mutate: createMutation } = useMutation({
		mutationFn: createPaymentProvider,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: paymentProviderQueryKeys.all,
			})
			router.push("/payment-providers")
		},
	})

	const { isPending: isUpdating, mutate: updateMutation } = useMutation({
		mutationFn: updatePaymentProvider,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: paymentProviderQueryKeys.all,
			})
			router.push("/payment-providers")
		},
	})

	const handleSubmit = useCallback(
		(values: PaymentProviderFormValues) => {
			if (isEdit) {
				if (!configId) return
				updateMutation(
					initPaymentProviderUpdate(
						configId,
						buildUpdatePaymentProviderPayload(values)
					)
				)
				return
			}

			createMutation(buildCreatePaymentProviderPayload(values))
		},
		[configId, createMutation, isEdit, updateMutation]
	)

	const isSubmitting = isCreating || isUpdating || isLoading
	const providerCode = form.watch("providerCode")
	const catalog = isKnownProviderCode(providerCode)
		? PAYMENT_PROVIDER_CATALOG[providerCode]
		: undefined
	const credentialFields = catalog?.credentialFields ?? []
	const settingsFields = catalog?.settingsFields ?? []

	return (
		<PageDialog
			open
			onOpenChange={(open) => {
				if (!open) router.back()
			}}
			size="md"
			title={isEdit ? "تعديل بوابة الدفع" : "إضافة بوابة دفع"}
			description={catalog?.descriptionAr}
			actions={
				<>
					<DialogClose asChild>
						<Button variant="outline">إلغاء</Button>
					</DialogClose>
					<Button
						type="submit"
						form="payment-provider-form"
						disabled={isSubmitting}
					>
						حفظ
					</Button>
				</>
			}
		>
			<form
				id="payment-provider-form"
				className="grid gap-6"
				onSubmit={form.handleSubmit(handleSubmit)}
			>
				<section className="grid gap-4 rounded-2xl border bg-background p-4">
					<h3 className="text-base font-semibold text-foreground">
						الإعدادات الأساسية
					</h3>

					<UiField
						data-invalid={Boolean(form.formState.errors.providerCode)}
					>
						<FieldLabel htmlFor="providerCode">المزود</FieldLabel>
						<Controller
							name="providerCode"
							control={form.control}
							render={({ field }) => (
								<Select
									value={field.value}
									onValueChange={(value) => {
										field.onChange(value)
										// On provider switch, propose the catalog default display name
										if (
											isKnownProviderCode(value) &&
											!form.getValues("displayName")
										) {
											form.setValue(
												"displayName",
												PAYMENT_PROVIDER_CATALOG[value].defaultDisplayName
											)
										}
									}}
									disabled={isSubmitting || isEdit}
								>
									<SelectTrigger id="providerCode">
										<SelectValue placeholder="اختر المزود" />
									</SelectTrigger>
									<SelectContent>
										{PROVIDER_CODES.map((code) => (
											<SelectItem key={code} value={code}>
												{PAYMENT_PROVIDER_CATALOG[code].nameAr}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						<FieldError errors={[form.formState.errors.providerCode]} />
					</UiField>

					<Field
						name="displayName"
						control={form.control}
						label="اسم العرض على صفحة الدفع"
						placeholder={catalog?.defaultDisplayName ?? ""}
						inputProps={{ disabled: isSubmitting }}
					/>

					<div className="grid gap-4 sm:grid-cols-2">
						<Field
							name="sortOrder"
							control={form.control}
							label="ترتيب العرض"
							placeholder="0"
							inputProps={{
								type: "number",
								min: "0",
								disabled: isSubmitting,
							}}
						/>

						<Controller
							name="isActive"
							control={form.control}
							render={({ field }) => (
								<div className="flex items-center gap-3 rounded-xl border bg-card p-3">
									<Checkbox
										id="isActive"
										checked={Boolean(field.value)}
										onCheckedChange={(checked) =>
											field.onChange(checked === true)
										}
										disabled={isSubmitting}
									/>
									<Label htmlFor="isActive" className="cursor-pointer">
										نشط (يظهر للعميل عند الدفع)
									</Label>
								</div>
							)}
						/>
					</div>
				</section>

				{credentialFields.length ? (
					<section className="grid gap-4 rounded-2xl border bg-background p-4">
						<div className="flex items-center justify-between">
							<h3 className="text-base font-semibold text-foreground">
								بيانات الاعتماد
							</h3>
						</div>

						{isEdit ? (
							<Alert className="rounded-xl border-amber-200 bg-amber-50">
								<ShieldAlert className="size-5 text-amber-700" />
								<AlertTitle className="text-amber-900">
									بيانات الاعتماد محفوظة بأمان
								</AlertTitle>
								<AlertDescription className="text-amber-800">
									لا يتم إرجاع بيانات الاعتماد من الخادم. اترك الحقول فارغة
									إذا كنت لا تريد تعديلها، أو املأها لتحديثها.
								</AlertDescription>
							</Alert>
						) : null}

						<div className="grid gap-4 sm:grid-cols-2">
							{credentialFields.map((fieldName) => (
								<Field
									key={fieldName}
									name={`credentials.${fieldName}` as const}
									control={form.control}
									label={CREDENTIAL_FIELD_LABELS[fieldName]}
									placeholder={
										isEdit ? "اتركه فارغاً للحفاظ على القيمة الحالية" : ""
									}
									inputProps={{
										type:
											fieldName === "password" ? "password" : "text",
										autoComplete: "off",
										disabled: isSubmitting,
									}}
								/>
							))}
						</div>
					</section>
				) : null}

				{settingsFields.length ? (
					<section className="grid gap-4 rounded-2xl border bg-background p-4">
						<h3 className="text-base font-semibold text-foreground">
							الإعدادات
						</h3>

						<div className="grid gap-4 sm:grid-cols-2">
							{settingsFields.map((fieldName) => {
								if (fieldName === "environment") {
									return (
										<UiField
											key={fieldName}
											data-invalid={Boolean(
												form.formState.errors.settings?.environment
											)}
										>
											<FieldLabel htmlFor="settings-environment">
												{SETTINGS_FIELD_LABELS.environment}
											</FieldLabel>
											<Controller
												name="settings.environment"
												control={form.control}
												render={({ field }) => (
													<Select
														value={field.value}
														onValueChange={(value) =>
															field.onChange(
																value as PaymentSettings["environment"]
															)
														}
														disabled={isSubmitting}
													>
														<SelectTrigger id="settings-environment">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{Object.entries(ENVIRONMENT_LABELS).map(
																([value, label]) => (
																	<SelectItem key={value} value={value}>
																		{label}
																	</SelectItem>
																)
															)}
														</SelectContent>
													</Select>
												)}
											/>
											<FieldError
												errors={[
													form.formState.errors.settings?.environment,
												]}
											/>
										</UiField>
									)
								}

								if (fieldName === "lang") {
									return (
										<UiField key={fieldName}>
											<FieldLabel htmlFor="settings-lang">
												{SETTINGS_FIELD_LABELS.lang}
											</FieldLabel>
											<Controller
												name="settings.lang"
												control={form.control}
												render={({ field }) => (
													<Select
														value={field.value}
														onValueChange={(value) =>
															field.onChange(value as PaymentSettings["lang"])
														}
														disabled={isSubmitting}
													>
														<SelectTrigger id="settings-lang">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{Object.entries(LANG_LABELS).map(
																([value, label]) => (
																	<SelectItem key={value} value={value}>
																		{label}
																	</SelectItem>
																)
															)}
														</SelectContent>
													</Select>
												)}
											/>
										</UiField>
									)
								}

								if (fieldName === "savedCards") {
									return (
										<Controller
											key={fieldName}
											name="settings.savedCards"
											control={form.control}
											render={({ field }) => (
												<div className="flex items-center gap-3 rounded-xl border bg-card p-3 sm:col-span-2">
													<Checkbox
														id="settings-savedCards"
														checked={Boolean(field.value)}
														onCheckedChange={(checked) =>
															field.onChange(checked === true)
														}
														disabled={isSubmitting}
													/>
													<Label
														htmlFor="settings-savedCards"
														className="cursor-pointer"
													>
														{SETTINGS_FIELD_LABELS.savedCards}
													</Label>
												</div>
											)}
										/>
									)
								}

								return (
									<UiField
										key={fieldName}
										data-invalid={Boolean(
											form.formState.errors.settings?.[
												fieldName as keyof PaymentSettings
											]
										)}
									>
										<FieldLabel htmlFor={`settings-${fieldName}`}>
											{
												SETTINGS_FIELD_LABELS[
													fieldName as keyof PaymentSettings
												]
											}
										</FieldLabel>
										<Controller
											name={
												`settings.${fieldName}` as `settings.${keyof PaymentSettings}`
											}
											control={form.control}
											render={({ field }) => (
												<Input
													id={`settings-${fieldName}`}
													value={(field.value as string) ?? ""}
													onChange={field.onChange}
													disabled={isSubmitting}
												/>
											)}
										/>
									</UiField>
								)
							})}
						</div>
					</section>
				) : null}
			</form>
		</PageDialog>
	)
}
