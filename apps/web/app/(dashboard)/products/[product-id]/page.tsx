"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Plus, Trash2Icon } from "lucide-react"
import { z } from "zod"

import Field from "@/components/system/Field"
import {
	getCreateProductMutationOptions,
	getProductQueryOptions,
	getUpdateProductMutationOptions,
} from "@/modules/product/product/actions"
import {
	initProduct,
	initProductFormValues,
	initProductPayload,
	productFormDefaultValues,
} from "@/modules/product/product/init"
import { productSchema } from "@/modules/product/product/schema"
import { listProductCategoriesQueryOptions } from "@/modules/product/category/actions"
import { listProductTagsQueryOptions } from "@/modules/product/tag/actions"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog"
import {
	Field as UiField,
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldSet,
	FieldTitle,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"

const productFormSchema = productSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
})

const optionDialogSchema = z.object({
	optionNameAr: z.string().trim().min(1, "اسم الخيار بالعربية مطلوب"),
	optionNameEn: z.string().trim().min(1, "اسم الخيار بالإنجليزية مطلوب"),
	valuesAr: z.string().trim().min(1, "أضف قيمة واحدة على الأقل"),
	valuesEn: z.string().trim().min(1, "أضف قيمة إنجليزية واحدة على الأقل"),
	colorHexes: z.string().trim().optional(),
})

type ProductFormValues = z.input<typeof productFormSchema>
type ProductSubmitValues = z.output<typeof productFormSchema>
type OptionDialogValues = z.infer<typeof optionDialogSchema>

const parseList = (value: string) =>
	value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean)

export default function ProductDetailsPage() {
	const router = useRouter()
	const queryClient = useQueryClient()
	const params = useParams()
	const productId = params?.["product-id"]?.toString() ?? ""
	const isEdit = productId !== "create"

	const [optionsDialogOpen, setOptionsDialogOpen] = React.useState(false)

	const form = useForm<ProductFormValues>({
		resolver: zodResolver(productFormSchema),
		defaultValues: productFormDefaultValues,
	})

	const optionDialogForm = useForm<OptionDialogValues>({
		resolver: zodResolver(optionDialogSchema),
		defaultValues: {
			optionNameAr: "",
			optionNameEn: "",
			valuesAr: "",
			valuesEn: "",
			colorHexes: "",
		},
	})

	const { data: product, isLoading } = useQuery({
		...getProductQueryOptions(productId),
		enabled: isEdit,
	})

	const { data: categories } = useQuery(listProductCategoriesQueryOptions())
	const { data: tags } = useQuery(listProductTagsQueryOptions())

	React.useEffect(() => {
		if (!isEdit) {
			form.reset(productFormDefaultValues)
			return
		}

		if (!product) return

		form.reset(initProductFormValues(product))
	}, [form, isEdit, product])

	const { isPending: isUpdating, mutate: updateProduct } = useMutation({
		...getUpdateProductMutationOptions({
			productId,
			queryClient,
			onSuccess: () => router.push("/products"),
		}),
	})

	const { isPending: isCreating, mutate: createProduct } = useMutation({
		...getCreateProductMutationOptions({
			queryClient,
			onSuccess: () => router.push("/products"),
		}),
	})

	const handleSubmit = React.useCallback(
		(values: ProductFormValues) => {
			const normalizedValues = initProductPayload(
				productFormSchema.parse(values) as ProductSubmitValues
			)

			if (isEdit) {
				if (!productId) return
				updateProduct(initProduct(productId, normalizedValues))
				return
			}

			createProduct(normalizedValues)
		},
		[createProduct, isEdit, productId, updateProduct]
	)

	const handleAddOption = optionDialogForm.handleSubmit((values) => {
		const parsedValuesAr = parseList(values.valuesAr)
		const parsedValuesEn = parseList(values.valuesEn)
		const parsedColorHexes = parseList(values.colorHexes ?? "")
		const currentOptions = form.getValues("options") ?? []

		form.setValue(
			"options",
			[
				...currentOptions,
				{
					optionNameAr: values.optionNameAr,
					optionNameEn: values.optionNameEn,
					sortOrder: currentOptions.length,
					values: parsedValuesAr.map((valueAr, index) => ({
						valueAr,
						valueEn: parsedValuesEn[index] ?? valueAr,
						colorHex: parsedColorHexes[index],
						sortOrder: index,
					})),
				},
			],
			{ shouldDirty: true, shouldValidate: true }
		)

		optionDialogForm.reset()
		setOptionsDialogOpen(false)
	})

	const isSubmitting = isUpdating || isLoading || isCreating

	return (
		<div className="container my-6 flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div className="page-title">{isEdit ? "تفاصيل المنتج" : "إضافة منتج"}</div>

				<div className="flex items-center gap-3">
					<Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
						إلغاء
					</Button>
					<Button type="submit" form="product-form" disabled={isSubmitting}>
						حفظ
					</Button>
				</div>
			</div>

			<form
				id="product-form"
				className="grid grid-cols-1 gap-4 xl:grid-cols-3"
				onSubmit={form.handleSubmit(handleSubmit)}
			>
				<div className="flex flex-col gap-4 xl:col-span-2">
					<Card className="h-full">
						<CardHeader>
							<CardTitle className="text-2xl">معلومات أساسية</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<Field<ProductFormValues>
									name="titleAr"
									control={form.control}
									label="العنوان بالعربية"
									placeholder="أدخل العنوان بالعربية"
									inputProps={{ disabled: isSubmitting }}
								/>

								<Field<ProductFormValues>
									name="titleEn"
									control={form.control}
									label="العنوان بالإنجليزية"
									placeholder="أدخل العنوان بالإنجليزية"
									inputProps={{ disabled: isSubmitting }}
								/>

								<Field<ProductFormValues>
									name="slug"
									control={form.control}
									label="الرابط"
									placeholder="أدخل رابط المنتج"
									inputProps={{ disabled: isSubmitting }}
								/>

								<UiField data-invalid={Boolean(form.formState.errors.status)}>
									<FieldLabel htmlFor="status">الحالة</FieldLabel>
									<Controller
										name="status"
										control={form.control}
										render={({ field }) => (
											<Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
												<SelectTrigger id="status" className="h-11 w-full">
													<SelectValue placeholder="اختر الحالة" />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														<SelectItem value="DRAFT">مسودة</SelectItem>
														<SelectItem value="ACTIVE">نشط</SelectItem>
														<SelectItem value="ARCHIVED">مؤرشف</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
										)}
									/>
									<FieldError errors={[form.formState.errors.status]} />
								</UiField>

								<UiField data-invalid={Boolean(form.formState.errors.descriptionAr)}>
									<FieldLabel htmlFor="descriptionAr">الوصف بالعربية</FieldLabel>
									<Controller
										name="descriptionAr"
										control={form.control}
										render={({ field }) => (
											<Textarea
												{...field}
												value={field.value ?? ""}
												id="descriptionAr"
												placeholder="أدخل الوصف بالعربية"
												disabled={isSubmitting}
												rows={4}
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
												value={field.value ?? ""}
												id="descriptionEn"
												placeholder="أدخل الوصف بالإنجليزية"
												disabled={isSubmitting}
												rows={4}
												className="min-h-24"
											/>
										)}
									/>
									<FieldError errors={[form.formState.errors.descriptionEn]} />
								</UiField>
							</div>
						</CardContent>
					</Card>

					<Card className="h-full">
						<CardHeader>
							<CardTitle className="text-2xl">التسعير</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-4">
								<UiField data-invalid={Boolean(form.formState.errors.basePrice)}>
									<FieldLabel htmlFor="basePrice">السعر الأساسي</FieldLabel>
									<Controller
										name="basePrice"
										control={form.control}
										render={({ field }) => (
											<Input
												id="basePrice"
												type="number"
												value={Number(field.value ?? 0)}
												onChange={(event) => field.onChange(Number(event.target.value))}
												disabled={isSubmitting}
											/>
										)}
									/>
									<FieldError errors={[form.formState.errors.basePrice]} />
								</UiField>

								<UiField data-invalid={Boolean(form.formState.errors.compareAtPrice)}>
									<FieldLabel htmlFor="compareAtPrice">سعر المقارنة</FieldLabel>
									<Controller
										name="compareAtPrice"
										control={form.control}
										render={({ field }) => (
											<Input
												id="compareAtPrice"
												type="number"
												value={Number(field.value ?? 0)}
												onChange={(event) => field.onChange(Number(event.target.value))}
												disabled={isSubmitting}
											/>
										)}
									/>
									<FieldError errors={[form.formState.errors.compareAtPrice]} />
								</UiField>

								<UiField data-invalid={Boolean(form.formState.errors.currencyCode)}>
									<FieldLabel htmlFor="currencyCode">العملة</FieldLabel>
									<Controller
										name="currencyCode"
										control={form.control}
										render={({ field }) => (
											<Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
												<SelectTrigger id="currencyCode" className="h-11 w-full">
													<SelectValue placeholder="اختر العملة" />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														<SelectItem value="SYP">SYP</SelectItem>
														<SelectItem value="USD">USD</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
										)}
									/>
									<FieldError errors={[form.formState.errors.currencyCode]} />
								</UiField>

								<UiField data-invalid={Boolean(form.formState.errors.allowOversell)} className="rounded-lg border p-4">
									<FieldLabel htmlFor="allowOversell" className="flex w-full items-center gap-3">
										<input
											id="allowOversell"
											type="checkbox"
											{...form.register("allowOversell")}
											disabled={isSubmitting}
											className="size-4"
										/>
										<div className="flex flex-col gap-1">
											<span>السماح بالبيع عند نفاد المخزون</span>
										</div>
									</FieldLabel>
									<FieldError errors={[form.formState.errors.allowOversell]} />
								</UiField>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="flex flex-col gap-4 xl:col-span-1">
					<Card>
						<CardHeader>
							<CardTitle className="text-2xl">الفئات</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-4">
								<UiField data-invalid={Boolean(form.formState.errors.defaultCategoryId)}>
									<FieldLabel htmlFor="defaultCategoryId">الفئة الافتراضية</FieldLabel>
									<Controller
										name="defaultCategoryId"
										control={form.control}
										render={({ field }) => (
											<Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)} disabled={isSubmitting}>
												<SelectTrigger id="defaultCategoryId" className="h-11 w-full">
													<SelectValue placeholder="اختر الفئة الافتراضية" />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														<SelectItem value="__none__">بدون</SelectItem>
														{(categories ?? []).map((category) => (
															<SelectItem key={category.id} value={category.id ?? ""}>
																{category.nameAr}
															</SelectItem>
														))}
													</SelectGroup>
												</SelectContent>
											</Select>
										)}
									/>
									<FieldError errors={[form.formState.errors.defaultCategoryId]} />
								</UiField>

								<Controller
									name="categoryIds"
									control={form.control}
									render={({ field }) => (
										<FieldSet>
											<FieldTitle>الفئات</FieldTitle>
											<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
												{(categories ?? []).map((category) => {
													const currentValues = field.value ?? []
													const checked = currentValues.includes(category.id ?? "")

													return (
														<label key={category.id} className="flex items-center gap-2 rounded-lg border border-secondary/20 bg-secondary/5 p-3 text-sm transition-colors hover:bg-secondary/10">
															<input
																type="checkbox"
																className="size-4"
																disabled={isSubmitting}
																checked={checked}
																onChange={(event) => {
																	if (!category.id) return

																	if (event.target.checked) {
																		field.onChange([...currentValues, category.id])
																		return
																	}

																	field.onChange(currentValues.filter((id) => id !== category.id))
																}}
															/>
															<span>{category.nameAr}</span>
														</label>
													)
												})}
											</div>
											<FieldDescription>يمكنك اختيار أكثر من فئة</FieldDescription>
											<FieldError errors={[form.formState.errors.categoryIds]} />
										</FieldSet>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-2xl">الوسوم</CardTitle>
						</CardHeader>
						<CardContent>
							<Controller
								name="tagIds"
								control={form.control}
								render={({ field }) => (
									<FieldSet>
										<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
											{(tags ?? []).map((tag) => {
												const currentValues = field.value ?? []
												const checked = currentValues.includes(tag.id ?? "")

												return (
													<label key={tag.id} className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm transition-colors hover:bg-primary/10">
														<input
															type="checkbox"
															className="size-4"
															disabled={isSubmitting}
															checked={checked}
															onChange={(event) => {
																if (!tag.id) return

																if (event.target.checked) {
																	field.onChange([...currentValues, tag.id])
																	return
																}

																field.onChange(currentValues.filter((id) => id !== tag.id))
															}}
														/>
														<span>{tag.tagName}</span>
													</label>
												)
											})}
										</div>
									</FieldSet>
								)}
							/>
							<FieldError errors={[form.formState.errors.tagIds]} />
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-2xl">إعدادات الSEO</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-4">
								<Field<ProductFormValues>
									name="seoTitle"
									control={form.control}
									label="عنوان SEO"
									placeholder="أدخل عنوان SEO"
									inputProps={{ disabled: isSubmitting }}
								/>

								<UiField data-invalid={Boolean(form.formState.errors.seoDescription)}>
									<FieldLabel htmlFor="seoDescription">وصف SEO</FieldLabel>
									<Controller
										name="seoDescription"
										control={form.control}
										render={({ field }) => (
											<Textarea
												{...field}
												id="seoDescription"
												placeholder="أدخل وصف SEO"
												disabled={isSubmitting}
												className="min-h-24"
											/>
										)}
									/>
									<FieldError errors={[form.formState.errors.seoDescription]} />
								</UiField>
							</div>
						</CardContent>
					</Card>
				</div>

				<Card className="xl:col-span-3">
					<CardHeader>
						<CardTitle className="text-2xl">خيارات المنتج</CardTitle>
						<CardAction>
							<Button
								type="button"
								variant="secondary"
								onClick={() => setOptionsDialogOpen(true)}
								disabled={isSubmitting}
							>
								إضافة خيار
								<Plus data-icon="inline-end" />
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent>
						<Controller
							name="options"
							control={form.control}
							render={({ field }) => (
								<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
									{(field.value ?? []).map((option, optionIndex) => (
										<Card key={`${option.optionNameAr}-${optionIndex}`} size="sm">
											<CardHeader>
												<CardTitle className="text-lg">{option.optionNameAr}</CardTitle>
												<CardDescription>{option.optionNameEn}</CardDescription>
												<CardAction>
													<Button
														type="button"
														variant="destructive"
														size="icon"
														onClick={() => {
															const nextOptions = (field.value ?? []).filter((_, index) => index !== optionIndex)
															field.onChange(nextOptions)
														}}
														disabled={isSubmitting}
													>
														<Trash2Icon data-icon="inline-start" className="p-0.5" />
													</Button>
												</CardAction>
											</CardHeader>
											<CardContent>
												<div className="flex flex-wrap gap-2">
													{option.values.map((value, valueIndex) => (
														<Badge key={`${value.valueAr}-${valueIndex}`} variant="secondary">
															{value.valueAr}
															{value.colorHex ? ` (${value.colorHex})` : ""}
														</Badge>
													))}
												</div>
											</CardContent>
										</Card>
									))}

									{!(field.value ?? []).length && (
										<div className="rounded-lg border p-4 text-sm text-muted-foreground">
											لا يوجد خيارات مضافة بعد.
										</div>
									)}
								</div>
							)}
						/>
						<FieldError errors={[form.formState.errors.options]} />
					</CardContent>
				</Card>
			</form>

			<Dialog open={optionsDialogOpen} onOpenChange={setOptionsDialogOpen}>
				<DialogContent size="sm" showCloseButton={!isSubmitting}>
					<DialogHeader>
						<DialogTitle>إضافة خيار</DialogTitle>
					</DialogHeader>

					<form id="add-option-form" className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleAddOption}>
						<Field<OptionDialogValues>
							name="optionNameAr"
							control={optionDialogForm.control}
							label="اسم الخيار بالعربية"
							placeholder="مثال: اللون"
							inputProps={{ disabled: isSubmitting }}
						/>

						<Field<OptionDialogValues>
							name="optionNameEn"
							control={optionDialogForm.control}
							label="اسم الخيار بالإنجليزية"
							placeholder="Example: Color"
							inputProps={{ disabled: isSubmitting }}
						/>

						<Field<OptionDialogValues>
							name="valuesAr"
							control={optionDialogForm.control}
							label="القيم بالعربية"
							placeholder="أحمر, أزرق"
							inputProps={{ disabled: isSubmitting }}
						/>

						<Field<OptionDialogValues>
							name="valuesEn"
							control={optionDialogForm.control}
							label="القيم بالإنجليزية"
							placeholder="Red, Blue"
							inputProps={{ disabled: isSubmitting }}
						/>

						<Field<OptionDialogValues>
							name="colorHexes"
							control={optionDialogForm.control}
							label="Color Hex (اختياري)"
							inputProps={{ disabled: isSubmitting, type: "color" }}
						/>
					</form>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setOptionsDialogOpen(false)} disabled={isSubmitting}>
							إلغاء
						</Button>
						<Button type="submit" form="add-option-form" disabled={isSubmitting}>
							إضافة
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
