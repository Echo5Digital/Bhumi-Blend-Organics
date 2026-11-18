import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { DonutChart, LineChart, StatTile, type Slice } from "../components/charts";
import { ErrorNotice, Loading, StatusBadge, useTitle } from "../components/ui";
import { ORDER_STATUS_LABELS, addDays, count, formatPoint, money, moneyShort, timeAgo, toDayString } from "../lib/format";
import type { Category, OrderList, OrderStatus, ProductList, SalesReport, StockReport } from "../lib/types";
import { useApi } from "../lib/useApi";

function Chevron() {
  return (
    <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A collapsible card with a count: the Orders and Stock lists at the bottom of the dashboard. */
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

// ---- the headline cards ---------------------------------------------------------

const ICONS: Record<string, ReactNode> = {
  rupee: <path d="M7 5h10M7 9.5h10M7 5c5.5 0 7 2.3 7 4.5s-1.5 4.5-7 4.5l6.5 5.5" />,
  cart: (
    <>
      <path d="M3 4h2.2l2.3 11h10.3l1.9-7.5H6.4" />
      <circle cx="9.5" cy="19.5" r="1.2" />
      <circle cx="17" cy="19.5" r="1.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  alert: <path d="M12 3.5l9.5 16.5h-19L12 3.5zM12 10v4.5M12 17.4h.01" />,
  box: <path d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3zM3 7.5l9 4.5 9-4.5M12 12v9" />,
  grid: <path d="M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z" />,
};

function Kpi({ to, value, label, icon, tone }: { to: string; value: ReactNode; label: string; icon: keyof typeof ICONS; tone?: "alert" | "calm" }) {
  return (
    <Link to={to} className="kpi">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
      <span className={`icon-chip ${tone ?? ""}`} aria-hidden="true">
        <svg viewBox="0 0 24 24">{ICONS[icon]}</svg>
      </span>
    </Link>
  );
}

// The colour belongs to the status, not to its size: "Processing" is gold whatever the counts.
// (Checked with the data-viz palette validator; the legend beside the ring carries every
// name and number, so colour is never the only clue.)
const STATUS_COLORS: [OrderStatus, string][] = [
  ["processing", "#ce8e22"],
  ["shipped", "#2a78d6"],
  ["completed", "#008300"],
  ["failed", "#e34948"],
  ["pending", "#6250d6"],
  ["cancelled", "#e87ba4"],
  ["refunded", "#1baf7a"],
];

// The dashboard: today's figures, the last two weeks of sales, how orders are spread over
// their statuses, then the orders waiting to be processed and the stock running out.
export function Home() {
  useTitle("Dashboard");
  const today = toDayString(new Date());
  const from = addDays(today, -13);
  const trend = useApi<SalesReport>(`/admin/reports/sales?from=${from}&to=${today}`);
  const month = useApi<SalesReport>("/admin/reports/sales");
  const processing = useApi<OrderList>("/admin/orders?status=processing&limit=5&sort=date&dir=asc");
  const stock = useApi<StockReport>("/admin/reports/stock");
  const products = useApi<ProductList>("/admin/products?limit=1");
  const categories = useApi<{ items: Category[] }>("/admin/categories");

  const todayRow = trend.data?.series.find((row) => row.date === today);
  const waiting = processing.data?.counts.processing ?? 0;
  const lowOrOut = (stock.data?.low.length ?? 0) + (stock.data?.out.length ?? 0);
  const dots = "…";

  const counts = processing.data?.counts;
  const slices: Slice[] = counts ? STATUS_COLORS.filter(([status]) => counts[status] > 0).map(([status, color]) => ({ key: status, name: ORDER_STATUS_LABELS[status] ?? status, value: counts[status], color })) : [];
  const orderTotal = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="page">
      <div className="page-title">
        <h1>Dashboard</h1>
      </div>
      <ErrorNotice error={trend.error ?? month.error ?? processing.error ?? stock.error ?? products.error ?? categories.error} />

      <div className="kpis">
        <Kpi to="/reports" icon="rupee" value={trend.data ? money(todayRow?.grossSales ?? 0) : dots} label="Sales Today" />
        <Kpi to="/orders" icon="cart" value={trend.data ? count(todayRow?.orders ?? 0) : dots} label="Orders Today" />
        <Kpi to="/orders?status=processing" icon="clock" value={processing.data ? count(waiting) : dots} label="Waiting to Process" />
        <Kpi to="/reports?tab=stock" icon="alert" tone={lowOrOut > 0 ? "alert" : "calm"} value={stock.data ? count(lowOrOut) : dots} label="Low Stock" />
        <Kpi to="/products" icon="box" tone="calm" value={products.data ? count(products.data.counts.active) : dots} label="Active Products" />
        <Kpi to="/products/categories" icon="grid" tone="calm" value={categories.data ? count(categories.data.items.length) : dots} label="Categories" />
      </div>

      <div className="dash-row">
        <section className="chart-card">
          <h2>Sales Trend</h2>
          <p className="sub">Last 14 days</p>
          {trend.data ? (
            <LineChart
              smooth
              height={390}
              points={trend.data.series.map((row) => ({ key: row.date, label: formatPoint(row.date), value: row.grossSales }))}
              seriesName="Sales"
              format={money}
              formatAxis={moneyShort}
              emptyMax={1000}
            />
          ) : (
            <Loading />
          )}
        </section>

        <section className="chart-card">
          <h2>Orders by Status</h2>
          <p className="sub">All-time</p>
          {!counts ? (
            <Loading />
          ) : orderTotal === 0 ? (
            <p className="hint">No orders yet.</p>
          ) : (
            <DonutChart slices={slices} total={orderTotal} centerLabel={orderTotal === 1 ? "order" : "orders"} formatValue={count} />
          )}
        </section>
      </div>

      <h2 className="dash-heading">This month so far</h2>
      <div className="tiles">
        <StatTile label="Gross sales" value={month.data ? money(month.data.summary.grossSales) : dots} />
        <StatTile label="Net sales" value={month.data ? money(month.data.summary.netSales) : dots} note="after coupons and refunds" />
        <StatTile label="Orders" value={month.data ? count(month.data.summary.orders) : dots} />
        <StatTile label="Items sold" value={month.data ? count(month.data.summary.items) : dots} />
      </div>

      <div className="dash-row halves">
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

        <Panel title="Stock" count={lowOrOut} defaultOpen={lowOrOut > 0}>
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
