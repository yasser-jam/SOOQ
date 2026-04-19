"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
import { initCategory } from "@/modules/product/category/init"
import {
	createProductCategory,
	getProductCategoryQueryOptions,
	productCategoryKeys,
	updateProductCategory,
} from "@/modules/product/category/actions"
import { productCategorySchema } from "@/modules/product/category/schema"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import {
	Field as UiField,
	FieldError,
	FieldLabel,
} from "@workspace/ui/components/field"

const categoryFormSchema = productCategorySchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).extend({
	parentCategoryId: z.preprocess(
		(value) => (value === "" ? null : value),
		z.string().trim().nullable().optional()
	),
})

type CategoryFormValues = z.infer<typeof categoryFormSchema>

export default function EditCategoryPage() {
	const router = useRouter()
	const queryClient = useQueryClient()
	const params = useParams()
	const categoryId = params?.["category-id"]?.toString() ?? ""
	const isEdit = categoryId !== "create"

	const form = useForm<CategoryFormValues>({
		resolver: zodResolver(categoryFormSchema),
		defaultValues: {
			nameAr: "",
			nameEn: "",
			slug: "",
			descriptionAr: "",
			descriptionEn: "",
			parentCategoryId: "",
			sortOrder: 0,
			isActive: true,
		},
	})

	const { data: category, isLoading } = useQuery({
		...getProductCategoryQueryOptions(categoryId),
		enabled: isEdit,
	})

	React.useEffect(() => {
		if (!isEdit) {
			form.reset({
				nameAr: "",
				nameEn: "",
				slug: "",
				descriptionAr: "",
				descriptionEn: "",
				parentCategoryId: "",
				sortOrder: 0,
				isActive: true,
			})

			return
		}

		if (!category) return

		form.reset({
			nameAr: category.nameAr,
			nameEn: category.nameEn,
			slug: category.slug,
			descriptionAr: category.descriptionAr,
			descriptionEn: category.descriptionEn,
			parentCategoryId: category.parentCategoryId ?? "",
			sortOrder: category.sortOrder,
			isActive: category.isActive,
		})
	}, [category, form, isEdit])

	const { isPending: isUpdating, mutate: updateCategory } = useMutation({
		mutationFn: updateProductCategory,
		onSuccess: (updatedCategory) => {
			queryClient.setQueryData(
				productCategoryKeys.detail(updatedCategory.id ?? categoryId),
				updatedCategory
			)
			queryClient.invalidateQueries({ queryKey: productCategoryKeys.all })
			router.back()
		},
	})

	const { isPending: isCreating, mutate: createCategory } = useMutation({
		mutationFn: createProductCategory,
		onSuccess: (createdCategory) => {
			queryClient.setQueryData(
				productCategoryKeys.detail(createdCategory.id ?? ""),
				createdCategory
			)
			queryClient.invalidateQueries({ queryKey: productCategoryKeys.all })
			router.back()
		},
	})

	const handleSubmit = React.useCallback(
		(values: CategoryFormValues) => {
			if (isEdit) {
				if (!categoryId) return

				updateCategory(initCategory(categoryId, values))

				return
			}

			createCategory(values)
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
			<form id="category-form" className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
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
					name="descriptionAr"
					control={form.control}
					label="الوصف بالعربية"
					placeholder="أدخل الوصف بالعربية"
					inputProps={{ disabled: isSubmitting }}
				/>

				<Field<CategoryFormValues>
					name="descriptionEn"
					control={form.control}
					label="الوصف بالإنجليزية"
					placeholder="أدخل الوصف بالإنجليزية"
					inputProps={{ disabled: isSubmitting }}
				/>

				<Field<CategoryFormValues>
					name="parentCategoryId"
					control={form.control}
					label="معرف الفئة الأم"
					placeholder="اتركه فارغًا للفئة الرئيسية"
					inputProps={{ disabled: isSubmitting }}
				/>

				<Field<CategoryFormValues>
					name="sortOrder"
					control={form.control}
					label="الترتيب"
					placeholder="أدخل الترتيب"
					inputProps={{
						type: "number",
						min: 0,
						step: 1,
						disabled: isSubmitting,
					}}
				/>

				<UiField data-invalid={Boolean(form.formState.errors.isActive)} className="rounded-lg border p-4">
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
