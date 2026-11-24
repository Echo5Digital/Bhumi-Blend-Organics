import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { ErrorNotice, Notice, PageTitle, Pagination, useTitle } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDateTime, timeAgo } from "../lib/format";
import type { ReviewList, ReviewRow, ReviewStatus } from "../lib/types";
import { useApi } from "../lib/useApi";

// Every review customers have sent from a product page. A new one is "Pending" and is NOT shown on the
// website; "Approve" puts it on the product page (and into its star rating); "Reject" hides it for good
// without losing it; "Delete" removes it.

const TABS: ("all" | ReviewStatus)[] = ["all", "pending", "approved", "rejected"];
const TAB_LABELS: Record<"all" | ReviewStatus, string> = { all: "All", pending: "Pending", approved: "Approved", rejected: "Rejected" };
const BADGE_CLASS: Record<ReviewStatus, string> = { pending: "pending", approved: "completed", rejected: "cancelled" };
const BULK = [
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
  { value: "delete", label: "Delete permanently" },
] as const;

const starPath = "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5z";

function Stars({ value }: { value?: number }) {
  if (!value) return <span>–</span>;
  return (
    <span className="review-stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d={starPath} fill={n <= value ? "#C89B3C" : "none"} stroke="#C89B3C" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

export function Reviews() {
  useTitle("Reviews");
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const status = (TABS.includes(params.get("status") as ReviewStatus) ? params.get("status") : "all") as "all" | ReviewStatus;
  const search = params.get("search") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);

  const [searchText, setSearchText] = useState(search);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
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

  const query = new URLSearchParams({ status, page: String(page), limit: "20" });
  if (search) query.set("search", search);
  const { data, error, loading, reload } = useApi<ReviewList>(`/admin/reviews?${query}`);
  const counts = data?.counts;
  const rows = data?.items ?? [];
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));

  /** Something changed: refresh this list and the "waiting" number in the menu. */
  function changed(text: string) {
    setMessage({ kind: "success", text });
    setSelected(new Set());
    reload();
    window.dispatchEvent(new Event("admin:reviews-changed"));
  }
  const failed = (caught: unknown) => setMessage({ kind: "error", text: caught instanceof ApiError ? caught.message : "Something went wrong." });

  async function setStatus(row: ReviewRow, next: ReviewStatus) {
    setBusy(true);
    try {
      await api(`/admin/reviews/${row.id}`, { method: "PATCH", token, body: { status: next } });
      changed(next === "approved" ? `The review by ${row.name} is approved and now shows on the product page.` : next === "rejected" ? `The review by ${row.name} is rejected.` : `The review by ${row.name} is back to pending and no longer shows on the product page.`);
    } catch (caught) {
      failed(caught);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: ReviewRow) {
    if (!window.confirm(`Delete the review by ${row.name} for good?`)) return;
    setBusy(true);
    try {
      await api(`/admin/reviews/${row.id}`, { method: "DELETE", token });
      changed(`The review by ${row.name} is deleted.`);
    } catch (caught) {
      failed(caught);
    } finally {
      setBusy(false);
    }
  }

  async function applyBulk(event: FormEvent) {
    event.preventDefault();
    if (!bulk || selected.size === 0) return;
    if (bulk === "delete" && !window.confirm(`Delete ${selected.size} ${selected.size === 1 ? "review" : "reviews"} for good?`)) return;
    setBusy(true);
    try {
      const result = await api<{ updated: number }>("/admin/reviews/bulk", { method: "POST", token, body: { ids: [...selected], action: bulk } });
      setBulk("");
      changed(`${result.updated} ${result.updated === 1 ? "review" : "reviews"} ${bulk === "approve" ? "approved" : bulk === "reject" ? "rejected" : "deleted"}.`);
    } catch (caught) {
      failed(caught);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageTitle title="Reviews" />

      {message && <Notice kind={message.kind} onDismiss={() => setMessage(null)}>{message.text}</Notice>}
      <ErrorNotice error={error} />

      <ul className="subsubsub">
        {TABS.map((tab) => (
          <li key={tab}>
            <a
              href="#"
              className={status === tab ? "current" : ""}
              onClick={(event) => {
                event.preventDefault();
                update({ status: tab === "all" ? null : tab });
              }}
            >
              {TAB_LABELS[tab]} <span className="num">({counts?.[tab] ?? 0})</span>
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
            <input type="search" aria-label="Search reviews" placeholder="Name, email, product or words in the review" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
            <button type="submit" className="btn">
              Search reviews
            </button>
          </span>
        </span>
      </form>

      <form className="toolbar" onSubmit={applyBulk}>
        <select aria-label="Bulk actions" value={bulk} onChange={(event) => setBulk(event.target.value)}>
          <option value="">Bulk actions</option>
          {BULK.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn" disabled={busy || !bulk || selected.size === 0}>
          Apply
        </button>
        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onPage={(next) => update({ page: String(next) })} noun="reviews" />
      </form>

      <div className={`table-wrap ${loading && data ? "loading-dim" : ""}`}>
        <table className="list">
          <thead>
            <tr>
              <th className="check">
                <input
                  type="checkbox"
                  aria-label="Select all reviews on this page"
                  checked={allSelected}
                  onChange={(event) => setSelected(event.target.checked ? new Set(rows.map((row) => row.id)) : new Set())}
                />
              </th>
              <th>Author</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  {loading ? "Loading reviews…" : status === "all" && !search ? "No reviews yet. When a customer sends one from a product page, it appears here to approve." : "No reviews found."}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="check">
                  <input
                    type="checkbox"
                    aria-label={`Select the review by ${row.name}`}
                    checked={selected.has(row.id)}
                    onChange={(event) =>
                      setSelected((previous) => {
                        const next = new Set(previous);
                        if (event.target.checked) next.add(row.id);
                        else next.delete(row.id);
                        return next;
                      })
                    }
                  />
                </td>
                <td className="author-cell">
                  <span className="strong">{row.name}</span>
                  <div className="muted" style={{ fontSize: 12, wordBreak: "break-all" }}>
                    {row.email}
                  </div>
                  <div className="row-actions">
                    {row.status !== "approved" && (
                      <span>
                        <button type="button" className="link-button" disabled={busy} onClick={() => setStatus(row, "approved")}>
                          Approve
                        </button>
                      </span>
                    )}
                    {row.status === "approved" && (
                      <span>
                        <button type="button" className="link-button" disabled={busy} onClick={() => setStatus(row, "pending")}>
                          Unapprove
                        </button>
                      </span>
                    )}
                    {row.status !== "rejected" && (
                      <span>
                        <button type="button" className="link-button" disabled={busy} onClick={() => setStatus(row, "rejected")}>
                          Reject
                        </button>
                      </span>
                    )}
                    <span>
                      <button type="button" className="link-button danger" disabled={busy} onClick={() => remove(row)}>
                        Delete
                      </button>
                    </span>
                  </div>
                </td>
                <td>
                  <Stars value={row.rating} />
                </td>
                <td className="review-cell">
                  <div className="review-text">{row.review}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    On{" "}
                    <a href={`/product/${row.productSlug}#reviews`} target="_blank" rel="noreferrer" className="strong">
                      {row.productName}
                    </a>
                  </div>
                </td>
                <td title={formatDateTime(row.createdAt)}>{timeAgo(row.createdAt)}</td>
                <td>
                  <span className={`badge ${BADGE_CLASS[row.status]}`}>{TAB_LABELS[row.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="toolbar">
        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onPage={(next) => update({ page: String(next) })} noun="reviews" />
      </div>
    </div>
  );
}
