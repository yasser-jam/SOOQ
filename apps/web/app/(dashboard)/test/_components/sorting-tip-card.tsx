'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { Card } from '@workspace/ui/components/card';

export function SortingTipCard() {
  return (
    <Card className="w-full bg-white border border-slate-100 shadow-[0_4px_30px_-6px_rgba(0,0,0,0.06)] rounded-[32px] p-6 lg:p-8 overflow-hidden relative">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        
        {/* Text Section (Right side in RTL) */}
        <div className="flex flex-col justify-center gap-2 items-start text-right">
          <h2 className="text-lg font-bold text-slate-800 tracking-wide text-right w-full">نصيحة الترتيب</h2>
          <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-xl text-right w-full">
            يمكنك سحب وإفلات العناصر لإعادة ترتيبها أو تغيير مستواها الهرمي بكل سهولة.
          </p>
        </div>

        {/* Icon Section (Left side in RTL) */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <Info className="w-8 h-8 text-slate-700" strokeWidth={1.5} />
        </div>

      </div>
    </Card>
  );
}
