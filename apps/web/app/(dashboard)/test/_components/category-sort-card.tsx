'use client';

import React from 'react';
import { ChevronDown, ChevronLeft, CheckCircle2, ChevronsUpDown } from 'lucide-react';
import { Card } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';

export function CategorySortCard() {
  return (
    <Card className="w-full bg-white overflow-visible border border-slate-100 shadow-[0_4px_30px_-6px_rgba(0,0,0,0.06)] rounded-[32px] p-6 lg:p-8">
      <div className="flex flex-col gap-4">
        
        {/* Toolbar Top Left */}
        <div className="flex w-full justify-start mb-0">
          <button className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronsUpDown className="w-5 h-5" />
          </button>
        </div>

        {/* --- First Item: الملابس --- */}
        <div className="flex flex-col gap-3 relative mt-1">
          
          <div className="flex items-center justify-between bg-white border border-slate-200 hover:border-slate-300 rounded-[14px] p-3 shadow-sm w-full transition-colors group">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-800 tracking-wide">الملابس</span>
              <span className="text-slate-400 cursor-pointer group-hover:text-slate-900 transition-colors">
                <ChevronDown className="w-4 h-4" strokeWidth={2} />
              </span>
            </div>
          </div>

          {/* Children Wrapper */}
          <div className="flex flex-col gap-3 relative my-1 mr-8 z-0">
            <div className="absolute top-[-16px] bottom-6 right-[-20px] w-px bg-slate-300 z-[-1]" />

            {/* -- Child 1: رجالي -- */}
            <div className="flex flex-col gap-3 relative">
              <div className="flex items-center justify-between bg-[#f8fafc] border border-slate-100 hover:border-slate-200 rounded-[14px] p-3 w-full transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-800">رجالي</span>
                  <span className="text-slate-400 cursor-pointer group-hover:text-slate-800 transition-colors">
                    <ChevronDown className="w-4 h-4" strokeWidth={2} />
                  </span>
                </div>
              </div>

              {/* Grandchildren Wrapper */}
              <div className="flex flex-col gap-3 relative mr-8 z-0">
                <div className="absolute top-[-16px] bottom-6 right-[-20px] w-px bg-slate-300 z-[-1]" />

                {/* --- Grandchild 1: قمصان (Active) --- */}
                <div className="flex items-center justify-between bg-[#f0f7ff] border border-blue-100/70 rounded-[14px] p-3 w-full shadow-[0_2px_10px_-4px_rgba(59,130,246,0.15)] relative">
                  <div className="absolute top-0 bottom-0 right-0 w-1 rounded-r-[14px] bg-transparent" />
                  <div className="flex items-center justify-start gap-4">
                    <span className="text-sm font-medium text-slate-800">قمصان</span>
                    <Badge variant="secondary" className="bg-[#e0f2fe] text-blue-600 hover:bg-blue-200 border-none font-medium text-xs px-2.5 py-0.5 rounded-full shadow-none cursor-default">
                      نشط
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-center text-amber-600">
                      <CheckCircle2 strokeWidth={2.5} className="w-[18px] h-[18px]"/>
                  </div>
                </div>

                {/* --- Grandchild 2: سراويل --- */}
                <div className="flex items-center justify-between bg-[#f8fafc] border border-slate-100 hover:border-slate-200 rounded-[14px] p-3 w-full transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-800">سراويل</span>
                  </div>
                </div>
              </div>
            </div>

            {/* -- Child 2: نسائي -- */}
            <div className="flex flex-col gap-3 relative">
              <div className="flex items-center justify-between bg-[#f8fafc] border border-slate-100 hover:border-slate-200 rounded-[14px] p-3 w-full transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-800">نسائي</span>
                  <span className="text-slate-400 cursor-pointer group-hover:text-slate-800 transition-colors">
                    <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* --- Second Item: إلكترونيات --- */}
        <div className="flex items-center justify-between bg-white border border-slate-200 hover:border-slate-300 rounded-[14px] p-3 shadow-sm w-full transition-colors group mt-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-800 tracking-wide">إلكترونيات</span>
            <span className="text-slate-400 cursor-pointer group-hover:text-slate-900 transition-colors">
              <ChevronDown className="w-4 h-4" strokeWidth={2} />
            </span>
          </div>
        </div>

        {/* --- Third Item: المنزل --- */}
        <div className="flex items-center justify-between bg-white border border-slate-200 hover:border-slate-300 rounded-[14px] p-3 shadow-sm w-full transition-colors group">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-800 tracking-wide">المنزل</span>
            <span className="text-slate-400 cursor-pointer group-hover:text-slate-900 transition-colors">
              <ChevronDown className="w-4 h-4" strokeWidth={2} />
            </span>
          </div>
        </div>

      </div>
    </Card>
  );
}
