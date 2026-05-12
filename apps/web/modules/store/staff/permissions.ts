// Source of truth: SOOQ-Back AuthPermissionCatalog.ASSIGNABLE_STAFF_PERMISSIONS.
// Keep this list in sync — any value not in the backend set is rejected with
// 400 ERR_1001 "Invalid permission".
export const ASSIGNABLE_PERMISSIONS = [
  "products:read",
  "products:write",
  "inventory:read",
  "inventory:write",
  "orders:read",
  "orders:update",
  "shipping:read",
  "shipping:write",
  "analytics:read",
] as const

export type AssignablePermission = (typeof ASSIGNABLE_PERMISSIONS)[number]

export type PermissionMeta = {
  value: AssignablePermission
  label: string
  description: string
}

export type PermissionGroup = {
  key: string
  title: string
  permissions: PermissionMeta[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "products",
    title: "المنتجات",
    permissions: [
      {
        value: "products:read",
        label: "عرض المنتجات",
        description: "عرض المنتجات والفئات والوسوم والمجموعات.",
      },
      {
        value: "products:write",
        label: "تعديل المنتجات",
        description: "إنشاء/تعديل/حذف المنتجات والفئات والوسوم والمجموعات.",
      },
    ],
  },
  {
    key: "inventory",
    title: "المخزون",
    permissions: [
      {
        value: "inventory:read",
        label: "عرض المخزون",
        description: "عرض مستويات المخزون.",
      },
      {
        value: "inventory:write",
        label: "تعديل المخزون",
        description: "ضبط الكميات وتسجيل الحركات.",
      },
    ],
  },
  {
    key: "orders",
    title: "الطلبات",
    permissions: [
      {
        value: "orders:read",
        label: "عرض الطلبات",
        description: "عرض الطلبات وتفاصيلها.",
      },
      {
        value: "orders:update",
        label: "تحديث الطلبات",
        description: "تحديث حالة الطلبات.",
      },
    ],
  },
  {
    key: "shipping",
    title: "الشحن",
    permissions: [
      {
        value: "shipping:read",
        label: "عرض الشحن",
        description: "عرض مزوّدي الشحن والشحنات وتتبّعها.",
      },
      {
        value: "shipping:write",
        label: "تعديل الشحن",
        description: "إدارة مزوّدي الشحن وتحديث حالة الشحنات.",
      },
    ],
  },
  {
    key: "analytics",
    title: "التحليلات",
    permissions: [
      {
        value: "analytics:read",
        label: "عرض التحليلات",
        description: "عرض لوحة التحليلات والتقارير.",
      },
    ],
  },
]

export const isAssignablePermission = (
  value: string
): value is AssignablePermission =>
  (ASSIGNABLE_PERMISSIONS as readonly string[]).includes(value)
