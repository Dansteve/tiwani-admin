"use client";

import * as React from "react";
import { Loader2, Search, SearchX } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// =============================================================================================
// DataTable: the GENERIC, reusable admin table the Users / Content modules build on. It is data-source
// agnostic: pass it an already-fetched array of rows and a column config, and it owns the presentation
// (the search box, client-side filtering, client-side pagination, the loading state, and the empty
// states). It does NOT fetch; the caller fetches through the adminApi seam and hands the rows in.
//
// SEARCH-FIRST (the DPO red line, README "Red lines"): when `searchFirst` is true the table refuses to
// render any rows until a query is entered, showing the "Search to begin" prompt instead. This is the
// no-standing-whole-population-browse control for cross-tenant views; the Users module turns it on.
//
// HOW TO USE IT (the contract the module devs code against):
//
//   const columns: DataTableColumn<AdminUserSummary>[] = [
//     { id: "name",   header: "Coordinator", cell: (u) => u.displayName, searchValue: (u) => u.displayName },
//     { id: "plan",   header: "Plan",        cell: (u) => <Badge>{u.planTier}</Badge> },
//     { id: "count",  header: "Recipients",  numeric: true, cell: (u) => u.recipientCount },
//   ];
//   <DataTable data={users} columns={columns} getRowId={(u) => u.id} searchFirst searchPlaceholder="Search by email" />
//
// Each column:
//   id          - stable key (React key for the column + header).
//   header      - the column header (string or node).
//   cell        - render the cell for a row (string | number | node).
//   numeric     - right-align + tabular figures (counts; this app never shows currency).
//   searchValue - the string a row contributes to the search match for this column (optional).
//   headClassName / cellClassName - per-column class hooks.
//
// Top-level:
//   data              - the rows (already fetched).
//   columns           - the column config above.
//   getRowId          - stable id per row (React key).
//   isLoading         - show the loading state instead of the table.
//   searchable        - show the search box (default true).
//   searchFirst       - require a query before any row renders (the DPO red line; default false).
//   searchPlaceholder - the search input placeholder.
//   pageSize          - initial rows per page (default 10).
//   pageSizeOptions   - the per-page choices (default [10, 20, 50]).
//   emptyTitle / emptyDescription - the no-data state (when `data` itself is empty).
//   onRowClick        - optional row click handler (rows become a button-like target).
//   caption           - an accessible <caption> for the table (screen-reader context).
//   className         - class on the wrapping Card.
// =============================================================================================

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  numeric?: boolean;
  searchValue?: (row: T) => string;
  headClassName?: string;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  searchable?: boolean;
  searchFirst?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  caption?: string;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  isLoading = false,
  searchable = true,
  searchFirst = false,
  searchPlaceholder = "Search",
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 20, 50],
  emptyTitle = "Nothing here yet",
  emptyDescription = "There is no data to show.",
  onRowClick,
  caption,
  className,
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const trimmedQuery = query.trim().toLowerCase();
  const hasQuery = trimmedQuery.length > 0;

  // Reset to the first page whenever the query or page size changes, so the visible window stays valid.
  // Done by adjusting state during render (the supported React pattern), not in an effect: we remember
  // the last query + page size and, when it changes, snap the page back before painting.
  const [lastResetKey, setLastResetKey] = React.useState(`${trimmedQuery}|${pageSize}`);
  const resetKey = `${trimmedQuery}|${pageSize}`;
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setPage(1);
  }

  // The rows that match the query (all rows when no query). When no column declares a searchValue, the
  // query cannot match anything, so search degrades to "no results" rather than silently ignoring it.
  const filtered = React.useMemo(() => {
    if (!hasQuery) {
      return data;
    }
    return data.filter((row) =>
      columns.some((column) => {
        const value = column.searchValue?.(row);
        return value
          ? value.toLowerCase().includes(trimmedQuery)
          : false;
      }),
    );
  }, [data, columns, hasQuery, trimmedQuery]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = React.useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  // In search-first mode, nothing renders until the user types: the cross-tenant browse guard.
  const showSearchFirstPrompt = searchFirst && !hasQuery && !isLoading;
  // The underlying data set is empty (not a no-results-for-a-query case).
  const showNoData = !isLoading && !showSearchFirstPrompt && data.length === 0;
  // A query matched nothing.
  const showNoResults =
    !isLoading && !showSearchFirstPrompt && data.length > 0 && total === 0;
  const showTable = !isLoading && !showSearchFirstPrompt && total > 0;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {searchable ? (
        <div className="relative w-full sm:max-w-xs">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-9"
          />
        </div>
      ) : null}

      {isLoading ? (
        <Card>
          <div
            className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Loading
          </div>
        </Card>
      ) : null}

      {showSearchFirstPrompt ? (
        <EmptyState
          icon={Search}
          title="Search to begin"
          description="To protect people's privacy, this view does not list everyone. Enter a search to find a specific record."
        />
      ) : null}

      {showNoData ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : null}

      {showNoResults ? (
        <EmptyState
          icon={SearchX}
          title="No matches"
          description="No records match your search. Check the spelling or try a different term."
        />
      ) : null}

      {showTable ? (
        <Card className="overflow-hidden">
          <Table>
            {caption ? (
              <caption className="sr-only">{caption}</caption>
            ) : null}
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    numeric={column.numeric}
                    className={column.headClassName}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? "cursor-pointer" : undefined}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      numeric={column.numeric}
                      className={column.cellClassName}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : null}

      {showTable ? (
        <TablePagination
          page={safePage}
          pageSize={pageSize}
          total={total}
          onPrev={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
          onPageSizeChange={setPageSize}
          pageSizeOptions={pageSizeOptions}
        />
      ) : null}
    </div>
  );
}
