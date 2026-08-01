import type { BilingualString } from "@/core/lib/bilingual";

export type Testimonial = {
  id: string;
  name: BilingualString;
  role?: BilingualString;
  avatar?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: BilingualString;
};

export const sampleTestimonials: Testimonial[] = [
  {
    id: "t-1",
    name: { ar: "ليلى حداد", en: "Layla Haddad" },
    role: { ar: "صاحبة مقهى، دمشق", en: "Café owner, Damascus" },
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    rating: 5,
    text: {
      ar: "إنشاء متجرنا الإلكتروني استغرق أقل من ساعة. أصبح العملاء يطلبون بالعربية دون أي عناء.",
      en: "Setting up our online store took less than an hour. Customers can now order in Arabic without any friction.",
    },
  },
  {
    id: "t-2",
    name: { ar: "عمر الخطيب", en: "Omar Khatib" },
    role: { ar: "مؤسس بوتيك، حلب", en: "Boutique founder, Aleppo" },
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    rating: 5,
    text: {
      ar: "إنشاء التطبيق الجوال هو الميزة الأقوى — يحب عملاؤنا وجود تطبيق يحمل علامتنا التجارية.",
      en: "The mobile app generation is the killer feature — our customers love having a branded app on their phones.",
    },
  },
  {
    id: "t-3",
    name: { ar: "رنا صالح", en: "Rana Saleh" },
    role: { ar: "محل حرف يدوية، اللاذقية", en: "Crafts shop, Latakia" },
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80",
    rating: 4,
    text: {
      ar: "دعم الدفع عند الاستلام وPaymera مكّننا من البيع من اليوم الأول. أنصح به بشدة.",
      en: "Cash on delivery and Paymera support meant we could start selling on day one. Highly recommended.",
    },
  },
];
