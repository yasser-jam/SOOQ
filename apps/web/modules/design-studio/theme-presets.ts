/** Display metadata for the active storefront theme (mirrors editor preset). */
export const ATELIER_PRESET = {
	id: "atelier",
	label: "Atelier",
	description:
		"Serif headings, warm neutrals, and a wine accent — clearly distinct from the default store theme.",
	previewColor: "#9f1239",
} as const;

export function themeDemoEditPath(id: string): string {
	return `/themes/${id}/edit`;
}
