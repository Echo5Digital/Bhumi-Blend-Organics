import { useState } from "react";
import { Link } from "react-router";
import { StatTile } from "../components/charts";
import { ErrorNotice, Loading, StatusBadge, useTitle } from "../components/ui";
import { count, money, timeAgo } from "../lib/format";
import type { OrderList, SalesReport, StockReport } from "../lib/types";
import { useApi } from "../lib/useApi";

function Chevron() {
  return (
    <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A collapsible card with a count, like the Orders / Stock panels on WooCommerce Home. */
function Panel({ title, count: total, defaultOpen = false, children }: { title: string; count: number; defaultOpen?: boolean; children: React.ReactNode }) {
  // Open or shut by default depending on the data (which arrives after the first draw),
  // until the visitor clicks it: then their choice wins.
  const [chosen, setChosen] = useState<boolean | null>(null);
  const open = chosen ?? defaultOpen;
  return (
    <section className="panel">
      <button type="button" className="panel-head" aria-expanded={open} onClick={() => setChosen(!open)}>
        <span>{title}</span>
        <span className="pill">{total}</span>
        <Chevron />
      </button>
      {open && <div className="panel-body">{children}</div>}
    </section>
  );
}

// WooCommerce → Home: what needs doing today. The month's figures on top, then
// orders waiting to be processed and stock running out.
export function Home() {
  useTitle("Dashboard");
  const sales = useApi<SalesReport>("/admin/reports/sales");
  const processing = useApi<OrderList>("/admin/orders?status=processing&limit=5&sort=date&dir=asc");
  const stock = useApi<StockReport>("/admin/reports/stock");

  const waiting = processing.data?.counts.processing ?? 0;
  const lowOrOut = (stock.data?.low.length ?? 0) + (stock.data?.out.length ?? 0);

  return (
    <div className="has-appbar">
      <div className="appbar">
        <h1>Home</h1>
      </div>
      <div className="page" style={{ maxWidth: 760, margin: "0 auto" }}>
        <ErrorNotice error={sales.error ?? processing.error ?? stock.error} />

        <h2 style={{ margin: "4px 0 10px", fontSize: 14, fontWeight: 600 }}>This month so far</h2>
        <div className="tiles">
          <StatTile label="Gross sales" value={sales.data ? money(sales.data.summary.grossSales) : "…"} />
          <StatTile label="Net sales" value={sales.data ? money(sales.data.summary.netSales) : "…"} note="after coupons and refunds" />
          <StatTile label="Orders" value={sales.data ? count(sales.data.summary.orders) : "…"} />
          <StatTile label="Items sold" value={sales.data ? count(sales.data.summary.items) : "…"} />
        </div>

        <Panel title="Orders" count={waiting} defaultOpen={waiting > 0}>
          {processing.loading && !processing.data ? (
            <Loading />
          ) : (processing.data?.items.length ?? 0) === 0 ? (
            <div className="panel-row">
              <span className="sub">No orders are waiting to be processed.</span>
            </div>
          ) : (
            <>
              {processing.data!.items.map((order) => (
                <div className="panel-row" key={order.number}>
                  <div className="grow">
                    <div className="title">
                      <Link to={`/orders/${order.number}`}>
                        #{order.number} {order.customerName}
                      </Link>
                    </div>
                    <div className="sub">
                      {timeAgo(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                  <strong>{money(order.total)}</strong>
                </div>
              ))}
              <div className="panel-foot">
                <Link to="/orders?status=processing">View all processing orders</Link>
              </div>
            </>
          )}
        </Panel>

        <Panel title="Stock" count={lowOrOut}>
          {lowOrOut === 0 ? (
            <div className="panel-row">
              <span className="sub">Nothing is low or out of stock{stock.data && stock.data.productsWithStockCount === 0 ? " (no product counts its stock yet — set a quantity on a product to track it)" : ""}.</span>
            </div>
          ) : (
            <>
              {[...(stock.data?.out ?? []).map((item) => ({ ...item, kind: "Out of stock" })), ...(stock.data?.low ?? []).map((item) => ({ ...item, kind: "Low in stock" }))].map((item) => (
                <div className="panel-row" key={`${item.kind}-${item.slug}`}>
                  <div className="grow">
                    <div className="title">
                      <Link to={`/products?search=${encodeURIComponent(item.name)}`}>{item.name}</Link>
                    </div>
                    <div className="sub">{item.kind}</div>
                  </div>
                  <strong>{item.stockQuantity ?? 0}</strong>
                </div>
              ))}
              <div className="panel-foot">
                <Link to="/reports?tab=stock">See the stock report</Link>
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
