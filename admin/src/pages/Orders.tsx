import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { ErrorNotice, Notice, Pagination, PageTitle, SortHeader, StatusBadge, useTitle } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { ORDER_STATUS_LABELS, formatDateTime, money, timeAgo, toDayString } from "../lib/format";
import type { CustomerRow, OrderList, OrderStatus, Paged, TargetStatus } from "../lib/types";
import { useApi } from "../lib/useApi";

const STATUS_TABS: ("all" | OrderStatus)[] = ["all", "pending", "processing", "shipped", "completed", "cancelled", "refunded", "failed"];
const BULK: TargetStatus[] = ["processing", "shipped", "completed", "cancelled", "refunded"];

/** The last 12 months for the "All dates" menu: value "2026-11", label "November 2026". */
function monthOptions() {
  const today = toDayString(new Date());
  let year = Number(today.slice(0, 4));
  let month = Number(today.slice(5, 7));
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    options.push({
      value: `${year}-${String(month).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1))),
    });
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return options;
}

function monthRange(value: string) {
  const [year, month] = value.split("-").map(Number) as [number, number];
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${value}-01`, to: `${value}-${String(lastDay).padStart(2, "0")}` };
}

/** "Filter by registered customer": type a name or email, pick from the matches. */
function CustomerFilter({ id, name, onPick }: { id: string; name: string; onPick: (id: string, name: string) => void }) {
  const { token } = useAuth();
  const [text, setText] = useState("");
  const [matches, setMatches] = useState<CustomerRow[]>([]);

  useEffect(() => {
    if (text.trim().length < 2) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      api<Paged<CustomerRow>>(`/admin/customers?type=registered&search=${encodeURIComponent(text.trim())}&limit=8&sort=name&dir=asc`, { token })
        .then((result) => {
          if (!cancelled) setMatches(result.items);
        })
        .catch(() => {
          if (!cancelled) setMatches([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [text, token]);

  if (id) {
    return (
      <span className="chip">
        {name || "Customer"}
        <button type="button" aria-label="Remove customer filter" onClick={() => onPick("", "")}>
          ×
        </button>
      </span>
    );
  }
  return (
    <div className="suggest">
      <input type="search" placeholder="Filter by registered customer" aria-label="Filter by registered customer" value={text} onChange={(event) => setText(event.target.value)} style={{ width: 230 }} />
      {text.trim().length >= 2 && matches.length > 0 && (
        <ul>
          {matches.filter((match) => match.id).map((match) => (
            <li key={match.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(match.id!, match.name || match.email);
                  setText("");
                  setMatches([]);
                }}
              >
                {match.name} <span className="muted">({match.email})</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Orders() {
  useTitle("Orders");
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "all";
  const search = params.get("search") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const month = params.get("month") ?? "";
  const customer = params.get("customer") ?? "";
  const customerName = params.get("cname") ?? "";
  const sort = params.get("sort") ?? "date";
  const dir = (params.get("dir") ?? "desc") as "asc" | "desc";

  const [searchText, setSearchText] = useState(search);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulk, setBulk] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error" | "warning"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  /** Change some filters; any change but paging goes back to page 1. */
  const update = (changes: Record<string, string | null>) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      if (!("page" in changes)) next.delete("page");
      return next;
    });

  const query = new URLSearchParams({ status, page: String(page), limit: "20", sort, dir });
  if (search) query.set("search", search);
  if (month) {
    const range = monthRange(month);
    query.set("from", range.from);
    query.set("to", range.to);
  }
  if (customer) query.set("customer", customer);

  const { data, error, loading, reload } = useApi<OrderList>(`/admin/orders?${query}`);
  const counts = data?.counts;
  const rows = data?.items ?? [];
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.number));

  const toggleSort = (field: string) => update({ sort: field, dir: sort === field && dir === "desc" ? "asc" : "desc" });

  async function applyBulk(event: FormEvent) {
    event.preventDefault();
    if (!bulk || selected.size === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await api<{ updated: number; skipped: { number: number; reason: string }[] }>("/admin/orders/bulk", {
        method: "POST",
        token,
        body: { numbers: [...selected], status: bulk },
      });
      const skipped = result.skipped.map((entry) => `#${entry.number}: ${entry.reason}`).join(" ");
      setMessage({
        kind: result.skipped.length > 0 ? "warning" : "success",
        text: `${result.updated} ${result.updated === 1 ? "order" : "orders"} updated.${skipped ? ` Skipped — ${skipped}` : ""}`,
      });
      setSelected(new Set());
      setBulk("");
      reload();
    } catch (caught) {
      setMessage({ kind: "error", text: caught instanceof ApiError ? caught.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageTitle title="Orders" />

      {message && <Notice kind={message.kind} onDismiss={() => setMessage(null)}>{message.text}</Notice>}
      <ErrorNotice error={error} />

      <ul className="subsubsub">
        {STATUS_TABS.filter((tab) => tab === "all" || (counts?.[tab] ?? 0) > 0 || tab === status).map((tab) => (
          <li key={tab}>
            <a
              href="#"
              className={status === tab ? "current" : ""}
              onClick={(event) => {
                event.preventDefault();
                update({ status: tab === "all" ? null : tab });
              }}
            >
              {tab === "all" ? "All" : ORDER_STATUS_LABELS[tab]} <span className="num">({counts?.[tab] ?? 0})</span>
            </a>
          </li>
        ))}
      </ul>

      <form
        className="toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          update({ search: searchText.trim() });
        }}
      >
        <span className="right" style={{ marginLeft: 0, order: 2 }}>
          <span className="search-box">
            <input type="search" aria-label="Search orders" placeholder="Order number, name or email" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
            <button type="submit" className="btn">
              Search orders
            </button>
          </span>
        </span>
      </form>

      <form className="toolbar" onSubmit={applyBulk}>
        <select aria-label="Bulk actions" value={bulk} onChange={(event) => setBulk(event.target.value)}>
          <option value="">Bulk actions</option>
          {BULK.map((target) => (
            <option key={target} value={target}>
              Change status to {target}
            </option>
          ))}
        </select>
        <button type="submit" className="btn" disabled={busy || !bulk || selected.size === 0}>
          Apply
        </button>

        <select aria-label="Filter by month" value={month} onChange={(event) => update({ month: event.target.value })}>
          <option value="">All dates</option>
          {monthOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <CustomerFilter id={customer} name={customerName} onPick={(id, name) => update({ customer: id, cname: name })} />

        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onPage={(next) => update({ page: String(next) })} />
      </form>

      <div className={`table-wrap ${loading && data ? "loading-dim" : ""}`}>
        <table className="list">
          <thead>
            <tr>
              <th className="check">
                <input
                  type="checkbox"
                  aria-label="Select all orders on this page"
                  checked={allSelected}
                  onChange={(event) => setSelected(event.target.checked ? new Set(rows.map((row) => row.number)) : new Set())}
                />
              </th>
              <SortHeader label="Order" field="number" sort={sort} dir={dir} onSort={toggleSort} />
              <SortHeader label="Date" field="date" sort={sort} dir={dir} onSort={toggleSort} />
              <th>Status</th>
              <SortHeader label="Total" field="total" sort={sort} dir={dir} onSort={toggleSort} className="num" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">
                  {loading ? "Loading orders…" : "No orders found."}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.number}>
                <td className="check">
                  <input
                    type="checkbox"
                    aria-label={`Select order ${row.number}`}
                    checked={selected.has(row.number)}
                    onChange={(event) =>
                      setSelected((previous) => {
                        const next = new Set(previous);
                        if (event.target.checked) next.add(row.number);
                        else next.delete(row.number);
                        return next;
                      })
                    }
                  />
                </td>
                <td>
                  <Link to={`/orders/${row.number}`} className="strong">
                    #{row.number} {row.customerName}
                  </Link>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {row.items.map((item) => `${item.name} × ${item.qty}`).join(", ")}
                  </div>
                </td>
                <td title={formatDateTime(row.createdAt)}>{timeAgo(row.createdAt)}</td>
                <td>
                  <StatusBadge status={row.status} />
                </td>
                <td className="num">{money(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="toolbar">
        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onPage={(next) => update({ page: String(next) })} />
      </div>
    </div>
  );
}
