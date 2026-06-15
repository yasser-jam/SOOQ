"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';

// إعدادات الحركة للحاوية لعمل تأخير متسلسل للعناصر
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

// حركة البطاقة (ظهور من الأسفل مع تأثير الزنبرك)
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  },
};

export  function Testimonials() {
  return (
    <motion.section 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
      className="max-w-[1240px] mx-auto my-24 px-5"
    >
      <motion.div variants={cardVariants} className="text-center mb-16">
        <h2 className="text-3xl md:text-[40px] text-[#BA7B1B] font-bold">آراء عملائنا</h2>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <motion.div 
            key={i}
            variants={cardVariants}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-shadow"
          >
            <div className="text-[#FF9345] text-xl mb-5">★★★★★</div>
            <p className="text-lg text-slate-700 mb-8 leading-relaxed">
              {i === 1 
                ? "المنصة قدمت لنا حلاً متكاملاً وسريعاً جداً ساعدنا في تنظيم وتوسيع مبيعاتنا بشكل ملحوظ."
                : "تجربة رائعة واستوديو التصميم سهل الاستخدام وممتاز للتحكم بهوية متجرنا وتطبيقاتنا بسهولة ودقة."
              }
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-200"></div>
              <span className="font-bold text-slate-900">اسم العميل</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}