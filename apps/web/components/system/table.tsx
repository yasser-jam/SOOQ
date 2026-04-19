"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type PaginationConfig = {
  pageIndex: number
  pageSize: number
  pageCount: number
}

type DataTableProps<TData, TValue> = {
  data: TData[]
  columns: ColumnDef<TData, TValue>[]
  pagination?: PaginationConfig
  onPageChange?: (pageIndex: number) => void
}

export default function DataTable<TData, TValue>({
  data,
  columns,
  pagination,
  onPageChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const paginationState = pagination
    ? {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      }
    : undefined

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      ...(paginationState ? { pagination: paginationState } : {}),
    },
    manualPagination: Boolean(paginationState),
    pageCount: paginationState ? pagination?.pageCount ?? 0 : undefined,
  })

  const colSpan = table.getVisibleLeafColumns().length
  const pageCount = pagination?.pageCount ?? 0
  const displayPageCount = pagination ? Math.max(1, pageCount) : 0
  const currentPageIndex = paginationState?.pageIndex ?? 0
  const currentPage = displayPageCount ? currentPageIndex + 1 : 0
  const canPreviousPage = currentPageIndex > 0
  const canNextPage = displayPageCount
    ? currentPageIndex < displayPageCount - 1
    : false

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                if (header.isPlaceholder) {
                  return <TableHead key={header.id} />
                }

                const canSort =
                  header.column.getCanSort() &&
                  header.column.columnDef.enableSorting === true
                const sortState = header.column.getIsSorted()
                const SortIcon =
                  sortState === "asc"
                    ? ChevronUpIcon
                    : sortState === "desc"
                      ? ChevronDownIcon
                      : ChevronUpIcon
                const headerLabel = flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )

                return (
                  <TableHead key={header.id}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-auto gap-2 px-0 hover:bg-transparent data-[state=sorted]:bg-transparent",
                        !canSort && "pointer-events-none"
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      aria-label={canSort ? "Sort column" : undefined}
                    >
                      {headerLabel}
                      {canSort ? (
                        <SortIcon
                          data-icon="inline-end"
                          className={cn(
                            "transition-opacity",
                            sortState
                              ? "opacity-100 text-foreground"
                              : "opacity-0 text-muted-foreground group-hover/button:opacity-100"
                          )}
                        />
                      ) : null}
                    </Button>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {pagination && onPageChange ? (
        <Pagination className="mx-0 w-full justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(event) => {
                  if (canPreviousPage) {
                    onPageChange(currentPageIndex - 1)
                  }
                }}
                aria-disabled={!canPreviousPage}
                tabIndex={canPreviousPage ? 0 : -1}
                className={cn(!canPreviousPage && "pointer-events-none opacity-50")}
              />
            </PaginationItem>

            {displayPageCount === 1 ? (
              <PaginationItem>
                <PaginationLink
                  isActive
                  onClick={() => undefined}
                  aria-disabled
                  tabIndex={-1}
                  className="pointer-events-none h-8 w-8 rounded-full"
                  variant="secondary"
                >
                  1
                </PaginationLink>
              </PaginationItem>
            ) : (
              <PaginationItem className="px-2 text-sm text-muted-foreground">
                {currentPage} / {displayPageCount}
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationNext
                onClick={(event) => {
                  if (canNextPage) {
                    onPageChange(currentPageIndex + 1)
                  }
                }}
                aria-disabled={!canNextPage}
                tabIndex={canNextPage ? 0 : -1}
                className={cn(!canNextPage && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

    </div>
  )
}
