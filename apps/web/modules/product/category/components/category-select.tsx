"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import {
	Controller,
	type Control,
	type FieldPath,
	type FieldValues,
} from "react-hook-form"

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

import {
	getProductCategory,
	listProductCategories,
	productCategoryKeys,
} from "../actions"

type ProductCategorySelectProps<T extends FieldValues> = {
	name: FieldPath<T>
	control: Control<T>
	label: string
	placeholder?: string
	initialValue?: string | null
	excludedCategoryIds?: Array<string | null | undefined>
	disabled?: boolean
	emptyLabel?: string
}

const EMPTY_VALUE = "__root__"

export default function ProductCategorySelect<T extends FieldValues>({
	name,
	control,
	label,
	placeholder = "اختر الفئة الأم",
	initialValue,
	excludedCategoryIds = [],
	disabled,
	emptyLabel = "بدون",
}: ProductCategorySelectProps<T>) {
	const fieldId = String(name)
	const initialCategoryId = initialValue?.trim() ?? ""
	const hasInitialValue = initialCategoryId.length > 0

	const { data: categories, isPending: isPendingCategories } = useQuery({
		queryKey: productCategoryKeys.all,
		queryFn: listProductCategories,
		enabled: !hasInitialValue,
	})

	const { data: initialCategory, isPending: isPendingInitialCategory } = useQuery({
		queryKey: productCategoryKeys.detail(initialCategoryId),
		queryFn: () => getProductCategory(initialCategoryId),
		enabled: hasInitialValue,
	})

	const isPending = hasInitialValue ? isPendingInitialCategory : isPendingCategories
	const isFieldLocked = hasInitialValue

	const excludedIds = useMemo(
		() => new Set(excludedCategoryIds.filter(Boolean)),
		[excludedCategoryIds]
	)

	const availableCategories = useMemo(() => {
		if (hasInitialValue) {
			return initialCategory ? [initialCategory] : []
		}

		return (categories ?? []).filter((category) => !excludedIds.has(category.id ?? ""))
	}, [categories, excludedIds, hasInitialValue, initialCategory])

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<UiField data-invalid={fieldState.invalid}>
					<FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
					<Select
						value={isFieldLocked ? initialCategoryId : (field.value ?? EMPTY_VALUE)}
						onValueChange={(value) => field.onChange(value === EMPTY_VALUE ? null : value)}
						disabled={disabled || isPending || isFieldLocked}
					>
						<SelectTrigger id={fieldId} className="h-11 w-full">
							<SelectValue placeholder={placeholder} />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{!isFieldLocked ? <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem> : null}
								{isPending ? (
									<SelectItem value="__loading__" disabled>
										<span className="inline-flex items-center gap-2">
											<Loader2 className="size-4 animate-spin" />
											جاري تحميل الفئات...
										</span>
									</SelectItem>
								) : (
									availableCategories.map((category) => (
										<SelectItem key={category.id} value={category.id ?? ""}>
											{category.nameAr}
										</SelectItem>
									))
								)}
							</SelectGroup>
						</SelectContent>
					</Select>
					<FieldError errors={[fieldState.error]} />
				</UiField>
			)}
		/>
	)
}