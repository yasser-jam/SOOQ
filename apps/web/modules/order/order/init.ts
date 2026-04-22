import type {
	CancelOrderPayload,
	CancelOrderInput,
	EditOrderInput,
	EditOrderPayload,
	TransitionOrderStatusInput,
	TransitionOrderStatusPayload,
	UpdateOrderNotesInput,
	UpdateOrderNotesPayload,
} from "./types"

export const initOrderTransition = (
	id: string,
	data: TransitionOrderStatusPayload
): TransitionOrderStatusInput => ({
	id,
	data,
})

export const initOrderCancel = (
	id: string,
	data: CancelOrderPayload
): CancelOrderInput => ({
	id,
	data,
})

export const initOrderNotes = (
	id: string,
	data: UpdateOrderNotesPayload
): UpdateOrderNotesInput => ({
	id,
	data,
})

export const initOrderEdit = (
	id: string,
	data: EditOrderPayload
): EditOrderInput => ({
	id,
	data,
})
