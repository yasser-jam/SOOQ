'use client';

import React from 'react';
import { Card } from '@workspace/ui/components/card';
import { Square, Copy, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Label } from '@workspace/ui/components/label';

export function CategoryDetailCard() {
  return (
    <Card className="w-full relative overflow-hidden border border-slate-100 rounded-[32px] p-0 bg-white shadow-[0_8px_30px_-6px_rgba(0,0,0,0.05)]">
      {/* --- Header Section (Dark Background) --- */}
      <div className="relative overflow-hidden bg-[#2d3a4d] p-8 pb-10">
        <div 
          className="absolute inset-0 pointer-events-none z-0" 
          style={{ 
            background: 'linear-gradient(125deg, transparent 30%, rgba(255,255,255,0.08) 45%, transparent 60%)',
            opacity: 0.6
          }} 
        />
        <div 
          className="absolute inset-0 pointer-events-none z-0" 
          style={{ 
            background: 'linear-gradient(145deg, transparent 40%, rgba(255,255,255,0.1) 52%, transparent 65%)',
            opacity: 0.4
          }} 
        />
        
        <div className="relative z-10 flex flex-row items-center justify-end gap-6 text-white w-full">
          <div className="flex flex-col gap-1 flex-grow">
            <h2 className="text-3xl font-bold text-white tracking-wide text-right">قمصان</h2>
            <p className="text-slate-300 font-medium tracking-wide text-[16px] text-right">معرف التصنيف: #CAT-882</p>
          </div>
          <div className="w-[84px] h-[84px] flex-shrink-0 bg-[#f8fafc] rounded-[24px] flex items-center justify-center shadow-lg">
            <Square className="w-10 h-10 text-[#2d3a4d]" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* --- Body Section (White Background) --- */}
      <div className="p-8 flex flex-col gap-8 -mt-6 relative z-20">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#f8fafc] rounded-[24px] p-5 flex flex-col items-center justify-center gap-2">
            <span className="text-[#333f50] text-sm font-medium opacity-70 text-center">عدد المنتجات</span>
            <span className="text-[#333f50] text-2xl font-bold">1,240</span>
          </div>
          <div className="bg-[#f8fafc] rounded-[24px] p-5 flex flex-col items-center justify-center gap-2">
            <span className="text-[#333f50] text-sm font-medium opacity-70 text-center">المستوى</span>
            <span className="text-[#333f50] text-2xl font-bold">3</span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 text-right">
            <Label className="text-[#333f50] font-bold text-lg">اسم التصنيف</Label>
            <div className="relative">
              <Input 
                value="قمصان" 
                readOnly
                className="rtl h-14 pr-4 pl-12 rounded-[16px] border-slate-200 bg-white text-right text-slate-700 font-medium focus-visible:ring-1 focus-visible:ring-slate-300"
              />
              <Copy className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
            </div>
          </div>

          <div className="flex flex-col gap-3 text-right">
            <Label className="text-[#333f50] font-bold text-lg">الوصف</Label>
            <div className="relative">
              <Textarea 
                value="تصنيف يضم جميع أنواع القمصان الرجالية الكلاسيكية"
                readOnly
                className="rtl min-h-[100px] pr-4 pl-12 py-4 rounded-[16px] border-slate-200 bg-white text-right text-slate-600 font-medium leading-relaxed resize-none focus-visible:ring-1 focus-visible:ring-slate-300"
              />
              <Copy className="absolute left-4 top-4 w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <Button variant="outline" className="flex-1 h-14 rounded-[16px] border-[#c28421] text-[#c28421] hover:bg-amber-50 gap-2 text-lg font-bold">
            إلغاء
            <XCircle className="w-5 h-5" />
          </Button>
          <Button className="flex-1 h-14 rounded-[16px] bg-[#c28421] hover:bg-[#a6701b] text-white gap-2 text-lg font-bold">
            حفظ التغيرات
            <CheckCircle2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
