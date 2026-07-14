"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

type PreviewPageShellProps = {
  pageTitle?: string;
  editHref: string;
  variant?: "desktop" | "mobile";
  children: React.ReactNode;
};

export function PreviewPageShell({
  pageTitle,
  editHref,
  variant = "desktop",
  children,
}: PreviewPageShellProps) {
  const previewLabel =
    variant === "mobile"
      ? pageTitle
        ? `معاينة الجوال: ${pageTitle}`
        : "معاينة الجوال"
      : pageTitle
        ? `معاينة: ${pageTitle}`
        : "معاينة الصفحة";

  return (
    <div data-design-studio-preview className="PreviewPageShell">
      <header className="PreviewPageShell-header">
        <div className="PreviewPageShell-headerStart">
          <Button variant="outline" size="sm" asChild>
            <Link href={editHref}>
              <Pencil size={16} />
              العودة للمحرر
            </Link>
          </Button>
        </div>

        <div className="PreviewPageShell-headerCenter">
          <Eye size={16} aria-hidden />
          <span>{previewLabel}</span>
        </div>

        <div className="PreviewPageShell-headerEnd" aria-hidden />
      </header>

      <main className="PreviewPageShell-main">{children}</main>
    </div>
  );
}
