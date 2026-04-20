"use client"

import * as React from "react"
import { SendHorizontal } from "lucide-react"

import type { OrderNoteModel, OrderNotesModel } from "@/modules/order/order/model"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Textarea } from "@workspace/ui/components/textarea"

interface OrderInternalNotesCardProps {
	notes?: OrderNotesModel
}

function EmptyNoteCard() {
	return (
		<div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/35 p-4">
			<div className="flex items-center justify-between gap-3">
				<Skeleton className="h-5 w-36" />
				<Skeleton className="h-4 w-20" />
			</div>
			<Skeleton className="h-5 w-full" />
			<Skeleton className="h-5 w-5/6" />
		</div>
	)
}

function NoteCard({ note }: { note: OrderNoteModel }) {
	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/35 p-4">
			<div className="flex items-center justify-between gap-3">
				<p className="text-lg font-semibold text-text">{note.authorRole}</p>
				<p className="text-sm text-muted-foreground">{note.timestampLabel}</p>
			</div>
			<p className="text-base leading-7 text-text-secondary">{note.body}</p>
		</div>
	)
}

export default function OrderInternalNotesCard({ notes }: OrderInternalNotesCardProps) {
	const [activeChannel, setActiveChannel] = React.useState<"INTERNAL" | "CUSTOMER">("INTERNAL")

	const activeNotes =
		activeChannel === "INTERNAL"
			? notes?.internalNotes ?? []
			: notes?.customerVisibleNotes ?? []

	return (
		<Card className="h-full gap-6 py-6">
			<CardHeader className="pb-0">
				<CardTitle className="text-xl">ملاحظات داخلية ولوجستية</CardTitle>
			</CardHeader>

			<CardContent className="flex h-full flex-col gap-4">
				<div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
					<Button
						type="button"
						size="md"
						variant={activeChannel === "INTERNAL" ? "outline" : "ghost"}
						onClick={() => setActiveChannel("INTERNAL")}
					>
						الفريق الداخلي
					</Button>

					<Button
						type="button"
						size="md"
						variant={activeChannel === "CUSTOMER" ? "outline" : "ghost"}
						onClick={() => setActiveChannel("CUSTOMER")}
					>
						مرئي للعميل
					</Button>
				</div>

				<div className="flex min-h-0 flex-1 flex-col gap-3">
					{activeNotes.length ? (
						activeNotes.map((note) => <NoteCard key={note.id} note={note} />)
					) : (
						<>
							<EmptyNoteCard />
							<EmptyNoteCard />
						</>
					)}
				</div>

				<div className="relative">
					<Textarea placeholder="اكتب ملاحظة..." className="min-h-36 rounded-xl bg-muted/40 ps-12" />
					<Button type="button" size="icon" variant="secondary" className="absolute bottom-3 left-3">
						<SendHorizontal />
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
