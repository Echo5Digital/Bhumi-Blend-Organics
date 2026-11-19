import { useState } from "react";
import { Link, useParams } from "react-router";
import { StatTile } from "../components/charts";
import { ErrorNotice, Loading, Notice, PageTitle, StatusBadge, useTitle } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDate, formatDateTime, money } from "../lib/format";
import type { Address, OrderStatus } from "../lib/types";
import { useApi } from "../lib/useApi";

type CustomerDetail = {
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    isActive: boolean;
    emailVerified: boolean;
    registeredAt?: string;
    lastLoginAt?: string;
    addresses: { shipping?: Address; billing?: Address };
  };
  stats: { orders: number; totalSpend: number; averageOrderValue: number };
  orders: { number: number; createdAt: string; status: OrderStatus; total: number; itemCount: number }[];
};

function AddressCard({ title, address }: { title: string; address?: Address }) {
  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{title}</h3>
      {address ? (
        <address style={{ fontStyle: "normal", lineHeight: 1.6 }}>
          {address.firstName} {address.lastName}
          <br />
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ""}
          <br />
          {address.city} {address.pin}, {address.state}
          <br />
          {address.phone}
        </address>
      ) : (
        <p className="hint" style={{ marginTop: 0 }}>Not set up.</p>
      )}
    </div>
  );
}

export function CustomerPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const { data, error, loading, reload } = useApi<CustomerDetail>(`/admin/customers/${encodeURIComponent(id ?? "")}`);
  const customer = data?.customer;
  useTitle(customer?.displayName ?? "Customer");
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function setActive(isActive: boolean) {
    if (!isActive && !window.confirm("Switch this account off? They won't be able to log in. Their orders stay.")) return;
    try {
      await api(`/admin/customers/${id}`, { method: "PATCH", token, body: { isActive } });
      setMessage({ kind: "success", text: isActive ? "Account switched back on." : "Account switched off." });
      reload();
    } catch (caught) {
      setMessage({ kind: "error", text: caught instanceof ApiError ? caught.message : "Something went wrong." });
    }
  }

  if (!data || !customer) {
    return (
      <div className="page">
        <PageTitle title="Customer" />
        <ErrorNotice error={error} />
        {loading && <Loading />}
        <Link to="/customers">← All customers</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <PageTitle title={customer.displayName}>
        {!customer.isActive && <span className="badge failed">Account switched off</span>}
        <Link to="/customers" className="btn">
          ← All customers
        </Link>
      </PageTitle>
      {message && <Notice kind={message.kind} onDismiss={() => setMessage(null)}>{message.text}</Notice>}

      <div className="tiles">
        <StatTile label="Orders" value={data.stats.orders} />
        <StatTile label="Total spend" value={money(data.stats.totalSpend)} />
        <StatTile label="Average order value" value={money(data.stats.averageOrderValue)} />
      </div>

      <div className="grid-2 wide-side">
        <section className="card flush">
          <div className="card-head">
            <h2>Orders</h2>
          </div>
          <div className="table-wrap" style={{ border: 0, boxShadow: "none" }}>
            <table className="list">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      No orders from this account yet.
                    </td>
                  </tr>
                )}
                {data.orders.map((order) => (
                  <tr key={order.number}>
                    <td>
                      <Link to={`/orders/${order.number}`} className="strong">
                        #{order.number}
                      </Link>
                      <span className="muted"> · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}</span>
                    </td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="num">{money(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside>
          <section className="card">
            <div className="card-head">
              <h2>Account</h2>
            </div>
            <div className="body stack">
              <p style={{ margin: 0 }}>
                <a href={`mailto:${customer.email}`}>{customer.email}</a>
                <br />
                <span className="muted">{customer.emailVerified ? "Email verified" : "Email not verified"}</span>
              </p>
              <p style={{ margin: 0 }}>
                <strong>Registered:</strong> {formatDate(customer.registeredAt)}
                <br />
                <strong>Last login:</strong> {customer.lastLoginAt ? formatDateTime(customer.lastLoginAt) : "—"}
              </p>
              {customer.isActive ? (
                <button type="button" className="btn danger" onClick={() => setActive(false)}>
                  Switch account off
                </button>
              ) : (
                <button type="button" className="btn" onClick={() => setActive(true)}>
                  Switch account back on
                </button>
              )}
            </div>
          </section>
          <section className="card">
            <div className="body stack">
              <AddressCard title="Billing address" address={customer.addresses.billing} />
              <AddressCard title="Shipping address" address={customer.addresses.shipping} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
