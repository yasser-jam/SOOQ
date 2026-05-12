export const ASSIGNABLE_PERMISSIONS = [
  "products:read",
  "products:write",
  "inventory:read",
  "inventory:write",
  "orders:read",
  "orders:update",
  "shipments:read",
  "shipments:update",
  "settings:write",
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
    key: "shipments",
    title: "الشحن",
    permissions: [
      {
        value: "shipments:read",
        label: "عرض الشحنات",
        description: "عرض الشحنات وتتبّعها.",
      },
      {
        value: "shipments:update",
        label: "تحديث الشحنات",
        description: "تحديث حالة الشحنات.",
      },
    ],
  },
  {
    key: "settings",
    title: "إعدادات المتجر",
    permissions: [
      {
        value: "settings:write",
        label: "تعديل الإعدادات",
        description: "تعديل إعدادات المتجر العامة.",
      },
    ],
  },
]

export const isAssignablePermission = (
  value: string
): value is AssignablePermission =>
  (ASSIGNABLE_PERMISSIONS as readonly string[]).includes(value)
