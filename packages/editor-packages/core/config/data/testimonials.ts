export type Testimonial = {
  id: string;
  name: string;
  nameAr?: string;
  role?: string;
  roleAr?: string;
  avatar?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  textAr?: string;
};

export const sampleTestimonials: Testimonial[] = [
  {
    id: "t-1",
    name: "Layla Haddad",
    nameAr: "ليلى حداد",
    role: "Café owner, Damascus",
    roleAr: "صاحبة مقهى، دمشق",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    rating: 5,
    text: "Setting up our online store took less than an hour. Customers can now order in Arabic without any friction.",
    textAr:
      "إنشاء متجرنا الإلكتروني استغرق أقل من ساعة. أصبح العملاء يطلبون بالعربية دون أي عناء.",
  },
  {
    id: "t-2",
    name: "Omar Khatib",
    nameAr: "عمر الخطيب",
    role: "Boutique founder, Aleppo",
    roleAr: "مؤسس بوتيك، حلب",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    rating: 5,
    text: "The mobile app generation is the killer feature — our customers love having a branded app on their phones.",
    textAr:
      "إنشاء التطبيق الجوال هو الميزة الأقوى — يحب عملاؤنا وجود تطبيق يحمل علامتنا التجارية.",
  },
  {
    id: "t-3",
    name: "Rana Saleh",
    nameAr: "رنا صالح",
    role: "Crafts shop, Latakia",
    roleAr: "محل حرف يدوية، اللاذقية",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80",
    rating: 4,
    text: "Cash on delivery and Paymera support meant we could start selling on day one. Highly recommended.",
    textAr:
      "دعم الدفع عند الاستلام وPaymera مكّننا من البيع من اليوم الأول. أنصح به بشدة.",
  },
];
