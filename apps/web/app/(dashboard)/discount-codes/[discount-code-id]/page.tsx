"use client"

import { useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

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

				<div className="grid gap-4 sm:grid-cols-2">
					<Field
						name="startsAt"
						control={form.control}
						label="تاريخ البداية"
						inputProps={{
							type: "datetime-local",
							disabled: isSubmitting,
						}}
					/>

					<Field
						name="expiresAt"
						control={form.control}
						label="تاريخ الانتهاء"
						inputProps={{
							type: "datetime-local",
							disabled: isSubmitting,
						}}
					/>
				</div>
			</form>
		</PageDialog>
	)
}
