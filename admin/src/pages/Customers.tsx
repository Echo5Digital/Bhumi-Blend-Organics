import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ErrorNotice, Notice, Pagination, SortHeader, useTitle } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { downloadCsv } from "../lib/csv";
import { formatDate, money } from "../lib/format";
import type { CustomerRow, Paged } from "../lib/types";
import { useApi } from "../lib/useApi";

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
  const { data, error: loadError, loading } = useApi<Paged<CustomerRow>>(`/admin/customers?${query}`);

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
                </tr>
              </thead>
              <tbody>
                {(data?.items.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={11} className="empty">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-head" style={{ borderTop: "1px solid var(--wp-card-border)", borderBottom: 0 }}>
            <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} noun="customers" onPage={(next) => update({ page: String(next) })} />
          </div>
        </section>
      </div>
    </div>
  );
}
