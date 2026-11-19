import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { ErrorNotice, Loading, Notice, PageTitle, StatusBadge, useTitle } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { ORDER_STATUS_LABELS, formatDateTime, money } from "../lib/format";
import type { Address, OrderDetail, OrderStatus, TargetStatus } from "../lib/types";
import { useApi } from "../lib/useApi";

const TARGETS: TargetStatus[] = ["processing", "shipped", "completed", "cancelled", "refunded"];

/** Which statuses make sense from here (the backend enforces the same rules). */
function allowed(current: OrderStatus): TargetStatus[] {
  if (current === "cancelled" || current === "refunded") return [];
  if (current === "pending" || current === "failed") return ["cancelled"];
  return TARGETS;
}

function AddressBlock({ address, email }: { address: Address; email?: string }) {
  return (
    <address>
      {address.firstName} {address.lastName}
      <br />
      {address.line1}
      {address.line2 && (
        <>
          <br />
          {address.line2}
        </>
      )}
      <br />
      {address.city} {address.pin}
      <br />
      {address.state}, {address.country}
      <br />
      <strong>Phone:</strong> <a href={`tel:${address.phone}`}>{address.phone}</a>
      {email && (
        <>
          <br />
          <strong>Email:</strong> <a href={`mailto:${email}`}>{email}</a>
        </>
      )}
    </address>
  );
}

export function OrderPage() {
  const { number } = useParams();
  // `key` makes the page start afresh when you go from one order to another.
  return <OrderView key={number} number={number ?? ""} />;
}

function OrderView({ number }: { number: string }) {
  const { token } = useAuth();
  const { data, error, loading } = useApi<{ order: OrderDetail }>(`/admin/orders/${encodeURIComponent(number)}`);
  const [fresh, setFresh] = useState<OrderDetail | null>(null);
  const order = fresh ?? data?.order;
  useTitle(order ? `Order #${order.number}` : "Order");

  const [status, setStatus] = useState<TargetStatus | "">("");
  const [carrier, setCarrier] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteForCustomer, setNoteForCustomer] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run<T>(action: () => Promise<T>, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage({ kind: "success", text: success });
    } catch (caught) {
      setMessage({ kind: "error", text: caught instanceof ApiError ? caught.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  if (!order) {
    return (
      <div className="page">
        <PageTitle title={`Order #${number}`} />
        <ErrorNotice error={error} />
        {loading && <Loading />}
        <Link to="/orders">← Back to orders</Link>
      </div>
    );
  }

  const options = allowed(order.status);
  const trackingCarrier = carrier ?? order.tracking?.carrier ?? "";
  const trackingValue = trackingNumber ?? order.tracking?.trackingNumber ?? "";

  const patch = async (body: object) => {
    const result = await api<{ order: OrderDetail }>(`/admin/orders/${order.number}`, { method: "PATCH", token, body });
    setFresh(result.order);
    return result;
  };

  const updateStatus = (event: FormEvent) => {
    event.preventDefault();
    if (!status) return;
    void run(async () => {
      await patch({ status });
      setStatus("");
    }, `Order status changed to ${ORDER_STATUS_LABELS[status]}.`);
  };

  const saveTracking = (event: FormEvent) => {
    event.preventDefault();
    if (!trackingValue.trim()) return;
    void run(async () => {
      await patch({ tracking: { carrier: trackingCarrier.trim() || undefined, trackingNumber: trackingValue.trim() } });
      setCarrier(null);
      setTrackingNumber(null);
    }, "Tracking saved.");
  };

  const addNote = (event: FormEvent) => {
    event.preventDefault();
    if (!noteText.trim()) return;
    void run(async () => {
      const result = await api<{ order: OrderDetail }>(`/admin/orders/${order.number}/notes`, { method: "POST", token, body: { text: noteText.trim(), customerNote: noteForCustomer } });
      setFresh(result.order);
      setNoteText("");
    }, "Note added.");
  };

  const deleteNote = (noteId: string) => {
    if (!window.confirm("Delete this note?")) return;
    void run(async () => {
      const result = await api<{ order: OrderDetail }>(`/admin/orders/${order.number}/notes/${noteId}`, { method: "DELETE", token });
      setFresh(result.order);
    }, "Note deleted.");
  };

  return (
    <div className="page">
      <PageTitle title={`Order #${order.number} details`}>
        <StatusBadge status={order.status} />
        <Link to="/orders" className="btn">
          ← All orders
        </Link>
      </PageTitle>

      {message && <Notice kind={message.kind} onDismiss={() => setMessage(null)}>{message.text}</Notice>}

      <div className="grid-2 wide-side">
        <div>
          <section className="card">
            <div className="card-head">
              <h2>General</h2>
            </div>
            <div className="body order-meta">
              <div>
                <h3>Order</h3>
                <p>
                  <strong>Date created:</strong>
                  <br />
                  {formatDateTime(order.createdAt)}
                </p>
                <p>
                  <strong>Payment:</strong>
                  <br />
                  {order.paymentMethod} through Razorpay
                  {order.paidAt ? <> · paid {formatDateTime(order.paidAt)}</> : " · not paid yet"}
                  {order.payment.razorpayPaymentId && (
                    <>
                      <br />
                      <span className="muted">Payment ID {order.payment.razorpayPaymentId}</span>
                    </>
                  )}
                  {order.payment.lastError && (
                    <>
                      <br />
                      <span style={{ color: "#000", fontWeight: 600 }}>Last attempt failed: {order.payment.lastError}</span>
                    </>
                  )}
                </p>
                <form onSubmit={updateStatus}>
                  <label className="label" htmlFor="order-status">
                    Status
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select id="order-status" value={status} onChange={(event) => setStatus(event.target.value as TargetStatus)} disabled={options.length === 0}>
                      <option value="">{ORDER_STATUS_LABELS[order.status]} (current)</option>
                      {options
                        .filter((target) => target !== order.status)
                        .map((target) => (
                          <option key={target} value={target}>
                            {ORDER_STATUS_LABELS[target]}
                          </option>
                        ))}
                    </select>
                    <button type="submit" className="btn primary" disabled={busy || !status}>
                      Update
                    </button>
                  </div>
                  {options.length === 0 && <p className="hint">A {order.status} order can't be changed any more.</p>}
                  {options.length > 0 && order.paymentStatus !== "paid" && <p className="hint">Not paid yet, so it can only be cancelled.</p>}
                  {(status === "cancelled" || status === "refunded") && order.stockReduced && <p className="hint">The items will go back into stock.</p>}
                  {status === "refunded" && <p className="hint">This only records the refund. Send the money back from the Razorpay dashboard.</p>}
                </form>
              </div>

              <div>
                <h3>Customer</h3>
                <p>
                  {order.customerId ? <Link to={`/customers/${order.customerId}`}>{order.shipping.firstName} {order.shipping.lastName}</Link> : <>{order.shipping.firstName} {order.shipping.lastName} <span className="muted">(guest)</span></>}
                  <br />
                  <a href={`mailto:${order.email}`}>{order.email}</a>
                </p>
                {order.note && (
                  <p>
                    <strong>Note from the customer:</strong>
                    <br />
                    {order.note}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="body order-meta">
              <div>
                <h3>Billing</h3>
                <AddressBlock address={order.billing} email={order.email} />
                {order.billingSameAsShipping && <p className="hint">Same as the shipping address.</p>}
              </div>
              <div>
                <h3>Shipping</h3>
                <AddressBlock address={order.shipping} />
              </div>
            </div>
          </section>

          <section className="card flush">
            <div className="body">
              <table className="items">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num">Cost</th>
                    <th className="num">Qty</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.slug}>
                      <td>
                        <strong>{item.name}</strong>
                        {item.size && <div className="muted">{item.size}</div>}
                      </td>
                      <td className="num">
                        {item.regularPrice && item.regularPrice > item.unitPrice && <del className="muted">{money(item.regularPrice)} </del>}
                        {money(item.unitPrice)}
                      </td>
                      <td className="num">× {item.qty}</td>
                      <td className="num">{money(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="totals">
                <div>
                  <span>Items subtotal:</span>
                  <span>{money(order.subtotal)}</span>
                </div>
                {order.discountTotal > 0 && (
                  <div>
                    <span>Coupon{order.coupon ? ` (${order.coupon.code})` : ""}:</span>
                    <span>−{money(order.discountTotal)}</span>
                  </div>
                )}
                <div>
                  <span>Shipping:</span>
                  <span>{order.shippingTotal > 0 ? money(order.shippingTotal) : "Free"}</span>
                </div>
                <div className="grand">
                  <span>Order total:</span>
                  <span>{money(order.total)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Shipping &amp; tracking</h2>
            </div>
            <form className="body field-grid" onSubmit={saveTracking}>
              <div>
                <label className="label" htmlFor="carrier">
                  Courier
                </label>
                <input id="carrier" type="text" placeholder="e.g. India Post" value={trackingCarrier} onChange={(event) => setCarrier(event.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="tracking">
                  Tracking number
                </label>
                <input id="tracking" type="text" value={trackingValue} onChange={(event) => setTrackingNumber(event.target.value)} />
              </div>
              <div className="full">
                <button type="submit" className="btn" disabled={busy || !trackingValue.trim()}>
                  Save tracking
                </button>
                {order.tracking?.shippedAt && <span className="hint" style={{ marginLeft: 10 }}>Shipped {formatDateTime(order.tracking.shippedAt)}. The customer sees the tracking number on their order.</span>}
              </div>
            </form>
          </section>
        </div>

        <aside>
          <section className="card">
            <div className="card-head">
              <h2>Order notes</h2>
            </div>
            <div className="body">
              <ul className="notes">
                {[...order.notes].reverse().map((note) => (
                  <li key={note.id} className={note.customerNote ? "customer" : note.author === "System" ? "system" : ""}>
                    <div className="text">{note.text}</div>
                    <div className="meta">
                      {formatDateTime(note.createdAt)} by {note.author}
                      {note.customerNote && " · customer can see this"}
                      {" · "}
                      <button type="button" className="link-button danger" onClick={() => deleteNote(note.id)}>
                        Delete note
                      </button>
                    </div>
                  </li>
                ))}
                {order.notes.length === 0 && <li className="hint">There are no notes yet.</li>}
              </ul>

              <form onSubmit={addNote} className="stack" style={{ borderTop: "1px solid var(--card-border)", paddingTop: 12 }}>
                <label className="label" htmlFor="note">
                  Add note
                </label>
                <textarea id="note" rows={3} value={noteText} onChange={(event) => setNoteText(event.target.value)} />
                <div style={{ display: "flex", gap: 6 }}>
                  <select aria-label="Note type" value={noteForCustomer ? "customer" : "private"} onChange={(event) => setNoteForCustomer(event.target.value === "customer")}>
                    <option value="private">Private note</option>
                    <option value="customer">Note to customer</option>
                  </select>
                  <button type="submit" className="btn" disabled={busy || !noteText.trim()}>
                    Add
                  </button>
                </div>
              </form>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
