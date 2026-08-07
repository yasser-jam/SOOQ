"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { ErteqaLogo } from "@/components/erteqa-logo"

const NAV_LINKS = [
  { href: "#features", label: "المميزات" },
  { href: "#how-it-works", label: "طريقة العمل" },
  { href: "#testimonials", label: "آراء العملاء" },
  { href: "#pricing", label: "الأسعار" },
] as const

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/85 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:h-20 md:px-8">
        <Link href="/welcome" aria-label="إرتقاء — الصفحة الرئيسية" className="shrink-0">
          <ErteqaLogo size="sm" />
        </Link>

        <nav aria-label="التنقل الرئيسي" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/request-otp" className={buttonVariants({ variant: "ghost", size: "md" })}>
            تسجيل الدخول
          </Link>
          <Link
            href="/request-otp"
            className={buttonVariants({ variant: "secondary", size: "md" })}
          >
            ابدأ الآن
          </Link>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          className="inline-flex size-10 items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "grid overflow-hidden border-t border-border/60 bg-background/95 backdrop-blur md:hidden",
          "transition-[grid-template-rows] duration-300 ease-out",
          mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0">
          <nav aria-label="التنقل في الموبايل" className="px-4 py-4">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
              <Link
                href="/request-otp"
                onClick={() => setMobileOpen(false)}
                className={buttonVariants({
                  variant: "ghost",
                  size: "md",
                  className: "w-full justify-center",
                })}
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/request-otp"
                onClick={() => setMobileOpen(false)}
                className={buttonVariants({
                  variant: "secondary",
                  size: "md",
                  className: "w-full justify-center",
                })}
              >
                ابدأ الآن
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
