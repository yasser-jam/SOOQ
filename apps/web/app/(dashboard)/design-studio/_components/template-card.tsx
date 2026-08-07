"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Eye, Copy, Trash2 } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";

type TemplateCardProps = {
  title: string;
  description: string;
  updatedAt: string;
  editHref: string;
  previewHref?: string;
  badge?: string;
  previewClassName?: string;
};

export default function TemplateCard({
  title,
  description,
  updatedAt,
  editHref,
  previewHref,
  badge,
  previewClassName,
}: TemplateCardProps) {
  return (
    <Card size="sm" className="border border-border/60">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm">
              {description}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="إجراءات القالب"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>إجراءات القالب</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={editHref}>
                  <Pencil className="size-4" />
                  تعديل القالب
                </Link>
              </DropdownMenuItem>
              {previewHref ? (
                <DropdownMenuItem asChild>
                  <Link href={previewHref}>
                    <Eye className="size-4" />
                    معاينة
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled>
                  <Eye className="size-4" />
                  معاينة
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Copy className="size-4" />
                إنشاء نسخة
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive">
                <Trash2 className="size-4" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div
          className={cn(
            "relative h-28 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-muted/40 via-background to-muted/10",
            previewClassName
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_60%)]" />
          <div className="relative h-full p-3">
            <div className="text-xs font-medium text-muted-foreground">
              معاينة سريعة
            </div>
            <div className="mt-3 h-2 w-2/3 rounded-full bg-foreground/10" />
            <div className="mt-2 h-2 w-1/2 rounded-full bg-foreground/10" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>آخر تحديث: {updatedAt}</span>
          {badge ? <Badge variant="secondary-tonal">{badge}</Badge> : null}
        </div>
      </CardContent>

      <CardFooter className="justify-end">
        <Button variant="primary" size="sm">
          <Link href={editHref}>تحرير القالب</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
