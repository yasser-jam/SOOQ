'use client';

import React from 'react';
import { CategorySortCard } from './_components/category-sort-card';
import { SortingTipCard } from './_components/sorting-tip-card';
import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { Field, FieldGroup, FieldLabel, FieldContent } from '@workspace/ui/components/field';
import { Input } from '@workspace/ui/components/input';
import FilterMenu from '@/components/system/filter-menu';
import { CategoryDetailCard } from './_components/category-detail-card';

export default function TestDashboardPage() {
  return (
    <div className="container">
      {/* Title and Actions (Matches Dashboard Style) */}
      <div className="w-full my-6 flex flex-wrap md:flex-nowrap gap-4 justify-between items-center text-text">
        <div className="page-title text-3xl font-bold">اختبار الترتيب</div>

        <div className="flex items-center gap-4">
          <FilterMenu>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="category-filter">الاسم</FieldLabel>
                <FieldContent>
                  <Input
                    id="category-filter"
                    type="search"
                    placeholder="ابحث عن..."
                    className="w-full"
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </FilterMenu>

          <Button size="md" variant="secondary">
            إضافة عنصر
            <Plus data-icon="inline-end" className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <CategorySortCard />
          <SortingTipCard />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6 pt-6">
          <CategoryDetailCard />
        </div>
      </div>
    </div>
  );
}
