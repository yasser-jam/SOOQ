# خطة تنفيذ ORD + PAY + SHP في SOOQ-Front

**المرجع:** `SOOQ-Back/docs/FRONTEND_PAGES_ORD_PAY_SHP.md` (محدّث 2026-05-05، مع Part H الجديد)
**ملخّص ما أُنجز:** `SOOQ-Front/KV-ORDERS-SUMMARY.md`
**اللغة:** RTL عربي افتراضي.
**العملة:** SYP (أعداد صحيحة فقط).

---

## Implementation Snapshot

| الـ Surface | الحالة | الـ Endpoints | المرجع |
|---|---|---|---|
| Merchant Admin (Part A) — `apps/web` | ✅ مكتمل على فرع `KV-Orders` | 35/35 admin endpoints | A1–A11 |
| Customer Storefront (Part B) — `apps/storefront` (مقترح) | ⏳ لم يبدأ | 0/18 customer endpoints | B1–B11 |
| Backend ORD + PAY + SHP | ✅ مكتمل | 60/60 | Part E |

---

## القسم 1 — ما أُنجز (Phase 0–10) ✅

| Phase | البند | الـ Commit |
|---|---|---|
| 0 | Cross-cutting infra (`api.ts` envelope + `X-Tenant-Id` for `/public/**` + domain enums + error codes + money/pagination helpers) | `4b1e67f` |
| 1 | محاذاة `OrderStatus` مع backend (10 حالات) + توسيع `AdminOrder` بالحقول الجديدة | `61bfff0` |
| 2 | Orders Dashboard (12 stat card) + URL filter بـ `?status=` + جدول غني | `13e9272` |
| 3 | Order Detail بـ مصفوفة أزرار شرطية + payment card + tracking widget + notes/timeline | `8603433` |
| 4 | Discount Codes module (CRUD + scope picker + status calc) | `eae8dc5` |
| 5 | Invoice Layout Profiles (19 toggle + color picker + logo) | `c8ed912` |
| 6 | Invoices module (list + Generate/Regenerate/Download من Order Detail) | `1b5f114` |
| 7 | Payment Providers config (catalog-driven COD/PAYMERA + write-only credentials) | `985c99e` |
| 8 | Refunds module + dialog من Order Detail (PAYMERA sync vs COD ledger) | `c452fea` |
| 9 | Shipping providers alignment + CreateShipmentDialog auto-open عند PROCESSING | `12d15ff` |
| 10 | COD Reconciliation (batch detail + per-shipment entries + status transitions) | `0b04f79` |
| Extra | Leaflet maps (`MapPin` / `MapPinPicker` / `MapRoute`) + ربط في address card / order edit / create-shipment / shipment route | `a6e7d8c` |
| Polish | Invoice Layout Editor — استبدال `alert()` بـ `toast`، `useRef` للـ file input، إعادة وضع color preview | `7943d90` |
| 11.4 | إعادة كتابة `order-edit-page` بـ react-hook-form + zod + useFieldArray + nested Controllers لـ MapPinPicker | `40f1b5a` |
| 11.1 | تحويل رفع شعار الفاتورة إلى multipart (`profile` + `logo` parts) ضمن نفس endpoints؛ إزالة base64 conversion من الـ frontend | `f3ae335` |
| 11.2 | فلاتر COD reconciliation list (مزود + نطاق تاريخ) — client-side حتى يدعم الـ backend الـ params | `fa690c1` |
| 11.3 | حذف نهائي لـ mock-service + 14 راوتاً Next.js مرتبطاً بها (dead code) | (هذا الـ commit) |

**التغطية:** 35 endpoint admin + كل صفحات A1–A11.

---

## القسم 2 — Phase 11: Polish + Tech Debt 🟡

**الهدف:** إغلاق الفجوات في لوحة الإدارة قبل الانتقال إلى الـ storefront.

### 11.1 — رفع الشعار عبر multipart ✅ **مكتمل**

**ما تمّ:**
1. [`lib/api.ts`](apps/web/lib/api.ts) — حارس صغير: عند `body instanceof FormData` يُلغى `Content-Type` على مستوى الـ request ليتركه المتصفّح يضبطه بـ boundary صحيحة.
2. [`modules/order/invoice-layout/types.ts`](apps/web/modules/order/invoice-layout/types.ts) — `CreateInvoiceLayoutMutationInput` و `UpdateInvoiceLayoutMutationInput` يجمعان الـ payload مع `logoFile?: File | null`.
3. [`modules/order/invoice-layout/actions.ts`](apps/web/modules/order/invoice-layout/actions.ts) — helper `buildMultipartBody(payload, logoFile?)` يبني `FormData` بـ:
   - `profile`: `new Blob([JSON.stringify(payload)], { type: "application/json" })`
   - `logo`: الـ File (اختياري)

   `createInvoiceLayout` و `updateInvoiceLayout` تستخدمانه.
4. [`modules/order/invoice-layout/init.ts`](apps/web/modules/order/invoice-layout/init.ts) — `initInvoiceLayoutUpdate(id, payload, logoFile?)` يُرجع الشكل الجديد.
5. [`app/(dashboard)/invoice-layouts/[profile-id]/page.tsx`](apps/web/app/(dashboard)/invoice-layouts/[profile-id]/page.tsx):
   - state صار `logoFile: File | null` بدل base64 string.
   - معاينة عبر `useMemo(() => URL.createObjectURL(logoFile))` + `useEffect` cleanup للـ `revokeObjectURL`.
   - حُذف `FileReader.readAsDataURL` كاملاً.
   - validation لنوع الملف صار صراحةً `image/jpeg | image/png | image/webp` (يطابق MultipartFile filter في الـ backend).
   - عند اختيار ملف جديد، `visibleFields.logoUrl` يُمسح ليُعلم أن الـ source الجديد هو الـ file (الـ backend يكتب الـ URL بعد الرفع).

**معيار القبول المُحقّق:** صورة 2MB ترفع كـ multipart، الـ DB يحفظ URL قصيراً (publicUrl من `MediaUploadService`)، الـ JSON payload يبقى صغيراً، الـ frontend لا يحمل base64 في الذاكرة بعد الآن.

---

### 11.2 — فلترة COD Reconciliation List ✅ **مكتمل (client-side interim)**

**ما تمّ:**
1. [`types.ts`](apps/web/modules/shipping/cod/types.ts) — `CodReconciliationFilters` + توسيع `ListCodReconciliationBatchesParams` بـ `shippingProviderId` و `settlementDateFrom` و `settlementDateTo` (forward-compatible عند تطوير الـ backend).
2. [`cod-reconciliation-filters.tsx`](apps/web/modules/shipping/cod/components/cod-reconciliation-filters.tsx) (جديد) — bar فيه:
   - **مزود الشحن**: `Select` من `listShippingProviders` مع option "كل المزودين"
   - **من تاريخ** + **إلى تاريخ**: `<Input type="date">` LTR، مع `min`/`max` متبادل لمنع نطاق مقلوب
   - زرّ "مسح الفلاتر" — معطّل ما لم يكن أيٌّ من الفلاتر فعّالاً
3. [`cod-reconciliation-table.tsx`](apps/web/modules/shipping/cod/components/cod-reconciliation-table.tsx) — يأخذ `filters` كـ prop، يجلب `size=200` مرّة واحدة، يُطبّق الفلترة + الـ pagination client-side. الـ pageIndex يُعاد لـ 0 عند تغيير أي فلتر.
4. [`cod-reconciliation-page.tsx`](apps/web/modules/shipping/cod/components/cod-reconciliation-page.tsx) — يحفظ state الفلاتر ويُمرّرها للـ table.

**سبب client-side:** الـ backend `GET /admin/shipping/cod/reconciliation` يقبل `Pageable` فقط (لا `@RequestParam`). البيانات قليلة الـ cardinality (دفعات قليلة لكل مزود يومياً)، فجلب 200 صفّ ثم filter في الذاكرة قرار مقبول كـ interim. الترقية لـ server-side تتطلّب فقط تعديل `actions.ts` لتمرير الـ params في الـ URL — بدون تغيير في الـ UI.

**معيار القبول المُحقّق:** اختيار مزود → تظهر دفعاته فقط؛ Date range يحدّد نافذة التسوية؛ pageIndex يُعاد ضبطه؛ "مسح الفلاتر" يعيد القائمة كاملة.

---

### 11.3 — حذف نهائي لـ `mock-service.ts` ✅ **مكتمل**

**ما تمّ:**
1. تحقّقتُ من الاستدعاءات: الـ mock services لم تكن مستدعاة من `actions.ts` (كل actions تستخدم `api()` المباشرة على Railway). الاستدعاءات الوحيدة كانت من 14 ملف Next.js API route تحت `app/api/admin/` كانت dead code (axios baseURL يشير إلى `https://sooq.up.railway.app/api/v1` فلا يصلها أحد).
2. حُذفت:
   - `apps/web/modules/order/order/apis/mock-service.ts` + الـ `apis/` directory
   - `apps/web/modules/shipping/apis/mock-service.ts` + الـ `apis/` directory
   - 14 ملف تحت `apps/web/app/api/admin/` (orders، products، shipping/cod، shipping/providers، shipping/shipments) + الـ `app/api/` directory نفسه
3. typecheck تخلّص أيضاً من الـ 4 أخطاء السابقة في `app/api/admin/products/*` لأنّها كانت داخل الراوتات المحذوفة.

**معيار القبول المُحقّق:** `grep -r "mock-service" apps/web` يُرجع صفر نتائج. typecheck يخرج بـ `EXIT=0` نظيف بدون أيّ خطأ.

---

### 11.4 — `order-edit-page` بـ react-hook-form ✅ **مكتمل**

**ما تمّ:**
1. أُضيف `editOrderSchema` + `editOrderItemSchema` + `editOrderShippingAddressSchema` في [`modules/order/order/schema.ts`](apps/web/modules/order/order/schema.ts) مع رسائل عربية وقواعد validation:
   - lat ∈ [-90, 90]، lng ∈ [-180, 180]
   - phone بنمط `^[0-9+]{8,15}$` (يطابق pattern الـ backend — أوسع من `phoneSchema` الـ OWNER لأن العميل قد لا يكون سورياً)
   - `quantity` بـ `z.coerce.number().int().min(1)`
2. أُضيف `EditOrderFormValues = z.input<typeof editOrderSchema>` و `EditOrderFormParsed = z.output` في [types.ts](apps/web/modules/order/order/types.ts).
3. [`order-edit-page.tsx`](apps/web/modules/order/order/components/order-edit-page.tsx) أُعيد كتابتها:
   - `useForm` + `zodResolver`
   - `useFieldArray` لـ items
   - `Field` لـ variantId/quantity/recipientName/phone
   - `TextareaField` لـ addressLabel
   - مكوّن مساعد `ShippingMapPickerField` يلفّ MapPinPicker بـ Controller المتداخل لـ lat/lng (مع `useWatch` للـ longitude لتقليل re-renders)

**معيار القبول المُحقّق:** validation عربية ظاهرة عبر `<FieldError>`، رقم هاتف يحقّق `^[0-9+]{8,15}$`، الـ payload يبقى نفسه (`items[]` كاملة + `shippingAddress` بإحداثيات + addressLabel optional).

---

### 11.5 — i18n + RTL polish

**الحالة الحالية:** كل الـ string عربية مدمجة في الـ JSX.

**العمل:**
1. إضافة `next-intl` (يحتاج موافقة على dep جديد).
2. إنشاء `i18n/messages/ar.json` و `i18n/messages/en.json` — استخراج كل الـ string من المكوّنات.
3. Toggle ar/en في الـ navbar.
4. مراجعة كل صفحة للـ Empty states / Loading states / Error handling:
   - استخدام `humanizeError()` من Phase 0 في كل `mutation.onError` صراحةً (حالياً يُستدعى عبر axios interceptor فقط).

**معيار القبول:** التبديل ar/en يعمل على كل الصفحات بدون refactor جوهري لكل مكوّن. صفحات فارغة تعرض رسائل واضحة.

---

### 11.6 — E2E manual test (Part D)

**العمل:** تنفيذ سيناريو Part D من backend doc بدءاً من dashboard حتى reconciliation:

| # | الخطوة | المتوقع |
|---|---|---|
| 1 | Dashboard | 12 بطاقة + counts |
| 2 | List PENDING | جدول مفلتر |
| 3 | Order Detail | كل البطاقات تُحمّل + map mini |
| 4 | Confirm | حالة الطلب CONFIRMED + timeline event |
| 5 | Move to Processing | dialog إنشاء shipment يفتح + map picker pre-filled |
| 6 | (محاكاة webhook 3PL) | الـ shipment status يتحدث |
| 7 | Mark Delivered | حالة الطلب DELIVERED |
| 8 | Generate Invoice | PDF يصل عبر link |
| 9 | Initiate Refund | dialog يفتح + COD/PAYMERA branching |
| 10 | COD Reconciliation | إنشاء batch + transition إلى SETTLED |

**معيار القبول:** السيناريو يعمل end-to-end بدون أخطاء console، كل toast يظهر، كل invalidation يحدث.

---

### 11.7 — SHP polish + ربط نقاط التكامل ✅ **مكتمل**

**الهدف:** سدّ الفجوات في رحلة الطلب → الشحنة → COD batch دون إعادة بناء.

**ما تمّ:**

1. [`shipping/shipment/public-tracking.ts`](apps/web/modules/shipping/shipment/public-tracking.ts) (جديد) — استخراج `fetchPublicShipmentTracking` و `publicShipmentTrackingQueryKey` ليتشاركها كل من tracking card و actions. React Query يدمج الطلبين تلقائياً.

2. [`order-details-actions.tsx`](apps/web/modules/order/order/components/order-details-actions.tsx) — حذف auto-open عند PROCESSING (كان يضع التاجر في فخّ لو dismiss). أُضيف زر يدوي **"إنشاء شحنة"** يظهر عند:
   - وجود `destinationLat/Lng` في `shippingAddress`
   - حالة الطلب ضمن `[PENDING, CONFIRMED, PROCESSING, SHIPPED]`
   - عدم وجود شحنة بعد (يُستدلّ من `tracking.shipmentId`)

3. [`order-shipment-tracking-card.tsx`](apps/web/modules/order/order/components/order-shipment-tracking-card.tsx) — أُضيف زر **"تفاصيل الشحنة (إدارة)"** يفتح `/logistics/shipping/shipments/{shipmentId}` بجانب "التتبع عبر شركة الشحن".

4. [`shipping/shipment/components/details.tsx`](apps/web/modules/shipping/shipment/components/details.tsx):
   - **Order back-link**: استبدال `Order ID: <uuid>` بـ Button → `/orders/{id}` يعرض `#orderNumber` + اسم المستلم + الهاتف. التسمية: "الطلب".
   - **Auto-sync**: عند نجاح transition الشحنة، يُقرأ الطلب الحالي ويُطبّق mapping (`SHIPMENT_TO_ORDER_SYNC`):
     | شحنة جديدة | طلب target | حالات سابقة صحيحة |
     |---|---|---|
     | `IN_TRANSIT` | `SHIPPED` | `CONFIRMED, PROCESSING` |
     | `DELIVERED` | `DELIVERED` | `SHIPPED` |
     | `FAILED` | `FAILED` | `PROCESSING, SHIPPED` |
     | `RETURNED` | `RETURNED` | `DELIVERED` |
   - يُتحقّق guard مزدوج: `validFromOrderStates.includes(currentStatus)` AND `ALLOWED_ORDER_TRANSITIONS[currentStatus]` — وإلا يظهر `toast.info` ويبقى الطلب كما هو.

5. [`cod-batch-detail-page.tsx`](apps/web/modules/shipping/cod/components/cod-batch-detail-page.tsx) — قسم جديد **"شحنات هذه الدفعة"**:
   - Aggregation: `listShipments()` filtered by `shippingProviderId === batch.shippingProviderId` + `status === DELIVERED` + `deliveredAt` يطابق `settlementDate` (calendar day).
   - كل صفّ يحوي link لـ `/orders/{id}` + المُحصَّل + تاريخ التسليم + زر "حركات COD" → `/logistics/shipping/shipments/{id}/cod`.
   - subtitle ينبّه إلى أنها مطابقة تقريبية (المزود قد يتأخّر في إرسال COD).

6. [`shipping/shipment/components/shipments-filters.tsx`](apps/web/modules/shipping/shipment/components/shipments-filters.tsx) (جديد) + [`table.tsx`](apps/web/modules/shipping/shipment/components/table.tsx) + [`view.tsx`](apps/web/modules/shipping/shipment/components/view.tsx):
   - فلاتر client-side: الحالة (Select)، المزود (Select)، نطاق تاريخ الإنشاء.
   - زر "مسح الفلاتر"، إعادة pageIndex إلى 0 عند أي تغيير.
   - نفس نمط [`cod-reconciliation-filters.tsx`](apps/web/modules/shipping/cod/components/cod-reconciliation-filters.tsx) — interim حتى يضيف الـ backend `@RequestParam` للقائمة.

7. [`shipping/shipment/actions.ts`](apps/web/modules/shipping/shipment/actions.ts) و [`shipping/provider/actions.ts`](apps/web/modules/shipping/provider/actions.ts) — `listShipments` و `listShippingProviders` صارا يقرآن `data` كـ array مباشر OR `data.content` (Spring Page) ليبقيا متوافقَين مع redesign الـ backend (2026-04-11). نفس الإصلاح المُطبّق على [`order/components/table.tsx`](apps/web/modules/order/order/components/table.tsx).

**معيار القبول المُحقَّق:**
- زر "إنشاء شحنة" ظاهر للطلبات الواردة، يختفي بعد الإنشاء.
- شحنة DELIVERED → الطلب يصير DELIVERED تلقائياً (toast نجاح مزدوج)؛ لو الحالة الحالية لا تسمح، toast.info دون كسر الـ flow.
- من شاشة الشحنة، نقرة على رقم الطلب تفتح صفحة الطلب.
- في COD batch detail، قائمة الشحنات المساهمة تظهر مع روابط لتفاصيل الشحنة و COD entries.
- فلاتر قائمة الشحنات تعمل (status/provider/date)، "مسح الفلاتر" يُعيد القائمة كاملة.
- typecheck نظيف؛ lint بدون warnings جديدة.

---

## القسم 3 — Phase 12: Customer Storefront ⏳

**الهدف:** تطبيق العميل (Cart → Checkout → My Orders → Tracking) كنطاق منفصل.

**القرار المعلّق:** موقع التطبيق الجديد:
- **مقترح أ:** `apps/storefront/` ضمن نفس الـ monorepo، يُشارك `packages/ui` و `lib/leaflet.ts` و `MapPinPicker` المُستخرَج إلى `packages/ui`.
- **مقترح ب:** مشروع Next.js مستقل خارج الـ monorepo.

**التوصية:** أ — يستفيد من الـ shared packages الموجودة.

### 12.0 — تجهيز قبل الـ Storefront

1. **استخراج `MapPinPicker` و `MapPin` و `MapRoute` إلى `packages/ui/src/components/`**:
   - تعديل imports في `apps/web` بعد النقل.
   - الـ storefront يستخدم نفس المكوّنات.
2. **استخراج `lib/leaflet.ts` و `lib/money.ts` و `lib/error-codes.ts` و `lib/domain-enums.ts` إلى `packages/shared/`** أو `packages/lib/`:
   - يُتاح للـ storefront و apps/web معاً.
3. **إنشاء `apps/storefront/` بـ Next.js scaffold** مع:
   - نفس tailwind config (RTL).
   - نفس shadcn/ui setup.
   - `lib/api.ts` خاص يحقن `X-Tenant-Id` لكل `/public/**` (حسب tenant subdomain أو env).

### 12.1 — Cart (B1)

**الـ Endpoints:** لا يوجد — كل شيء client-side.

**العمل:**
- Zustand store + `localStorage` persistence (`zustand/middleware/persist`).
- كل سطر: `{ variantId, quantity, productSnapshot: { title, price, image } }`.
- عند تحميل الـ cart اختيارياً: re-fetch كل variant عبر `GET /public/products/.../variants/{id}` للكشف عن price drift.

### 12.2 — Checkout Step 1 — Address (B2)

**الـ Endpoints:** لا يوجد — local form state فقط.

**العمل:**
- `MapPinPicker` (المُستخرَج من Phase 12.0).
- form: `recipientName`, `phone`, `addressLabel`.
- validation: `latitude ∈ [-90, 90]`، `longitude ∈ [-180, 180]`، `recipientName` و `phone` مطلوبان.
- الـ map default يقع على `store.location` من store-settings (يحتاج `GET /public/store-settings` — أتأكّد من توفّره).

### 12.3 — Checkout Step 2 — Shipping Cost Preview (B3)

**Endpoint:** `POST /public/shipping/calculate` (X-Tenant-Id)

**العمل:**
- TanStack Query mutation تُستدعى debounced عند تغيير الـ pin.
- `shippingProviderId: null` ليُختار auto بـ priority.
- عرض: `"Shipping: 15,000 SYP via دمشق إكسبريس"` + ETA إن وجد.

### 12.4 — Checkout Step 3 — Discount Code Preview (B4)

**Endpoint:** `GET /public/checkout/validate-discount?code=...&subtotal=...&shippingCost=...` (X-Tenant-Id)

**العمل:**
- Input مع debounce على blur (لا keystroke).
- عند نجاح: عرض savings + recompute total.
- معالجة `ERR_2001` (invalid/expired code) بـ inline error.

### 12.5 — Checkout Step 4 — Payment Methods (B5)

**Endpoint:** `GET /public/payments/methods` (X-Tenant-Id)

**العمل:**
- TanStack Query عند فتح step.
- Radio group بـ `displayName`.
- لو `requiresRedirect: true` → label الزر "Continue to Payment".

### 12.6 — Checkout Step 5 — Place Order (B6)

**Endpoint:** `POST /public/checkout` (X-Tenant-Id)

**العمل:**
- توليد `checkoutToken = crypto.randomUUID()` **مرة** عند دخول صفحة الـ checkout (ليُمنع duplicate orders).
- إرسال كامل الـ payload (items + shippingAddress + paymentMethod + checkoutToken + discountCode + notesCustomer + guestEmail).
- معالجة الـ response:
  - `paymentMethod === "COD"` و `paymentStatus === "UNPAID"` → navigate `/checkout/success?orderId=`
  - `paymentMethod === "PAYMERA"` و `paymentStatus === "PENDING"` → `window.location.href = response.paymentRedirectUrl`
- معالجة الأخطاء: `ERR_2001` (out of stock / discount invalid / guest email missing)، `ERR_1003` (missing tenant).

### 12.7 — Payment Return Pages (B7)

**Endpoint:** `GET /public/payments/{txnId}/status` (X-Tenant-Id)

**صفحات:**
- `/payment/success?txnId=...`
- `/payment/failure?txnId=...`

**العمل:**
- Poll مرة عند التحميل، ثم كل 2s حتى 10s ما لم تتحوّل من `PENDING`.
- على `PAID` → redirect إلى `/orders/{orderId}`.
- على `FAILED` → زر retry يعيد إلى checkout.

### 12.8 — My Orders (B8) + Detail (B9)

**Endpoints:**
- `GET /customer/orders?status=...&page=...&size=...` (JWT)
- `GET /customer/orders/{id}` (JWT)
- `POST /customer/orders/{id}/cancel` (JWT)
- `GET /customer/orders/{id}/invoice` (JWT)

**العمل:**
- إعادة استخدام `OrderResponseDto` shape من `apps/web` (مع حذف `notesInternal`).
- "Cancel" يظهر فقط لو `status ∈ {PENDING, CONFIRMED}`.
- "Download Invoice" يستدعي endpoint الـ invoice — على 404 يعرض "Invoice not ready yet".
- Embed `B11. Tracking Widget`.

### 12.9 — Guest Order Lookup (B10)

**Endpoint:** `GET /public/checkout/orders/lookup?orderNumber=...&email=...` (X-Tenant-Id)

**العمل:** نموذج بسيط بـ orderNumber + email → يعرض نفس shape B9.

### 12.10 — Tracking Widget (B11)

**Endpoint:** `GET /public/shipping/track/{orderId}` (X-Tenant-Id)

**العمل:**
- Vertical stepper من `statusHistory[]` بـ timestamps.
- "Track with carrier" link لـ `carrierTrackingUrl`.
- عرض `officePickupInstructions` بارز عند `READY_FOR_PICKUP_AT_OFFICE`.
- "Delivered on {date}" عند وجود `deliveredAt`.
- 404 → placeholder "بانتظار الشحن".

---

## القسم 4 — Backend Dependencies (Open)

| Endpoint | الغرض | المُستهلك | الحالة |
|---|---|---|---|
| `POST /api/v1/admin/invoice-layout-profiles` (multipart) | رفع شعار الفاتورة inline | Phase 11.1 | ✅ متاح + مُستهلَك من الـ frontend |
| `GET /public/store-settings` | إعدادات المتجر العامة (origin lat/lng، logo، اسم) | Phase 12.2 — map default + checkout header | ❓ بانتظار التأكيد |

تُحرَّر بمشاركة فريق الـ backend قبل بدء العمل المقابل.

---

## القسم 5 — Open Questions

| السؤال | الحالة | ملاحظات |
|---|---|---|
| موقع تطبيق الـ storefront | ❓ | مقترح `apps/storefront/` — تأكيد قبل Phase 12.0 |
| نظام i18n | ❓ | `next-intl` مرشّح — يحتاج موافقة dep جديد |
| رفع الصور (logo) | ✅ مكتمل | الـ backend دعم multipart inline على endpoints الفاتورة (2026-05-05) والـ frontend استهلكها في Phase 11.1. |
| دعم backend لفلاتر COD list | ❌ غير مدعوم بعد | الـ frontend يفلتر client-side حالياً (Phase 11.2). طلب backend: إضافة `@RequestParam` لـ `shippingProviderId` + `settlementDateFrom/To` على `GET /admin/shipping/cod/reconciliation`. الترقية على الـ frontend تتطلّب فقط تعديل `actions.ts` لتمرير الـ params. |
| دعم backend لفلاتر/pagination قائمة الشحنات | ❌ غير مدعوم بعد | `GET /admin/shipping/shipments` يعيد `List<>` كامل بلا query params. الـ frontend يفلتر client-side (Phase 11.7). طلب backend: pagination + `@RequestParam` لـ `status`, `shippingProviderId`, `createdAtFrom/To`. |
| GET /admin/shipping/cod/reconciliation/{batchId}/shipments | ❌ غير موجود | الـ frontend يجمّع تقريبياً عبر تطابق provider + DELIVERED + settlementDate (Phase 11.7). Endpoint مخصّص يعطي تطابقاً دقيقاً يربط batch ↔ COD entries ↔ shipments على مستوى الـ backend. |
| تزامن SHP→ORD على مستوى الـ backend | ❌ غير موجود | الـ frontend يطبّق التزامن (Phase 11.7) عبر transitionAdminOrderStatus بعد transition الشحنة. الأنسب لاحقاً: backend يستهلك `ShipmentStatusChangedEvent` ويُحدّث الـ order تلقائياً، ثم نُزيل المنطق من الـ FE. |

---

## القسم 6 — Recommended Sequence

```
Phase 11.1 (logo upload)        ← ✅ مكتمل
Phase 11.2 (COD filters)        ← ✅ مكتمل (client-side interim)
Phase 11.3 (delete mock-service) ← ✅ مكتمل
Phase 11.4 (order-edit RHF)     ← ✅ مكتمل
Phase 11.5 (i18n + polish)      ← بعد موافقة dep
Phase 11.6 (E2E manual)         ← بعد كل ما سبق
Phase 11.7 (SHP polish + ربط)   ← ✅ مكتمل

ثم:

Phase 12.0 (extract shared packages)  ← يستفيد منه باقي 12.*
Phase 12.1–12.10 (storefront flows)   ← بترتيب الـ user journey
```

---

## القسم 7 — Notes تقنية

- **TanStack Query keys**: نمط `{all, list, detail(id), summary?, byOrder(id)?}` مُتّسق — تابعه في الـ storefront.
- **Optimistic updates**: لا تُستخدم للـ transitions (الـ backend يتحقق من state machine). تُستخدم للـ Notes فقط.
- **Invalidation strategy**: عند `transition/cancel/edit/notes/refund` يُلغى `orderQueryKeys.detail(id)` + `timeline(id)` + `summary`.
- **Forms**: `react-hook-form + zodResolver + Field` — الـ standard في كامل المشروع بعد Phase 11.4.
- **MapPinPicker/MapPin/MapRoute**: حالياً في `apps/web/components/system/`. تُنقل إلى `packages/ui` في Phase 12.0.
- **`X-Tenant-Id` للـ storefront**: يأتي من subdomain (`<tenant>.sooq.app`) أو من env config — قرار معماري قبل Phase 12.0.
- **Tech debt المُتبقّي:** لا أخطاء TypeScript قائمة بعد Phase 11.3 (الـ 4 أخطاء السابقة في `app/api/admin/products/*` اختفت مع حذف الراوتات).
