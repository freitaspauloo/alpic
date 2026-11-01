import { Table, type SortState, type TableColumn } from "@/components/motion/table";
import { cn } from "@/lib/utils";

const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 52;

export function tableViewportHeight(rowCount: number, max = 560) {
  if (rowCount === 0) return ROW_HEIGHT * 3 + HEADER_HEIGHT;
  return Math.min(max, HEADER_HEIGHT + rowCount * ROW_HEIGHT + 8);
}

export function SimpleDataTable<T>({
  data,
  columns,
  getRowId,
  className,
  maxHeight = 560,
  emptyState = "No data",
  defaultSort,
}: {
  data: T[];
  columns: TableColumn<T>[];
  getRowId?: (row: T, index: number) => string;
  className?: string;
  maxHeight?: number;
  emptyState?: string;
  defaultSort?: SortState | null;
}) {
  return (
    <Table
      data={data}
      columns={columns}
      getRowId={getRowId}
      defaultSort={defaultSort}
      rowHeight={ROW_HEIGHT}
      height={tableViewportHeight(data.length, maxHeight)}
      className={cn("rounded-xl", className)}
      emptyState={emptyState}
    />
  );
}
