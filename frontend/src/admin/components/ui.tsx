import { useEffect, type ReactNode } from "react";
import { ApiError } from "../lib/api";
import { ORDER_STATUS_LABELS, count } from "../lib/format";
import type { OrderStatus } from "../lib/types";

/** Sets the browser tab title: "Orders ‹ Bhumi Blend Admin". */
export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} ‹ Bhumi Blend Admin`;
  }, [title]);
}

type NoticeKind = "success" | "error" | "warning" | "info";

export function Notice({ kind = "info", children, onDismiss }: { kind?: NoticeKind; children: ReactNode; onDismiss?: () => void }) {
  return (
    <div className={`notice ${kind === "info" ? "" : kind}`} role={kind === "error" ? "alert" : "status"}>
      <p>
        {children}
        {onDismiss && (
          <>
            {" "}
            <button type="button" className="link-button" onClick={onDismiss}>
              Dismiss
            </button>
          </>
        )}
      </p>
    </div>
  );
}

/** Shows what went wrong loading something (nothing when there's no error). */
export function ErrorNotice({ error }: { error: ApiError | undefined }) {
  if (!error) return null;
  return <Notice kind="error">{error.message}</Notice>;
}

export function Loading({ text = "Loading…" }: { text?: string }) {
  return <div className="spinner-line">{text}</div>;
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge ${status}`}>{ORDER_STATUS_LABELS[status] ?? status}</span>;
}

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="page-title">
      <h1>{title}</h1>
      {children}
    </div>
  );
}

/** "20 items  « ‹ 1 of 3 › »" */
export function Pagination({ page, pages, total, onPage, noun = "items" }: { page: number; pages: number; total: number; onPage: (page: number) => void; noun?: string }) {
  return (
    <div className="pagination">
      <span className="displaying">
        {count(total)} {total === 1 ? noun.replace(/s$/, "") : noun}
      </span>
      {pages > 1 && (
        <>
          <button type="button" className="btn" aria-label="First page" disabled={page <= 1} onClick={() => onPage(1)}>
            «
          </button>
          <button type="button" className="btn" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            ‹
          </button>
          <span className="current-page">
            {page} of {pages}
          </span>
          <button type="button" className="btn" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}>
            ›
          </button>
          <button type="button" className="btn" aria-label="Last page" disabled={page >= pages} onClick={() => onPage(pages)}>
            »
          </button>
        </>
      )}
    </div>
  );
}

/** A sortable column heading for list tables. */
export function SortHeader({
  label,
  field,
  sort,
  dir,
  onSort,
  className,
}: {
  label: string;
  field: string;
  sort: string;
  dir: "asc" | "desc";
  onSort: (field: string) => void;
  className?: string;
}) {
  const active = sort === field;
  return (
    <th className={className} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(field)}>
        {label}
        <span aria-hidden="true">{active ? (dir === "asc" ? " ▲" : " ▼") : ""}</span>
      </button>
    </th>
  );
}

/** Field with a label and an optional error line (error text sits under the field). */
export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
