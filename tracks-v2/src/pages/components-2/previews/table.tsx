import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Table, type TableColumn } from "@/components/motion/table";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/motion/switch";
type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "invited" | "suspended";
  mrr: number;
};

const FIRST = [
  "Ava",
  "Leo",
  "Mia",
  "Kai",
  "Zoe",
  "Eli",
  "Noa",
  "Ren",
  "Ivy",
  "Jude",
];
const LAST = [
  "Cole",
  "Frost",
  "Vale",
  "Reyes",
  "Okafor",
  "Sato",
  "Lund",
  "Marsh",
  "Bose",
  "Quinn",
];
const ROLES = ["Owner", "Admin", "Member", "Viewer"];
const STATUSES: Person["status"][] = ["active", "invited", "suspended"];

// Deterministic so SSR and client render the same rows (no hydration drift).
function buildPeople(count: number): Person[] {
  const out: Person[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 7) % LAST.length];
    out.push({
      id: String(i),
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@beui.dev`,
      role: ROLES[(i * 3) % ROLES.length],
      status: STATUSES[(i * 5) % STATUSES.length],
      mrr: 12 + ((i * 37) % 488),
    });
  }
  return out;
}

const STATUS_STYLES: Record<Person["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  invited: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  suspended: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

function StatusBadge({ status }: { status: Person["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-medium text-xs capitalize",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}

export function TablePreview() {
  const data = useMemo(() => buildPeople(10_000), []);
  const [selected, setSelected] = useState<string[]>([]);

  const columns = useMemo<TableColumn<Person>[]>(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        width: "1.4fr",
        cell: (row) => <span className="font-medium">{row.name}</span>,
      },
      { key: "email", header: "Email", width: "1.8fr" },
      { key: "role", header: "Role", sortable: true, width: "120px" },
      {
        key: "status",
        header: "Status",
        width: "130px",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "mrr",
        header: "MRR",
        sortable: true,
        align: "right",
        width: "110px",
        cell: (row) => (
          <span className="tabular-nums">${row.mrr.toLocaleString()}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex w-full justify-center p-4">
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-between px-1 text-muted-foreground text-xs">
          <span>{data.length.toLocaleString()} rows</span>
          {selected.length > 0 ? (
            <span>{selected.length.toLocaleString()} selected</span>
          ) : null}
        </div>
        <Table
          data={data}
          columns={columns}
          selectable
          resizable
          reorderable
          selectedRowIds={selected}
          onSelectionChange={setSelected}
          defaultSort={{ key: "mrr", direction: "desc" }}
          height={420}
          rowHeight={52}
          className="rounded-2xl"
        />
      </div>
    </div>
  );
}

type Row = { id: string; [key: string]: string };

const INITIAL_ROWS: Row[] = [
  { id: "r1", name: "Ava Cole", role: "Owner", team: "Design" },
  { id: "r2", name: "Leo Frost", role: "Admin", team: "Growth" },
  { id: "r3", name: "Mia Vale", role: "Member", team: "Design" },
  { id: "r4", name: "Kai Reyes", role: "Member", team: "Platform" },
];

export function TableEditablePreview() {
  const [rows, setRows] = useState<Row[]>(INITIAL_ROWS);
  const [keys, setKeys] = useState<string[]>(["name", "role", "team"]);
  const [labels, setLabels] = useState<Record<string, string>>({
    name: "Name",
    role: "Role",
    team: "Team",
  });
  const nextRow = useRef(5);
  const nextCol = useRef(1);
  const [editable, setEditable] = useState(true);

  const onCellEdit = useCallback(
    (rowId: string, key: string, value: string) => {
      setRows((prev) =>
        prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)),
      );
    },
    [],
  );

  const onInsertRow = useCallback(
    (index: number, position: "before" | "after") => {
      const at = position === "after" ? index + 1 : index;
      setRows((prev) => {
        const next = [...prev];
        next.splice(at, 0, { id: `r${nextRow.current}` });
        return next;
      });
      nextRow.current += 1;
    },
    [],
  );

  const onDeleteRow = useCallback((rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  }, []);

  const onInsertColumn = useCallback(
    (index: number, position: "before" | "after") => {
      const key = `field${nextCol.current}`;
      const at = position === "after" ? index + 1 : index;
      setLabels((prev) => ({ ...prev, [key]: `Field ${nextCol.current}` }));
      setKeys((prev) => {
        const next = [...prev];
        next.splice(at, 0, key);
        return next;
      });
      setRows((prev) => prev.map((row) => ({ ...row, [key]: "" })));
      nextCol.current += 1;
    },
    [],
  );

  const onColumnRename = useCallback((key: string, value: string) => {
    setLabels((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onDeleteColumn = useCallback((key: string) => {
    setKeys((prev) => prev.filter((k) => k !== key));
    setRows((prev) =>
      prev.map((row) => {
        const next = { ...row };
        delete next[key];
        return next;
      }),
    );
  }, []);

  const columns = useMemo<TableColumn<Row>[]>(
    () =>
      keys.map((key, i) => ({
        key,
        header: labels[key] ?? key,
        editable,
        width: i === 0 ? undefined : "180px",
      })),
    [keys, labels, editable],
  );

  const bodyHeight = Math.min(Math.max(rows.length, 1), 6) * 48;

  return (
    <div className="flex w-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          {editable
            ? "Click a cell to edit. Use the column and row handles to insert or delete."
            : "Read-only."}
        </p>
        <Switch
          checked={editable}
          onCheckedChange={setEditable}
          label="Editable"
        />
      </div>
      <Table
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        rowHeight={48}
        height={bodyHeight}
        onCellEdit={editable ? onCellEdit : undefined}
        onColumnRename={editable ? onColumnRename : undefined}
        onInsertRow={editable ? onInsertRow : undefined}
        onDeleteRow={editable ? onDeleteRow : undefined}
        onInsertColumn={editable ? onInsertColumn : undefined}
        onDeleteColumn={editable ? onDeleteColumn : undefined}
        emptyState={
          <button
            type="button"
            onClick={() => onInsertRow(0, "before")}
            className="rounded-full border border-border px-3 py-1.5 font-medium text-foreground text-xs transition-colors hover:bg-muted"
          >
            Insert first row
          </button>
        }
      />
    </div>
  );
}

type Person_TableAsyncPreview = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "invited" | "suspended";
  mrr: number;
};

const FIRST_TableAsyncPreview = ["Ava", "Leo", "Mia", "Kai", "Zoe", "Eli", "Noa", "Ren", "Ivy", "Jude"];
const LAST_TableAsyncPreview = ["Cole", "Frost", "Vale", "Reyes", "Okafor", "Sato", "Lund", "Marsh", "Bose", "Quinn"];
const ROLES_TableAsyncPreview = ["Owner", "Admin", "Member", "Viewer"];
const STATUSES_TableAsyncPreview: Person_TableAsyncPreview["status"][] = ["active", "invited", "suspended"];

const PAGE_SIZE = 20;
const MAX_PAGES = 8;

function buildPage(page: number): Person_TableAsyncPreview[] {
  const out: Person_TableAsyncPreview[] = [];
  const start = page * PAGE_SIZE;
  for (let n = start; n < start + PAGE_SIZE; n++) {
    const first = FIRST_TableAsyncPreview[n % FIRST_TableAsyncPreview.length];
    const last = LAST_TableAsyncPreview[(n * 7) % LAST_TableAsyncPreview.length];
    out.push({
      id: String(n),
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${n}@beui.dev`,
      role: ROLES_TableAsyncPreview[(n * 3) % ROLES_TableAsyncPreview.length],
      status: STATUSES_TableAsyncPreview[(n * 5) % STATUSES_TableAsyncPreview.length],
      mrr: 12 + ((n * 37) % 488),
    });
  }
  return out;
}

const STATUS_STYLES_TableAsyncPreview: Record<Person_TableAsyncPreview["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  invited: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  suspended: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export function TableAsyncPreview() {
  const [rows, setRows] = useState<Person_TableAsyncPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(0);
  const loadingRef = useRef(false);

  const loadMore = useCallback(() => {
    if (loadingRef.current || pageRef.current >= MAX_PAGES) return;
    loadingRef.current = true;
    setLoading(true);
    // Simulate a network request.
    setTimeout(() => {
      const page = pageRef.current;
      setRows((prev) => [...prev, ...buildPage(page)]);
      pageRef.current = page + 1;
      loadingRef.current = false;
      setLoading(false);
    }, 700);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    loadMore();
  }, []);

  const columns = useMemo<TableColumn<Person_TableAsyncPreview>[]>(
    () => [
      {
        key: "name",
        header: "Name",
        cell: (r) => <span className="font-medium">{r.name}</span>,
      },
      { key: "email", header: "Email", width: "220px" },
      { key: "role", header: "Role", width: "110px" },
      {
        key: "status",
        header: "Status",
        width: "120px",
        cell: (r) => (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-medium text-xs capitalize",
              STATUS_STYLES_TableAsyncPreview[r.status],
            )}
          >
            {r.status}
          </span>
        ),
      },
      {
        key: "mrr",
        header: "MRR",
        align: "right",
        width: "100px",
        cell: (r) => <span className="tabular-nums">${r.mrr.toLocaleString()}</span>,
      },
    ],
    [],
  );

  const done = pageRef.current >= MAX_PAGES;

  return (
    <div className="flex w-full justify-center p-4">
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-between px-1 text-muted-foreground text-xs">
          <span>{rows.length.toLocaleString()} loaded</span>
          <span>{loading ? "Loading…" : done ? "All loaded" : "Scroll for more"}</span>
        </div>
        <Table
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          height={420}
          rowHeight={52}
          onEndReached={loadMore}
          loading={loading}
          className="rounded-2xl"
        />
      </div>
    </div>
  );
}

