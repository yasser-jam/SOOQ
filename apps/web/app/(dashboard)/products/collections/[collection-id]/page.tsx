"use client"

import { useCallback, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import Field from "@/components/system/Field"
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/system/tabs"
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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card"
import {
	Field as UiField,
	FieldError,
	FieldLabel,
} from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"

import ManualProductsTab from "@/modules/product/collection/components/manual-products-tab"
import RulesTab from "@/modules/product/collection/components/rules-tab"
import PreviewTab from "@/modules/product/collection/components/preview-tab"

const collectionFormSchema = productCollectionSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
})

const VALID_TABS = ["info", "products", "rules", "preview"] as const
type TabValue = (typeof VALID_TABS)[number]
const isValidTab = (v: string | null): v is TabValue =>
	v !== null && (VALID_TABS as readonly string[]).includes(v)

export default function EditCollectionPage() {
	const router = useRouter()
	const queryClient = useQueryClient()
	const params = useParams()
	const searchParams = useSearchParams()
	const collectionId = params?.["collection-id"]?.toString() ?? ""
	const isEdit = collectionId !== "create"

	const tabFromUrl = searchParams?.get("tab") ?? null
	const activeTab: TabValue = isValidTab(tabFromUrl) ? tabFromUrl : "info"
	const handleTabChange = useCallback(
		(next: string) => {
			const url = new URL(window.location.href)
			if (next === "info") {
				url.searchParams.delete("tab")
			} else {
				url.searchParams.set("tab", next)
			}
			router.replace(`${url.pathname}${url.search}`, { scroll: false })
		},
		[router]
	)

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
		},
	})

	const { isPending: isCreating, mutate: createCollection } = useMutation({
		mutationFn: createProductCollection,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all })
			router.push("/products/collections")
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
	const collectionType = collection?.collectionType ?? "MANUAL"
	const isManual = collectionType === "MANUAL"
	// Both AUTOMATED (canonical, per backend) and AUTOMATIC (legacy alias).
	const isAutomated =
		collectionType === "AUTOMATED" || collectionType === "AUTOMATIC"

	return (
		<div className="container my-6 flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div className="page-title">
					{isEdit ? "تعديل المجموعة" : "إضافة مجموعة"}
				</div>
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						onClick={() => router.back()}
						disabled={isSubmitting}
					>
						إلغاء
					</Button>
					<Button
						type="submit"
						form="collection-form"
						disabled={isSubmitting}
					>
						حفظ المعلومات
					</Button>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={handleTabChange}>
				<TabsList className="self-start">
					<TabsTrigger value="info">المعلومات</TabsTrigger>
					<TabsTrigger value="products" disabled={!isEdit || !isManual}>
						منتجات يدوية
					</TabsTrigger>
					<TabsTrigger value="rules" disabled={!isEdit || !isAutomated}>
						القواعد
					</TabsTrigger>
					<TabsTrigger value="preview" disabled={!isEdit || !isAutomated}>
						معاينة
					</TabsTrigger>
				</TabsList>

				<TabsContent value="info">
					<Card>
						<CardHeader>
							<CardTitle>معلومات المجموعة</CardTitle>
							<CardDescription>
								يحدّد النوع كيفية إضافة المنتجات: يدوي (سحب وإفلات) أو
								تلقائي (قواعد).
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form
								id="collection-form"
								className="grid gap-4"
								onSubmit={form.handleSubmit(handleSubmit)}
							>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
								</div>

								<UiField
									data-invalid={Boolean(form.formState.errors.descriptionAr)}
								>
									<FieldLabel htmlFor="descriptionAr">
										الوصف بالعربية
									</FieldLabel>
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
									<FieldError
										errors={[form.formState.errors.descriptionAr]}
									/>
								</UiField>

								<UiField
									data-invalid={Boolean(form.formState.errors.descriptionEn)}
								>
									<FieldLabel htmlFor="descriptionEn">
										الوصف بالإنجليزية
									</FieldLabel>
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
									<FieldError
										errors={[form.formState.errors.descriptionEn]}
									/>
								</UiField>

								<UiField
									data-invalid={Boolean(form.formState.errors.isActive)}
									className="rounded-lg border p-4"
								>
									<FieldLabel
										htmlFor="isActive"
										className="flex w-full items-center gap-3"
									>
										<input
											id="isActive"
											type="checkbox"
											{...form.register("isActive")}
											disabled={isSubmitting}
											className="size-4"
										/>
										<div className="flex flex-col gap-1">
											<span>المجموعة نشطة</span>
											<span className="text-xs text-muted-foreground">
												إظهار المجموعة في القوائم
											</span>
										</div>
									</FieldLabel>
									<FieldError errors={[form.formState.errors.isActive]} />
								</UiField>
							</form>
						</CardContent>
					</Card>
				</TabsContent>

				{isEdit && isManual ? (
					<TabsContent value="products">
						<Card>
							<CardHeader>
								<CardTitle>المنتجات (يدوياً)</CardTitle>
								<CardDescription>
									أضِف، احذف، أو أعد ترتيب المنتجات في هذه المجموعة.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ManualProductsTab collectionId={collectionId} />
							</CardContent>
						</Card>
					</TabsContent>
				) : null}

				{isEdit && isAutomated ? (
					<>
						<TabsContent value="rules">
							<Card>
								<CardHeader>
									<CardTitle>قواعد الإضافة التلقائية</CardTitle>
									<CardDescription>
										عرّف شروط مطابقة المنتجات. اضغط "تطبيق" لحفظ المنتجات
										المطابقة في المجموعة.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<RulesTab collectionId={collectionId} />
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="preview">
							<Card>
								<CardHeader>
									<CardTitle>معاينة القواعد</CardTitle>
									<CardDescription>
										المنتجات التي ستُحفظ عند تطبيق القواعد الحالية.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<PreviewTab collectionId={collectionId} />
								</CardContent>
							</Card>
						</TabsContent>
					</>
				) : null}
			</Tabs>
		</div>
	)
}
