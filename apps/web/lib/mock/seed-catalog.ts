import type {
  MockCategoryRecord,
  MockCollectionRecord,
  MockProductRecord,
  MockTagRecord,
} from "./types"

/** Demo FX so FakeStore USD prices render as SYP (platform default). */
const USD_TO_SYP = 15_000

type FakeStoreCategory =
  | "men's clothing"
  | "women's clothing"
  | "jewelery"
  | "electronics"

type FakeStoreItem = {
  id: number
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  priceUsd: number
  category: FakeStoreCategory
  image: string
  slug: string
}

const CATEGORY_META: Record<
  FakeStoreCategory,
  {
    categoryId: string
    slug: string
    nameAr: string
    nameEn: string
    descriptionAr: string
    descriptionEn: string
    sortOrder: number
    tagId: string
    tagName: string
  }
> = {
  "men's clothing": {
    categoryId: "mock-cat-mens-clothing",
    slug: "mens-clothing",
    nameAr: "ملابس رجالية",
    nameEn: "Men's clothing",
    descriptionAr: "قمصان وجواكيت وإطلالات يومية للرجال",
    descriptionEn: "Shirts, jackets, and everyday looks for men",
    sortOrder: 0,
    tagId: "mock-tag-men",
    tagName: "رجالي",
  },
  "women's clothing": {
    categoryId: "mock-cat-womens-clothing",
    slug: "womens-clothing",
    nameAr: "ملابس نسائية",
    nameEn: "Women's clothing",
    descriptionAr: "جاكيتات وبلوزات وإطلالات كاجوال للنساء",
    descriptionEn: "Jackets, tops, and casual looks for women",
    sortOrder: 1,
    tagId: "mock-tag-women",
    tagName: "نسائي",
  },
  jewelery: {
    categoryId: "mock-cat-jewelery",
    slug: "jewelery",
    nameAr: "مجوهرات",
    nameEn: "Jewelery",
    descriptionAr: "أساور وخواتم وإكسسوارات فاخرة",
    descriptionEn: "Bracelets, rings, and fine accessories",
    sortOrder: 2,
    tagId: "mock-tag-jewelery",
    tagName: "مجوهرات",
  },
  electronics: {
    categoryId: "mock-cat-electronics",
    slug: "electronics",
    nameAr: "إلكترونيات",
    nameEn: "Electronics",
    descriptionAr: "أجهزة تخزين وشاشات وإلكترونيات منزلية",
    descriptionEn: "Storage, monitors, and home electronics",
    sortOrder: 3,
    tagId: "mock-tag-electronics",
    tagName: "إلكترونيات",
  },
}

/**
 * FakeStore catalog (images from fakestoreapi.com) with Arabic translations
 * for SOOQ bilingual mock seed data.
 */
const FAKE_STORE_ITEMS: FakeStoreItem[] = [
  {
    id: 1,
    titleEn: "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops",
    titleAr: "حقيبة ظهر فجالرافن فولدساك رقم 1 — تتسع لحاسوب 15 بوصة",
    descriptionEn:
      "Your perfect pack for everyday use and walks in the forest. Stash your laptop (up to 15 inches) in the padded sleeve, your everyday",
    descriptionAr:
      "حقيبتك المثالية للاستخدام اليومي والمشي في الطبيعة. ضع حاسوبك المحمول (حتى 15 بوصة) في الجيب المبطّن للاستخدام اليومي.",
    priceUsd: 109.95,
    category: "men's clothing",
    image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_t.png",
    slug: "fjallraven-foldsack-no-1-backpack",
  },
  {
    id: 2,
    titleEn: "Mens Casual Premium Slim Fit T-Shirts",
    titleAr: "تيشيرت رجالي كاجوال فاخر بقصة ضيقة",
    descriptionEn:
      "Slim-fitting style, contrast raglan long sleeve, three-button henley placket, light weight & soft fabric for breathable and comfortable wearing. And Solid stitched shirts with round neck made for durability and a great fit for casual fashion wear and diehard baseball fans. The Henley style round neckline includes a three-button placket.",
    descriptionAr:
      "قصة ضيقة بأكمام راغلان متباينة اللون، وياقة هنلي بثلاثة أزرار، وقماش خفيف وناعم للتنفس والراحة. قميص متين بياقة دائرية مناسب للإطلالات الكاجوال وعشاق البيسبول.",
    priceUsd: 22.3,
    category: "men's clothing",
    image:
      "https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_t.png",
    slug: "mens-casual-premium-slim-fit-t-shirts",
  },
  {
    id: 3,
    titleEn: "Mens Cotton Jacket",
    titleAr: "جاكيت قطني رجالي",
    descriptionEn:
      "great outerwear jackets for Spring/Autumn/Winter, suitable for many occasions, such as working, hiking, camping, mountain/rock climbing, cycling, traveling or other outdoors. Good gift choice for you or your family member. A warm hearted love to Father, husband or son in this thanksgiving or Christmas Day.",
    descriptionAr:
      "جاكيت خارجي رائع للربيع والخريف والشتاء، مناسب للعمل والمشي والتخييم وتسلق الجبال وركوب الدراجة والسفر. هدية مميزة للأب أو الزوج أو الابن في الأعياد.",
    priceUsd: 55.99,
    category: "men's clothing",
    image: "https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_t.png",
    slug: "mens-cotton-jacket",
  },
  {
    id: 4,
    titleEn: "Mens Casual Slim Fit",
    titleAr: "قميص رجالي كاجوال بقصة ضيقة",
    descriptionEn:
      "The color could be slightly different between on the screen and in practice. / Please note that body builds vary by person, therefore, detailed size information should be reviewed below on the product description.",
    descriptionAr:
      "قد يختلف اللون قليلاً بين الشاشة والواقع. مقاسات الأجسام تختلف من شخص لآخر، لذا راجع جدول المقاسات في وصف المنتج.",
    priceUsd: 15.99,
    category: "men's clothing",
    image: "https://fakestoreapi.com/img/71YXzeOuslL._AC_UY879_t.png",
    slug: "mens-casual-slim-fit",
  },
  {
    id: 5,
    titleEn:
      "John Hardy Women's Legends Naga Gold & Silver Dragon Station Chain Bracelet",
    titleAr:
      "سوار جون هاردي ليجندز ناغا سلسلة تنين ذهب وفضة للنساء",
    descriptionEn:
      "From our Legends Collection, the Naga was inspired by the mythical water dragon that protects the ocean's pearl. Wear facing inward to be bestowed with love and abundance, or outward for protection.",
    descriptionAr:
      "من مجموعة الأساطير، مستوحى من تنين الماء الأسطوري حارس لؤلؤة المحيط. ارتديه للداخل لنيل الحب والوفرة، أو للخارج للحماية.",
    priceUsd: 695,
    category: "jewelery",
    image: "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_t.png",
    slug: "john-hardy-legends-naga-bracelet",
  },
  {
    id: 6,
    titleEn: "Solid Gold Petite Micropave",
    titleAr: "خاتم ذهب صلب صغير بترصيع مايكرو بافيه",
    descriptionEn:
      "Satisfaction Guaranteed. Return or exchange any order within 30 days.Designed and sold by Hafeez Center in the United States. Satisfaction Guaranteed. Return or exchange any order within 30 days.",
    descriptionAr:
      "رضا مضمون. إمكانية الإرجاع أو الاستبدال خلال 30 يوماً. مصمم ومباع عبر Hafeez Center في الولايات المتحدة.",
    priceUsd: 168,
    category: "jewelery",
    image: "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_t.png",
    slug: "solid-gold-petite-micropave",
  },
  {
    id: 7,
    titleEn: "White Gold Plated Princess",
    titleAr: "خاتم برنسيس مطلي ذهب أبيض",
    descriptionEn:
      "Classic Created Wedding Engagement Solitaire Diamond Promise Ring for Her. Gifts to spoil your love more for Engagement, Wedding, Anniversary, Valentine's Day...",
    descriptionAr:
      "خاتم خطوبة وزفاف كلاسيكي بفص منفرد. هدية مثالية للخطوبة والزفاف والذكرى وعيد الحب.",
    priceUsd: 9.99,
    category: "jewelery",
    image: "https://fakestoreapi.com/img/71YAIFU48IL._AC_UL640_QL65_ML3_t.png",
    slug: "white-gold-plated-princess",
  },
  {
    id: 8,
    titleEn: "Pierced Owl Rose Gold Plated Stainless Steel Double",
    titleAr: "أقراط بيلسد أول مطلية ذهب وردي من الفولاذ المقاوم للصدأ",
    descriptionEn:
      "Rose Gold Plated Double Flared Tunnel Plug Earrings. Made of 316L Stainless Steel",
    descriptionAr:
      "أقراط نفق مزدوجة مطلية ذهب وردي. مصنوعة من فولاذ مقاوم للصدأ 316L.",
    priceUsd: 10.99,
    category: "jewelery",
    image: "https://fakestoreapi.com/img/51UDEzMJVpL._AC_UL640_QL65_ML3_t.png",
    slug: "pierced-owl-rose-gold-double",
  },
  {
    id: 9,
    titleEn: "WD 2TB Elements Portable External Hard Drive - USB 3.0",
    titleAr: "قرص صلب خارجي محمول WD Elements بسعة 2 تيرابايت — USB 3.0",
    descriptionEn:
      "USB 3.0 and USB 2.0 Compatibility Fast data transfers Improve PC Performance High Capacity; Compatibility Formatted NTFS for Windows 10, Windows 8.1, Windows 7; Reformatting may be required for other operating systems; Compatibility may vary depending on user’s hardware configuration and operating system",
    descriptionAr:
      "متوافق مع USB 3.0 و USB 2.0 لنقل سريع وتحسين أداء الحاسوب. منسّق NTFS لنظام ويندوز؛ قد يلزم إعادة التنسيق لأنظمة أخرى حسب الجهاز ونظام التشغيل.",
    priceUsd: 64,
    category: "electronics",
    image: "https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_t.png",
    slug: "wd-2tb-elements-portable-hard-drive",
  },
  {
    id: 10,
    titleEn: "SanDisk SSD PLUS 1TB Internal SSD - SATA III 6 Gb/s",
    titleAr: "قرص SSD داخلي SanDisk PLUS بسعة 1 تيرابايت — SATA III",
    descriptionEn:
      "Easy upgrade for faster boot up, shutdown, application load and response (As compared to 5400 RPM SATA 2.5” hard drive; Based on published specifications and internal benchmarking tests using PCMark vantage scores) Boosts burst write performance, making it ideal for typical PC workloads The perfect balance of performance and reliability Read/write speeds of up to 535MB/s/450MB/s (Based on internal testing; Performance may vary depending upon drive capacity, host device, OS and application.)",
    descriptionAr:
      "ترقية سهلة لإقلاع وإيقاف وتحميل تطبيقات أسرع مقارنة بالأقراص الميكانيكية. توازن بين الأداء والموثوقية بسرعات قراءة/كتابة تصل إلى 535/450 ميجابايت في الثانية (قد تختلف حسب الجهاز والنظام).",
    priceUsd: 109,
    category: "electronics",
    image: "https://fakestoreapi.com/img/61U7T1koQqL._AC_SX679_t.png",
    slug: "sandisk-ssd-plus-1tb",
  },
  {
    id: 11,
    titleEn:
      "Silicon Power 256GB SSD 3D NAND A55 SLC Cache Performance Boost SATA III 2.5",
    titleAr:
      "قرص SSD Silicon Power سعة 256 جيجابايت 3D NAND A55 — SATA III",
    descriptionEn:
      "3D NAND flash are applied to deliver high transfer speeds Remarkable transfer speeds that enable faster bootup and improved overall system performance. The advanced SLC Cache Technology allows performance boost and longer lifespan 7mm slim design suitable for Ultrabooks and Ultra-slim notebooks. Supports TRIM command, Garbage Collection technology, RAID, and ECC (Error Checking & Correction) to provide the optimized performance and enhanced reliability.",
    descriptionAr:
      "ذاكرة 3D NAND لسرعات نقل عالية وإقلاع أسرع. تقنية SLC Cache لتعزيز الأداء والعمر، بتصميم نحيف 7 مم مناسب للأجهزة فائقة النحافة، مع دعم TRIM و RAID و ECC.",
    priceUsd: 109,
    category: "electronics",
    image: "https://fakestoreapi.com/img/71kWymZ+c+L._AC_SX679_t.png",
    slug: "silicon-power-256gb-ssd-a55",
  },
  {
    id: 12,
    titleEn: "WD 4TB Gaming Drive Works with Playstation 4 Portable External Hard Drive",
    titleAr: "قرص ألعاب WD خارجي محمول بسعة 4 تيرابايت متوافق مع PlayStation 4",
    descriptionEn:
      "Expand your PS4 gaming experience, Play anywhere Fast and easy, setup Sleek design with high capacity, 3-year manufacturer's limited warranty",
    descriptionAr:
      "وسّع تجربة ألعاب PS4 والعب في أي مكان. إعداد سريع وتصميم أنيق بسعة عالية، مع ضمان محدود من الشركة المصنعة لمدة 3 سنوات.",
    priceUsd: 114,
    category: "electronics",
    image: "https://fakestoreapi.com/img/61mtL65D4cL._AC_SX679_t.png",
    slug: "wd-4tb-gaming-drive-ps4",
  },
  {
    id: 13,
    titleEn: "Acer SB220Q bi 21.5 inches Full HD (1920 x 1080) IPS Ultra-Thin",
    titleAr: "شاشة Acer SB220Q مقاس 21.5 بوصة Full HD IPS فائقة النحافة",
    descriptionEn:
      "21. 5 inches Full HD (1920 x 1080) widescreen IPS display And Radeon free Sync technology. No compatibility for VESA Mount Refresh Rate: 75Hz - Using HDMI port Zero-frame design | ultra-thin | 4ms response time | IPS panel Aspect ratio - 16: 9. Color Supported - 16. 7 million colors. Brightness - 250 nit Tilt angle -5 degree to 15 degree. Horizontal viewing angle-178 degree. Vertical viewing angle-178 degree 75 hertz",
    descriptionAr:
      "شاشة IPS بعرض 21.5 بوصة ودقة Full HD 1920×1080 مع FreeSync. معدل تحديث 75Hz عبر HDMI، تصميم بلا إطار، زمن استجابة 4ms، سطوع 250 نت، وزوايا مشاهدة واسعة.",
    priceUsd: 599,
    category: "electronics",
    image: "https://fakestoreapi.com/img/81QpkIctqPL._AC_SX679_t.png",
    slug: "acer-sb220q-21-5-full-hd-ips",
  },
  {
    id: 14,
    titleEn:
      "Samsung 49-Inch CHG90 144Hz Curved Gaming Monitor (LC49HG90DMNXZA) – Super Ultrawide Screen QLED",
    titleAr:
      "شاشة ألعاب سامسونج منحنية 49 بوصة CHG90 بمعدل 144Hz — QLED فائقة العرض",
    descriptionEn:
      "49 INCH SUPER ULTRAWIDE 32:9 CURVED GAMING MONITOR with dual 27 inch screen side by side QUANTUM DOT (QLED) TECHNOLOGY, HDR support and factory calibration provides stunningly realistic and accurate color and contrast 144HZ HIGH REFRESH RATE and 1ms ultra fast response time work to eliminate motion blur, ghosting, and reduce input lag",
    descriptionAr:
      "شاشة ألعاب منحنية فائقة العرض 49 بوصة بنسبة 32:9 بتقنية Quantum Dot (QLED) ودعم HDR. معدل تحديث 144Hz وزمن استجابة 1ms لتقليل الضبابية والتأخير.",
    priceUsd: 999.99,
    category: "electronics",
    image: "https://fakestoreapi.com/img/81Zt42ioCgL._AC_SX679_t.png",
    slug: "samsung-49-chg90-curved-gaming-monitor",
  },
  {
    id: 15,
    titleEn: "BIYLACLESEN Women's 3-in-1 Snowboard Jacket Winter Coats",
    titleAr: "جاكيت تزلج نسائي 3 في 1 لفصل الشتاء من BIYLACLESEN",
    descriptionEn:
      "Note:The Jackets is US standard size, Please choose size as your usual wear Material: 100% Polyester; Detachable Liner Fabric: Warm Fleece. Detachable Functional Liner: Skin Friendly, Lightweigt and Warm.Stand Collar Liner jacket, keep you warm in cold weather. Zippered Pockets: 2 Zippered Hand Pockets, 2 Zippered Pockets on Chest (enough to keep cards or keys)and 1 Hidden Pocket Inside.Zippered Hand Pockets and Hidden Pocket keep your things secure. Humanized Design: Adjustable and Detachable Hood and Adjustable cuff to prevent the wind and water,for a comfortable fit. 3 in 1 Detachable Design provide more convenience, you can separate the coat and inner as needed, or wear it together. It is suitable for different season and help you adapt to different climates",
    descriptionAr:
      "مقاسات أمريكية قياسية. بوليستر 100٪ مع بطانة صوف دافئة قابلة للفصل. جيوب بسحّاب وقلنسوة قابلة للتعديل. تصميم 3 في 1 يمكنك فصل الطبقة الخارجية عن الداخلية حسب الموسم.",
    priceUsd: 56.99,
    category: "women's clothing",
    image: "https://fakestoreapi.com/img/51Y5NI-I5jL._AC_UX679_t.png",
    slug: "biylaclesen-womens-3-in-1-snowboard-jacket",
  },
  {
    id: 16,
    titleEn: "Lock and Love Women's Removable Hooded Faux Leather Moto Biker Jacket",
    titleAr: "جاكيت موتو نسائي جلد صناعي بقلنسوة قابلة للإزالة من Lock and Love",
    descriptionEn:
      "100% POLYURETHANE(shell) 100% POLYESTER(lining) 75% POLYESTER 25% COTTON (SWEATER), Faux leather material for style and comfort / 2 pockets of front, 2-For-One Hooded denim style faux leather jacket, Button detail on waist / Detail stitching at sides, HAND WASH ONLY / DO NOT BLEACH / LINE DRY / DO NOT IRON",
    descriptionAr:
      "غلاف بولي يوريثان وبطانة بوليستر، مظهر جلد صناعي أنيق ومريح. جيبان أماميان وتفاصيل أزرار عند الخصر. يُغسل يدوياً فقط — لا مبيّض ولا كيّ.",
    priceUsd: 29.95,
    category: "women's clothing",
    image: "https://fakestoreapi.com/img/81XH0e8fefL._AC_UY879_t.png",
    slug: "lock-and-love-womens-faux-leather-moto-jacket",
  },
  {
    id: 17,
    titleEn: "Rain Jacket Women Windbreaker Striped Climbing Raincoats",
    titleAr: "جاكيت مطر نسائي مقاوم للرياح بخطوط للتسلق",
    descriptionEn:
      "Lightweight perfet for trip or casual wear---Long sleeve with hooded, adjustable drawstring waist design. Button and zipper front closure raincoat, fully stripes Lined and The Raincoat has 2 side pockets are a good size to hold all kinds of things, it covers the hips, and the hood is generous but doesn't overdo it.Attached Cotton Lined Hood with Adjustable Drawstrings give it a real styled look.",
    descriptionAr:
      "خفيف مثالي للسفر والإطلالات اليومية. أكمام طويلة وقلنسوة وخصر برباط قابل للتعديل، إغلاق بأزرار وسحّاب، وبطانة مخططة مع جيبين جانبيين.",
    priceUsd: 39.99,
    category: "women's clothing",
    image: "https://fakestoreapi.com/img/71HblAHs5xL._AC_UY879_-2t.png",
    slug: "womens-rain-jacket-windbreaker-striped",
  },
  {
    id: 18,
    titleEn: "MBJ Women's Solid Short Sleeve Boat Neck V",
    titleAr: "بلوزة نسائية قصيرة الأكمام بياقة قارب من MBJ",
    descriptionEn:
      "95% RAYON 5% SPANDEX, Made in USA or Imported, Do Not Bleach, Lightweight fabric with great stretch for comfort, Ribbed on sleeves and neckline / Double stitching on bottom hem",
    descriptionAr:
      "95٪ رايون و5٪ سباندكس. قماش خفيف بمرونة مريحة، حواف مضلعة عند الأكمام والياقة، وخياطة مزدوجة عند الحاشية. لا تستخدم المبيّض.",
    priceUsd: 9.85,
    category: "women's clothing",
    image: "https://fakestoreapi.com/img/71z3kpMAYsL._AC_UY879_t.png",
    slug: "mbj-womens-solid-short-sleeve-boat-neck",
  },
  {
    id: 19,
    titleEn: "Opna Women's Short Sleeve Moisture",
    titleAr: "تيشيرت نسائي قصير الأكمام ماص للرطوبة من Opna",
    descriptionEn:
      "100% Polyester, Machine wash, 100% cationic polyester interlock, Machine Wash & Pre Shrunk for a Great Fit, Lightweight, roomy and highly breathable with moisture wicking fabric which helps to keep moisture away, Soft Lightweight Fabric with comfortable V-neck collar and a slimmer fit, delivers a sleek, more feminine silhouette and Added Comfort",
    descriptionAr:
      "بوليستر 100٪ قابل للغسل الآلي ومسبق الانكماش. خفيف وواسع ويتنفس جيداً مع خاصية طرد الرطوبة، وياقة V بقصة أنحف لإطلالة أنثوية مريحة.",
    priceUsd: 7.95,
    category: "women's clothing",
    image: "https://fakestoreapi.com/img/51eg55uWmdL._AC_UX679_t.png",
    slug: "opna-womens-short-sleeve-moisture",
  },
  {
    id: 20,
    titleEn: "DANVOUY Womens T Shirt Casual Cotton Short",
    titleAr: "تيشيرت نسائي قطني كاجوال قصير الأكمام من DANVOUY",
    descriptionEn:
      "95%Cotton,5%Spandex, Features: Casual, Short Sleeve, Letter Print,V-Neck,Fashion Tees, The fabric is soft and has some stretch., Occasion: Casual/Office/Beach/School/Home/Street. Season: Spring,Summer,Autumn,Winter.",
    descriptionAr:
      "95٪ قطن و5٪ سباندكس. كاجوال بأكمام قصيرة وطباعة حروف وياقة V. قماش ناعم بمرونة خفيفة مناسب للكاجوال والمكتب والشاطئ والمدرسة طوال الفصول.",
    priceUsd: 12.99,
    category: "women's clothing",
    image: "https://fakestoreapi.com/img/61pHAEJ4NML._AC_UX679_t.png",
    slug: "danvouy-womens-casual-cotton-short-tee",
  },
]

const toSyp = (usd: number): number => Math.round(usd * USD_TO_SYP)

const productIdFor = (id: number) => `mock-product-${id}`
const variantIdFor = (id: number) => `mock-var-${id}`
const mediaIdFor = (id: number) => `mock-media-${id}`

/** Editorial + category tags used by admin pickers and product cards. */
const TAG_DEFS = [
  { productTagId: "mock-tag-new", tagName: "جديد", slug: "new" },
  { productTagId: "mock-tag-featured", tagName: "مميز", slug: "featured" },
  { productTagId: "mock-tag-exclusive", tagName: "حصري", slug: "exclusive" },
  { productTagId: "mock-tag-sale", tagName: "تخفيض", slug: "sale" },
  { productTagId: "mock-tag-gift", tagName: "هدية", slug: "gift" },
  { productTagId: "mock-tag-classic", tagName: "كلاسيكي", slug: "classic" },
  { productTagId: "mock-tag-elegant", tagName: "أناقة", slug: "elegant" },
  { productTagId: "mock-tag-men", tagName: "رجالي", slug: "men" },
  { productTagId: "mock-tag-women", tagName: "نسائي", slug: "women" },
  { productTagId: "mock-tag-jewelery", tagName: "مجوهرات", slug: "jewelery" },
  {
    productTagId: "mock-tag-electronics",
    tagName: "إلكترونيات",
    slug: "electronics",
  },
] as const

const tagRef = (productTagId: string) => {
  const tag = TAG_DEFS.find((entry) => entry.productTagId === productTagId)
  return { id: productTagId, name: tag?.tagName ?? productTagId }
}

const tagsForProduct = (
  item: FakeStoreItem
): Array<{ id: string; name: string }> => {
  const meta = CATEGORY_META[item.category]
  const tags = [tagRef(meta.tagId)]

  // New arrivals highlight
  if ([1, 5, 9, 15, 13, 18].includes(item.id)) {
    tags.push(tagRef("mock-tag-new"))
  }
  // Featured / hero picks
  if ([3, 5, 11, 14, 18].includes(item.id)) {
    tags.push(tagRef("mock-tag-featured"))
  }
  // Exclusive luxury
  if ([5, 6, 14].includes(item.id)) {
    tags.push(tagRef("mock-tag-exclusive"))
  }
  // Sale (lower-priced clothing / entry jewelery)
  if ([2, 4, 7, 8, 16, 18, 19, 20].includes(item.id)) {
    tags.push(tagRef("mock-tag-sale"))
  }
  // Gift-ready
  if (item.category === "jewelery" || [1, 3].includes(item.id)) {
    tags.push(tagRef("mock-tag-gift"))
  }
  // Style tags
  if ([6, 7].includes(item.id)) {
    tags.push(tagRef("mock-tag-classic"))
  }
  if ([5, 6, 15, 16].includes(item.id)) {
    tags.push(tagRef("mock-tag-elegant"))
  }

  // Dedupe by id
  const seen = new Set<string>()
  return tags.filter((tag) => {
    if (seen.has(tag.id)) return false
    seen.add(tag.id)
    return true
  })
}

export const seedMockTags = (): MockTagRecord[] => {
  const now = new Date().toISOString()
  return TAG_DEFS.map((tag) => ({
    productTagId: tag.productTagId,
    tagName: tag.tagName,
    slug: tag.slug,
    createdAt: now,
    updatedAt: now,
  }))
}

export const seedMockCategories = (): MockCategoryRecord[] => {
  const now = new Date().toISOString()
  return Object.values(CATEGORY_META).map((meta) => ({
    categoryId: meta.categoryId,
    nameAr: meta.nameAr,
    nameEn: meta.nameEn,
    slug: meta.slug,
    descriptionAr: meta.descriptionAr,
    descriptionEn: meta.descriptionEn,
    parentCategoryId: null,
    sortOrder: meta.sortOrder,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }))
}

export const seedMockProducts = (): MockProductRecord[] => {
  const now = new Date().toISOString()
  return FAKE_STORE_ITEMS.map((item) => {
    const meta = CATEGORY_META[item.category]
    const price = toSyp(item.priceUsd)
    const compareAtPrice = Math.round(price * 1.15)
    return {
      productId: productIdFor(item.id),
      titleAr: item.titleAr,
      titleEn: item.titleEn,
      descriptionAr: item.descriptionAr,
      descriptionEn: item.descriptionEn,
      slug: item.slug,
      basePrice: price,
      compareAtPrice,
      currencyCode: "SYP",
      status: "ACTIVE",
      seoTitle: item.titleAr,
      seoDescription: item.descriptionAr.slice(0, 160),
      allowOversell: false,
      defaultCategoryId: meta.categoryId,
      categories: [
        {
          id: meta.categoryId,
          nameAr: meta.nameAr,
          nameEn: meta.nameEn,
        },
      ],
      tags: tagsForProduct(item),
      media: [
        {
          mediaAssetId: mediaIdFor(item.id),
          url: item.image,
          thumbnailUrl: item.image,
        },
      ],
      options: [],
      variants: [
        {
          variantId: variantIdFor(item.id),
          sku: `FS-${item.id}`,
          price,
          compareAtPrice,
          stockQty: 20 + (item.id % 10),
          isActive: true,
        },
      ],
      createdAt: now,
      updatedAt: now,
    }
  })
}

export const seedMockCollections = (): MockCollectionRecord[] => {
  const now = new Date().toISOString()
  const byCategory = (category: FakeStoreCategory) =>
    FAKE_STORE_ITEMS.filter((item) => item.category === category).map((item) =>
      productIdFor(item.id)
    )

  const saleProductIds = FAKE_STORE_ITEMS.filter((item) =>
    [2, 4, 7, 8, 16, 18, 19, 20].includes(item.id)
  ).map((item) => productIdFor(item.id))

  const makeCollection = (
    id: string,
    name: string,
    slug: string,
    descriptionAr: string,
    descriptionEn: string,
    productIds: string[]
  ): MockCollectionRecord => ({
    collectionId: id,
    collectionName: name,
    collectionSlug: slug,
    collectionType: "MANUAL",
    descriptionAr,
    descriptionEn,
    isActive: true,
    productIds,
    createdAt: now,
    updatedAt: now,
  })

  return [
    makeCollection(
      "mock-col-featured",
      "مختارات مميزة",
      "featured",
      "منتجات مميزة لشبكات المنتجات في المحرر",
      "Featured picks for Design Studio product grids",
      [
        productIdFor(3),
        productIdFor(5),
        productIdFor(11),
        productIdFor(14),
        productIdFor(18),
        productIdFor(1),
      ]
    ),
    makeCollection(
      "mock-col-new-arrivals",
      "وصل حديثاً",
      "new-arrivals",
      "أحدث المنتجات المضافة للمتجر",
      "Newest products added to the store",
      [
        productIdFor(1),
        productIdFor(5),
        productIdFor(9),
        productIdFor(15),
        productIdFor(13),
        productIdFor(18),
      ]
    ),
    makeCollection(
      "mock-col-essentials",
      "أساسيات",
      "essentials",
      "قطع يومية أساسية من الملابس",
      "Everyday clothing essentials",
      [
        ...byCategory("men's clothing"),
        ...byCategory("women's clothing"),
      ].slice(0, 8)
    ),
    makeCollection(
      "mock-col-gifts",
      "هدايا",
      "gifts",
      "مجوهرات ومنتجات مناسبة للإهداء",
      "Jewelery and gift-ready picks",
      [...byCategory("jewelery"), productIdFor(1), productIdFor(3)]
    ),
    makeCollection(
      "mock-col-sale",
      "تخفيضات",
      "sale",
      "منتجات مخفّضة للتجربة في المحرر والمتجر",
      "On-sale products for editor and storefront testing",
      saleProductIds
    ),
    makeCollection(
      "mock-col-mens-clothing",
      "ملابس رجالية",
      "mens-clothing",
      "كل منتجات الملابس الرجالية",
      "All men's clothing products",
      byCategory("men's clothing")
    ),
    makeCollection(
      "mock-col-womens-clothing",
      "ملابس نسائية",
      "womens-clothing",
      "كل منتجات الملابس النسائية",
      "All women's clothing products",
      byCategory("women's clothing")
    ),
    makeCollection(
      "mock-col-jewelery",
      "مجوهرات",
      "jewelery",
      "أساور وخواتم وإكسسوارات",
      "Bracelets, rings, and accessories",
      byCategory("jewelery")
    ),
    makeCollection(
      "mock-col-electronics",
      "إلكترونيات",
      "electronics",
      "أجهزة وشاشات وتخزين",
      "Devices, monitors, and storage",
      byCategory("electronics")
    ),
  ]
}
