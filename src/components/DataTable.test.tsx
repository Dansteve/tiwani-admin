// DataTable is the GENERIC table the Users / Content modules build on, so these pin its load-bearing
// behaviour: search-first refuses to list anyone until a query is typed (the DPO cross-tenant red line),
// the search box filters by the column searchValues, pagination windows the rows (prev/next), and the
// no-data / no-results empty states show. A regression here is a privacy or a usability bug in every
// table that reuses it.

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DataTable, type DataTableColumn } from "@/components/DataTable";

interface Row {
  id: string;
  name: string;
  count: number;
}

const ROWS: Row[] = Array.from({ length: 23 }, (_, i) => ({
  id: `r${i + 1}`,
  name: `Person ${String(i + 1).padStart(2, "0")}`,
  count: i + 1,
}));

const COLUMNS: DataTableColumn<Row>[] = [
  { id: "name", header: "Name", cell: (r) => r.name, searchValue: (r) => r.name },
  { id: "count", header: "Count", numeric: true, cell: (r) => r.count },
];

function setup(props?: Partial<React.ComponentProps<typeof DataTable<Row>>>) {
  return render(
    <DataTable
      data={ROWS}
      columns={COLUMNS}
      getRowId={(r) => r.id}
      pageSize={10}
      {...props}
    />,
  );
}

describe("DataTable search-first (the DPO cross-tenant red line)", () => {
  it("shows the 'Search to begin' prompt and NO rows until a query is entered", async () => {
    const user = userEvent.setup();
    setup({ searchFirst: true });

    // No table, the search-first prompt instead.
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Search to begin")).toBeInTheDocument();
    expect(screen.queryByText("Person 01")).not.toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "Person 01");

    // Now the matching row is shown and the prompt is gone.
    expect(screen.queryByText("Search to begin")).not.toBeInTheDocument();
    expect(screen.getByText("Person 01")).toBeInTheDocument();
  });
});

describe("DataTable filtering", () => {
  it("filters rows by the column searchValue", async () => {
    const user = userEvent.setup();
    setup();

    // Page 1 shows the first 10 rows.
    expect(screen.getByText("Person 01")).toBeInTheDocument();
    expect(screen.getByText("Showing 1-10 of 23")).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "Person 21");
    expect(screen.getByText("Person 21")).toBeInTheDocument();
    expect(screen.queryByText("Person 01")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1-1 of 1")).toBeInTheDocument();
  });

  it("shows the no-results empty state when nothing matches", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByRole("searchbox"), "zzz-nothing");
    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

// The pager renders both a compact mobile bar and the full desktop bar (each shown at its breakpoint via
// CSS, which removes the other from the accessibility tree in a real browser; jsdom has no CSS, so both
// are in the DOM). The "Next" label is shared, so these helpers target the DESKTOP bar (its labels are
// "Previous" / "Next" and its count reads "Showing X-Y of N", which is unambiguous).
function clickNext(user: ReturnType<typeof userEvent.setup>) {
  const nextButtons = screen.getAllByRole("button", { name: "Next" });
  return user.click(nextButtons[nextButtons.length - 1]);
}

describe("DataTable pagination", () => {
  it("windows the rows and pages forward / back with prev / next", async () => {
    const user = userEvent.setup();
    setup();

    // Page 1: rows 1-10, Person 11 not yet visible.
    expect(screen.getByText("Person 01")).toBeInTheDocument();
    expect(screen.queryByText("Person 11")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1-10 of 23")).toBeInTheDocument();

    await clickNext(user);
    expect(screen.getByText("Showing 11-20 of 23")).toBeInTheDocument();
    expect(screen.getByText("Person 11")).toBeInTheDocument();
    expect(screen.queryByText("Person 01")).not.toBeInTheDocument();

    // Last page: 3 rows.
    await clickNext(user);
    expect(screen.getByText("Showing 21-23 of 23")).toBeInTheDocument();

    // Back to page 2 (desktop "Previous" is a unique label).
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByText("Showing 11-20 of 23")).toBeInTheDocument();
  });

  it("resets to page 1 when the query changes", async () => {
    const user = userEvent.setup();
    setup();
    await clickNext(user);
    expect(screen.getByText("Showing 11-20 of 23")).toBeInTheDocument();

    // A broad query that still has many matches: page must snap back to 1.
    await user.type(screen.getByRole("searchbox"), "Person");
    expect(screen.getByText("Showing 1-10 of 23")).toBeInTheDocument();
  });
});

describe("DataTable empty data", () => {
  it("shows the no-data empty state with the provided title", () => {
    setup({ data: [], emptyTitle: "No coordinators", emptyDescription: "None yet." });
    expect(screen.getByText("No coordinators")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("DataTable numeric column", () => {
  it("right-aligns numeric columns with tabular figures", () => {
    setup();
    const headers = screen.getAllByRole("columnheader");
    const countHeader = headers.find((h) => within(h).queryByText("Count"));
    expect(countHeader?.className).toContain("text-right");
  });
});
