import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { blogPosts } from "../../data/blog";
import { ErrorNotice, Notice, PageTitle, Pagination, useTitle } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDateTime, timeAgo } from "../lib/format";
import type { MessageList, MessageRow } from "../lib/types";
import { useApi } from "../lib/useApi";

// What visitors send through the "Leave a Reply" form under the blog articles. An inbox: a message is
// "New" until you mark it as read. Nothing here shows on the website; use "Reply" to answer by email.

type Tab = "all" | "new" | "read";
const TABS: Tab[] = ["all", "new", "read"];
const TAB_LABELS: Record<Tab, string> = { all: "All", new: "New", read: "Read" };
const BULK = [
  { value: "read", label: "Mark as read" },
  { value: "unread", label: "Mark as new" },
  { value: "delete", label: "Delete permanently" },
] as const;

const articleTitle = (slug: string) => blogPosts.find((post) => post.slug === slug)?.title ?? slug;
/** Only real web addresses become links (the visitor typed it, so never trust it as a link). */
const safeWebsite = (website: string) => (/^https?:\/\//i.test(website) ? website : "");

export function Messages() {
  useTitle("Messages");
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const status = (TABS.includes(params.get("status") as Tab) ? params.get("status") : "all") as Tab;
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
  const { data, error, loading, reload } = useApi<MessageList>(`/admin/messages?${query}`);
  const counts = data?.counts;
  const rows = data?.items ?? [];
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));

  /** Something changed: refresh this list and the "new" number in the menu. */
  function changed(text: string) {
    setMessage({ kind: "success", text });
    setSelected(new Set());
    reload();
    window.dispatchEvent(new Event("admin:messages-changed"));
  }
  const failed = (caught: unknown) => setMessage({ kind: "error", text: caught instanceof ApiError ? caught.message : "Something went wrong." });

  async function setRead(row: MessageRow, isRead: boolean) {
    setBusy(true);
    try {
      await api(`/admin/messages/${row.id}`, { method: "PATCH", token, body: { isRead } });
      changed(isRead ? `The message from ${row.name} is marked as read.` : `The message from ${row.name} is marked as new.`);
    } catch (caught) {
      failed(caught);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: MessageRow) {
    if (!window.confirm(`Delete the message from ${row.name} for good?`)) return;
    setBusy(true);
    try {
      await api(`/admin/messages/${row.id}`, { method: "DELETE", token });
      changed(`The message from ${row.name} is deleted.`);
    } catch (caught) {
      failed(caught);
    } finally {
      setBusy(false);
    }
  }

  async function applyBulk(event: FormEvent) {
    event.preventDefault();
    if (!bulk || selected.size === 0) return;
    if (bulk === "delete" && !window.confirm(`Delete ${selected.size} ${selected.size === 1 ? "message" : "messages"} for good?`)) return;
    setBusy(true);
    try {
      const result = await api<{ updated: number }>("/admin/messages/bulk", { method: "POST", token, body: { ids: [...selected], action: bulk } });
      setBulk("");
      const noun = result.updated === 1 ? "message" : "messages";
      changed(`${result.updated} ${noun} ${bulk === "read" ? "marked as read" : bulk === "unread" ? "marked as new" : "deleted"}.`);
    } catch (caught) {
      failed(caught);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageTitle title="Messages" />

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
            <input type="search" aria-label="Search messages" placeholder="Name, email, website or words in the message" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
            <button type="submit" className="btn">
              Search messages
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
        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onPage={(next) => update({ page: String(next) })} noun="messages" />
      </form>

      <div className={`table-wrap ${loading && data ? "loading-dim" : ""}`}>
        <table className="list">
          <thead>
            <tr>
              <th className="check">
                <input
                  type="checkbox"
                  aria-label="Select all messages on this page"
                  checked={allSelected}
                  onChange={(event) => setSelected(event.target.checked ? new Set(rows.map((row) => row.id)) : new Set())}
                />
              </th>
              <th>From</th>
              <th>Message</th>
              <th>Received</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">
                  {loading ? "Loading messages…" : status === "all" && !search ? "No messages yet. What visitors send through the “Leave a Reply” form under a blog article appears here." : "No messages found."}
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const website = safeWebsite(row.website);
              const title = articleTitle(row.postSlug);
              return (
                <tr key={row.id}>
                  <td className="check">
                    <input
                      type="checkbox"
                      aria-label={`Select the message from ${row.name}`}
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
                    <span className={row.isRead ? "" : "strong"} style={row.isRead ? undefined : { fontWeight: 700 }}>
                      {row.name}
                    </span>
                    <div className="muted" style={{ fontSize: 12, wordBreak: "break-all" }}>
                      {row.email}
                    </div>
                    {row.website && (
                      <div className="muted" style={{ fontSize: 12, wordBreak: "break-all" }}>
                        {website ? (
                          <a href={website} target="_blank" rel="noopener noreferrer nofollow">
                            {row.website}
                          </a>
                        ) : (
                          row.website
                        )}
                      </div>
                    )}
                    <div className="row-actions">
                      <span>
                        <a href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: ${title}`)}`}>Reply</a>
                      </span>
                      <span>
                        <button type="button" className="link-button" disabled={busy} onClick={() => setRead(row, !row.isRead)}>
                          {row.isRead ? "Mark as new" : "Mark as read"}
                        </button>
                      </span>
                      <span>
                        <button type="button" className="link-button danger" disabled={busy} onClick={() => remove(row)}>
                          Delete
                        </button>
                      </span>
                    </div>
                  </td>
                  <td className="review-cell">
                    <div className="review-text">{row.comment}</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      On{" "}
                      <a href={`/${row.postSlug}`} target="_blank" rel="noreferrer" className="strong">
                        {title}
                      </a>
                    </div>
                  </td>
                  <td title={formatDateTime(row.createdAt)}>{timeAgo(row.createdAt)}</td>
                  <td>
                    <span className={`badge ${row.isRead ? "completed" : "pending"}`}>{row.isRead ? "Read" : "New"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="toolbar">
        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onPage={(next) => update({ page: String(next) })} noun="messages" />
      </div>
    </div>
  );
}
