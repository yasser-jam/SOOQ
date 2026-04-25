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
import { CategoryTreePopover } from "./category-tree-popover"
import {
	buildCategoryNameMap,
	filterCategoryTree,
	toStringValue,
} from "./category-select.utils"

type ProductCategorySelectProps<T extends FieldValues> = {
	name: FieldPath<T>
	control: Control<T>
	label: string
	placeholder?: string
	initialValue?: string | null
	excludedCategoryIds?: Array<string | null | undefined>
	disabled?: boolean
	emptyLabel?: string
	subrowKeys?: string
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
	subrowKeys,
}: ProductCategorySelectProps<T>) {
	const fieldId = String(name)
	const initialCategoryId = initialValue?.trim() ?? ""
	const hasInitialValue = initialCategoryId.length > 0

	// Fetch list mode or single-item mode depending on whether parent is fixed.
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
		() => new Set(excludedCategoryIds.filter((id): id is string => Boolean(id))),
		[excludedCategoryIds]
	)

	const availableCategories = useMemo(() => {
		if (hasInitialValue) {
			return initialCategory ? [initialCategory] : []
		}

		return filterCategoryTree(categories ?? [], excludedIds, subrowKeys)
	}, [categories, excludedIds, hasInitialValue, initialCategory, subrowKeys])

	const categoryNamesById = useMemo(() => {
		return buildCategoryNameMap(availableCategories, subrowKeys)
	}, [availableCategories, subrowKeys])

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<UiField data-invalid={fieldState.invalid}>
					<FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
					{subrowKeys ? (
						<CategoryTreePopover
							id={fieldId}
							disabled={disabled}
							isPending={isPending}
							isFieldLocked={isFieldLocked}
							placeholder={placeholder}
							emptyLabel={emptyLabel}
							subrowKeys={subrowKeys}
							categories={availableCategories}
							selectedValue={isFieldLocked ? initialCategoryId : toStringValue(field.value)}
							selectedLabel={
								isFieldLocked
									? categoryNamesById.get(initialCategoryId)
									: categoryNamesById.get(toStringValue(field.value))
							}
							onSelect={(value) => field.onChange(value)}
							onClear={() => field.onChange(null)}
						/>
					) : (
						// Flat mode keeps current behavior for callers that do not pass subrowKeys.
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
					)}
					<FieldError errors={[fieldState.error]} />
				</UiField>
			)}
		/>
	)
}