"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
import {
	categoryFormDefaultValues,
	initCategory,
	initCategoryPayload,
	initCategoryFormValues,
} from "@/modules/product/category/init"
import {
	getCreateCategoryMutationOptions,
	getProductCategoryQueryOptions,
	getUpdateCategoryMutationOptions,
} from "@/modules/product/category/actions"
import { productCategorySchema } from "@/modules/product/category/schema"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import {
	Field as UiField,
	FieldError,
	FieldLabel,
} from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"

const categoryFormSchema = productCategorySchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
})

type CategoryFormValues = z.input<typeof categoryFormSchema>
type CategorySubmitValues = z.output<typeof categoryFormSchema>

export default function EditCategoryPage() {
	const router = useRouter()
	const queryClient = useQueryClient()
	const params = useParams()
	const categoryId = params?.["category-id"]?.toString() ?? ""
	const isEdit = categoryId !== "create"

	const form = useForm<CategoryFormValues>({
		resolver: zodResolver(categoryFormSchema),
		defaultValues: categoryFormDefaultValues,
	})

	const { data: category, isLoading } = useQuery({
		...getProductCategoryQueryOptions(categoryId),
		enabled: isEdit,
	})

	React.useEffect(() => {
		if (!isEdit) {
			form.reset(categoryFormDefaultValues)

			return
		}

		if (!category) return

		form.reset(initCategoryFormValues(category))
	}, [category, form, isEdit])

	const { isPending: isUpdating, mutate: updateCategory } = useMutation({
		...getUpdateCategoryMutationOptions({
			categoryId,
			queryClient,
			onSuccess: () => router.back(),
		}),
	})

	const { isPending: isCreating, mutate: createCategory } = useMutation({
		...getCreateCategoryMutationOptions({
			queryClient,
			onSuccess: () => router.back(),
		}),
	})

	const handleSubmit = React.useCallback(
		(values: CategoryFormValues) => {
			const normalizedValues = initCategoryPayload(
				categoryFormSchema.parse(values) as CategorySubmitValues
			)

			if (isEdit) {
				if (!categoryId) return

				updateCategory(initCategory(categoryId, normalizedValues))

				return
			}

			createCategory(normalizedValues)
		},
		[categoryId, createCategory, isEdit, updateCategory]
	)

	const isSubmitting = isUpdating || isLoading || isCreating

	return (
		<PageDialog
			open
			onOpenChange={(open) => {
				if (!open) {
					router.back()
				}
			}}
			size="sm"
			title={isEdit ? "تعديل الفئة" : "إضافة فئة"}
			actions={
				<>
					<DialogClose asChild>
						<Button variant="outline">إلغاء</Button>
					</DialogClose>

					<Button type="submit" form="category-form" disabled={isSubmitting}>
						حفظ
					</Button>
				</>
			}
		>
			<form
				id="category-form"
				className="grid grid-cols-1 gap-4 md:grid-cols-2"
				onSubmit={form.handleSubmit(handleSubmit)}
			>
				<Field<CategoryFormValues>
					name="nameAr"
					control={form.control}
					label="الاسم بالعربية"
					placeholder="أدخل الاسم بالعربية"
					inputProps={{ disabled: isSubmitting }}
				/>

				<Field<CategoryFormValues>
					name="nameEn"
					control={form.control}
					label="الاسم بالإنجليزية"
					placeholder="أدخل الاسم بالإنجليزية"
					inputProps={{ disabled: isSubmitting }}
				/>

				<Field<CategoryFormValues>
					name="slug"
					control={form.control}
					label="الاسم المختصر"
					placeholder="أدخل الاسم المختصر"
					inputProps={{ disabled: isSubmitting }}
				/>

				<Field<CategoryFormValues>
					name="parentCategoryId"
					control={form.control}
					label="معرف الفئة الأم"
					placeholder="اتركه فارغًا للفئة الرئيسية"
					inputProps={{ disabled: isSubmitting }}
				/>

				<UiField data-invalid={Boolean(form.formState.errors.descriptionAr)}>
					<FieldLabel htmlFor="descriptionAr">الوصف بالعربية</FieldLabel>
					<Controller
						name="descriptionAr"
						control={form.control}
						render={({ field }) => (
							<Textarea
								{...field}
								id="descriptionAr"
								placeholder="أدخل الوصف بالعربية"
								disabled={isSubmitting}
								className="min-h-24"
							/>
						)}
					/>
					<FieldError errors={[form.formState.errors.descriptionAr]} />
				</UiField>

				<UiField data-invalid={Boolean(form.formState.errors.descriptionEn)}>
					<FieldLabel htmlFor="descriptionEn">الوصف بالإنجليزية</FieldLabel>
					<Controller
						name="descriptionEn"
						control={form.control}
						render={({ field }) => (
							<Textarea
								{...field}
								id="descriptionEn"
								placeholder="أدخل الوصف بالإنجليزية"
								disabled={isSubmitting}
								className="min-h-24"
							/>
						)}
					/>
					<FieldError errors={[form.formState.errors.descriptionEn]} />
				</UiField>

				<UiField
					data-invalid={Boolean(form.formState.errors.isActive)}
					className="rounded-lg border p-4 md:col-span-2"
				>
					<FieldLabel htmlFor="isActive" className="flex w-full items-center gap-3">
						<input
							id="isActive"
							type="checkbox"
							{...form.register("isActive")}
							disabled={isSubmitting}
							className="size-4"
						/>
						<div className="flex flex-col gap-1">
							<span>الفئة نشطة</span>
							<span className="text-xs text-muted-foreground">إظهار الفئة في القوائم</span>
						</div>
					</FieldLabel>
					<FieldError errors={[form.formState.errors.isActive]} />
				</UiField>
			</form>
		</PageDialog>
	)
}
