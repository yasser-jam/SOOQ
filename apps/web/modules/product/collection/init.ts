import type {
	CreateProductCollectionInput,
	UpdateProductCollectionInput,
} from "./actions"
import type { ProductCollection } from "./types"

export const collectionFormDefaultValues: CreateProductCollectionInput = {
	collectionName: "",
	collectionSlug: "",
	collectionType: "MANUAL",
	descriptionAr: "",
	descriptionEn: "",
	isActive: true,
}

export const initCollectionFormValues = (
	collection?: ProductCollection | null
): CreateProductCollectionInput => {
	if (!collection) {
		return { ...collectionFormDefaultValues }
	}

	return {
		collectionName: collection.collectionName,
		collectionSlug: collection.collectionSlug,
		collectionType: collection.collectionType,
		descriptionAr: collection.descriptionAr,
		descriptionEn: collection.descriptionEn,
		isActive: collection.isActive,
	}
}

export const initCollection = (
	id: string,
	data: CreateProductCollectionInput
): UpdateProductCollectionInput => ({
	id,
	data,
})

export const initCollectionPayload = (
	data: CreateProductCollectionInput
): CreateProductCollectionInput => ({
	...data,
})
