import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ErrorNotice, Notice, PageTitle, Pagination, useTitle } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDate, money } from "../lib/format";
import type { Coupon, Paged } from "../lib/types";
import { useApi } from "../lib/useApi";

export function couponStatus(coupon: Coupon): { label: string; className: string } {
  if (!coupon.isActive) return { label: "Disabled", className: "cancelled" };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { label: "Expired", className: "cancelled" };
  if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) return { label: "Not started", className: "pending" };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { label: "Used up", className: "cancelled" };
  return { label: "Active", className: "processing" };
}

export const couponAmount = (coupon: Pick<Coupon, "type" | "value">) => (coupon.type === "percent" ? `${coupon.value}%` : money(coupon.value));

export function Coupons() {
  useTitle("Coupons");
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const { data, error, loading, reload } = useApi<Paged<Coupon>>(`/admin/coupons?page=${page}&limit=20`);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function remove(coupon: Coupon) {
    if (!window.confirm(`Delete the coupon ${coupon.code}?`)) return;
    try {
      await api(`/admin/coupons/${coupon.id}`, { method: "DELETE", token });
      setMessage({ kind: "success", text: `${coupon.code} deleted.` });
      reload();
    } catch (caught) {
      setMessage({ kind: "error", text: caught instanceof ApiError ? caught.message : "Something went wrong." });
    }
  }

  return (
    <div className="page">
      <PageTitle title="Coupons">
        <Link to="/coupons/new" className="btn">
          Add coupon
        </Link>
      </PageTitle>
      {message && <Notice kind={message.kind} onDismiss={() => setMessage(null)}>{message.text}</Notice>}
      <ErrorNotice error={error} />

      <div className="toolbar">
        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onPage={(next) => setParams({ page: String(next) })} />
      </div>

      <div className={`table-wrap ${loading && data ? "loading-dim" : ""}`}>
        <table className="list">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Description</th>
              <th className="num">Usage / limit</th>
              <th>Expiry date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  {loading ? "Loading coupons…" : "No coupons yet. Add one with the button above."}
                </td>
              </tr>
            )}
            {data?.items.map((coupon) => {
              const status = couponStatus(coupon);
              return (
                <tr key={coupon.id}>
                  <td>
                    <Link to={`/coupons/${coupon.id}`} className="strong">
                      {coupon.code}
                    </Link>
                    <div className="row-actions">
                      <span>
                        <Link to={`/coupons/${coupon.id}`}>Edit</Link>
                      </span>
                      <span>
                        <button type="button" className="link-button danger" onClick={() => remove(coupon)}>
                          Delete
                        </button>
                      </span>
                    </div>
                  </td>
                  <td>
                    {couponAmount(coupon)} {coupon.type === "percent" ? "off" : "off the cart"}
                    {coupon.minSubtotal > 0 && <div className="muted" style={{ fontSize: 12 }}>on orders of {money(coupon.minSubtotal)}+</div>}
                  </td>
                  <td>{coupon.description ?? "–"}</td>
                  <td className="num">
                    {coupon.usedCount} / {coupon.usageLimit ?? "∞"}
                  </td>
                  <td>{coupon.expiresAt ? formatDate(coupon.expiresAt) : "–"}</td>
                  <td>
                    <span className={`badge ${status.className}`}>{status.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
