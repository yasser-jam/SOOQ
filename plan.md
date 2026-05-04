# خطة تنفيذ وحدات ORD + PAY + SHP في SOOQ-Front

**المرجع:** `SOOQ-Back/docs/FRONTEND_PAGES_ORD_PAY_SHP.md`
**النطاق:** Merchant Admin Panel (هذا التطبيق الحالي `apps/web`). الـ Customer Storefront يُعالج كنطاق منفصل في Phase 12.
**اللغة:** RTL عربي افتراضي + English switcher.
**العملة:** SYP (أعداد صحيحة فقط).
**عدد الـ endpoints:** ORD = 29، PAY = 13، SHP = 18.

---

## مخطط الحالة الحالية vs المطلوبة

| الوحدة | الموجود حالياً في `modules/` | الحالة | الفجوات |
|---|---|---|---|
| ORD — orders | `order/order` | mock + جزئي | enum غير محاذٍ، أزرار الإجراءات الشرطية غير مكتملة، لا يوجد invoice/shipment widget |
| ORD — discount codes | — | غير موجود | إنشاء كامل |
| ORD — invoices | — | غير موجود | إنشاء كامل |
| ORD — invoice layout profiles | — | غير موجود | إنشاء كامل |
| PAY — payment providers | — | غير موجود | إنشاء كامل |
| PAY — refunds | — | غير موجود | إنشاء كامل |
| SHP — providers | `shipping/provider` | موجود | محاذاة الـ DTO، write-only credentials |
| SHP — shipments | `shipping/shipment` | موجود | الربط مع transition → PROCESSING |
| SHP — COD reconciliation | `shipping/cod` | موجود | محاذاة + batch detail |
| SHP — tracking widget | — | غير موجود | إضافة في Order Detail |

---

## Phase 0 — البنية التحتية المشتركة (Cross-cutting)

**الهدف:** تجهيز الأساس التقني قبل البدء بأي وحدة.

### المهام
1. **محاذاة `lib/api.ts` مع envelope الـ backend**
   - تعريف `ApiEnvelope<T> = { success, data, message, timestamp, errorCode?, fieldErrors? }`.
   - استخراج `data` تلقائياً في الـ interceptor، وإرجاع كائن الخطأ المُهيكل (`errorCode`, `fieldErrors`) عند الفشل.
   - `lib/types.ts`: تحديث `ApiResponse<T>` ليطابق هذا الشكل.

2. **حقن `X-Tenant-Id` لمسارات `/public/**`**
   - قراءة `tenantId` من cookie أو env (`NEXT_PUBLIC_TENANT_ID` للتطوير).
   - request interceptor: إذا بدأ الـ URL بـ `/public/`، يضيف `X-Tenant-Id` (لا يضيف `Authorization`).
   - دالة منفصلة `publicApi()` في `lib/api.ts` لتمييز الاستدعاءات.

3. **خرائط enums مشتركة**
   - ملف جديد `lib/domain-enums.ts`:
     - `OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "RETURNED" | "REFUNDED" | "FAILED"`
     - `PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED"`
     - `ShipmentStatus = "PENDING" | "PICKED_UP" | "IN_TRANSIT" | "READY_FOR_PICKUP_AT_OFFICE" | "DELIVERED" | "FAILED" | "RETURNED"`
     - `SettlementStatus = "PENDING" | "SETTLED" | "DISPUTED"`
   - meta map لكل enum (label عربي + variant للـ Badge).

4. **خريطة أكواد الأخطاء → رسائل عربية**
   - `lib/error-codes.ts`: `ERR_1003`, `ERR_2001`, `ERR_3001`, `ERR_8000–ERR_8005`, `RESOURCE_NOT_FOUND`.
   - دالة `humanizeError(errorCode, fallback)` تُستخدم في كل الـ mutations.

5. **مساعدات Money + Pagination**
   - `lib/money.ts`: `formatSyp(amount: number)` — أعداد صحيحة فقط، `Intl.NumberFormat("ar-SY", { style: "currency", currency: "SYP", maximumFractionDigits: 0 })`.
   - `lib/pagination.ts`: تطبيع استجابة Spring `Page<T>` (`content[]`, `totalElements`, `totalPages`, `number`, `size`) إلى شكل موحّد للـ DataTable.

6. **مكوّن خريطة (Map) عام**
   - `components/system/map-pin.tsx`: عرض pin على إحداثيات معطاة (read-only) — Leaflet.
   - `components/system/map-pin-picker.tsx`: التقاط الإحداثيات بالنقر (للـ checkout/edit address) — يُستخدم لاحقاً في Phase 12.

### معايير القبول
- كل استدعاء API يمر عبر `api()` يُرجع `data` مباشرة بدون تكرار `.data ?? {}`.
- `/public/**` يتضمن تلقائياً `X-Tenant-Id`.
- الـ enums متطابقة 100% مع الـ backend.

---

## Phase 1 — ORD: محاذاة وحدة الطلبات الحالية

**الهدف:** إصلاح الـ enum + إعادة هيكلة الإجراءات حسب الـ backend الفعلي.

### المهام
1. **تحديث [schema.ts](apps/web/modules/order/order/schema.ts)**
   - حذف: `NEW`, `OUT_FOR_DELIVERY`, `RETURN_REQUESTED`.
   - إضافة: `COMPLETED`, `REFUNDED`, `FAILED`.
   - إضافة `paymentStatus` إلى `orderSchema` (`UNPAID | PENDING | PAID | FAILED | REFUNDED`).

2. **تحديث [model.ts](apps/web/modules/order/order/model.ts)**
   - إعادة بناء `ORDER_LIST_STATUS_META` للحالات الجديدة بترجمة عربية.
   - إضافة `ORDER_PAYMENT_STATUS_META`.

3. **تحديث [types.ts](apps/web/modules/order/order/types.ts)**
   - إضافة `paymentStatus`, `paymentRedirectUrl?`, `invoiceNumber?`, `invoicePdfUrl?` إلى `AdminOrder`.
   - `AdminOrderShippingAddress`: إضافة `latitude: number, longitude: number, recipientName: string, addressLabel?: string` وحذف `country/governorate/city/district/street` (الـ backend يستخدم إحداثيات فقط).
   - `AdminOrdersSummary`: إضافة حقول لكل حالة (`pending, confirmed, processing, shipped, delivered, completed, cancelled, returned, refunded, failed, total`).

4. **تحديث [actions.ts](apps/web/modules/order/order/actions.ts)**
   - مطابقة كل endpoint مع الجدول في A1–A3:
     - `GET /admin/orders/summary`
     - `GET /admin/orders` (مع `status`, `page`, `size`, `sort`)
     - `GET /admin/orders/{id}`
     - `GET /admin/orders/{id}/timeline`
     - `POST /admin/orders/{id}/transition` body `{ targetStatus }`
     - `POST /admin/orders/{id}/cancel` body `{ reason }`
     - `PUT /admin/orders/{id}/notes` body `{ notesInternal?, notesCustomer? }` (`null` = لا تغيير، `""` = مسح)
     - `PUT /admin/orders/{id}/edit` body `{ items[], shippingAddress }`

5. **حذف `apis/mock-service.ts` بعد ربط الـ backend** (تركه مؤقتاً مع flag `USE_MOCK` خلال التطوير).

### معايير القبول
- جميع الـ TypeScript types تُترجم بدون أخطاء.
- استدعاء `/admin/orders/summary` على الـ backend يُرجع نفس الشكل المتوقع.

---

## Phase 2 — ORD: Orders Dashboard + List (A1, A2)

**الهدف:** صفحة لوحة الطلبات + جدول مع فلترة.

### المهام
1. **بطاقات Dashboard في [view.tsx](apps/web/modules/order/order/components/view.tsx)**
   - بطاقة لكل حالة (10 بطاقات بدلاً من 4 الحالية): pending, confirmed, processing, shipped, delivered, completed, cancelled, returned, refunded, failed، + بطاقة "الإجمالي".
   - اقتراح: عرضها كـ `grid-cols-2 md:grid-cols-3 xl:grid-cols-5`.
   - النقر على بطاقة → التنقل إلى `/orders?status=<STATUS>`.

2. **فلترة الجدول بـ status من الـ URL search params**
   - استخدام `useSearchParams` في `view.tsx`.
   - إزالة التبويب الثنائي (`activeTab`) الحالي واستبداله بـ chips فلترة كاملة (10 حالات).

3. **جدول الطلبات [table.tsx](apps/web/modules/order/order/components/table.tsx)**
   - أعمدة جديدة: `orderNumber, customer, itemCount, total (SYP), status, paymentStatus, placedAt`.
   - إضافة `itemCount` إلى `AdminOrderListItem` و عرضه بدون per-row fetch.
   - شريط بحث client-side على `orderNumber`.

4. **Pagination حقيقية**
   - تمرير `pageIndex/pageSize/sort` إلى `listAdminOrders` مع التحديث في URL.

### معايير القبول
- النقر على بطاقة "Pending" → يظهر URL `?status=PENDING` والجدول يُفلتر.
- العمود `itemCount` يظهر "3 عناصر" بدون استدعاء إضافي.

---

## Phase 3 — ORD: Order Detail + Action Buttons (A3)

**الهدف:** صفحة تفاصيل كاملة مع منطق الأزرار الشرطية + tracking widget.

### المهام
1. **مصفوفة الأزرار حسب الحالة في [order-details-actions.tsx](apps/web/modules/order/order/components/order-details-actions.tsx)**
   - دالة `getAvailableActions(status)` تُرجع قائمة بالأزرار المسموحة:
     | زر | يظهر عند |
     |---|---|
     | تأكيد | `PENDING` |
     | بدء المعالجة | `CONFIRMED` (يستدعي إنشاء shipment تلقائياً — Phase 9) |
     | تم الشحن | `PROCESSING` |
     | تم التسليم | `SHIPPED` |
     | إكمال | `DELIVERED` |
     | فشل | `SHIPPED` |
     | مرتجع | `DELIVERED` |
     | استرداد | `RETURNED` (أو استخدم Refund flow A8 من Phase 6) |
     | إلغاء | `PENDING/CONFIRMED/PROCESSING` |
     | تعديل | `PENDING/CONFIRMED` |
     | توليد فاتورة | أي حالة (idempotent) |
     | بدء استرداد | `DELIVERED/COMPLETED` |

2. **بطاقة عنوان الشحن مع mini map**
   - مكوّن جديد `order-address-card.tsx` يستخدم `MapPin` من Phase 0.
   - عرض `recipientName, phone, addressLabel, latitude, longitude`.

3. **بطاقة الدفع**
   - مكوّن جديد `order-payment-card.tsx`: `paymentMethod`, `paymentStatus` (Badge ملوّن)، `paymeraTxnId` إن وجد.

4. **بطاقة الفاتورة (Phase 4 dependency)**
   - إذا `invoiceNumber` و `invoicePdfUrl` موجودان → "تنزيل الفاتورة" (link مباشر).
   - إذا غير موجود → زر "توليد الفاتورة" → `POST /admin/invoices/generate/{orderId}`.

5. **Shipment Tracking Widget داخل الصفحة**
   - مكوّن جديد `order-shipment-tracking-card.tsx` يستدعي `GET /public/shipping/track/{orderId}`.
   - 404 → عرض placeholder "بانتظار الشحن".

6. **بطاقة Notes**
   - إصلاح [order-internal-notes-card.tsx](apps/web/modules/order/order/components/order-internal-notes-card.tsx) ليرسل فقط الحقل المُعدَّل (`null` لعدم التغيير، `""` للمسح).

7. **Edit Dialog**
   - إعادة كتابة [order-edit-page.tsx](apps/web/modules/order/order/components/order-edit-page.tsx):
     - إرسال **كامل** `items[]` (يستبدل القائمة).
     - `shippingAddress` ككائن واحد بإحداثيات.

8. **Cancel Dialog**
   - [order-cancel-page.tsx](apps/web/modules/order/order/components/order-cancel-page.tsx) يرسل `{ reason }`.

9. **Timeline**
   - تحديث [order-audit-timeline-card.tsx](apps/web/modules/order/order/components/order-audit-timeline-card.tsx) لمعالجة event types: `ORDER_CREATED, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, COMPLETED, CANCELLED (details.reason), NOTES_UPDATED, ORDER_EDITED (details.editedFields)`.

### معايير القبول
- زر "تأكيد" يظهر فقط عندما `status === "PENDING"`.
- النقر على "بدء المعالجة" يستدعي `transition` ثم يفتح dialog إنشاء shipment.
- خرائط lat/lng تُعرض داخل بطاقة العنوان.

---

## Phase 4 — ORD: Discount Codes (A4)

**الهدف:** CRUD كامل لأكواد الخصم.

### المهام
1. **إنشاء وحدة `modules/order/discount-code/`**
   - `types.ts`: `DiscountCode { id, code, discountType: "PERCENTAGE"|"FIXED_AMOUNT"|"FREE_SHIPPING", value, minOrder, cap, usageLimit, currentUses, scope: "ALL"|"PRODUCT"|"CATEGORY", scopeIds[], startsAt, endsAt, isActive }`.
   - `schema.ts`: zod schema للنموذج.
   - `actions.ts`: `listDiscountCodes`, `getDiscountCode`, `createDiscountCode`, `updateDiscountCode`, `deleteDiscountCode`.
   - `queryKeys.ts`.

2. **الصفحات**
   - `app/(dashboard)/discount-codes/page.tsx` → list
   - `app/(dashboard)/discount-codes/new/page.tsx` → create form
   - `app/(dashboard)/discount-codes/[id]/page.tsx` → edit form

3. **مكوّنات**
   - `components/discount-codes-table.tsx`: badge "نشط/منتهي"، progress bar `currentUses / usageLimit`.
   - `components/discount-code-form.tsx`: حقل code (auto-uppercase preview)، type selector، scope picker (مع dropdown للمنتجات/الفئات).

4. **قواعد**
   - عند التعديل: `code` و `discountType` immutable (تعطيل الحقول).

### معايير القبول
- إنشاء كود `10OFF` بنوع PERCENTAGE = 10% يعمل ويظهر في القائمة.
- soft-delete يخفي الكود من القائمة.

---

## Phase 5 — ORD: Invoice Layout Profiles (A5)

**الهدف:** محرّر بصري لقوالب PDF الفاتورة.

### المهام
1. **إنشاء وحدة `modules/order/invoice-layout/`**
   - `types.ts`: `InvoiceLayoutProfile { id, name, isDefault, headerText, footerText, storeName, colorScheme, logoUrl, visibleFieldsJson }`.
   - `actions.ts`: 5 endpoints.

2. **الصفحات**
   - `app/(dashboard)/invoice-layouts/page.tsx` → list
   - `app/(dashboard)/invoice-layouts/[id]/page.tsx` → editor

3. **محرّر**
   - رفع شعار (يستخدم نفس logic رفع صور المنتج إن وجد، أو إنشاء `lib/upload.ts`).
   - color picker (مكوّن `<Input type="color">` + hex preview).
   - مفاتيح Toggle لكل حقل في `visibleFieldsJson` (19 toggle): `showLogo, showStoreName, showOrderNumber, showOrderDate, showCustomerName, showCustomerPhone, showShippingAddress, showSku, showUnitPrice, showQuantity, showItemDiscount, showSubtotal, showTaxBreakdown, showShippingCost, showDiscountTotal, showPaymentMethod, showPaymentStatus, showPaymeraRrn, showNotes`.
   - حقل text لـ `headerText`, `footerText`, `storeName`.

4. **منطق `isDefault`**
   - تحويل profile إلى default يلغي default السابق تلقائياً (الـ backend يتعامل مع ذلك).
   - عرض شارة "الافتراضي" على البطاقة.

5. **Live preview** (اختياري في v1، يمكن تأجيله): مربع يحاكي شكل الفاتورة بناءً على القيم الحالية.

### معايير القبول
- إنشاء profile جديد، تعيينه default، توليد فاتورة لطلب → الفاتورة تستخدم الإعدادات الجديدة.

---

## Phase 6 — ORD: Invoices (A6)

**الهدف:** صفحة قائمة + ربط أزرار التوليد في Order Detail.

### المهام
1. **إنشاء وحدة `modules/order/invoice/`**
   - `actions.ts`: `listInvoices`, `generateInvoice(orderId)`, `regenerateInvoice(orderId)`.

2. **الصفحات**
   - `app/(dashboard)/invoices/page.tsx` → جدول كل الفواتير مع روابط تنزيل.

3. **الربط في Order Detail (Phase 3)**
   - زر "توليد" / "إعادة توليد" / "تنزيل" حسب وجود `invoiceNumber`.
   - "إعادة التوليد" يُستخدم بعد تغيير layout profile.

### معايير القبول
- توليد فاتورة لطلب يظهر الـ PDF رابط مباشرةً.
- إعادة التوليد تُنشئ ملف جديد و تُلغي الـ soft-delete على القديم.

---

## Phase 7 — PAY: Payment Providers Configuration (A7)

**الهدف:** صفحة إعدادات بوابات الدفع.

### المهام
1. **إنشاء وحدة `modules/payment/provider/`**
   - `types.ts`: `PaymentProvider { id, providerCode: "COD"|"PAYMERA"|..., displayName, isEnabled, hasApiKey, hasWebhookSecret, settingsJson }`.
   - `actions.ts`: 5 endpoints.

2. **الصفحات**
   - `app/(dashboard)/payment-providers/page.tsx` → list + add/edit form.

3. **النماذج الحساسة لكل provider**
   - `COD`: toggle `enabled` فقط.
   - `PAYMERA`: حقول `terminalId, username, password, environment (test|prod), savedCards, merchantDisplayName, settlementCurrency`.
   - الـ credentials غير مُرجعة من API → عرض `hasApiKey: ✓` فقط مع زر "تعديل" يفتح dialog إعادة الإدخال.

4. **منطق التشفير على الواجهة**
   - الـ password يُرسل عند الإدخال فقط، لا يُجلَب أبداً.

### معايير القبول
- إعداد PAYMERA test يعمل والـ checkout يستخدم البيانات.
- إعادة فتح الصفحة لا تظهر `password` في النموذج (مفرّغ).

---

## Phase 8 — PAY: Refunds (A8)

**الهدف:** قائمة الاستردادات + modal بدء استرداد من Order Detail.

### المهام
1. **إنشاء وحدة `modules/payment/refund/`**
   - `types.ts`: `Refund { id, orderId, refundAmount, reason, status: "PENDING"|"COMPLETED"|"FAILED", createdAt, paymeraRrn? }`.
   - `actions.ts`: `listRefunds`, `getRefundForOrder(orderId)`, `createRefund({ orderId, refundAmount, reason })`.

2. **الصفحات**
   - `app/(dashboard)/refunds/page.tsx` → list مع فلتر status.

3. **Modal من Order Detail**
   - يظهر زر "بدء استرداد" عند `DELIVERED` أو `COMPLETED`.
   - حقول: `refundAmount` (مع validation ≤ order.total)، `reason`.
   - PAYMERA → عرض النتيجة sync.
   - COD → toast "تم تسجيل الاسترداد كقيد دفترية".

4. **بعد النجاح**
   - تحديث `paymentStatus` للطلب إلى `REFUNDED` تلقائياً (الـ backend).
   - invalidate query keys: `orderQueryKeys.detail(orderId)` + `refundQueryKeys.all`.

### معايير القبول
- بدء استرداد لطلب PAYMERA → النتيجة تظهر فوراً، حالة الطلب تتحدث.

---

## Phase 9 — SHP: محاذاة Shipping Providers + Shipments + COD

**الهدف:** ربط الوحدات الموجودة بالـ backend الحقيقي + إكمال الفجوات.

### المهام
1. **Shipping Providers (A9)** — `modules/shipping/provider/`
   - مراجعة [actions.ts](apps/web/modules/shipping/provider/actions.ts) لتطابق `/admin/shipping/providers/*`.
   - النموذج: `providerCode, nameAr, nameEn, apiBaseUrl, apiKey (write-only), webhookSecret (write-only), priority, isActive`.
   - الترتيب في القائمة بحسب `priority DESC`.
   - زر "تحديث المفتاح" يفتح dialog منفصل (نمط Phase 7).

2. **Shipments (A10)** — `modules/shipping/shipment/`
   - مراجعة `actions.ts` لتطابق `/admin/shipping/shipments/*`.
   - **Auto-create shipment dialog** يفتح من Order Detail عند اختيار "بدء المعالجة":
     - Read-only: `orderId`, `expectedCodAmountSyp` (= `order.total` if COD، وإلا `null`).
     - User input: `shippingProviderId` (dropdown من active providers، مرتبة حسب priority، الأعلى مُختار افتراضياً).
     - `originLat/Lng`: من store settings.
     - `destinationLat/Lng`: من `order.shippingAddress`.
   - ترتيب الاستدعاء: `transition → PROCESSING` ثم `POST /admin/shipping/shipments`.
   - معالجة `ERR_8003` ("shipment already exists") بشكل لطيف.

3. **Shipment Detail Page**
   - مكوّن جديد: timeline من `GET /admin/shipping/shipments/{id}/events`.
   - عرض `carrierTrackingUrl, codAmountSyp, codCollectedAt`.
   - زر "Manual transition" (override) يفتح dialog اختيار `targetStatus` من enum الـ ShipmentStatus.

4. **Status badge map**
   - في `lib/domain-enums.ts`: ألوان كل ShipmentStatus.

### معايير القبول
- "بدء المعالجة" على طلب PENDING → ينشئ shipment مع correct provider + COD amount.
- التتبع في `/public/shipping/track/{orderId}` يعرض القيم الحقيقية.

---

## Phase 10 — SHP: COD Reconciliation (A11)

**الهدف:** إكمال صفحات تسوية COD.

### المهام
1. **List page** — `app/(dashboard)/finance/shipping/cod-reconciliation/page.tsx`
   - أعمدة: `provider, settlementDate, expectedTotalSyp, collectedTotalSyp, providerFeeAmountSyp, netSettlementSyp, status (badge)`.
   - فلترة بـ provider + settlement date range.

2. **Create batch dialog**
   - `shippingProviderId` (dropdown)، `providerFeePercentage` (number)، `settlementDate` (date picker)، `notes` (textarea).

3. **Batch Detail Page** — `[batchId]/page.tsx`
   - عرض كل الـ COD entries في الـ batch.
   - زر "تحويل إلى SETTLED" / "وضع علامة DISPUTED".

4. **Shipment COD entries** — `app/(dashboard)/logistics/shipping/shipments/[id]/cod/page.tsx`
   - يستدعي `GET /admin/shipping/cod/entries/{shipmentId}`.

5. **Permissions**
   - الصفحة محمية بصلاحية "finance" (فحص في layout أو middleware).

### معايير القبول
- إنشاء batch جديد بـ providerFeePercentage = 5% يعرض `netSettlementSyp = expectedTotal - fee`.

---

## Phase 11 — i18n + RTL polish + اختبار End-to-End

**الهدف:** التحقق من Part D (Merchant Workflow) عبر السيناريو الكامل.

### المهام
1. **مفاتيح الترجمة**
   - تجميع كل الـ string العربية الموجودة حالياً + الجديدة في `i18n/messages/ar.json` و `i18n/messages/en.json`.
   - إعداد next-intl أو نظام مماثل، مع toggle في navbar.

2. **اختبار سيناريو Part D يدوياً**
   - Dashboard → list (PENDING) → detail → confirm → processing (+shipment) → wait webhook (محاكاة من admin) → delivered → generate invoice → refund flow → COD reconciliation.

3. **Empty states + loading states**
   - مراجعة كل القوائم: skeleton، رسالة فارغة عربية واضحة.

4. **معالجة الأخطاء العامة**
   - كل mutation تستخدم `humanizeError()` من Phase 0.
   - 401/403 يعيد التوجيه إلى `/request-otp` (موجود حالياً).

### معايير القبول
- التبديل ar/en يعمل على كل الصفحات الجديدة.
- سيناريو Part D ينفّذ من البداية للنهاية بدون أخطاء console.

---

## Phase 12 — Customer Storefront (Part B) — نطاق منفصل

**الهدف:** تطبيق العميل (Cart → Checkout → My Orders → Tracking).

> **ملاحظة:** هذا تطبيق منفصل — يُقترح إنشاؤه كـ `apps/storefront/` في نفس monorepo، أو كمشروع Next.js مستقل. **لا يُنفَّذ ضمن `apps/web` (لوحة الإدارة).**

### الـ phases الفرعية
- **12.1 — Cart (B1):** Zustand store + localStorage persistence + `productSnapshot` لكل سطر.
- **12.2 — Checkout Step 1 — Address (B2):** `MapPinPicker` من Phase 0 + form (recipientName, phone, addressLabel).
- **12.3 — Checkout Step 2 — Shipping Preview (B3):** `POST /public/shipping/calculate` فور تغيير الـ pin (debounced).
- **12.4 — Checkout Step 3 — Discount (B4):** `GET /public/checkout/validate-discount` على blur.
- **12.5 — Checkout Step 4 — Payment Methods (B5):** `GET /public/payments/methods` → radio group.
- **12.6 — Checkout Step 5 — Place Order (B6):** `POST /public/checkout` مع `checkoutToken` (UUID مولّد مرة عند دخول الصفحة)، التعامل مع `paymentRedirectUrl` لـ PAYMERA.
- **12.7 — Payment Return Pages (B7):** `/payment/success`, `/payment/failure` مع poll على `/public/payments/{txnId}/status` كل 2s حتى 10s.
- **12.8 — My Orders (B8) + Detail (B9):** قوائم + cancel + invoice download.
- **12.9 — Guest Order Lookup (B10):** نموذج بسيط بـ `orderNumber + email`.
- **12.10 — Tracking Widget (B11):** stepper عمودي مع `statusHistory`.

---

## ترتيب التنفيذ المُوصى به

```
Phase 0 (يوم 1)  ──┐
                   │
Phase 1 (يوم 2)  ──┤
                   │
Phase 2 ──┐  Phase 4 ──┐  Phase 7 ──┐
Phase 3 ──┤  Phase 5 ──┤  Phase 8 ──┤   ← يمكن تنفيذها بالتوازي
          │  Phase 6 ──┘             │      بمطورين منفصلين
Phase 9   ──────────────────────────┤
                                     │
Phase 10 ─────────────────────────────┘
                                     │
Phase 11 ─────────────────────────────┘ (تكامل + اختبار)
                                     │
Phase 12 ───────────────────────── (نطاق منفصل، تطبيق آخر)
```

**الحرجة (يجب أن تسبق غيرها):**
- Phase 0 → كل ما بعدها.
- Phase 1 → Phase 2, 3, 9.
- Phase 5 → Phase 6 (لأن الفاتورة تستخدم layout).
- Phase 9 → Phase 10 (COD entries تأتي من shipments).

---

## مخاطر معروفة + قرارات معلّقة

| المخاطرة | البديل | القرار المطلوب |
|---|---|---|
| الـ enum الحالي يستخدم `NEW`, `OUT_FOR_DELIVERY`, `RETURN_REQUESTED` (mock data) — حذفها قد يكسر الـ UI | الإبقاء على `mock-service.ts` خلف flag حتى نهاية Phase 1 | OK |
| `tenantId` للـ `/public/**` — من أين يأتي في لوحة الإدارة؟ | استخدام tenant الحالي من JWT claims على الـ backend | تأكيد مع backend team |
| رفع الصور (logo) في Phase 5 | استخدام endpoint موجود (إن وجد) أو إنشاء `POST /admin/uploads` | فحص الـ backend |
| Shipment auto-creation عند PROCESSING — هل يُنشأ على الـ backend تلقائياً؟ | لا، الـ frontend يستدعي `transition` ثم `POST /shipments` بشكل صريح | موثّق ✓ |
| Map provider — Leaflet (مجاني) أم Google Maps (مدفوع)؟ | Leaflet + OpenStreetMap للبداية | تأكيد مع PM |

---

## ملاحظات تقنية

- **TanStack Query keys**: كل وحدة تحتفظ بـ `queryKeys.ts` خاص بها (نمط موجود).
- **Optimistic updates**: لا تُستخدم في الـ transitions (الـ backend يتحقق من الـ flow). تُستخدم في Notes فقط.
- **invalidation strategy**: عند `transition/cancel/edit/notes` → invalidate `orderQueryKeys.detail(id)` + `orderQueryKeys.timeline(id)` + `orderQueryKeys.summary()`.
- **Forms**: استخدام `react-hook-form` + `zodResolver` (نمط مفترض). إن لم يكن موجود، يُضاف في Phase 0.
