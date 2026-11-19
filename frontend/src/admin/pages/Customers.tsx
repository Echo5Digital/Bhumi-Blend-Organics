import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ErrorNotice, Notice, Pagination, SortHeader, useTitle } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { downloadCsv } from "../lib/csv";
import { formatDate, money } from "../lib/format";
import type { CustomerRow, Paged } from "../lib/types";
import { useApi } from "../lib/useApi";

/** A bin (waste-basket) icon, for the delete button at the end of each row. */
function BinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 6h17" />
      <path d="M9 6V4h6v2" />
      <path d="M5.5 6l1 14h11l1-14" />
      <path d="M10 10.5v6M14 10.5v6" />
    </svg>
  );
}

// WooCommerce → Customers: everyone who has bought (or signed up), with what they've spent.
export function Customers() {
  useTitle("Customers");
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const type = params.get("type") ?? "all";
  const search = params.get("search") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const sort = params.get("sort") ?? "lastActive";
  const dir = (params.get("dir") ?? "desc") as "asc" | "desc";
  const [searchText, setSearchText] = useState(search);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // The id of the customer being deleted right now (its button waits).
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const query = new URLSearchParams({ type, page: String(page), limit: "25", sort, dir });
  if (search) query.set("search", search);
  const { data, error: loadError, loading, reload } = useApi<Paged<CustomerRow>>(`/admin/customers?${query}`);

  /** Delete a registered customer's account. Their orders are kept (as guest orders). */
  async function deleteCustomer(row: CustomerRow) {
    if (!row.id) return;
    const who = row.name || row.email;
    if (!window.confirm(`Delete ${who}?\n\nTheir account is removed for good and they can no longer log in. Their orders stay in Orders, as guest orders.\n\nThis can't be undone.`)) return;
    setError("");
    setNotice("");
    setDeleting(row.id);
    try {
      const result = await api<{ deleted: boolean; ordersKept: number }>(`/admin/customers/${row.id}`, { method: "DELETE", token });
      setNotice(`Deleted ${who}.${result.ordersKept > 0 ? ` Their ${result.ordersKept === 1 ? "order was" : `${result.ordersKept} orders were`} kept.` : ""}`);
      reload();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The customer couldn't be deleted.");
    } finally {
      setDeleting(null);
    }
  }

  const toggleSort = (field: string) => update({ sort: field, dir: sort === field && dir === "desc" ? "asc" : "desc" });

  async function download() {
    setError("");
    try {
      const all = new URLSearchParams({ type, limit: "5000", sort, dir });
      if (search) all.set("search", search);
      const result = await api<Paged<CustomerRow>>(`/admin/customers?${all}`, { token });
      downloadCsv(
        "customers.csv",
        ["Name", "Type", "Email", "Last active", "Date registered", "Orders", "Total spend", "AOV", "Country", "City", "State", "Postal code"],
        result.items.map((row) => [row.name, row.type, row.email, row.lastActive?.slice(0, 10), row.registeredAt?.slice(0, 10), row.orders, row.totalSpend, row.averageOrderValue, row.country, row.city, row.state, row.postcode]),
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The download failed.");
    }
  }

  return (
    <div className="has-appbar">
      <div className="appbar">
        <h1>Customers</h1>
      </div>
      <div className="page">
        {error && <Notice kind="error" onDismiss={() => setError("")}>{error}</Notice>}
        {notice && <Notice kind="success" onDismiss={() => setNotice("")}>{notice}</Notice>}
        <ErrorNotice error={loadError} />

        <div className="toolbar" style={{ alignItems: "flex-end" }}>
          <div>
            <label className="label" htmlFor="show" style={{ fontSize: 14 }}>
              Show
            </label>
            <select id="show" value={type} onChange={(event) => update({ type: event.target.value === "all" ? null : event.target.value })} style={{ minWidth: 220 }}>
              <option value="all">All Customers</option>
              <option value="registered">Registered customers</option>
              <option value="guests">Guests (checked out without an account)</option>
            </select>
          </div>
        </div>

        <section className="card flush">
          <div className="card-head">
            <h2 style={{ fontSize: 16 }}>Customers</h2>
            <form
              style={{ flex: 1 }}
              onSubmit={(event) => {
                event.preventDefault();
                update({ search: searchText.trim() });
              }}
            >
              <input type="search" aria-label="Search customers" placeholder="Search by name or email" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
            </form>
            <button type="button" className="btn" onClick={download}>
              Download
            </button>
          </div>
          <div className={`table-wrap ${loading && data ? "loading-dim" : ""}`} style={{ border: 0, boxShadow: "none" }}>
            <table className="list">
              <thead>
                <tr>
                  <SortHeader label="Name" field="name" sort={sort} dir={dir} onSort={toggleSort} />
                  <SortHeader label="Last active" field="lastActive" sort={sort} dir={dir} onSort={toggleSort} />
                  <SortHeader label="Date registered" field="registered" sort={sort} dir={dir} onSort={toggleSort} />
                  <th>Email</th>
                  <SortHeader label="Orders" field="orders" sort={sort} dir={dir} onSort={toggleSort} className="num" />
                  <SortHeader label="Total spend" field="spend" sort={sort} dir={dir} onSort={toggleSort} className="num" />
                  <th className="num">AOV</th>
                  <th>Country / Region</th>
                  <th>City</th>
                  <th>Region</th>
                  <th>Postal code</th>
                  <th className="row-icon">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(data?.items.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={12} className="empty">
                      {loading ? "Loading customers…" : "No customers found."}
                    </td>
                  </tr>
                )}
                {data?.items.map((row) => (
                  <tr key={row.id ?? `guest-${row.email}`}>
                    <td>
                      {row.id ? (
                        <Link to={`/customers/${row.id}`} className="strong">
                          {row.name}
                        </Link>
                      ) : (
                        <>
                          {row.name || "—"} <span className="muted">(guest)</span>
                        </>
                      )}
                    </td>
                    <td>{formatDate(row.lastActive)}</td>
                    <td>{row.registeredAt ? formatDate(row.registeredAt) : "—"}</td>
                    <td>
                      <a href={`mailto:${row.email}`}>{row.email}</a>
                    </td>
                    <td className="num">{row.orders}</td>
                    <td className="num">{money(row.totalSpend)}</td>
                    <td className="num">{money(row.averageOrderValue)}</td>
                    <td>{row.country === "India" ? "IN" : (row.country ?? "—")}</td>
                    <td>{row.city ?? "—"}</td>
                    <td>{row.state ?? "—"}</td>
                    <td>{row.postcode ?? "—"}</td>
                    <td className="row-icon">
                      {row.id && (
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Delete ${row.name || row.email}`}
                          title="Delete customer"
                          disabled={deleting === row.id}
                          onClick={() => deleteCustomer(row)}
                        >
                          <BinIcon />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-head" style={{ borderTop: "1px solid var(--card-border)", borderBottom: 0 }}>
            <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} noun="customers" onPage={(next) => update({ page: String(next) })} />
          </div>
        </section>
      </div>
    </div>
  );
}
