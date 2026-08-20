/**
 * One-shot script: run with
 *   pnpm exec jest themes/inject-nova-home-fill.spec.ts --testNamePattern=fills
 *
 * Fills the ~37 literal-empty ContentHeading/ContentParagraph nodes on nova's
 * home page (`/`) with real bilingual copy, and adds ContentIcon blocks to
 * the trust bar and "Why Nova" cards (the theme used zero ContentIcon blocks
 * anywhere before this). Targets nodes by their stable `Group-*` ids rather
 * than array indices, since those ids already encode intent
 * (`Group-cat-laptops`, `Group-spec-import`, `Group-quote-1`, ...).
 */
import fs from "node:fs";
import path from "node:path";

type Node = { type?: string; props?: Record<string, unknown> };

const themePath = path.join(__dirname, "theme-nova-electronics.json");

function findById(node: unknown, id: string): Node | null {
  if (Array.isArray(node)) {
    for (const entry of node) {
      const found = findById(entry, id);
      if (found) return found;
    }
    return null;
  }
  if (!node || typeof node !== "object") return null;
  const record = node as Node;
  if (record.props?.id === id) return record;
  if (record.props?.content != null) return findById(record.props.content, id);
  return null;
}

function bilingual(ar: string, en: string) {
  return { ar, en };
}

function setText(group: Node, childIndex: number, ar: string, en: string) {
  const content = group.props?.content as Node[] | undefined;
  const child = content?.[childIndex];
  if (!child?.props) throw new Error(`missing child ${childIndex} in group`);
  child.props.text = bilingual(ar, en);
}

function makeIcon(id: string, icon: string, size = 32) {
  return {
    type: "ContentIcon",
    props: {
      id,
      icon,
      size,
      colorMode: "theme",
      colorTheme: "primary",
      colorFixed: "#4f6df5",
    },
  };
}

it("fills empty text nodes and adds icons on nova's home page", () => {
  const theme = JSON.parse(fs.readFileSync(themePath, "utf8"));
  const home = (theme.pages ?? []).find(
    (page: { path?: string }) => page.path === "/"
  );
  if (!home) throw new Error("home page not found");

  // ── Hero ──────────────────────────────────────────────────────────────
  const heroGroup = findById(home.content, "Group-hero");
  if (!heroGroup?.props) throw new Error("hero group not found");
  setText(
    heroGroup,
    1,
    "أحدث الأجهزة الإلكترونية بضمان أصلي وتوصيل سريع",
    "The latest electronics — genuine warranty, fast delivery"
  );
  setText(
    heroGroup,
    2,
    "من الهواتف إلى أجهزة الألعاب: نستورد مباشرة من الوكلاء الرسميين ونوصلك خلال ٢٤-٤٨ ساعة.",
    "From phones to gaming gear — imported directly from official agents and delivered within 24–48 hours."
  );

  // ── Trust bar ────────────────────────────────────────────────────────
  const trustBar: [string, string, string][] = [
    [
      "Group-trust-1",
      "قطع أصلية 100% مع كرت ضمان من الوكيل المعتمد.",
      "100% genuine parts with an authorized dealer warranty card.",
    ],
    [
      "Group-trust-2",
      "التوصيل خلال 24-48 ساعة لجميع المحافظات.",
      "Delivery within 24–48 hours to all governorates.",
    ],
    [
      "Group-trust-3",
      "ادفع نقداً عند استلام طلبك دون أي التزام مسبق.",
      "Pay cash on delivery — no upfront commitment.",
    ],
    [
      "Group-trust-4",
      "فريق دعم متخصص لمساعدتك في أي وقت.",
      "A specialist support team ready to help anytime.",
    ],
  ];
  const trustIcons: Record<string, string> = {
    "Group-trust-1": "shield-check",
    "Group-trust-2": "truck",
    "Group-trust-3": "banknote",
    "Group-trust-4": "headset",
  };
  for (const [id, ar, en] of trustBar) {
    const group = findById(home.content, id);
    if (!group?.props) throw new Error(`${id} not found`);
    const content = group.props.content as Node[];
    // Idempotent: this script re-runs on every `pnpm test`, so only
    // unshift the icon once — a second run must not shift the heading/
    // paragraph indices out from under `setText` below.
    if (content[0]?.type !== "ContentIcon") {
      content.unshift(makeIcon(`Icon-${id}`, trustIcons[id]!, 32));
    }
    setText(group, 1, ar, en);
  }

  // ── Categories ───────────────────────────────────────────────────────
  const categories: Record<string, [string, string, string, string]> = {
    "Group-cat-laptops": [
      "حواسيب محمولة",
      "Laptops",
      "أداء قوي للعمل والدراسة والتصميم",
      "Powerful performance for work, study, and design",
    ],
    "Group-cat-audio": [
      "سماعات وصوتيات",
      "Audio & headphones",
      "صوت نقي وعزل ضوضاء من أفضل الماركات",
      "Crystal-clear sound and noise cancellation from top brands",
    ],
    "Group-cat-phones": [
      "هواتف ذكية",
      "Smartphones",
      "أحدث الإصدارات بضمان الوكيل الرسمي",
      "The latest releases with an official agent warranty",
    ],
    "Group-cat-gaming": [
      "أجهزة ألعاب",
      "Gaming gear",
      "تجهيزات من أجهزة تحكم إلى شاشات عالية الأداء",
      "Gear from controllers to high-performance monitors",
    ],
  };
  for (const [id, [titleAr, titleEn, descAr, descEn]] of Object.entries(
    categories
  )) {
    const outer = findById(home.content, id);
    if (!outer?.props) throw new Error(`${id} not found`);
    const body = (outer.props.content as Node[])[1];
    if (!body?.props) throw new Error(`${id} body not found`);
    setText(body, 0, titleAr, titleEn);
    setText(body, 1, descAr, descEn);
  }

  // ── Flash deals ──────────────────────────────────────────────────────
  const flashGroup = findById(home.content, "Group-deals");
  if (!flashGroup?.props) throw new Error("flash deals group not found");
  setText(
    flashGroup,
    2,
    "عرض ساري حتى نفاد الكمية على تشكيلة مختارة من السماعات وملحقاتها.",
    "Valid while supplies last on a selected range of headphones and accessories."
  );

  // ── Why Nova ─────────────────────────────────────────────────────────
  const whyNova: Record<string, [string, string, string, string, string]> = {
    "Group-spec-import": [
      "package-check",
      "استيراد مباشر من الوكلاء الرسميين",
      "Direct import from authorized agents",
      "كل منتج يصلك عبر قنوات استيراد موثّقة، بلا وسطاء وبلا مخاطرة.",
      "Every product arrives through documented import channels — no middlemen, no risk.",
    ],
    "Group-spec-check": [
      "badge-check",
      "فحص جودة على كل قطعة",
      "Quality check on every unit",
      "نفحص كل جهاز قبل الشحن للتأكد من مطابقته للمواصفات الأصلية.",
      "We inspect every device before shipping to confirm it matches original specs.",
    ],
    "Group-spec-support": [
      "life-buoy",
      "دعم فني بعد البيع",
      "After-sales technical support",
      "فريقنا الفني معك بعد الشراء لأي صيانة أو استفسار تقني.",
      "Our technical team stays with you after purchase for maintenance or questions.",
    ],
  };
  for (const [id, [icon, titleAr, titleEn, descAr, descEn]] of Object.entries(
    whyNova
  )) {
    const group = findById(home.content, id);
    if (!group?.props) throw new Error(`${id} not found`);
    const content = group.props.content as Node[];
    // content[0] and content[1] are both empty ContentHeadings today —
    // turn the first into the feature icon, keep the second as the title.
    content[0] = makeIcon(`Icon-${id}`, icon, 40);
    setText(group, 1, titleAr, titleEn);
    setText(group, 2, descAr, descEn);
  }

  // ── Reviews ──────────────────────────────────────────────────────────
  const reviewsSection = home.content[7];
  const reviewsSubtitle = (reviewsSection.props!.content as Node[])[1];
  if (!reviewsSubtitle?.props) throw new Error("reviews subtitle not found");
  reviewsSubtitle.props.text = bilingual(
    "أكثر من ١٢,٠٠٠ طلب توصيل ناجح وتقييمات حقيقية من عملائنا.",
    "Over 12,000 successful deliveries and real reviews from our customers."
  );

  const reviews: Record<string, [string, string, string, string]> = {
    "Group-quote-1": [
      "طلبت سماعة لاسلكية وكانت أصلية 100% ووصلت خلال يوم واحد فقط.",
      "I ordered wireless headphones — 100% genuine, delivered in just one day.",
      "اشترت سماعات Nova Air",
      "Bought Nova Air headphones",
    ],
    "Group-quote-2": [
      "الدعم الفني ساعدني أختار اللابتوب المناسب لشغلي، وما ندمت.",
      "Their support team helped me pick the right laptop for my work — no regrets.",
      "اشترى لابتوب Nova Book 14",
      "Bought a Nova Book 14 laptop",
    ],
    "Group-quote-3": [
      "أسعار منافسة وضمان حقيقي، رجعت أشتري منهم أكتر من مرة.",
      "Competitive prices and a real warranty — I've bought from them more than once.",
      "اشترت ساعة Nova Watch",
      "Bought a Nova Watch smartwatch",
    ],
  };
  for (const [id, [quoteAr, quoteEn, roleAr, roleEn]] of Object.entries(
    reviews
  )) {
    const group = findById(home.content, id);
    if (!group?.props) throw new Error(`${id} not found`);
    setText(group, 0, "★★★★★", "★★★★★");
    setText(group, 1, quoteAr, quoteEn);
    setText(group, 4, roleAr, roleEn);
  }

  // ── Closing CTA ──────────────────────────────────────────────────────
  const ctaGroup = findById(home.content, "Group-cta");
  if (!ctaGroup?.props) throw new Error("closing CTA group not found");
  setText(
    ctaGroup,
    2,
    "زُر معرضنا في دمشق وجرّب أحدث الأجهزة قبل اتخاذ قرارك.",
    "Visit our Damascus showroom and try the latest devices before you decide."
  );

  fs.writeFileSync(themePath, `${JSON.stringify(theme, null, 2)}\n`, "utf8");
});
