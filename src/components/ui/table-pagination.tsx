import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// The shared table pager. One pager look for every paginated admin table (the "Showing X-Y of N" count,
// the per-page picker, prev/next). It is presentational: the parent owns the page state and passes the
// handlers. A compact bar on phones, the full row from sm up. All colours resolve to brand tokens.

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
}

export function TablePagination({
  page,
  pageSize,
  total,
  onPrev,
  onNext,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  disabled = false,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1 && !disabled;
  const canNext = page < totalPages && !disabled;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 rounded-md border border-border/70 bg-muted/20 p-2 sm:border-0 sm:bg-transparent sm:p-0">
      <div className="flex items-center justify-between sm:hidden">
        <p className="text-xs text-muted-foreground">
          {start}-{end} / {total}
        </p>
        <div className="flex items-center gap-1.5">
          {onPageSizeChange && (
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
              disabled={disabled}
            >
              <SelectTrigger size="sm" className="w-[72px] text-xs" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={!canPrev}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!canNext}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="hidden sm:flex sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {start}-{end} of {total}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => onPageSizeChange(Number(value))}
                disabled={disabled}
              >
                <SelectTrigger size="sm" className="w-[88px]" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={!canPrev}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!canNext}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
