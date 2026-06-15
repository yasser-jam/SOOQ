"use client"

import { useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { RefreshCw, Percent, DollarSign } from "lucide-react"
import DatePicker from "react-datepicker"
import { ar } from "date-fns/locale"
import "react-datepicker/dist/react-datepicker.css"

import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
import { useStorePath } from "@/lib/store-path"
import {
	createDiscountCode,
	getDiscountCode,
	updateDiscountCode,
} from "@/modules/order/discount-code/actions"
import {
	discountCodeFormDefaults,
	initDiscountCodeFormValues,
	initDiscountCodeUpdate,
} from "@/modules/order/discount-code/init"
import {
	DISCOUNT_SCOPE_LABELS,
	DISCOUNT_TYPE_LABELS,
} from "@/modules/order/discount-code/model"
import { discountCodeQueryKeys } from "@/modules/order/discount-code/queryKeys"
import {
	createDiscountCodeSchema,
	discountScopeSchema,
	discountTypeSchema,
} from "@/modules/order/discount-code/schema"
import type {
	CreateDiscountCodeFormValues,
	CreateDiscountCodePayload,
	DiscountScope,
	DiscountType,
} from "@/modules/order/discount-code/types"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import {
	Field as UiField,
	FieldError,
	FieldLabel,
} from "@workspace/ui/components/field"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select"

const DISCOUNT_TYPE_VALUES = discountTypeSchema.options
const DISCOUNT_SCOPE_VALUES = discountScopeSchema.options

export default function EditDiscountCodePage() {
	const router = useRouter()
	const storePath = useStorePath()
	const queryClient = useQueryClient()
	const params = useParams()
	const codeId = params?.["discount-code-id"]?.toString() ?? ""
	const isEdit = codeId !== "create"

	const form = useForm<CreateDiscountCodeFormValues>({
		resolver: zodResolver(createDiscountCodeSchema) as never,
		defaultValues: discountCodeFormDefaults,
	})

	const { data: code, isLoading } = useQuery({
		queryKey: discountCodeQueryKeys.detail(codeId),
		queryFn: () => getDiscountCode(codeId),
		enabled: isEdit,
	})

	useEffect(() => {
		if (!isEdit) {
			form.reset(discountCodeFormDefaults)
			return
		}

		if (!code) return

		form.reset(initDiscountCodeFormValues(code))
	}, [code, form, isEdit])

	const { isPending: isCreating, mutate: createMutation } = useMutation({
		mutationFn: createDiscountCode,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: discountCodeQueryKeys.all })
			router.push(storePath("/discount-codes"))
		},
	})

	const { isPending: isUpdating, mutate: updateMutation } = useMutation({
		mutationFn: updateDiscountCode,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: discountCodeQueryKeys.all })
			router.push(storePath("/discount-codes"))
		},
	})

	const handleSubmit = useCallback(
		(values: CreateDiscountCodeFormValues) => {
			const parsed = createDiscountCodeSchema.parse(
				values
			) as CreateDiscountCodePayload

			if (isEdit) {
				if (!codeId) return
				const { code: _omitCode, discountType: _omitType, ...rest } = parsed
				updateMutation(initDiscountCodeUpdate(codeId, rest))
				return
			}

			createMutation(parsed)
		},
		[codeId, createMutation, isEdit, updateMutation]
	)

	const isSubmitting = isCreating || isUpdating || isLoading

	const generateRandomCode = () => {
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
		let code = ""
		for (let i = 0; i < 8; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length))
		}
		form.setValue("code", code)
	}

	const discountType = form.watch("discountType")

	return (
		<PageDialog
			open
			onOpenChange={(open) => {
				if (!open) router.back()
			}}
			size="lg"
			title={isEdit ? "تعديل كود الخصم" : "إضافة كود خصم"}
			actions={
				<>
					<DialogClose asChild>
						<Button variant="ghost">إلغاء</Button>
					</DialogClose>
					<Button
						type="submit"
						form="discount-code-form"
						disabled={isSubmitting}
						style={{ backgroundColor: "#BA7B1B" }}
						className="text-white px-6 py-2"
					>
						حفظ
					</Button>
				</>
			}
		>
			<form
				id="discount-code-form"
				className="flex flex-col gap-10"
				onSubmit={form.handleSubmit(handleSubmit)}
			>
				{/* قسم معلومات الكود الأساسية */}
				<div className="space-y-6">
					<h3 className="text-xl font-bold" style={{ color: "#122640" }}>
						معلومات الكود الأساسية
					</h3>

					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium flex items-center gap-1" style={{ color: "#122640" }}>
							الرمز (كود الخصم)
							<span className="text-red-500">*</span>
						</label>
						<div className="flex gap-2 items-center">
							<Field
								name="code"
								control={form.control}
								label=""
								inputProps={{
									disabled: isSubmitting || isEdit,
									style: { textTransform: "uppercase" },
									className: "rounded-lg flex-1 h-12",
								}}
							/>
							{!isEdit && (
								<Button
									type="button"
									variant="outline"
									onClick={generateRandomCode}
									disabled={isSubmitting}
									className="rounded-lg h-12 w-12 flex items-center justify-center"
								>
									<RefreshCw className="size-4" />
								</Button>
							)}
						</div>
						<p className="text-xs text-gray-500 min-h-[16px]">
							الكود الذي سيستخدمه العميل للحصول على الخصم
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium flex items-center gap-1" style={{ color: "#122640" }}>
								نوع الخصم
								<span className="text-red-500">*</span>
							</label>
							<UiField data-invalid={Boolean(form.formState.errors.discountType)}>
								<Controller
									name="discountType"
									control={form.control}
									render={({ field }) => (
										<Select
											value={field.value}
											onValueChange={(value) =>
												field.onChange(value as DiscountType)
											}
											disabled={isSubmitting || isEdit}
										>
											<SelectTrigger className="rounded-lg h-12">
												<SelectValue placeholder="اختر نوع الخصم" />
											</SelectTrigger>
											<SelectContent>
												{DISCOUNT_TYPE_VALUES.map((value) => (
													<SelectItem key={value} value={value}>
														{DISCOUNT_TYPE_LABELS[value]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
								<FieldError errors={[form.formState.errors.discountType]} />
							</UiField>
							<div className="min-h-[16px]"></div>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium flex items-center gap-1" style={{ color: "#122640" }}>
								قيمة الخصم
								<span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<Field
									name="discountValue"
									control={form.control}
									label=""
									inputProps={{
										type: "number",
										min: "0.01",
										step: "0.01",
										disabled: isSubmitting,
										className: "rounded-lg pl-10 h-12",
									}}
								/>
								<div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
									{discountType === "PERCENTAGE" ? (
										<Percent className="size-4" />
									) : (
										<DollarSign className="size-4" />
									)}
								</div>
							</div>
							<p className="text-xs text-gray-500 min-h-[16px]">
								{discountType === "PERCENTAGE" ? "نسبة مئوية من إجمالي الطلب" : "مبلغ ثابت بالعملة المحلية"}
							</p>
						</div>
					</div>
				</div>

				{/* قسم قيود الاستخدام */}
				<div className="space-y-6">
					<h3 className="text-xl font-bold" style={{ color: "#122640" }}>
						قيود الاستخدام
					</h3>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium" style={{ color: "#122640" }}>
								الحد الأدنى للطلب
							</label>
							<Field
								name="minOrderAmount"
								control={form.control}
								label=""
								inputProps={{
									type: "number",
									min: "0",
									disabled: isSubmitting,
									className: "rounded-lg h-12",
								}}
							/>
							<div className="min-h-[16px]"></div>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium" style={{ color: "#122640" }}>
								الحد الأقصى للخصم
							</label>
							<Field
								name="maxDiscountCap"
								control={form.control}
								label=""
								inputProps={{
									type: "number",
									min: "0",
									disabled: isSubmitting,
									className: "rounded-lg h-12",
								}}
							/>
							<div className="min-h-[16px]"></div>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium" style={{ color: "#122640" }}>
								عدد مرات الاستخدام الكلي
							</label>
							<Field
								name="usageLimit"
								control={form.control}
								label=""
								inputProps={{
									type: "number",
									min: "1",
									disabled: isSubmitting,
									className: "rounded-lg h-12",
								}}
							/>
							<div className="min-h-[16px]"></div>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium" style={{ color: "#122640" }}>
								عدد مرات استخدام العميل
							</label>
							<Field
								name="perCustomerMax"
								control={form.control}
								label=""
								inputProps={{
									type: "number",
									min: "1",
									disabled: isSubmitting,
									className: "rounded-lg h-12",
								}}
							/>
							<div className="min-h-[16px]"></div>
						</div>
					</div>
				</div>

				{/* قسم النطاق والصلاحية */}
				<div className="space-y-6">
					<h3 className="text-xl font-bold" style={{ color: "#122640" }}>
						النطاق والصلاحية
					</h3>

					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium" style={{ color: "#122640" }}>
							النطاق
						</label>
						<UiField data-invalid={Boolean(form.formState.errors.applicableScope)}>
							<Controller
								name="applicableScope"
								control={form.control}
								render={({ field }) => (
									<Select
										value={field.value ?? "ALL"}
										onValueChange={(value) =>
											field.onChange(value as DiscountScope)
										}
										disabled={isSubmitting}
									>
										<SelectTrigger className="rounded-lg h-12">
											<SelectValue placeholder="اختر النطاق" />
										</SelectTrigger>
										<SelectContent>
											{DISCOUNT_SCOPE_VALUES.map((value) => (
												<SelectItem key={value} value={value}>
													{DISCOUNT_SCOPE_LABELS[value]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							<FieldError errors={[form.formState.errors.applicableScope]} />
						</UiField>
						<div className="min-h-[16px]"></div>
					</div>

					<div className="rounded-lg border p-6" style={{ borderColor: "#E5E7EB" }}>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium" style={{ color: "#122640" }}>
									تاريخ البداية
								</label>
								<UiField data-invalid={Boolean(form.formState.errors.startsAt)}>
									<Controller
										name="startsAt"
										control={form.control}
										render={({ field }) => (
											<DatePicker
												selected={field.value ? new Date(field.value) : null}
												onChange={(date: Date | null) => {
													if (date) {
														const isoString = date.toISOString().slice(0, 16)
														field.onChange(isoString)
													} else {
														field.onChange("")
													}
												}}
												showTimeSelect
												timeFormat="HH:mm"
												timeIntervals={15}
												dateFormat="yyyy-MM-dd HH:mm"
												placeholderText="اختر تاريخ البداية والوقت"
												disabled={isSubmitting}
												className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm focus:border-[#BA7B1B] focus:outline-none focus:ring-1 focus:ring-[#BA7B1B] disabled:cursor-not-allowed disabled:opacity-50 text-right h-12"
												locale={ar}
											/>
										)}
									/>
									<FieldError errors={[form.formState.errors.startsAt]} />
								</UiField>
								<div className="min-h-[16px]"></div>
							</div>

							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium" style={{ color: "#122640" }}>
									تاريخ الانتهاء
								</label>
								<UiField data-invalid={Boolean(form.formState.errors.expiresAt)}>
									<Controller
										name="expiresAt"
										control={form.control}
										render={({ field }) => (
											<DatePicker
												selected={field.value ? new Date(field.value) : null}
												onChange={(date: Date | null) => {
													if (date) {
														const isoString = date.toISOString().slice(0, 16)
														field.onChange(isoString)
													} else {
														field.onChange("")
													}
												}}
												showTimeSelect
												timeFormat="HH:mm"
												timeIntervals={15}
												dateFormat="yyyy-MM-dd HH:mm"
												placeholderText="اختر تاريخ الانتهاء والوقت"
												disabled={isSubmitting}
												className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm focus:border-[#BA7B1B] focus:outline-none focus:ring-1 focus:ring-[#BA7B1B] disabled:cursor-not-allowed disabled:opacity-50 text-right h-12"
												locale={ar}
												minDate={form.getValues("startsAt") ? new Date(form.getValues("startsAt")) : new Date()}
											/>
										)}
									/>
									<FieldError errors={[form.formState.errors.expiresAt]} />
								</UiField>
								<div className="min-h-[16px]"></div>
							</div>
						</div>
						<p className="mt-4 text-xs text-gray-500">
							سيتم تفعيل الكود من تاريخ البداية وحتى تاريخ الانتهاء المحدد
						</p>
					</div>
				</div>
			</form>
		</PageDialog>
	)
}
