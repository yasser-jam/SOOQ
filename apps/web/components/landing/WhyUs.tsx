import React from 'react';
import Image from 'next/image';

const features = [
  { text: "نظام تسعير ذكي", top: "12%", left: "15%" },
  { text: "يعمل في الانترنت الضعيف", top: "50%", left: "15%" },
  { text: "موقع، تطبيق، توصيل", top: "80%", left: "35%" },
  { text: "يدعم اللغة العربية", top: "95%", left: "60%" },
  { text: "مخصص للسوق السوري", top: "65%", left: "80%" },
];

export  function WhyUs() {
  return (
    <section className="w-full max-w-[1240px] mx-auto my-16 px-4">
      {/* الحاوية الأساسية */}
      <div className="relative w-full">
        
        <Image
          src="/images/why-us.png" 
          alt="لماذا نحن - مزايا منصة إرتقاء الرقمية"
          width={1240}
          height={780}
          className="w-full h-auto object-contain"
          priority
        />

        {/* توزيع النصوص فوق الصورة */}
        {features.map((item, index) => (
          <div
            key={index}
            className="absolute text-[#020708] font-bold text-[10px] md:text-sm lg:text-lg xl:text-xl transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
            style={{ top: item.top, left: item.left }}
          >
            {item.text}
          </div>
        ))}
        
        {/* عنوان لماذا نحن في المركز */}
        <div className="absolute top-[20%] left-[53%] transform -translate-x-1/2 -translate-y-1/2 text-[#BA7B1B] font-bold text-lg md:text-2xl lg:text-4xl whitespace-nowrap">
          لماذا نحن
        </div>
      </div>
    </section>
  );
}