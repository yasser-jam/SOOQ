import Link from "next/link";

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
import { cn } from "@workspace/ui/lib/utils";

type ThemeMarketplaceCardProps = {
	title: string;
	description: string;
	previewColor: string;
	badge?: string;
	href?: string;
	isActive?: boolean;
};

export default function ThemeMarketplaceCard({
	title,
	description,
	previewColor,
	badge,
	href,
	isActive,
}: ThemeMarketplaceCardProps) {
	return (
		<Card
			size="sm"
			className={cn(
				"border border-border/60",
				isActive && "ring-2 ring-primary/30",
			)}
		>
			<CardHeader className="gap-3">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-1">
						<CardTitle className="text-lg">{title}</CardTitle>
						<CardDescription className="text-sm">{description}</CardDescription>
					</div>
					{isActive ? (
						<Badge variant="secondary-tonal">الثيم الحالي</Badge>
					) : badge ? (
						<Badge variant="outline">{badge}</Badge>
					) : null}
				</div>
			</CardHeader>

			<CardContent>
				<div
					className="relative h-32 overflow-hidden rounded-xl border border-border/60"
					style={{
						background: `linear-gradient(135deg, ${previewColor}22, transparent 60%), linear-gradient(to bottom right, var(--color-muted), var(--color-background))`,
					}}
				>
					<span
						className="absolute start-4 top-4 size-8 rounded-full border border-border/40 shadow-sm"
						style={{ backgroundColor: previewColor }}
					/>
					<div className="absolute inset-x-4 bottom-4 space-y-2">
						<div className="h-2 w-2/3 rounded-full bg-foreground/10" />
						<div className="h-2 w-1/2 rounded-full bg-foreground/10" />
					</div>
				</div>
			</CardContent>

			{href ? (
				<CardFooter className="justify-end">
					<Button variant="outline" size="sm" asChild>
						<Link href={href}>معاينة</Link>
					</Button>
				</CardFooter>
			) : null}
		</Card>
	);
}
