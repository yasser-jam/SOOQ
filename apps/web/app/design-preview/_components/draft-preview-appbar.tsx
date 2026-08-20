"use client"

import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowRight, Eye, PencilRuler, Send } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { publishDesign } from "@/modules/design-studio/actions"
import { designStudioKeys } from "@/modules/design-studio/queryKeys"
import { humanizeError } from "@/lib/error-codes"

export const DRAFT_PREVIEW_APPBAR_HEIGHT_PX = 56

export function DraftPreviewAppbar({
	/** true when previewing a gallery template's own JSON rather than the
	 *  tenant's draft — publishing isn't meaningful there (it would publish
	 *  the real draft, not the template being looked at), so the publish
	 *  action is hidden. */
	isTemplateMode = false,
	templateName = null,
}: {
	isTemplateMode?: boolean
	templateName?: string | null
}) {
	const queryClient = useQueryClient()

	const publishMutation = useMutation({
		mutationFn: publishDesign,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: designStudioKeys.all })
			toast.success("تم نشر التصميم.")
		},
		onError: (error: { errorCode?: string; message?: string }) => {
			toast.error(humanizeError(error?.errorCode, error?.message))
		},
	})

	return (
		<header
			data-design-preview-appbar
			className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-white/10 bg-zinc-900 px-4 text-white shadow-md"
			style={{ height: DRAFT_PREVIEW_APPBAR_HEIGHT_PX }}
		>
			<div className="flex items-center gap-2 text-sm font-medium text-white/90">
				{isTemplateMode ? (
					<>
						<Eye className="size-4 text-white/70" aria-hidden />
						<span>
							معاينة قالب{templateName ? `: ${templateName}` : ""}
						</span>
					</>
				) : (
					<>
						<PencilRuler className="size-4 text-white/70" aria-hidden />
						<span>وضع المعاينة — مسودة غير منشورة</span>
					</>
				)}
			</div>

			<div className="flex items-center gap-2">
				<Button variant="outline" size="sm" asChild className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
					<Link href="/design-studio">
						<ArrowRight className="size-4" aria-hidden />
						العودة إلى استوديو التصميم
					</Link>
				</Button>

				{!isTemplateMode && (
					<Button
						variant="default"
						size="sm"
						loading={publishMutation.isPending}
						onClick={() => publishMutation.mutate()}
					>
						<Send className="size-4" aria-hidden />
						نشر التصميم
					</Button>
				)}
			</div>
		</header>
	)
}
