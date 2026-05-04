import type {
	AdminOrder,
	AdminOrderItem,
	AdminOrderListItem,
	AdminOrderNote,
	AdminOrderPricing,
	AdminOrderTimelineEvent,
	AdminOrdersSummary,
	ListAdminOrdersParams,
	OrderPaymentMethod,
	OrderStatus,
	PaginatedApiResponse,
} from "../types"

type MockOrderItemSeed = {
	variantId: string
	title: string
	variantTitle: string
	sku: string
	quantity: number
	unitPrice: number
	imageUrl?: string | null
}

type MockOrderSeed = {
	id: string
	orderNumber: string
	status: OrderStatus
	placedAt: string
	customer: {
		id: string
		name: string
		email: string
		phone: string
		avatarUrl?: string | null
	}
	shippingAddress: {
		country: string
		governorate: string
		city: string
		district: string
		street: string
		details?: string | null
	}
	paymentMethod: OrderPaymentMethod
	items: MockOrderItemSeed[]
	shippingCost: number
	taxAmount: number
	notesInternal?: string | null
	notesCustomer?: string | null
}

const STATUS_FLOW: OrderStatus[] = [
	"PENDING",
	"CONFIRMED",
	"PROCESSING",
	"SHIPPED",
	"DELIVERED",
	"COMPLETED",
]

const STATUS_EVENT_META: Record<
	OrderStatus,
	{ eventType: string; title: string; description: string }
> = {
	PENDING: {
		eventType: "ORDER_CREATED",
		title: "تم إنشاء الطلب",
		description: "تم تسجيل الطلب وبانتظار المراجعة الأولية.",
	},
	CONFIRMED: {
		eventType: "CONFIRMED",
		title: "تم تأكيد الطلب",
		description: "تمت مراجعة الطلب وتأكيده.",
	},
	PROCESSING: {
		eventType: "PROCESSING",
		title: "الطلب قيد المعالجة",
		description: "يتم تجهيز الأصناف للشحن.",
	},
	SHIPPED: {
		eventType: "SHIPPED",
		title: "تم شحن الطلب",
		description: "تم تسليم الطلب إلى شركة الشحن.",
	},
	DELIVERED: {
		eventType: "DELIVERED",
		title: "تم تسليم الطلب",
		description: "تم تسليم الطلب بنجاح إلى العميل.",
	},
	COMPLETED: {
		eventType: "COMPLETED",
		title: "تم إكمال الطلب",
		description: "اكتمل الطلب وأُغلق.",
	},
	CANCELLED: {
		eventType: "CANCELLED",
		title: "تم إلغاء الطلب",
		description: "تم إلغاء الطلب قبل اكتمال الشحن.",
	},
	RETURNED: {
		eventType: "RETURNED",
		title: "تم إرجاع الطلب",
		description: "اكتملت عملية الإرجاع وتمت المعالجة.",
	},
	REFUNDED: {
		eventType: "REFUNDED",
		title: "تم استرداد الطلب",
		description: "تم استرداد قيمة الطلب للعميل.",
	},
	FAILED: {
		eventType: "FAILED",
		title: "فشل الطلب",
		description: "فشل تنفيذ الطلب.",
	},
}

const ORDER_SEEDS: MockOrderSeed[] = [
	{
		id: "ord_1001",
		orderNumber: "SOOQ-1001",
		status: "PENDING",
		placedAt: "2026-04-22T08:15:00.000Z",
		customer: {
			id: "cus_1001",
			name: "لينا أحمد",
			email: "lina.ahmad@example.com",
			phone: "+963933100001",
			avatarUrl: null,
		},
		shippingAddress: {
			country: "Syria",
			governorate: "Damascus",
			city: "دمشق",
			district: "المزة",
			street: "شارع الجلاء",
			details: "بجانب الصيدلية المركزية",
		},
		paymentMethod: "COD",
		items: [
			{
				variantId: "var_case_01",
				title: "غطاء هاتف",
				variantTitle: "أسود",
				sku: "CASE-BLK-01",
				quantity: 2,
				unitPrice: 25000,
			},
			{
				variantId: "var_charger_01",
				title: "شاحن سريع",
				variantTitle: "20W",
				sku: "CHG-20W-01",
				quantity: 1,
				unitPrice: 55000,
			},
		],
		shippingCost: 12000,
		taxAmount: 5000,
		notesInternal: "عميل جديد، تأكيد العنوان قبل الشحن.",
		notesCustomer: "يرجى الاتصال قبل التسليم.",
	},
	{
		id: "ord_1002",
		orderNumber: "SOOQ-1002",
		status: "PENDING",
		placedAt: "2026-04-22T07:40:00.000Z",
		customer: {
			id: "cus_1002",
			name: "محمد زيدان",
			email: "m.zidan@example.com",
			phone: "+963933100002",
			avatarUrl: null,
		},
		shippingAddress: {
			country: "Syria",
			governorate: "Rif Dimashq",
			city: "جرمانا",
			district: "الروضة",
			street: "شارع المدارس",
		},
		paymentMethod: "PAYMERA",
		items: [
			{
				variantId: "var_headset_01",
				title: "سماعة لاسلكية",
				variantTitle: "أبيض",
				sku: "EAR-WHT-01",
				quantity: 1,
				unitPrice: 95000,
			},
		],
		shippingCost: 10000,
		taxAmount: 7000,
		notesInternal: "الدفع الإلكتروني قيد التحقق.",
	},
	{
		id: "ord_1003",
		orderNumber: "SOOQ-1003",
		status: "CONFIRMED",
		placedAt: "2026-04-21T14:10:00.000Z",
		customer: {
			id: "cus_1003",
			name: "سارة الخطيب",
			email: "sara.khatib@example.com",
			phone: "+963933100003",
			avatarUrl: null,
		},
		shippingAddress: {
			country: "Syria",
			governorate: "Aleppo",
			city: "حلب",
			district: "الجميلية",
			street: "شارع فيصل",
		},
		paymentMethod: "COD",
		items: [
			{
				variantId: "var_bag_01",
				title: "حقيبة ظهر",
				variantTitle: "رمادي",
				sku: "BAG-GRY-01",
				quantity: 1,
				unitPrice: 115000,
			},
			{
				variantId: "var_bottle_01",
				title: "قارورة مياه",
				variantTitle: "750ml",
				sku: "BOT-750-01",
				quantity: 2,
				unitPrice: 18000,
			},
		],
		shippingCost: 14000,
		taxAmount: 8000,
	},
	{
		id: "ord_1004",
		orderNumber: "SOOQ-1004",
		status: "PROCESSING",
		placedAt: "2026-04-21T10:55:00.000Z",
		customer: {
			id: "cus_1004",
			name: "عمر السالم",
			email: "omar.salem@example.com",
			phone: "+963933100004",
			avatarUrl: null,
		},
		shippingAddress: {
			country: "Syria",
			governorate: "Homs",
			city: "حمص",
			district: "عكرمة",
			street: "شارع الحضارة",
		},
		paymentMethod: "COD",
		items: [
			{
				variantId: "var_watch_01",
				title: "ساعة ذكية",
				variantTitle: "أسود",
				sku: "SWT-BLK-01",
				quantity: 1,
				unitPrice: 220000,
			},
		],
		shippingCost: 16000,
		taxAmount: 12000,
	},
	{
		id: "ord_1005",
		orderNumber: "SOOQ-1005",
		status: "SHIPPED",
		placedAt: "2026-04-20T16:20:00.000Z",
		customer: {
			id: "cus_1005",
			name: "نور علي",
			email: "noor.ali@example.com",
			phone: "+963933100005",
			avatarUrl: null,
		},
		shippingAddress: {
			country: "Syria",
			governorate: "Latakia",
			city: "اللاذقية",
			district: "الصليبة",
			street: "شارع بغداد",
		},
		paymentMethod: "PAYMERA",
		items: [
			{
				variantId: "var_lamp_01",
				title: "مصباح مكتبي",
				variantTitle: "أبيض",
				sku: "LMP-WHT-01",
				quantity: 1,
				unitPrice: 67000,
			},
			{
				variantId: "var_notebook_01",
				title: "دفتر ملاحظات",
				variantTitle: "A5",
				sku: "NBK-A5-01",
				quantity: 3,
				unitPrice: 9000,
			},
		],
		shippingCost: 9000,
		taxAmount: 4000,
	},
	{
		id: "ord_1006",
		orderNumber: "SOOQ-1006",
		status: "COMPLETED",
		placedAt: "2026-04-20T09:30:00.000Z",
		customer: {
			id: "cus_1006",
			name: "ريما يوسف",
			email: "rima.yousef@example.com",
			phone: "+963933100006",
			avatarUrl: null,
		},
		shippingAddress: {
			country: "Syria",
			governorate: "Tartus",
			city: "طرطوس",
			district: "الكورنيش",
			street: "شارع الثورة",
		},
		paymentMethod: "COD",
		items: [
			{
				variantId: "var_speaker_01",
				title: "مكبر صوت بلوتوث",
				variantTitle: "أزرق",
				sku: "SPK-BLU-01",
				quantity: 1,
				unitPrice: 125000,
			},
		],
		shippingCost: 13000,
		taxAmount: 9000,
	},
	{
		id: "ord_1007",
		orderNumber: "SOOQ-1007",
		status: "DELIVERED",
		placedAt: "2026-04-19T13:00:00.000Z",
		customer: {
			id: "cus_1007",
			name: "كريم حداد",
			email: "karim.haddad@example.com",
			phone: "+963933100007",
			avatarUrl: null,
		},
		shippingAddress: {
			country: "Syria",
			governorate: "Damascus",
			city: "دمشق",
			district: "أبو رمانة",
			street: "شارع المالكي",
		},
		paymentMethod: "PAYMERA",
		items: [
			{
				variantId: "var_keyboard_01",
				title: "لوحة مفاتيح",
				variantTitle: "ميكانيكية",
				sku: "KEY-MEC-01",
				quantity: 1,
				unitPrice: 150000,
			},
			{
				variantId: "var_mouse_01",
				title: "فأرة لاسلكية",
				variantTitle: "رمادي",
				sku: "MSE-GRY-01",
				quantity: 1,
				unitPrice: 65000,
			},
		],
		shippingCost: 11000,
		taxAmount: 7000,
	},
	{
		id: "ord_1008",
		orderNumber: "SOOQ-1008",
		status: "CANCELLED",
		placedAt: "2026-04-19T08:25:00.000Z",
		customer: {
			id: "cus_1008",
			name: "هبة ناصر",
			email: "hiba.nasser@example.com",
			phone: "+963933100008",
			avatarUrl: null,
		},
		shippingAddress: {
			country: "Syria",
			governorate: "Hama",
			city: "حماة",
			district: "القصور",
			street: "شارع النواعير",
		},
		paymentMethod: "COD",
		items: [
			{
				variantId: "var_tripod_01",
				title: "حامل ثلاثي",
				variantTitle: "قياسي",
				sku: "TRI-STD-01",
				quantity: 1,
				unitPrice: 48000,
			},
		],
		shippingCost: 8000,
		taxAmount: 3000,
		notesInternal: "تم الإلغاء بسبب عدم توفر المخزون.",
	},
	{
		id: "ord_1009",
		orderNumber: "SOOQ-1009",
		status: "REFUNDED",
		placedAt: "2026-04-18T11:50:00.000Z",
		customer: {
			id: "cus_1009",
			name: "يزن درويش",
			email: "yazan.darwish@example.com",
			phone: "+963933100009",
			avatarUrl: null,
		},
		shippingAddress: {
			country: "Syria",
			governorate: "Aleppo",
			city: "حلب",
			district: "الفرقان",
			street: "شارع النيل",
		},
		paymentMethod: "COD",
		items: [
			{
				variantId: "var_router_01",
				title: "راوتر منزلي",
				variantTitle: "Dual Band",
				sku: "RTR-DB-01",
				quantity: 1,
				unitPrice: 135000,
			},
		],
		shippingCost: 12000,
		taxAmount: 6000,
		notesCustomer: "المنتج لا يطابق الوصف.",
	},
	{
		id: "ord_1010",
		orderNumber: "SOOQ-1010",
		status: "RETURNED",
		placedAt: "2026-04-18T09:10:00.000Z",
		customer: {
			id: "cus_1010",
			name: "ميساء شريف",
			email: "maysa.sharif@example.com",
			phone: "+963933100010",
			avatarUrl: null,
		},
		shippingAddress: {
			country: "Syria",
			governorate: "Rif Dimashq",
			city: "صحنايا",
			district: "البلد",
			street: "الشارع الرئيسي",
		},
		paymentMethod: "PAYMERA",
		items: [
			{
				variantId: "var_blender_01",
				title: "خلاط كهربائي",
				variantTitle: "1.5L",
				sku: "BLD-15-01",
				quantity: 1,
				unitPrice: 175000,
			},
		],
		shippingCost: 15000,
		taxAmount: 9000,
		notesInternal: "اكتمل فحص المنتج المرتجع.",
	},
	{
		id: "ord_1011",
		orderNumber: "SOOQ-1011",
		status: "DELIVERED",
		placedAt: "2026-04-17T15:45:00.000Z",
		customer: {
			id: "cus_1011",
			name: "جودت صباغ",
			email: "jawdat.sabbagh@example.com",
			phone: "+963933100011",
			avatarUrl: null,
		},
		shippingAddress: {
			country: "Syria",
			governorate: "Damascus",
			city: "دمشق",
			district: "ركن الدين",
			street: "شارع أسد الدين",
		},
		paymentMethod: "COD",
		items: [
			{
				variantId: "var_mug_01",
				title: "كوب حراري",
				variantTitle: "أحمر",
				sku: "MUG-RED-01",
				quantity: 2,
				unitPrice: 22000,
			},
			{
				variantId: "var_bag_02",
				title: "حقيبة لابتوب",
				variantTitle: "15 inch",
				sku: "BAG-LTP-01",
				quantity: 1,
				unitPrice: 98000,
			},
		],
		shippingCost: 10000,
		taxAmount: 5000,
	},
	{
		id: "ord_1012",
		orderNumber: "SOOQ-1012",
		status: "CONFIRMED",
		placedAt: "2026-04-17T09:05:00.000Z",
		customer: {
			id: "cus_1012",
			name: "آية سليمان",
			email: "aya.suleiman@example.com",
			phone: "+963933100012",
			avatarUrl: null,
		},
		shippingAddress: {
			country: "Syria",
			governorate: "Idlib",
			city: "إدلب",
			district: "المركز",
			street: "شارع الجامعة",
		},
		paymentMethod: "PAYMERA",
		items: [
			{
				variantId: "var_ring_01",
				title: "حامل هاتف",
				variantTitle: "معدني",
				sku: "RNG-MTL-01",
				quantity: 3,
				unitPrice: 15000,
			},
			{
				variantId: "var_cable_01",
				title: "كابل شحن",
				variantTitle: "USB-C",
				sku: "CBL-USBC-01",
				quantity: 2,
				unitPrice: 12000,
			},
		],
		shippingCost: 9000,
		taxAmount: 4000,
	},
]

const getStageStatuses = (status: OrderStatus): OrderStatus[] => {
	if (status === "CANCELLED") {
		return ["PENDING", "CANCELLED"]
	}

	if (status === "RETURNED") {
		return [...STATUS_FLOW.slice(0, STATUS_FLOW.indexOf("DELIVERED") + 1), "RETURNED"]
	}

	if (status === "REFUNDED") {
		return [
			...STATUS_FLOW.slice(0, STATUS_FLOW.indexOf("DELIVERED") + 1),
			"RETURNED",
			"REFUNDED",
		]
	}

	if (status === "FAILED") {
		return [...STATUS_FLOW.slice(0, STATUS_FLOW.indexOf("SHIPPED") + 1), "FAILED"]
	}

	return STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(status) + 1)
}

const buildPricing = (
	items: AdminOrderItem[],
	shippingCost: number,
	taxAmount: number
): AdminOrderPricing => {
	const subtotal = items.reduce(
		(sum, item) => sum + (item.totalPrice ?? item.quantity ?? 0),
		0
	)
	const total = subtotal + shippingCost + taxAmount

	return {
		subtotal,
		shippingCost,
		taxAmount,
		total,
		currencyCode: "SYP",
		subtotalLabel: `${subtotal.toLocaleString("en-US")} SYP`,
		logisticsAndTaxesLabel: `${(shippingCost + taxAmount).toLocaleString("en-US")} SYP`,
		totalLabel: `${total.toLocaleString("en-US")} SYP`,
	}
}

const buildItems = (orderId: string, items: MockOrderItemSeed[]): AdminOrderItem[] =>
	items.map((item, index) => ({
		id: `${orderId}_item_${index + 1}`,
		orderItemId: `${orderId}_item_${index + 1}`,
		variantId: item.variantId,
		title: item.title,
		productTitle: item.title,
		variantTitle: item.variantTitle,
		sku: item.sku,
		variantSku: item.sku,
		quantity: item.quantity,
		unitPrice: item.unitPrice,
		totalPrice: item.unitPrice * item.quantity,
		priceLabel: `${(item.unitPrice * item.quantity).toLocaleString("en-US")} SYP`,
		inventoryLabel: "متوفر",
		inventoryStatus: "IN_STOCK",
		thumbnailUrl: item.imageUrl ?? null,
		imageUrl: item.imageUrl ?? null,
	}))

const buildTimeline = (
	orderId: string,
	placedAt: string,
	status: OrderStatus
): AdminOrderTimelineEvent[] => {
	const stages = getStageStatuses(status)
	const placedAtDate = new Date(placedAt)

	return stages.map((stage, index) => {
		const occurredAt = new Date(placedAtDate.getTime() + index * 6 * 60 * 60 * 1000)
		const meta = STATUS_EVENT_META[stage]

		return {
			id: `${orderId}_timeline_${stage.toLowerCase()}`,
			eventId: `${orderId}_timeline_${stage.toLowerCase()}`,
			eventType: meta.eventType,
			title: meta.title,
			description: meta.description,
			details: meta.description,
			createdAt: occurredAt.toISOString(),
			occurredAt: occurredAt.toISOString(),
			timestampLabel: occurredAt.toLocaleString("en-GB"),
			isCurrent: index === stages.length - 1,
		}
	})
}

const buildNotes = (seed: MockOrderSeed): AdminOrderNote[] => {
	const placedAtDate = new Date(seed.placedAt)
	const notes: AdminOrderNote[] = []

	if (seed.notesInternal) {
		notes.push({
			id: `${seed.id}_note_internal`,
			noteId: `${seed.id}_note_internal`,
			authorRole: "ADMIN",
			authorName: "Order Admin",
			body: seed.notesInternal,
			message: seed.notesInternal,
			channel: "INTERNAL",
			createdAt: placedAtDate.toISOString(),
			updatedAt: placedAtDate.toISOString(),
			timestampLabel: placedAtDate.toLocaleString("en-GB"),
		})
	}

	if (seed.notesCustomer) {
		const customerNoteDate = new Date(placedAtDate.getTime() + 2 * 60 * 60 * 1000)

		notes.push({
			id: `${seed.id}_note_customer`,
			noteId: `${seed.id}_note_customer`,
			authorRole: "CUSTOMER",
			authorName: seed.customer.name,
			body: seed.notesCustomer,
			message: seed.notesCustomer,
			channel: "CUSTOMER",
			createdAt: customerNoteDate.toISOString(),
			updatedAt: customerNoteDate.toISOString(),
			timestampLabel: customerNoteDate.toLocaleString("en-GB"),
		})
	}

	return notes
}

const MOCK_ADMIN_ORDERS: AdminOrder[] = ORDER_SEEDS.map((seed) => {
	const items = buildItems(seed.id, seed.items)
	const pricing = buildPricing(items, seed.shippingCost, seed.taxAmount)
	const timeline = buildTimeline(seed.id, seed.placedAt, seed.status)

	return {
		id: seed.id,
		orderId: seed.id,
		orderNumber: seed.orderNumber,
		status: seed.status,
		placedAt: seed.placedAt,
		createdAt: seed.placedAt,
		currencyCode: "SYP",
		paymentMethod: seed.paymentMethod,
		customerName: seed.customer.name,
		customer: {
			id: seed.customer.id,
			customerId: seed.customer.id,
			name: seed.customer.name,
			fullName: seed.customer.name,
			email: seed.customer.email,
			phone: seed.customer.phone,
			avatarUrl: seed.customer.avatarUrl ?? null,
			createdAt: "2026-01-01T08:00:00.000Z",
			joinedAt: "2026-01-01T08:00:00.000Z",
			shippingAddress: seed.shippingAddress,
		},
		shippingAddress: {
			...seed.shippingAddress,
			name: seed.customer.name,
			phone: seed.customer.phone,
		},
		items,
		pricing,
		timeline,
		auditTrail: timeline,
		notes: buildNotes(seed),
		notesInternal: seed.notesInternal ?? null,
		notesCustomer: seed.notesCustomer ?? null,
	}
})

const compareOrderDates = (
	a: AdminOrder,
	b: AdminOrder,
	field: "placedAt" | "createdAt",
	direction: "asc" | "desc"
) => {
	const aTime = new Date(a[field] ?? "").getTime()
	const bTime = new Date(b[field] ?? "").getTime()

	return direction === "asc" ? aTime - bTime : bTime - aTime
}

const toListItem = (order: AdminOrder): AdminOrderListItem => ({
	id: order.id,
	orderId: order.orderId,
	orderNumber: order.orderNumber,
	status: order.status,
	placedAt: order.placedAt,
	createdAt: order.createdAt,
	customerName: order.customerName,
	customerAvatarUrl: order.customer?.avatarUrl ?? null,
	customer: order.customer ?? null,
})

export const getMockAdminOrdersSummary = (): AdminOrdersSummary => {
	const countBy = (status: OrderStatus) =>
		MOCK_ADMIN_ORDERS.filter((order) => order.status === status).length

	const totalRevenue = MOCK_ADMIN_ORDERS.reduce((sum, order) => {
		if (
			order.status === "CANCELLED" ||
			order.status === "RETURNED" ||
			order.status === "REFUNDED" ||
			order.status === "FAILED"
		) {
			return sum
		}

		return sum + (order.pricing?.total ?? 0)
	}, 0)

	return {
		total: MOCK_ADMIN_ORDERS.length,
		pending: countBy("PENDING"),
		confirmed: countBy("CONFIRMED"),
		processing: countBy("PROCESSING"),
		shipped: countBy("SHIPPED"),
		delivered: countBy("DELIVERED"),
		completed: countBy("COMPLETED"),
		cancelled: countBy("CANCELLED"),
		returned: countBy("RETURNED"),
		refunded: countBy("REFUNDED"),
		failed: countBy("FAILED"),
		totalRevenue,
		revenue: totalRevenue,
		currencyCode: "SYP",
		// legacy aliases (retained for transitional callers)
		totalOrders: MOCK_ADMIN_ORDERS.length,
		returnsCount: countBy("RETURNED") + countBy("REFUNDED"),
		inDeliveryCount: countBy("SHIPPED"),
	}
}

export const listMockAdminOrders = (
	params: ListAdminOrdersParams = {}
): PaginatedApiResponse<AdminOrderListItem> => {
	const page = Math.max(0, params.page ?? 0)
	const size = Math.max(1, params.size ?? 10)
	const [sortFieldRaw, sortDirectionRaw] = (params.sort ?? "placedAt,desc").split(",")
	const sortField = sortFieldRaw === "createdAt" ? "createdAt" : "placedAt"
	const sortDirection = sortDirectionRaw === "asc" ? "asc" : "desc"

	const filteredOrders = MOCK_ADMIN_ORDERS.filter((order) =>
		params.status ? order.status === params.status : true
	).sort((a, b) => compareOrderDates(a, b, sortField, sortDirection))

	const totalItems = filteredOrders.length
	const totalPages = Math.max(1, Math.ceil(totalItems / size))
	const start = page * size
	const content = filteredOrders.slice(start, start + size).map(toListItem)

	return {
		content,
		items: content,
		totalElements: totalItems,
		totalItems,
		totalPages,
		page,
		number: page,
		size,
	}
}

export const getMockAdminOrder = (id: string): AdminOrder | undefined =>
	MOCK_ADMIN_ORDERS.find(
		(order) =>
			order.id === id || order.orderId === id || order.orderNumber === id
	)

export const getMockAdminOrderTimeline = (
	id: string
): AdminOrderTimelineEvent[] | undefined =>
	getMockAdminOrder(id)?.timeline ?? getMockAdminOrder(id)?.auditTrail
