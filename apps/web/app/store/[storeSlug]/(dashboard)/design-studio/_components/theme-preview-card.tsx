import { Monitor, Smartphone } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";

type ThemePreviewCardProps = {
	variant: "desktop" | "mobile";
	className?: string;
};

const variantConfig = {
	desktop: {
		label: "ويب",
		icon: Monitor,
		aspectClass: "aspect-[16/10]",
		frameClass: "max-w-full",
	},
	mobile: {
		label: "جوال",
		icon: Smartphone,
		aspectClass: "aspect-[9/16]",
		frameClass: "mx-auto max-w-[220px]",
	},
} as const;

export default function ThemePreviewCard({
	variant,
	className,
}: ThemePreviewCardProps) {
	const config = variantConfig[variant];
	const Icon = config.icon;

	return (
		<Card size="sm" className={cn("border border-border/60", className)}>
			<CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
				<div className="space-y-1">
					<CardTitle className="text-base">معاينة {config.label}</CardTitle>
					<CardDescription className="text-xs">
						صورة المعاينة ستُضاف لاحقاً
					</CardDescription>
				</div>
				<Badge variant="outline" className="gap-1">
					<Icon className="size-3.5" />
					{config.label}
				</Badge>
			</CardHeader>

			<CardContent>
				<div className={cn("w-full", config.frameClass)}>
					<div
						className={cn(
							"relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-muted/50 via-background to-muted/20",
							config.aspectClass,
						)}
					>
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_65%)]" />
						<div className="relative flex h-full flex-col justify-end p-4">
							<div className="space-y-2">
								<div className="h-2 w-2/3 rounded-full bg-foreground/10" />
								<div className="h-2 w-1/2 rounded-full bg-foreground/10" />
								<div className="h-16 rounded-lg border border-dashed border-border/70 bg-background/60" />
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
