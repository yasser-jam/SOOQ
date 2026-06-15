import React from 'react';

import Image from 'next/image';

import Link from 'next/link';



// تعريف أنواع البيانات لتنظيم الروابط

type FooterLink = { label: string; href: string };

type LinkColumn = { title: string; links: FooterLink[] };



const LINK_COLUMNS: ReadonlyArray<LinkColumn> = [

  {

    title: "روابط سريعة",

    links: [

      { label: "الصفحة الرئيسية", href: "/" },

      { label: "لمحة عنا", href: "#about" },

    ],

  },

  {

    title: "روابط أخرى",

    links: [

      { label: "تواصل معنا", href: "#contact" },

      { label: "الدعم", href: "#support" },

      { label: "سياسة الخصوصية", href: "#privacy" },

      { label: "الشروط والأحكام", href: "#terms" },

    ],

  },

];



export  function Footer() {

  const year = new Date().getFullYear();



  return (

    <footer className="relative w-full max-w-[1350px] mx-auto min-h-[460px] md:min-h-[480px] mt-20 bg-transparent overflow-hidden select-none">

     

      {/* 1. الصورة الخلفية */}

      <div className="absolute inset-0 z-0 pointer-events-none">

        <Image

          src="/images/footer3-banner.png"

          alt="إرتقاء خلفية الفوتر"

          fill

          className="object-stretch md:object-fill"

          priority

        />

      </div>




{/* 2. حاوية المحتوى */}
<div className="relative z-10 w-full pt-24 pb-4 px-8 md:px-16 lg:px-24 flex flex-col justify-between min-h-[460px] md:min-h-[480px]">
  
  {/* قمنا بتغيير gap-8 إلى gap-16 لزيادة المسافة بين القوائم */}
  <div className="w-full grid grid-cols-2 md:grid-cols-12 gap-12 md:gap-16 items-start text-right">
    
    {/* الفراغ الأيمن لضبط المحاذاة */}
    <div className="hidden md:block md:col-span-3 lg:col-span-4"></div>

    {/* القوائم */}
    {LINK_COLUMNS.map((column) => (
      <div key={column.title} className="col-span-1 md:col-span-3 lg:col-span-3 flex flex-col items-start space-y-3">
        <h4 className="text-lg md:text-xl font-bold text-white mb-1">
          {column.title}
        </h4>
        <ul className="space-y-2 text-right">
          {column.links.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="text-sm md:text-base text-gray-300/80 hover:text-[#BA7B1B] transition-colors duration-200 no-underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>






        {/* 3. شريط الحقوق السفلي */}

        <div className="w-full flex justify-center items-center pt-8 pb-2 text-center">

          <p className="text-xs md:text-sm font-medium text-gray-400/80 tracking-wide">

            جميع الحقوق محفوظة لمنصة إرتقاء © {year}

          </p>

        </div>

      </div>

    </footer>

  );

} 

