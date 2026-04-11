"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { ArrowLeftIcon, Coins, Link2, Store } from "lucide-react"
import * as React from "react"

const CURRENCIES = [
  { code: "SYP", label: "ليرة سورية (SYP)" },
  { code: "USD", label: "دولار أمريكي (USD)" },
] as const

export default function CreateStorePage() {
  const [primaryCurrencyCode, setPrimaryCurrencyCode] = React.useState<
    (typeof CURRENCIES)[number]["code"] | ""
  >("SYP")

  return (
    <Card className="w-full max-w-1/3">
      <form>
        <CardHeader className="mb-4 text-center">
          <Avatar className="mx-auto mb-2 rounded-lg bg-primary p-8 text-5xl">
            <AvatarImage src="/logo.png" alt="logo" />
            <AvatarFallback className="font-bold text-primary-foreground">
              SOOQ
            </AvatarFallback>
          </Avatar>

          <CardTitle>إنشاء متجر</CardTitle>
          <CardDescription>
            أدخل بيانات متجرك للبدء في البيع عبر SOOQ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="storeName">
                <Store />
                اسم المتجر
              </Label>
              <Input
                id="storeName"
                name="storeName"
                placeholder="متجري"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">
                <Link2 />
                الرابط (slug)
              </Label>
              <Input
                id="slug"
                name="slug"
                placeholder="my-store"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="primaryCurrencyCode">
                <Coins />
                العملة الأساسية
              </Label>
              <Select
                value={primaryCurrencyCode || undefined}
                onValueChange={(v) =>
                  setPrimaryCurrencyCode(v as (typeof CURRENCIES)[number]["code"])
                }
                required
              >
                <SelectTrigger
                  id="primaryCurrencyCode"
                  size="default"
                  className="h-12 w-full min-w-0 border-input bg-white text-lg md:text-sm dark:bg-input/30"
                >
                  <SelectValue placeholder="اختر العملة" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                name="primaryCurrencyCode"
                value={primaryCurrencyCode}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" size="lg" className="w-full">
            متابعة
            <ArrowLeftIcon />
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
