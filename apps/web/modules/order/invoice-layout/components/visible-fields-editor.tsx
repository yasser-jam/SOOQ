"use client"

import { Controller, type Control } from "react-hook-form"

import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"

import { VISIBLE_FIELDS_GROUPS } from "../model"
import type { InvoiceLayoutFormValues } from "../types"

interface VisibleFieldsEditorProps {
	control: Control<InvoiceLayoutFormValues>
	disabled?: boolean
}

export default function VisibleFieldsEditor({
	control,
	disabled,
}: VisibleFieldsEditorProps) {
	return (
		<div className="grid gap-4">
			{VISIBLE_FIELDS_GROUPS.map((group) => (
				<section
					key={group.id}
					className="flex flex-col gap-3 rounded-2xl border bg-background p-4"
				>
					<div className="flex flex-col gap-1">
						<h3 className="text-base font-semibold text-foreground">
							{group.title}
						</h3>
						{group.description ? (
							<p className="text-xs text-muted-foreground">
								{group.description}
							</p>
						) : null}
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						{group.toggles.map((toggle) => {
							const fieldId = `visible-${toggle.name}`

							return (
								<Controller
									key={toggle.name}
									name={`visibleFields.${toggle.name}`}
									control={control}
									render={({ field }) => (
										<div className="flex items-start gap-3 rounded-xl border bg-card p-3">
											<Checkbox
												id={fieldId}
												checked={Boolean(field.value)}
												onCheckedChange={(checked) =>
													field.onChange(checked === true)
												}
												disabled={disabled}
											/>
											<div className="flex flex-col gap-0.5">
												<Label
													htmlFor={fieldId}
													className="cursor-pointer text-sm"
												>
													{toggle.label}
												</Label>
												{toggle.helper ? (
													<span className="text-xs text-muted-foreground">
														{toggle.helper}
													</span>
												) : null}
											</div>
										</div>
									)}
								/>
							)
						})}
					</div>
				</section>
			))}
		</div>
	)
}
