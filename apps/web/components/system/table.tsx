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
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type DataTableProps<TData, TValue> = {
  data: TData[]
  columns: ColumnDef<TData, TValue>[]
}

export default function DataTable<TData, TValue>({
  data,
  columns,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  const colSpan = table.getVisibleLeafColumns().length

  return (
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

              return (
                <TableHead key={header.id}>
                  {canSort ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto gap-2 px-0 hover:bg-transparent data-[state=sorted]:bg-transparent"
                      onClick={header.column.getToggleSortingHandler()}
                      aria-label="Sort column"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <SortIcon
                        data-icon="inline-end"
                        className={cn(
                          "transition-opacity",
                          sortState
                            ? "opacity-100 text-foreground"
                            : "opacity-0 text-muted-foreground group-hover/button:opacity-100"
                        )}
                      />
                    </Button>
                  ) : (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )
                  )}
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
  )
}
