"use client"

import { useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import DatePicker from "react-datepicker"
import { ar } from "date-fns/locale"
import "react-datepicker/dist/react-datepicker.css"

import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
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
			router.push("/discount-codes")
		},
	})

	const { isPending: isUpdating, mutate: updateMutation } = useMutation({
		mutationFn: updateDiscountCode,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: discountCodeQueryKeys.all })
			router.push("/discount-codes")
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

	return (
		<PageDialog
			open
			onOpenChange={(open) => {
				if (!open) router.back()
			}}
			size="md"
			title={isEdit ? "تعديل كود الخصم" : "إضافة كود خصم"}
			actions={
				<>
					<DialogClose asChild>
						<Button variant="outline">إلغاء</Button>
					</DialogClose>
					<Button
						type="submit"
						form="discount-code-form"
						disabled={isSubmitting}
					>
						حفظ
					</Button>
				</>
			}
		>
			<form
				id="discount-code-form"
				className="grid gap-4"
				onSubmit={form.handleSubmit(handleSubmit)}
			>
				<Field
					name="code"
					control={form.control}
					label="الرمز"
					placeholder="مثال: 10OFF"
					inputProps={{
						disabled: isSubmitting || isEdit,
						style: { textTransform: "uppercase" },
					}}
				/>

				<UiField
					data-invalid={Boolean(form.formState.errors.discountType)}
				>
					<FieldLabel htmlFor="discountType">نوع الخصم</FieldLabel>
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
								<SelectTrigger id="discountType">
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

				<Field
					name="discountValue"
					control={form.control}
					label="قيمة الخصم"
					placeholder="مثال: 10"
					inputProps={{
						type: "number",
						min: "0.01",
						step: "0.01",
						disabled: isSubmitting,
					}}
				/>

				<div className="grid gap-4 sm:grid-cols-2">
					<Field
						name="minOrderAmount"
						control={form.control}
						label="حد أدنى للطلب (SYP)"
						placeholder="اختياري"
						inputProps={{
							type: "number",
							min: "0",
							disabled: isSubmitting,
						}}
					/>

					<Field
						name="maxDiscountCap"
						control={form.control}
						label="الحد الأقصى للخصم (SYP)"
						placeholder="اختياري"
						inputProps={{
							type: "number",
							min: "0",
							disabled: isSubmitting,
						}}
					/>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<Field
						name="usageLimit"
						control={form.control}
						label="الحد الأقصى للاستخدامات"
						placeholder="اتركه فارغًا لعدم التحديد"
						inputProps={{
							type: "number",
							min: "1",
							disabled: isSubmitting,
						}}
					/>

					<Field
						name="perCustomerMax"
						control={form.control}
						label="استخدام لكل عميل"
						placeholder="اتركه فارغًا لعدم التحديد"
						inputProps={{
							type: "number",
							min: "1",
							disabled: isSubmitting,
						}}
					/>
				</div>

				<UiField
					data-invalid={Boolean(form.formState.errors.applicableScope)}
				>
					<FieldLabel htmlFor="applicableScope">النطاق</FieldLabel>
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
								<SelectTrigger id="applicableScope">
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

				<div className="space-y-4">
					<div className="rounded-lg border bg-gray-50 p-4">
						<div className="mb-3 text-sm font-medium text-gray-700">
							⏰ فترة الصلاحية
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<UiField data-invalid={Boolean(form.formState.errors.startsAt)}>
								<FieldLabel htmlFor="startsAt" className="flex items-center gap-2">
									📅 تاريخ البداية
								</FieldLabel>
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
											className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 text-right"
											locale={ar}
										/>
									)}
								/>
								<FieldError errors={[form.formState.errors.startsAt]} />
							</UiField>

							<UiField data-invalid={Boolean(form.formState.errors.expiresAt)}>
								<FieldLabel htmlFor="expiresAt" className="flex items-center gap-2">
									🕐 تاريخ الانتهاء
								</FieldLabel>
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
											className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 text-right"
											locale={ar}
											minDate={form.getValues("startsAt") ? new Date(form.getValues("startsAt")) : new Date()}
										/>
									)}
								/>
								<FieldError errors={[form.formState.errors.expiresAt]} />
							</UiField>
						</div>
						<div className="mt-3 text-xs text-gray-500">
							💡 سيتم تفعيل الكود من تاريخ البداية وحتى تاريخ الانتهاء المحدد
						</div>
					</div>
				</div>
			</form>
		</PageDialog>
	)
}
