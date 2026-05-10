# خطة إعادة هيكلة Routing لـ SOOQ-Front

> Branch: `KV-Auth`
> Base: `master` @ `28b9f44`

## Context

عند الدخول على `localhost:3000/store/kemo` (واجهة تاجر متجر `kemo`)، يظهر شريط جانبي إداري بروابط مطلقة (`/products`, `/orders`, …). الضغط على "المنتجات" يخرج المستخدم من سياق متجره إلى `localhost:3000/products`.

**السبب الجذري**: `app/store/[storeSlug]/(shop)/layout.tsx` يستخدم `Providers` نفسه الذي يستخدمه الداشبورد، وهذا الـ Provider يركّب `AppSidebar` بروابط hard-coded غير واعية بالـ slug. ال `(shop)` مسمّى بشكل مضلّل لأنه فعلاً يحوي صفحة لوحة تحكم التاجر، لا واجهة زبون.

**المخرَج المستهدف**: فصل واضح بين ثلاثة جماهير على مستوى الـ URL والـ layout والـ middleware:

| الجمهور | البادئة | الموقع في `app/` |
|---|---|---|
| التاجر | `/store/[storeSlug]/...` | `app/store/[storeSlug]/(dashboard)/...` |
| الزبون | `/shop/[storeSlug]/...` | `app/shop/[storeSlug]/...` |
| مالك المنصّة | `/platform/...` | `app/(platform)/platform/...` |

تسجيل دخول التاجر للمنصّة يبقى كما هو في `app/(auth)/`.

---

## Phase A — نقل داشبورد التاجر إلى `/store/[storeSlug]/...`

> الأساس. كل ما بعدها يبني عليها. تحتاج PR واحد متماسك.

### A.1 تجهيز البنية والـ layout

- [x] إنشاء `apps/web/app/store/[storeSlug]/(dashboard)/layout.tsx` يلفّ المحتوى بنسخة معدّلة من `Providers` (انظر A.3)
- [x] إنشاء `apps/web/app/store/[storeSlug]/(dashboard)/page.tsx` ينقل محتوى `app/store/[storeSlug]/(shop)/page.tsx` (الذي يعرض `HomeMockDashboard`)
- [x] حذف `apps/web/app/store/[storeSlug]/(shop)/` بالكامل بعد النقل

### A.2 تعديل `AppSidebar` ليصبح slug-aware

ملف: `packages/ui/src/components/app-sidebar.tsx`

- [x] إضافة `storeSlug: string` إلى `AppSidebarProps`
- [x] تحويل `navItems` من ثابت إلى دالّة `buildNavItems(storeSlug)` تُرجع روابط مبنيّة بالـ slug
  - مثال: `url: \`/store/${storeSlug}/products\``
- [x] الجذر "لوحة التحكم" يصبح `/store/${storeSlug}` (بدل `/`)
- [x] التأكّد أن `isRouteActive` و `isExactMatch` يعملان مع المسارات الجديدة

### A.3 تعديل `Providers` ليمرّر `storeSlug`

ملف: `apps/web/components/Providers.tsx`

- [x] في `AppSidebarWithPathname`، استخراج `storeSlug` من الـ pathname (regex: `^/store/([^/]+)`)
- [x] تمرير `storeSlug` إلى `<AppSidebar />`
- [x] لو لم يوجد slug، إخفاء الـ sidebar أو تعطيل الروابط

### A.4 نقل صفحات الداشبورد (٤٧ صفحة في ١٤ مجلد)

استخدم `git mv` للحفاظ على history:

- [x] `apps/web/app/(dashboard)/account/` → `apps/web/app/store/[storeSlug]/(dashboard)/account/`
- [x] `apps/web/app/(dashboard)/audit-logs/` → `apps/web/app/store/[storeSlug]/(dashboard)/audit-logs/`
- [x] `apps/web/app/(dashboard)/discount-codes/` → `apps/web/app/store/[storeSlug]/(dashboard)/discount-codes/`
- [x] `apps/web/app/(dashboard)/finance/` → `apps/web/app/store/[storeSlug]/(dashboard)/finance/`
- [x] `apps/web/app/(dashboard)/inventory/` → `apps/web/app/store/[storeSlug]/(dashboard)/inventory/`
- [x] `apps/web/app/(dashboard)/invoice-layouts/` → `apps/web/app/store/[storeSlug]/(dashboard)/invoice-layouts/`
- [x] `apps/web/app/(dashboard)/invoices/` → `apps/web/app/store/[storeSlug]/(dashboard)/invoices/`
- [x] `apps/web/app/(dashboard)/logistics/` → `apps/web/app/store/[storeSlug]/(dashboard)/logistics/`
- [x] `apps/web/app/(dashboard)/orders/` → `apps/web/app/store/[storeSlug]/(dashboard)/orders/`
- [x] `apps/web/app/(dashboard)/payment-providers/` → `apps/web/app/store/[storeSlug]/(dashboard)/payment-providers/`
- [x] `apps/web/app/(dashboard)/products/` → `apps/web/app/store/[storeSlug]/(dashboard)/products/`
- [x] `apps/web/app/(dashboard)/refunds/` → `apps/web/app/store/[storeSlug]/(dashboard)/refunds/`
- [x] `apps/web/app/(dashboard)/settings/` → `apps/web/app/store/[storeSlug]/(dashboard)/settings/`
- [x] `apps/web/app/(dashboard)/test/` → `apps/web/app/store/[storeSlug]/(dashboard)/test/`
- [x] نقل `apps/web/app/(dashboard)/page.tsx` → `apps/web/app/store/[storeSlug]/(dashboard)/page.tsx` (دمج مع A.1)
- [x] حذف `apps/web/app/(dashboard)/layout.tsx` بعد التأكّد أن الجديد يغطّيه

> ملاحظة: `platform/` يبقى في مكانه الحالي حتى Phase B

### A.5 تحديث الروابط الداخلية

كل `router.push("/X")` و `router.replace("/X")` و `redirect("/X")` و `<Link href="/X">` حيث `X` تبدأ بأحد المسارات المنقولة، يجب أن تصبح `/store/${storeSlug}/X`.

استخراج `storeSlug` داخل كل ملف:
```ts
const params = useParams<{ storeSlug: string }>()
const storeSlug = params?.storeSlug ?? ""
```

> أُضيف helper مشترك `apps/web/lib/store-path.ts` (`useStorePath()`) لتقليل تكرار `useParams` في كل ملف. الاستخدام: `const storePath = useStorePath(); router.push(storePath("/products"))`.

- [x] `apps/web/app/store/[storeSlug]/(dashboard)/products/**` — تحديث ٨ روابط
- [x] `apps/web/modules/product/**` — تحديث الروابط لاستخدام `storeSlug`
- [x] `apps/web/app/store/[storeSlug]/(dashboard)/discount-codes/**` — ٣ روابط
- [x] `apps/web/app/store/[storeSlug]/(dashboard)/invoice-layouts/**` — ٣ روابط
- [x] `apps/web/app/store/[storeSlug]/(dashboard)/payment-providers/**` — ٣ روابط
- [x] `apps/web/modules/shipping/provider/**` — ٣ روابط
- [x] `apps/web/modules/shipping/cod/**` — ٣ روابط
- [x] `apps/web/modules/order/order/**` — ٢ روابط
- [x] مراجعة كل `<Link href="/...">` المتبقّية بـ grep شامل للتأكّد (تم اكتشاف ٥ مواضع إضافية في `inventory/`, `shipping/shipment/details`, `order/order/shipment-tracking-card`, `payment/refund/table` — جميعها محدّثة)

### A.6 تحديث Middleware

ملف: `apps/web/middleware.ts`

> **حرج**: حاليًا `/store` في القائمة العامّة (يتجاوز auth). بعد النقل، الداشبورد كله تحت `/store/[slug]/`، لذا التاجر سيدخل الداشبورد بدون tenant-auth.

- [x] فصل المنطق: `/store/[slug]/(dashboard)/...` يتطلّب auth — لم يعد `/store` ضمن المسارات العامة
- [ ] `/shop/[slug]/...` يبقى عامًا (مع customer-auth اختياري للـ checkout) — يُنفّذ في Phase C
- [x] `/store/[slug]/(auth)/...` (customer OTP الحالي) عام عبر regex متوافق مع slug — يُلغى بعد Phase C
- [x] تحديث القاعدة العامة: استبدال `'/store'` بقائمة prefixes صريحة أو منطق دقيق

### A.7 تحقّق Phase A

- [ ] `pnpm dev` في `apps/web/` — يحتاج تشغيل يدوي
- [ ] فتح `localhost:3000/store/kemo` → يجب أن يظهر شريط جانبي بروابط `/store/kemo/...`
- [ ] الضغط على "المنتجات" → يفتح `localhost:3000/store/kemo/products` (وليس `/products`)
- [ ] الضغط على "الطلبات" → `/store/kemo/orders`
- [ ] فتح صفحة منتج → زر العودة / breadcrumb يبقى داخل سياق `kemo`
- [x] `pnpm --filter web typecheck` ينجح (0 errors)
- [x] `pnpm --filter web lint` نظيف من الأخطاء (109 warnings قديمة موجودة قبل الـ refactor)

---

## Phase B — فصل صفحات مالك المنصّة

> يفصل صلاحيات المنصّة عن صلاحيات التاجر. أصغر من Phase A.

### B.1 إنشاء route group منفصل

- [x] إنشاء `apps/web/app/(platform)/layout.tsx` بـ providers خاصّ (بدون AppSidebar — تتم إعادة النظر لاحقًا لو احتاجت المنصّة سايدبار خاصًّا بها)
- [x] نقل `apps/web/app/(dashboard)/platform/` → `apps/web/app/(platform)/platform/` (مع حذف `(dashboard)/` لأنه أصبح فارغًا)

### B.2 تحديث Middleware لصلاحيات المنصّة

ملف: `apps/web/middleware.ts`

- [x] middleware يتطلّب auth لكل `/platform/*` (يتم تلقائيًا — `/platform` ليس في `PUBLIC_PREFIXES`)
- [x] فحص الدور (`PLATFORM_ADMIN`) يتم على مستوى الصفحة عبر `<RequireRole roles={["PLATFORM_ADMIN"]}>` — مطابق لقاعدة المشروع (`lib/jwt.ts` يحذّر من ثقة الـ JWT في الـ FE)

### B.3 تحديث الروابط

- [x] AppSidebar للتاجر لا يحوي روابط `/platform/...` (مُؤكَّد بالفحص)

### B.4 تحقّق Phase B

- [ ] فتح `localhost:3000/platform/tenants` كمستخدم platform → يعمل
- [ ] فتح نفس الرابط كتاجر عادي → يُرفض/يُعاد توجيهه
- [ ] لا يظهر "platform" في سايدبار التاجر

---

## Phase C — فصل واجهات الزبون (`/shop/[slug]/...`)

> يحضّر البنية لواجهات الزبون القادمة. المحتوى الفعلي للزبون يأتي في PRs لاحقة.

### C.1 إنشاء بنية `/shop/[storeSlug]/`

- [x] إنشاء `apps/web/app/shop/[storeSlug]/(storefront)/layout.tsx` بـ providers خاص (بدون AppSidebar الإداري)
- [x] إنشاء `apps/web/app/shop/[storeSlug]/(storefront)/page.tsx` placeholder بسيط

### C.2 نقل customer OTP من `/store/` إلى `/shop/`

- [x] نقل `apps/web/app/store/[storeSlug]/(auth)/` بالكامل (مع `layout.tsx` و `request-otp` و `verify-otp`) إلى `apps/web/app/shop/[storeSlug]/(customer-auth)/` عبر `git mv`

### C.3 تحديث المراجع الـ٤ في صفحات OTP

- [x] `request-otp/page.tsx` — `/store/${storeSlug}/verify-otp?...` → `/shop/${storeSlug}/verify-otp?...`
- [x] `verify-otp/page.tsx` (3 مواضع) — `/store/${storeSlug}/...` → `/shop/${storeSlug}/...` (بما فيها الإحالة بعد نجاح OTP إلى `/shop/${storeSlug}`)

### C.4 تحديث `NEXT_PUBLIC_STOREFRONT_BASE` ودالّة `buildStorefrontUrl`

ملف: `apps/web/modules/auth/store/storefront-url.ts`

- [x] **تغيير القرار**: `NEXT_PUBLIC_STOREFRONT_BASE` يبقى `http://localhost:3000/store` لأنه يُستخدم لتحويل **التاجر** لداشبورده بعد التسجيل/الدخول. تم تحديث الـ docstring في `storefront-url.ts` وتعليق `.env.example` ليوضّحا أن الاسم legacy وأن الوجهة هي داشبورد التاجر، لا واجهة الزبون.
- [x] المستدعون الـ٣ لا يحتاجون تعديلًا — سلوكهم الحالي (التحويل لـ `/store/[slug]`) صحيح بعد المعمارية الجديدة

### C.5 تحديث Middleware

- [x] أُضيف `/shop` إلى `PUBLIC_PREFIXES` (يغطّي `/shop/[slug]/(storefront)` و `/shop/[slug]/(customer-auth)/...`)
- [x] أُزيل `TENANT_PUBLIC_PATTERN` (لم يعد هناك customer auth تحت `/store/`)
- [ ] `/shop/[slug]/checkout` (لاحقًا) قد يتطلّب customer-auth — يُضاف عند بناء الـ checkout

### C.6 تحقّق Phase C

- [ ] `localhost:3000/shop/kemo` → يفتح placeholder المتجر بدون شريط إداري
- [ ] `localhost:3000/shop/kemo/request-otp` → يعمل OTP الزبون
- [ ] `localhost:3000/store/kemo/request-otp` → 404 (المسار القديم زال)
- [ ] إنشاء متجر جديد كتاجر يُحوّل للوجهة الصحيحة

---

## Phase D — تنظيف نهائي وتحقّق شامل

- [x] grep شامل للتأكّد من عدم وجود مسارات قديمة hard-coded في الكود (نظيف)
- [x] `apps/web/app/(dashboard)/` محذوف بالكامل
- [x] `apps/web/app/store/[storeSlug]/(shop)/` و `(auth)/` غير موجودين (الـ store تحتوي على `(dashboard)/` فقط)
- [x] `CLAUDE.md` لا يحوي إشارات لمسارات قديمة؛ `docs/order-admin-ai-rules.md` حُدِّث (٣ مواضع)
- [ ] تشغيل end-to-end:
  - [ ] دخول كتاجر → داشبورد متجره يعمل بكل الأقسام
  - [ ] دخول كمالك منصّة → `/platform/tenants` يعمل
  - [ ] فتح `/shop/[slug]` كزبون → placeholder يظهر بدون شريط إداري
- [x] `pnpm --filter web typecheck` نظيف (0 errors)

---

## ملفات حرجة للمرجع

- `apps/web/middleware.ts` — auth guard، يحتاج تحديث في كل phase
- `apps/web/components/Providers.tsx` — مصدر السايدبار، يُمرَّر له slug في Phase A
- `packages/ui/src/components/app-sidebar.tsx` — `navItems` تتحوّل لدالّة slug-aware
- `apps/web/modules/auth/store/storefront-url.ts` — `buildStorefrontUrl`
- `apps/web/app/store/[storeSlug]/(auth)/verify-otp/page.tsx` — مرجع لكيفية قراءة `storeSlug` من `useParams`
- `.env`, `.env.local`, `.env.example` — `NEXT_PUBLIC_STOREFRONT_BASE`

---

## ملاحظات تنفيذية

- استخدام `git mv` لكل النقل لحفظ history الملفات
- لا نقل ولا تعديل أيّ logic في الصفحات نفسها — فقط مكانها وروابطها. تجنّب refactor إضافي
- بعد كل phase، تشغيل dev server والتحقّق يدويًا قبل الانتقال للـ phase التالي
- لا push بدون موافقة KarmoVsky (قاعدة المشروع)
