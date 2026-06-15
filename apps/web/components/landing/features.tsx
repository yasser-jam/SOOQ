"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link'; // إضافة استيراد Link
import { motion, Variants } from 'framer-motion';

export function Features() {

  // إعدادات الحركة للحاوية لعمل تأخير متسلسل (Stagger) للعناصر
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // تأخير ظهور العناصر تباعاً
      },
    },
  };

  // إعدادات الحركة للنصوص والأزرار (ظهور من الأسفل للأعلى)
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.7, ease: "easeOut" } 
    },
  };

  // إعدادات الحركة للصورة (ظهور وانزلاق ناعم من اليسار)
  const imageVariants: Variants = {
    hidden: { opacity: 0, x: -30 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.9, ease: "easeOut" } 
    },
  };

  return (
    <motion.section 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
      className="w-full max-w-[1350px] mx-auto my-16 md:my-24 px-4 md:px-8 bg-transparent"
    >
      {/* شبكة جرافيكية مقسمة: اليمين للنصوص واليسار للصورة */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 items-center gap-8 min-h-[360px] md:min-h-[450px]">
        
        {/* 1. القسم الأيمن: مخصص للنصوص والزر */}
        <div className="w-full md:col-span-6 lg:col-span-5 flex flex-col items-start justify-center text-right space-y-6 md:space-y-8 pr-0 md:pr-6 lg:pr-12">
          
          {/* صندوق النصوص */}
          <motion.div variants={itemVariants} className="flex flex-col items-start space-y-4 max-w-xl">
            <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-extrabold text-[#122640] leading-[1.35] lg:leading-[1.4]">
              أنشئ متجرك الآن واجعله <br className="hidden lg:block" />
              <span className="text-[#BA7B1B]">بمتناول عملائك</span> في لحظات
            </h2>
          </motion.div>

          {/* زر الـ CTA التفاعلي */}
          <motion.div 
            variants={itemVariants}
            className="w-full flex justify-start"
          >
            {/* تم استبدال motion.a بـ motion.div وبداخله Link الخاص بـ Next.js */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
            >
              <Link
                href="/request-otp"
                className="group flex items-center gap-3 px-8 py-4 bg-[#BA7B1B] hover:bg-[#a36b17] text-white font-bold rounded-2xl shadow-xl shadow-black/10 text-base md:text-lg"
              >
                أنشئ متجرك الآن
                {/* السهم يتجه لليسار متوافقاً مع حركة العين */}
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="transition-transform duration-300 group-hover:-translate-x-1"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </motion.div>
          </motion.div>

        </div>

        {/* 2. القسم الأيسر: مخصص للصورة الجرافيكية */}
        <div className="relative w-full h-[280px] sm:h-[350px] md:h-full md:col-span-6 lg:col-span-7 flex justify-end items-center">
          <motion.div 
            variants={imageVariants}
            className="relative w-full h-full min-h-[300px] md:min-h-[440px] transform md:-translate-x-4 lg:-translate-x-8"
          >
            <Image
              src="/images/store1-section-banner.png"
              alt="إرتقاء جرافيكس"
              fill
              className="object-contain object-left pointer-events-none"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </motion.div>
        </div>

      </div>
    </motion.section>
  );
}