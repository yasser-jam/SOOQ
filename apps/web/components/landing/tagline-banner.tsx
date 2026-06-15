"use client";

import React from 'react';
import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from 'framer-motion';
import { Sparkles, PlayCircle } from "lucide-react";

export function TaglineBanner() {

  // إعدادات الحركة للحاوية الرئيسية لعمل تأخير متسلسل (Stagger) للعناصر بداخلها
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  // إعدادات الحركة لكل عنصر على حدة
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.7, ease: "easeOut" } 
    },
  };

  return (
    <motion.header 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
      className="relative w-full max-w-[1350px] mx-auto overflow-hidden rounded-b-[40px] shadow-2xl aspect-[2.26/1] bg-[#122640]" 
      dir="rtl"
    >
      {/* 1. الصورة الخلفية */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Image
          src="/images/hero2-element.png"
          alt="الخلفية"
          fill
          priority
          className="object-cover object-center pointer-events-none"
          sizes="(max-width: 1350px) 100vw, 1350px"
        />
      </motion.div>

      {/* 2. الطرف الأيمن: نصوص الترحيب الكبيرة */}
      <motion.div 
        variants={itemVariants}
        className="absolute right-[6%] lg:right-[8%] top-[32%] flex flex-col items-start text-right z-10 select-none"
      >
        <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-[64px] font-bold text-[#122640] leading-tight">
          ابدأ مع <span className="font-sans font-black">erteqa</span>
        </h1>
        <h2 className="text-2xl md:text-4xl lg:text-5xl xl:text-[54px] font-bold text-[#BA7B1B] mt-2">
          رحلتك التجارية
        </h2>
      </motion.div>

      {/* 3. الطرف الأيسر: النصوص الفرعية */}
      <motion.div 
        variants={itemVariants}
        className="absolute left-[6%] lg:left-[8%] top-[32%] flex flex-col items-start text-right z-10 select-none"
      >
        <h3 className="text-white text-lg md:text-2xl lg:text-[26px] font-medium whitespace-nowrap">
          أطلق متجرك الإلكتروني
        </h3>
        <p className="text-white text-base md:text-xl lg:text-[22px] font-medium whitespace-nowrap mt-2 md:mt-3">
          <span className="text-[#BA7B1B]">وتطبيقك الخاص...</span> في مكان واحد
        </p>
      </motion.div>

      {/* 4. الطرف الأيسر: أزرار التحكم بعد تطبيق الانتقالات الحركية */}
      <motion.div 
        variants={itemVariants}
        className="absolute left-[6%] lg:left-[8%] bottom-[22%] flex items-center gap-4 md:gap-6 z-10 select-none"
      >
        {/* زر: شاهد كيف يعمل (تم تطبيق انيميشن الهوفر والضغط وإضافة الأيقونة) */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <Link
            href="#how-it-works"
            className="text-white hover:text-[#FEB553] font-medium border-b border-white hover:border-[#FEB553] pb-0.5 transition-all duration-300 text-xs md:text-sm lg:text-base whitespace-nowrap flex items-center gap-2"
          >
            <PlayCircle className="size-5" aria-hidden />
            شاهد كيف يعمل
          </Link>
        </motion.div>

        {/* زر: ابدأ تجربتك المجانية (تم تطبيق انيميشن الهوفر والضغط أيضاً) */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <Link
            href="/request-otp"
            className="px-5 py-2.5 md:px-7 md:py-3.5 bg-[#BA7B1B] hover:bg-[#a36b17] text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-black/20 text-center text-xs md:text-sm lg:text-base whitespace-nowrap"
          >
            ابدأ تجربتك المجانية
          </Link>
        </motion.div>
      </motion.div>

      {/* 5. أسفل اليمين: التقييم/عدد التجار */}
      <motion.div 
        variants={itemVariants}
        className="absolute bottom-[6%] right-[6%] lg:right-[8%] flex items-center gap-3 z-10 select-none"
      >
        {/* النص */}
        <p className="text-[#122640] font-medium text-xs md:text-sm lg:text-base">
          أكثر من <span className="text-[#BA7B1B] font-bold">500</span> تاجر سوري
        </p>
        {/* الدوائر */}
        <div className="flex -space-x-2 space-x-reverse">
          <div className="w-7 h-7 md:w-9 md:h-9 rounded-full border-2 border-white bg-slate-300"></div>
          <div className="w-7 h-7 md:w-9 md:h-9 rounded-full border-2 border-white bg-slate-400"></div>
          <div className="w-7 h-7 md:w-9 md:h-9 rounded-full border-2 border-white bg-slate-500"></div>
        </div>
      </motion.div>
    </motion.header>
  );
}