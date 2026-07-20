export type PaginationButtonItem = {
  title: string;
  value: string;
};

export const ALL_CATEGORY_VALUE = "__all__";

export function validatePaginationItemValues(
  items: PaginationButtonItem[]
): boolean {
  return items.every((item) => /^\d+$/.test(String(item.value).trim()));
}

/**
 * Build a compact page-number window with ellipsis markers for long ranges.
 * Returns string values suitable for ButtonGroupItem.value.
 */
export function buildPaginationItems(
  totalPages: number,
  currentPage: number
): PaginationButtonItem[] {
  if (totalPages <= 0) return [];

  const pages = buildPaginationWindow(totalPages, currentPage);
  return pages.map((entry) => {
    if (entry === "ellipsis") {
      return {
      title: "…",
      value: `ellipsis-${Math.random()}`,
    };
    }

    return {
      title: String(entry),
      value: String(entry),
    };
  });
}

export function buildPaginationWindow(
  totalPages: number,
  currentPage: number
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);
  if (currentPage > 1) pages.add(currentPage - 1);
  if (currentPage < totalPages) pages.add(currentPage + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];

  for (let index = 0; index < sorted.length; index++) {
    const page = sorted[index]!;
    const prev = sorted[index - 1];
    if (prev != null && page - prev > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  }

  return result;
}
