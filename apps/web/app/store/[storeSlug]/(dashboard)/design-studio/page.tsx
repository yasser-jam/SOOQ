"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowUpRight,
	ExternalLink,
	Globe,
	Pencil,
	Sparkles,
} from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	ATELIER_PRESET,
	themeDemoEditPath,
} from "@/modules/design-studio/theme-presets";
import { useStorePath } from "@/lib/store-path";
import { getStoreSettingsQueryOptions } from "@/modules/store/settings/actions";
import type { StoreStatus } from "@/modules/auth/store/types";

import ThemeMarketplaceCard from "./_components/theme-marketplace-card";
import ThemePreviewCard from "./_components/theme-preview-card";

const statusLabels: Record<StoreStatus, string> = {
	ACTIVE: "نشط",
	PAUSED: "متوقف مؤقتاً",
	MAINTENANCE: "صيانة",
	PASSWORD_PROTECTED: "محمي بكلمة مرور",
	CLOSED: "مغلق",
};

const statusBadgeVariant: Record<
	StoreStatus,
	"secondary-tonal" | "outline" | "destructive"
> = {
	ACTIVE: "secondary-tonal",
	PAUSED: "outline",
	MAINTENANCE: "outline",
	PASSWORD_PROTECTED: "outline",
	CLOSED: "destructive",
};

const marketplaceThemes = [
	{
		id: "atelier",
		title: "Atelier",
		description: "تحريري بلمسة دافئة — مثالي للأزياء والمنتجات الحرفية.",
		previewColor: ATELIER_PRESET.previewColor,
		isActive: true,
	},
	{
		id: "minimal",
		title: "Minimal",
		description: "تصميم نظيف يركز على المنتجات مع مساحات بيضاء واسعة.",
		previewColor: "#0f172a",
		badge: "قريباً",
	},
	{
		id: "bazaar",
		title: "Bazaar",
		description: "ألوان حيوية وشبكة منتجات كثيفة لمتاجر التجزئة.",
		previewColor: "#c2410c",
		badge: "قريباً",
	},
];

export default function DesignStudioPage() {
	const storePath = useStorePath();
	const { data: settings, isPending } = useQuery(getStoreSettingsQueryOptions());

	const editorBase = storePath("/design-studio");
	const themeEditHref = `${editorBase}${themeDemoEditPath(ATELIER_PRESET.id)}`;
	const themesGalleryHref = `${editorBase}/themes/edit`;

	const storeSlug = settings?.slug ?? "";
	const shopUrl = useMemo(() => {
		if (!storeSlug) return "";
		if (typeof window === "undefined") return `/shop/${storeSlug}`;
		return `${window.location.origin}/shop/${storeSlug}`;
	}, [storeSlug]);

	// Store status is not yet exposed on the merchant settings endpoint;
	// default to ACTIVE until a dedicated read API is wired.
	const storeStatus: StoreStatus = "ACTIVE";

	return (
		<div className="container space-y-10 py-8">
			<header className="space-y-2">
				<p className="text-sm font-medium text-muted-foreground">
					منصة بناء الثيمات
				</p>
				<h1 className="page-title">مصنع الثيمات</h1>
				<p className="max-w-2xl text-sm text-muted-foreground">
					خصّص مظهر متجرك، راقب حالة الموقع، وعدّل الثيم الحالي من مكان واحد.
				</p>
			</header>

			{/* Current theme overview */}
			<Card className="overflow-hidden border border-border/60">
				<div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
					<div className="relative min-h-[220px] overflow-hidden border-b border-border/60 bg-gradient-to-br from-stone-200/70 via-background to-rose-100/50 lg:border-b-0 lg:border-e">
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.65),_transparent_60%)]" />
						<div className="relative flex h-full flex-col justify-end p-6">
							<Badge variant="secondary-tonal" className="mb-3 w-fit">
								الثيم النشط
							</Badge>
							<p className="text-xs font-medium text-muted-foreground">
								معاينة الثيم
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								سيتم استبدال هذه المعاينة بصورة حقيقية لاحقاً
							</p>
						</div>
					</div>

					<div className="flex flex-col justify-center gap-4 p-6">
						<div className="space-y-2">
							<CardTitle className="text-2xl">{ATELIER_PRESET.label}</CardTitle>
							<CardDescription className="text-sm leading-relaxed">
								{ATELIER_PRESET.description}
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<span
								className="size-5 rounded-full border border-border/50 shadow-sm"
								style={{ backgroundColor: ATELIER_PRESET.previewColor }}
								aria-hidden
							/>
							<span className="text-xs text-muted-foreground">
								لون التمييز — Merriweather + Playfair Display
							</span>
						</div>
					</div>
				</div>
			</Card>

			{/* Website status & URL */}
			<section className="space-y-4">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold text-text">حالة الموقع</h2>
					<p className="text-sm text-muted-foreground">
						رابط متجرك الإلكتروني وحالته أمام العملاء.
					</p>
				</div>

				<Card className="border border-border/60">
					<CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-3">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
								<Globe className="size-5" />
							</div>
							<div className="space-y-2">
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-sm font-medium text-text">
										حالة المتجر
									</span>
									<Badge variant={statusBadgeVariant[storeStatus]}>
										{statusLabels[storeStatus]}
									</Badge>
								</div>
								{isPending ? (
									<Skeleton className="h-4 w-48" />
								) : shopUrl ? (
									<a
										href={shopUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
										dir="ltr"
									>
										{shopUrl.replace(/^https?:\/\//, "")}
										<ExternalLink className="size-3.5 shrink-0" />
									</a>
								) : (
									<p className="text-sm text-muted-foreground">
										أكمل إعداد المتجر لعرض الرابط العام.
									</p>
								)}
							</div>
						</div>

						<Button variant="outline" size="sm" asChild>
							<Link href={storePath("/settings/access")}>
								إدارة الحالة
								<ArrowUpRight data-icon="inline-end" className="size-4" />
							</Link>
						</Button>
					</CardContent>
				</Card>
			</section>

			{/* Theme marketplace */}
			<section className="space-y-6">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div className="space-y-1">
						<h2 className="text-xl font-semibold text-text">قوالب الثيمات</h2>
						<p className="text-sm text-muted-foreground">
							استكشف اتجاهات بصرية جاهزة أو طبّق ثيماً جديداً على متجرك.
						</p>
					</div>
					<Button variant="outline" size="sm" asChild>
						<Link href={themesGalleryHref}>
							استكشف المزيد
							<Sparkles data-icon="inline-end" className="size-4" />
						</Link>
					</Button>
				</div>

				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					{marketplaceThemes.map((theme) => (
						<ThemeMarketplaceCard
							key={theme.id}
							title={theme.title}
							description={theme.description}
							previewColor={theme.previewColor}
							badge={theme.badge}
							isActive={theme.isActive}
							href={
								theme.isActive
									? `${editorBase}/themes/${theme.id}`
									: undefined
							}
						/>
					))}
				</div>
			</section>

			{/* Current theme device previews */}
			<section className="space-y-6">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold text-text">الثيم الحالي</h2>
					<p className="text-sm text-muted-foreground">
						معاينة سريعة لشكل المتجر على الشاشات المختلفة.
					</p>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<ThemePreviewCard variant="desktop" />
					<ThemePreviewCard variant="mobile" />
				</div>

				<div className="flex justify-start">
					<Button size="md" asChild>
						<Link href={themeEditHref}>
							<Pencil data-icon="inline-start" className="size-4" />
							تحرير الثيم الحالي
						</Link>
					</Button>
				</div>
			</section>
		</div>
	);
}
