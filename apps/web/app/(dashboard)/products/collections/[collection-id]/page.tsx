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
	collectionFormDefaultValues,
	initCollection,
	initCollectionFormValues,
	initCollectionPayload,
} from "@/modules/product/collection/init"
import {
	getCreateCollectionMutationOptions,
	getProductCollectionQueryOptions,
	getUpdateCollectionMutationOptions,
} from "@/modules/product/collection/actions"
import { productCollectionSchema } from "@/modules/product/collection/schema"
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
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"

const collectionFormSchema = productCollectionSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
})

type CollectionFormValues = z.input<typeof collectionFormSchema>
type CollectionSubmitValues = z.output<typeof collectionFormSchema>

export default function EditCollectionPage() {
	const router = useRouter()
	const queryClient = useQueryClient()
	const params = useParams()
	const collectionId = params?.["collection-id"]?.toString() ?? ""
	const isEdit = collectionId !== "create"

	const form = useForm<CollectionFormValues>({
		resolver: zodResolver(collectionFormSchema),
		defaultValues: collectionFormDefaultValues,
	})

	const { data: collection, isLoading } = useQuery({
		...getProductCollectionQueryOptions(collectionId),
		enabled: isEdit,
	})

	React.useEffect(() => {
		if (!isEdit) {
			form.reset(collectionFormDefaultValues)
			return
		}

		if (!collection) return

		form.reset(initCollectionFormValues(collection))
	}, [collection, form, isEdit])

	const { isPending: isUpdating, mutate: updateCollection } = useMutation({
		...getUpdateCollectionMutationOptions({
			collectionId,
			queryClient,
			onSuccess: () => router.back(),
		}),
	})

	const { isPending: isCreating, mutate: createCollection } = useMutation({
		...getCreateCollectionMutationOptions({
			queryClient,
			onSuccess: () => router.back(),
		}),
	})

	const handleSubmit = React.useCallback(
		(values: CollectionFormValues) => {
			const normalizedValues = initCollectionPayload(
				collectionFormSchema.parse(values) as CollectionSubmitValues
			)

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
				<Field<CollectionFormValues>
					name="collectionName"
					control={form.control}
					label="اسم المجموعة"
					placeholder="أدخل اسم المجموعة"
					inputProps={{ disabled: isSubmitting }}
				/>

				<Field<CollectionFormValues>
					name="collectionSlug"
					control={form.control}
					label="الرابط"
					placeholder="أدخل الرابط"
					inputProps={{ disabled: isSubmitting }}
				/>

				<UiField data-invalid={Boolean(form.formState.errors.collectionType)}>
					<FieldLabel htmlFor="collectionType">نوع المجموعة</FieldLabel>
					<Controller
						name="collectionType"
						control={form.control}
						render={({ field }) => (
							<Select
								disabled={isSubmitting}
								value={field.value}
								onValueChange={field.onChange}
							>
								<SelectTrigger id="collectionType" className="h-11 w-full">
									<SelectValue placeholder="اختر نوع المجموعة" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="MANUAL">يدوية</SelectItem>
										<SelectItem value="AUTOMATIC">تلقائية</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						)}
					/>
					<FieldError errors={[form.formState.errors.collectionType]} />
				</UiField>

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
		</PageDialog>
	)
}
