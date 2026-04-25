"use client"

import { useState } from "react"
import { Check, ChevronDown, ChevronRight, ChevronsUpDown, Loader2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import type { ProductCategory } from "../types"
import { getCategoryChildren } from "./category-select.utils"

type CategoryTreePopoverProps = {
	id: string
	disabled?: boolean
	isPending: boolean
	isFieldLocked: boolean
	placeholder: string
	emptyLabel: string
	subrowKeys: string
	categories: ProductCategory[]
	selectedValue: string
	selectedLabel?: string
	onSelect: (value: string) => void
	onClear: () => void
}

type CategoryTreeNodeProps = {
	node: ProductCategory
	depth: number
	subrowKeys: string
	selectedValue: string
	expandedIds: Set<string>
	onToggleExpand: (id: string) => void
	onSelect: (id: string) => void
}

function CategoryTreeNode({
	node,
	depth,
	subrowKeys,
	selectedValue,
	expandedIds,
	onToggleExpand,
	onSelect,
}: CategoryTreeNodeProps) {
	const nodeId = node.id ?? ""
	if (!nodeId) return null

	const children = getCategoryChildren(node, subrowKeys)
	const hasChildren = children.length > 0
	const isExpanded = expandedIds.has(nodeId)
	const isSelected = selectedValue === nodeId

	return (
		<div className="space-y-1">
			<div
				className="flex items-center gap-1"
				style={{ paddingInlineStart: `${depth * 14}px` }}
			>
				<button
					type="button"
					onClick={(event) => {
						event.preventDefault()
						event.stopPropagation()
						if (!hasChildren) return
						onToggleExpand(nodeId)
					}}
					disabled={!hasChildren}
					className={cn(
						"flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground",
						!hasChildren && "pointer-events-none opacity-0"
					)}
				>
					{isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
				</button>

				<button
					type="button"
					onClick={() => onSelect(nodeId)}
					className={cn(
						"flex h-8 flex-1 items-center justify-between rounded-md px-2 text-sm hover:bg-accent hover:text-accent-foreground",
						isSelected && "bg-accent text-accent-foreground"
					)}
				>
					<span className="truncate">{node.nameAr}</span>
					{isSelected ? <Check className="size-4" /> : null}
				</button>
			</div>

			{hasChildren && isExpanded ? (
				<div className="space-y-1">
					{children.map((child) => (
						<CategoryTreeNode
							key={child.id ?? `${nodeId}-child`}
							node={child}
							depth={depth + 1}
							subrowKeys={subrowKeys}
							selectedValue={selectedValue}
							expandedIds={expandedIds}
							onToggleExpand={onToggleExpand}
							onSelect={onSelect}
						/>
					))}
				</div>
			) : null}
		</div>
	)
}

export function CategoryTreePopover({
	id,
	disabled,
	isPending,
	isFieldLocked,
	placeholder,
	emptyLabel,
	subrowKeys,
	categories,
	selectedValue,
	selectedLabel,
	onSelect,
	onClear,
}: CategoryTreePopoverProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

	const toggleExpanded = (categoryId: string) => {
		setExpandedIds((current) => {
			const next = new Set(current)
			if (next.has(categoryId)) {
				next.delete(categoryId)
			} else {
				next.add(categoryId)
			}
			return next
		})
	}

	const handleSelect = (id: string) => {
		onSelect(id)
		setIsOpen(false)
	}

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					id={id}
					variant="outline"
					size="md"
					disabled={disabled || isPending || isFieldLocked}
					className="h-11 w-full justify-between rounded-md border-input bg-white px-3 font-normal"
				>
					<span className={cn("truncate", !selectedValue && "text-muted-foreground")}> 
						{selectedLabel ?? placeholder}
					</span>
					<ChevronsUpDown className="size-4 text-muted-foreground" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-1.5">
				<div className="max-h-72 space-y-1 overflow-y-auto">
					{!isFieldLocked ? (
						<button
							type="button"
							onClick={() => {
								onClear()
								setIsOpen(false)
							}}
							className={cn(
								"flex h-8 w-full items-center justify-between rounded-md px-2 text-sm hover:bg-accent hover:text-accent-foreground",
								!selectedValue && "bg-accent text-accent-foreground"
							)}
						>
							<span className="truncate">{emptyLabel}</span>
							{!selectedValue ? <Check className="size-4" /> : null}
						</button>
					) : null}

					{isPending ? (
						<div className="inline-flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
							<Loader2 className="size-4 animate-spin" />
							جاري تحميل الفئات...
						</div>
					) : (
						categories.map((category) => (
							<CategoryTreeNode
								key={category.id ?? "category-node"}
								node={category}
								depth={0}
								subrowKeys={subrowKeys}
								selectedValue={selectedValue}
								expandedIds={expandedIds}
								onToggleExpand={toggleExpanded}
								onSelect={handleSelect}
							/>
						))
					)}
				</div>
			</PopoverContent>
		</Popover>
	)
}
