'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Check, Copy, Globe, Zap, CheckCircle, Info, Circle, Search } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@workspace/ui/components/input-group'
import { InputGroupTextarea } from '@workspace/ui/components/input-group'
import { Field, FieldLabel, FieldContent, FieldDescription } from '@workspace/ui/components/field'

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={className}>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-[oklch(0.6_0.2_150)] transition-all duration-300"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function InsightItem({
  title,
  description,
  status,
}: {
  title: string
  description: string
  status: 'success' | 'info' | 'inactive'
}) {
  const iconColor = {
    success: 'text-[oklch(0.6_0.2_150)]',
    info: 'text-[oklch(0.6_0.15_250)]',
    inactive: 'text-muted-foreground',
  }[status]

  const Icon = {
    success: CheckCircle,
    info: Info,
    inactive: Circle,
  }[status]

  return (
    <div className="flex items-center gap-2">
      <Icon className={`size-4 shrink-0 ${iconColor}`} />
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  )
}

export default function ProductSeoPage() {
  const params = useParams<{ 'product-id': string }>()
  const productId = params['product-id']

  const [url, setUrl] = useState(`https://sooq.com/products/${productId}`)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  const titleLength = metaTitle.length
  const descLength = metaDescription.length
  const titleValid = titleLength > 0 && titleLength <= 60
  const descValid = descLength > 0 && descLength <= 160

  const seoScore = useMemo(() => {
    let score = 0
    if (titleValid) score += 30
    if (descValid) score += 30
    if (titleLength >= 30) score += 20
    if (descLength >= 80) score += 20
    return score
  }, [titleValid, descValid, titleLength, descLength])

  return (
    <div className="container py-6">
      <div className="mb-6 page-title">إعدادات الـ SEO</div>

      <div className="flex flex-row-reverse gap-6" dir="rtl">
        <div className="flex-[1.2]">
          <Card className="bg-card/75 border-border rounded-[calc(var(--radius)*1.4)] p-6 md:p-8 gap-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>بيانات الـ SEO</CardTitle>
            </CardHeader>

            <CardContent className="px-0 flex flex-col gap-6">
              <Field>
                <FieldLabel htmlFor="product-url">رابط المنتج</FieldLabel>
                <FieldContent>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <Copy className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="product-url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="رابط المنتج"
                      dir="ltr"
                    />
                  </InputGroup>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="meta-title">
                  عنوان الميتا
                  <span className="text-muted-foreground text-sm font-normal mr-2">
                    {titleLength}/60 حرف
                  </span>
                </FieldLabel>
                <FieldContent>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <Copy className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="meta-title"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="ادخل عنوان جذاب للمنتج"
                      maxLength={60}
                    />
                  </InputGroup>
                  <FieldDescription>
                    يجب أن يكون العنوان بين 30-60 حرفاً
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="meta-description">
                  وصف الميتا
                  <span className="text-muted-foreground text-sm font-normal mr-2">
                    {descLength}/160 حرف
                  </span>
                </FieldLabel>
                <FieldContent>
                  <InputGroup>
                    <InputGroupTextarea
                      id="meta-description"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="اكتب وصف مختصر يشجع المستخدمين على النقر"
                      maxLength={160}
                      className="min-h-[100px]"
                    />
                  </InputGroup>
                  <FieldDescription>
                    يجب أن يكون الوصف بين 80-160 حرفاً
                  </FieldDescription>
                </FieldContent>
              </Field>

              <div className="flex justify-end gap-4 pt-2">
                <Button variant="outline" size="md">
                  إلغاء
                </Button>
                <Button variant="default" size="md">
                  حفظ التغييرات
                  <Check data-icon="inline-end" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <Card className="bg-card/75 border-border rounded-[calc(var(--radius)*1.4)] p-6 shadow-[0_16px_32px_0_#293C57]">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Sooq</span>
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{url}</span>
              </div>
            </CardHeader>

            <CardContent className="px-0">
              <div className="flex items-center gap-2 mb-3">
                <Search className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">معاينة محرك البحث</span>
              </div>
              <div className="text-base text-[oklch(0.6_0.2_250)] hover:underline cursor-pointer line-clamp-1">
                {metaTitle || 'عنوان الميتا سيظهر هنا'}
              </div>
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {metaDescription || 'وصف الميتا سيظهر هنا...'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#122640] border-0 rounded-[calc(var(--radius)*1.4)] p-6 md:p-8 gap-6 text-white">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center gap-2">
                <Zap className="size-5 text-[oklch(0.8_0.15_80)]" />
                <CardTitle className="text-white">دليل التحسين السريع</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="px-0 flex flex-col gap-4">
              <InsightItem
                title="الكلمات المفتاحية"
                description="تأكد من استخدام الكلمات المفتاحية المناسبة"
                status={titleValid ? 'success' : 'info'}
              />
              <InsightItem
                title="طول العنوان"
                description="العنوان المثالي 30-60 حرف"
                status={titleLength >= 30 ? 'success' : titleLength > 0 ? 'info' : 'inactive'}
              />
              <InsightItem
                title="وصف الميتا"
                description="الوصف المثالي 80-160 حرف"
                status={descLength >= 80 ? 'success' : descLength > 0 ? 'info' : 'inactive'}
              />
              <InsightItem
                title="الصور والنصوص البديلة"
                description="تأكد من إضافة نص بديل للصور"
                status="inactive"
              />

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">نقاط قوة الـ SEO</span>
                  <span className="text-sm font-bold text-[oklch(0.6_0.2_150)]">{seoScore}%</span>
                </div>
                <ProgressBar value={seoScore} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
