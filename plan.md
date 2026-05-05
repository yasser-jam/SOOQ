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

**التغطية:** 35 endpoint admin + كل صفحات A1–A11.

---

## القسم 2 — Phase 11: Polish + Tech Debt 🟡

**الهدف:** إغلاق الفجوات في لوحة الإدارة قبل الانتقال إلى الـ storefront.

### 11.1 — Backend dependency: رفع الشعار (Logo Upload)

**الحالة الحالية:** الشعار يُرفع كـ base64 data URL ويُحفَظ في `visibleFields.logoUrl`. صورة 5MB → ~6.7MB JSON. غير مناسب للإنتاج.

**ما يحتاج backend:**
- `POST /api/v1/admin/uploads` — multipart يستقبل الملف، يُخزّنه (S3 / local)، ويُرجع `{ url, fileId? }`.

**عمل الـ frontend بعد جاهزية الـ endpoint:**
1. إضافة `lib/upload.ts` بـ `uploadImage(file): Promise<{ url }>`.
2. تعديل `app/(dashboard)/invoice-layouts/[profile-id]/page.tsx`:
   - استبدال `FileReader.readAsDataURL` بـ `uploadImage(file)`.
   - حقن `result.url` في `visibleFields.logoUrl` بدلاً من الـ data URL.
   - الإبقاء على معاينة سريعة client-side عبر `URL.createObjectURL` خلال الرفع.

**معيار القبول:** صورة 2MB ترفع كـ multipart، الـ DB يحفظ URL ~80 byte، الـ form payload يبقى صغيراً.

---

### 11.2 — فلترة COD Reconciliation List

**الحالة الحالية:** القائمة الأساسية بدون فلاتر (انظر `KV-ORDERS-SUMMARY.md` §11).

**العمل:**
1. إضافة `FilterMenu` فوق `CodReconciliationTable`:
   - Dropdown مزود الشحن (من `listShippingProviders`)
   - Date range picker (من / إلى) لـ `settlementDate`
2. تمرير الفلاتر كـ query params إلى `GET /admin/shipping/cod/reconciliation`:
   - `shippingProviderId`، `settlementDateFrom`، `settlementDateTo`
3. التحقق من دعم backend لهذه params — إن لم يدعم، إما طلب التعديل أو client-side filter كحل مؤقّت.

**معيار القبول:** اختيار مزود → تظهر دفعاته فقط. Date range يحدّد نافذة التسوية.

---

### 11.3 — حذف نهائي لـ `mock-service.ts`

**الموقع:** `apps/web/modules/order/order/apis/mock-service.ts` + استدعاءاته.

**العمل:**
1. التأكّد أن كل `getMockAdmin*` في `actions.ts` لم تعد تُستدعى.
2. حذف الملف + استدعاءاته.
3. تشغيل typecheck للتأكّد.

**معيار القبول:** `grep -r "mock-service" modules/order/order` يُرجع صفر نتائج.

---

### 11.4 — `order-edit-page` بـ react-hook-form

**الحالة الحالية:** الصفحة تستخدم `useState` يدوياً بينما باقي الـ forms في المشروع تستخدم `react-hook-form + zodResolver`.

**العمل:**
1. إنشاء `editOrderSchema` في `modules/order/order/schema.ts` يستخدم `phoneSchema` الموجود.
2. إعادة كتابة `order-edit-page.tsx` بنفس نمط `shipping-provider/components/form.tsx`:
   - `useForm<EditOrderFormValues>({ resolver: zodResolver(editOrderSchema) })`
   - `Field` من `components/system/Field.tsx` للحقول النصية
   - `Controller` لـ `MapPinPicker`
3. الإبقاء على نفس الـ payload shape (`items[]` كاملة + `shippingAddress` بإحداثيات).

**معيار القبول:** validation عربية ظاهرة عبر `<FieldError>`، رقم هاتف بصيغة Syrian +9639 محقّق، نفس الـ payload يصل للـ backend.

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

| Endpoint | الغرض | المُستهلك |
|---|---|---|
| `POST /api/v1/admin/uploads` | رفع صور (multipart → URL) | Phase 11.1 — Invoice logo؛ مستقبلاً صور المنتجات |
| `GET /public/store-settings` | إعدادات المتجر العامة (origin lat/lng، logo، اسم) | Phase 12.2 — map default + checkout header |

تُحرَّر بمشاركة فريق الـ backend قبل بدء العمل المقابل.

---

## القسم 5 — Open Questions

| السؤال | الحالة | ملاحظات |
|---|---|---|
| موقع تطبيق الـ storefront | ❓ | مقترح `apps/storefront/` — تأكيد قبل Phase 12.0 |
| نظام i18n | ❓ | `next-intl` مرشّح — يحتاج موافقة dep جديد |
| رفع الصور (logo) | ❓ | بانتظار `POST /admin/uploads` على الـ backend |
| دعم backend لفلاتر COD list | ❓ | تأكيد دعم `shippingProviderId` + `settlementDateFrom/To` كـ query params |

---

## القسم 6 — Recommended Sequence

```
Phase 11.1 (logo upload)        ← بانتظار backend
Phase 11.2 (COD filters)        ← يمكن البدء فوراً (مع توضيح backend params)
Phase 11.3 (delete mock-service) ← بعد E2E (11.6)
Phase 11.4 (order-edit RHF)     ← يمكن البدء فوراً
Phase 11.5 (i18n + polish)      ← بعد موافقة dep
Phase 11.6 (E2E manual)         ← بعد كل ما سبق

ثم:

Phase 12.0 (extract shared packages)  ← يستفيد منه باقي 12.*
Phase 12.1–12.10 (storefront flows)   ← بترتيب الـ user journey
```

---

## القسم 7 — Notes تقنية

- **TanStack Query keys**: نمط `{all, list, detail(id), summary?, byOrder(id)?}` مُتّسق — تابعه في الـ storefront.
- **Optimistic updates**: لا تُستخدم للـ transitions (الـ backend يتحقق من state machine). تُستخدم للـ Notes فقط.
- **Invalidation strategy**: عند `transition/cancel/edit/notes/refund` يُلغى `orderQueryKeys.detail(id)` + `timeline(id)` + `summary`.
- **Forms**: `react-hook-form + zodResolver + Field` — الـ standard. (استثناء حالي: `order-edit-page` — Phase 11.4).
- **MapPinPicker/MapPin/MapRoute**: حالياً في `apps/web/components/system/`. تُنقل إلى `packages/ui` في Phase 12.0.
- **`X-Tenant-Id` للـ storefront**: يأتي من subdomain (`<tenant>.sooq.app`) أو من env config — قرار معماري قبل Phase 12.0.
- **Tech debt المُتبقّي:** 4 أخطاء TypeScript في `app/api/admin/products/*` (سابقة، خارج هذا الـ scope).
