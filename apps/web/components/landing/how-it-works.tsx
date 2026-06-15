"use client";

import React from 'react';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';

interface StepItem {
  id: number;
  text: string;
  image: string;
  alt: string;
}

export  function HowWeWork() {
  const steps: StepItem[] = [
    {
      id: 1,
      text: "صمم هويتك بلمسات بسيطة، عبر استوديو التصميم (Design Studio)، استخدم واجهة السحب والإفلات لاختيار ألوانك، خطوطك، وتصميم موقعك وتطبيقك في شاشة واحدة.",
      image: "/images/step1-design.png",
      alt: "استوديو تصميم الهوية والموقع",
    },
    {
      id: 2,
      text: "أضف منتجاتك وحدد مناطق الشحن، ارفع منتجاتك، وحدد أسعار التوصيل لـ 14 محافظة سورية، واختر ما إذا كنت ستدير الشحن بنفسك أو عبر مناديبك.",
      image: "/images/step2-cart.png",
      alt: "إضافة المنتجات وإدارة الشحن للمحافظات",
    },
    {
      id: 3,
      text: "ولد تطبيقك وانطلق. بضغطة زر واحدة (وفي أقل من 15 دقيقة)، ستقوم المنصة ببناء تطبيقك الخاص لتكون جاهزاً لاستقبال الطلبات وتتبعها لحظة بلحظة.",
      image: "/images/step3-app.png",
      alt: "إطلاق وتوليد التطبيق الخاص بك",
    }
  ];

  const step1 = steps[0];
  const step2 = steps[1];
  const step3 = steps[2];

  // إعدادات الحركة للحاوية الرئيسية لعمل تأخير متسلسل للعناصر بداخلها
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  // إعدادات الحركة لكل عنصر (ظهور وانزلاق ناعم من الأسفل)
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" } 
    },
  };

  return (
    <motion.section 
    id="how-it-works"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
      className="relative w-full bg-[#f8fafc] py-12 md:py-20 px-4 md:px-8 font-sans overflow-hidden" 
      dir="rtl"
    >
      
      {/* الزخارف العلوية المتموجة جهة اليسار */}
      <div className="absolute top-0 left-0 w-64 md:w-[420px] h-auto opacity-20 pointer-events-none z-0">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M-50,0 Q50,150 150,50 T350,200 T500,100" stroke="#cbd5e1" strokeWidth="1" fill="none" />
          <path d="M-50,20 Q60,170 140,70 T360,220 T500,120" stroke="#cbd5e1" strokeWidth="1" fill="none" />
          <path d="M-50,40 Q70,190 130,90 T370,240 T500,140" stroke="#cbd5e1" strokeWidth="1" fill="none" />
          <path d="M-50,60 Q80,210 120,110 T380,260 T500,160" stroke="#cbd5e1" strokeWidth="1" fill="none" />
        </svg>
      </div>

      <div className="max-w-[1140px] mx-auto relative z-10">
        
        {/* عنوان القسم */}
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center mb-12 md:mb-16">
          <h2 className="text-[#cba358] text-3xl md:text-[38px] font-bold mb-3 tracking-wide">
            كيف نعمل
          </h2>
          <div className="w-20 h-[3px] bg-[#cba358] rounded-full relative">
            <div className="absolute -top-[2px] right-[20%] w-2.5 h-[6px] bg-[#cba358] rounded-full rotate-[15deg]"></div>
          </div>
        </motion.div>

        {/* حاوية الخطوات الطولية */}
        <div className="relative flex flex-col gap-12 md:gap-16">
          
          {/* الخط المنحني الواصل الخلفي - يظهر في الشاشات الكبيرة فقط */}
          <motion.div variants={itemVariants} className="hidden lg:block absolute right-[28%] top-[120px] bottom-[120px] w-[180px] pointer-events-none z-0">
            <svg width="100%" height="100%" viewBox="0 0 180 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
              <path 
                d="M 140 0 L 140 140 Q 140 190 70 190 L 40 190 Q 10 190 10 240 L 10 320 Q 10 370 80 370 L 120 370" 
                stroke="#cbd5e1" 
                strokeWidth="1.5" 
                strokeDasharray="5 5" 
                fill="none"
              />
            </svg>
          </motion.div>

          {/* الخطوة 1: الصورة يمين، النص يسار */}
          {step1 && (
            <motion.div variants={itemVariants} className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12 w-full">
              {/* الجهة اليمنى: الصورة مع تأثير الهوفر */}
              <div className="w-full lg:w-1/2 flex justify-center lg:justify-start relative z-10">
                <motion.div 
                  whileHover={{ scale: 1.06, rotate: -4 }}
                  transition={{ type: "spring", stiffness: 280, damping: 16 }}
                  className="relative w-full max-w-[440px] h-[260px] md:h-[320px]"
                >
                  <Image src={step1.image} alt={step1.alt} fill className="object-contain" priority sizes="(max-width: 768px) 100vw, 50vw" />
                </motion.div>
              </div>
              {/* الجهة اليسرى: النص */}
              <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                <p className="text-[#334155] text-[16px] md:text-[18px] font-medium leading-[2] text-right max-w-[460px]">
                  {step1.text}
                </p>
              </div>
            </motion.div>
          )}

          {/* الخطوة 2: العربة في اليمين */}
          {step2 && (
            <motion.div variants={itemVariants} className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12 w-full">
              {/* الجهة اليمنى: صورة العربة مع تأثير الهوفر */}
              <div className="w-full lg:w-1/2 flex justify-start relative z-10 lg:pr-[34%]">
                <motion.div 
                  whileHover={{ scale: 1.06, rotate: -4 }}
                  transition={{ type: "spring", stiffness: 280, damping: 16 }}
                  className="relative w-[140px] h-[140px] md:w-[180px] md:h-[180px]"
                >
                  <Image src={step2.image} alt={step2.alt} fill className="object-contain" sizes="(max-width: 768px) 100vw, 30vw" />
                </motion.div>
              </div>
              
              {/* الجهة اليسرى: النص */}
              <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                <p className="text-[#334155] text-[16px] md:text-[18px] font-medium leading-[2] text-right max-w-[460px]">
                  {step2.text}
                </p>
              </div>
            </motion.div>
          )}

          {/* الخطوة 3: الصورة يمين، النص يسار */}
          {step3 && (
            <motion.div variants={itemVariants} className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12 w-full">
              {/* الجهة اليمنى: الصورة مع تأثير الهوفر */}
              <div className="w-full lg:w-1/2 flex justify-center lg:justify-start relative z-10">
                <motion.div 
                  whileHover={{ scale: 1.06, rotate: -4 }}
                  transition={{ type: "spring", stiffness: 280, damping: 16 }}
                  className="relative w-full max-w-[440px] h-[260px] md:h-[320px]"
                >
                  <Image src={step3.image} alt={step3.alt} fill className="object-contain" sizes="(max-width: 768px) 100vw, 50vw" />
                </motion.div>
              </div>
              {/* الجهة اليسرى: النص */}
              <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                <p className="text-[#334155] text-[16px] md:text-[18px] font-medium leading-[2] text-right max-w-[460px]">
                  {step3.text}
                </p>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* الحلقات الدائرية المتداخلة أسفل اليمين */}
      <div className="absolute -bottom-[10%] -right-[5%] w-[450px] h-[450px] border-[1.5px] border-slate-300/40 rounded-full z-0 pointer-events-none"></div>
      <div className="absolute -bottom-[15%] -right-[2%] w-[580px] h-[580px] border-[1.5px] border-slate-300/40 rounded-full z-0 pointer-events-none"></div>
    </motion.section>
  );
}