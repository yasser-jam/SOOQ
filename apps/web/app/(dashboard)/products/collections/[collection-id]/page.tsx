"use client"

import { useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
import {
	collectionFormDefaultValues,
	initCollection,
	initCollectionFormValues,
	initCollectionPayload,
} from "@/modules/product/collection/init"
import {
	createProductCollection,
	getProductCollection,
	updateProductCollection,
} from "@/modules/product/collection/actions"
import { collectionQueryKeys } from "@/modules/product/collection/queryKeys"
import { productCollectionSchema } from "@/modules/product/collection/schema"
import { ProductCollection } from "@/modules/product/collection/types"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import {
	Field as UiField,
	FieldError,
	FieldLabel,
} from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"
import { Textarea } from "@workspace/ui/components/textarea"
import { useState } from "react"

import RulesList from "@/modules/product/collection/components/rules-list"
import RuleDialog from "@/modules/product/collection/components/rule-dialog"

const collectionFormSchema = productCollectionSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
})

export default function EditCollectionPage() {

	const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false)
	const router = useRouter()
	const queryClient = useQueryClient()
	const params = useParams()
	const collectionId = params?.["collection-id"]?.toString() ?? ""
	const isEdit = collectionId !== "create"

	const form = useForm<ProductCollection>({
		resolver: zodResolver(collectionFormSchema),
		defaultValues: collectionFormDefaultValues,
	})

	const { data: collection, isLoading } = useQuery({
		queryKey: collectionQueryKeys.detail(collectionId),
		queryFn: () => getProductCollection(collectionId),
		enabled: isEdit,
	})

	useEffect(() => {
		if (!isEdit) {
			form.reset(collectionFormDefaultValues)
			return
		}

		if (!collection) return

		form.reset(initCollectionFormValues(collection))
	}, [collection, form, isEdit])

	const { isPending: isUpdating, mutate: updateCollection } = useMutation({
		mutationFn: updateProductCollection,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all })
			router.push('/products/collections')
		},
	})

	const { isPending: isCreating, mutate: createCollection } = useMutation({
		mutationFn: createProductCollection,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all })
			router.push('/products/collections')
		},
	})

	const handleSubmit = useCallback(
		(values: ProductCollection) => {
			const normalizedValues = initCollectionPayload(values)

			if (isEdit) {
				if (!collectionId) return
				updateCollection(initCollection(collectionId, normalizedValues))
				return
			}

			createCollection(normalizedValues)
		},
		[collectionId, createCollection, isEdit, updateCollection]
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
			title={isEdit ? "تعديل المجموعة" : "إضافة مجموعة"}
			actions={
				<>
					<DialogClose asChild>
						<Button variant="outline">إلغاء</Button>
					</DialogClose>

					<Button type="submit" form="collection-form" disabled={isSubmitting}>
						حفظ
					</Button>
				</>
			}
		>
			<form
				id="collection-form"
				className="grid gap-4"
				onSubmit={form.handleSubmit(handleSubmit)}
			>
				<Field
					name="collectionName"
					control={form.control}
					label="اسم المجموعة"
					placeholder="أدخل اسم المجموعة"
					inputProps={{ disabled: isSubmitting }}
				/>

				<Field
					name="collectionSlug"
					control={form.control}
					label="الرابط"
					placeholder="أدخل الرابط"
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
					className="rounded-lg border p-4"
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
							<span>المجموعة نشطة</span>
							<span className="text-xs text-muted-foreground">إظهار المجموعة في القوائم</span>
						</div>
					</FieldLabel>
					<FieldError errors={[form.formState.errors.isActive]} />
				</UiField>
			</form>

			{isEdit && collection && (
				<div className="mt-4">
					<RulesList collectionId={collection.id} onCreate={() => setIsRuleDialogOpen(true)} />
					<RuleDialog
						collectionId={collection.id}
						open={isRuleDialogOpen}
						onOpenChange={(v) => setIsRuleDialogOpen(v)}
					/>
				</div>
			)}
		</PageDialog>
	)
}
