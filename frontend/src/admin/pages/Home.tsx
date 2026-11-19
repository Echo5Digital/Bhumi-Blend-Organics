import type { ReactNode } from "react";
import { Link } from "react-router";
import { DayBars, Meter } from "../components/dashboard";
import { ErrorNotice, Loading, StatusBadge, useTitle } from "../components/ui";
import { addDays, count, formatPoint, money, moneyShort, timeAgo, toDayString } from "../lib/format";
import type { OrderList, OrderStatus, SalesReport, StockReport } from "../lib/types";
import { useApi } from "../lib/useApi";

// The stages an order walks through, left to right, and the ones that end it early.
const STAGES: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Pending payment" },
  { status: "processing", label: "Processing" },
  { status: "shipped", label: "Shipped" },
  { status: "completed", label: "Completed" },
];
const ENDED: { status: OrderStatus; label: string }[] = [
  { status: "cancelled", label: "Cancelled" },
  { status: "refunded", label: "Refunded" },
  { status: "failed", label: "Failed" },
];

type Ranked = { items: { slug: string; name: string; quantity: number; revenue: number }[] };

const todayLabel = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });
/** ₹1,198 for a whole-rupee amount, ₹1,198.50 when it has paise: the big figure stays short. */
const heroMoney = (value: number) => (Number.isInteger(value) ? moneyShort(value) : money(value));

function Card({ title, sub, action, className = "", children }: { title: string; sub?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`dx-card ${className}`}>
      <header className="dx-card-head">
        <div>
          <h2>{title}</h2>
          {sub && <p>{sub}</p>}
        </div>
        {action && <div className="dx-card-action">{action}</div>}
      </header>
      {children}
    </section>
  );
}

// The dashboard: today and the last two weeks on top, the month so far underneath, then where
// the orders are, what is running low, the latest orders and what sells best.
export function Home() {
  useTitle("Dashboard");
  const today = toDayString(new Date());
  const trend = useApi<SalesReport>(`/admin/reports/sales?from=${addDays(today, -13)}&to=${today}`);
  const month = useApi<SalesReport>("/admin/reports/sales");
  const orders = useApi<OrderList>("/admin/orders?limit=6");
  const stock = useApi<StockReport>("/admin/reports/stock");
  const best = useApi<Ranked>("/admin/reports/products");

  const dots = "…";
  const todayRow = trend.data?.series.find((row) => row.date === today);
  const yesterdayRow = trend.data?.series.find((row) => row.date === addDays(today, -1));
  const todaySales = todayRow?.grossSales ?? 0;
  const yesterdaySales = yesterdayRow?.grossSales ?? 0;
  const counts = orders.data?.counts;
  const lowOrOut = (stock.data?.low.length ?? 0) + (stock.data?.out.length ?? 0);

  // today against yesterday: "▲ 12%" / "▼ 30%" (today is still in progress, so it starts below)
  let change: { dir: "up" | "down" | "flat"; text: string } = { dir: "flat", text: "No sales yet today" };
  if (yesterdaySales > 0) {
    const percent = Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);
    change = percent > 0 ? { dir: "up", text: `▲ ${percent}%` } : percent < 0 ? { dir: "down", text: `▼ ${Math.abs(percent)}%` } : { dir: "flat", text: "Same as yesterday" };
  } else if (todaySales > 0) {
    change = { dir: "up", text: "▲ No sales yesterday" };
  }

  const summary = month.data?.summary;
  const stockRows = [...(stock.data?.out ?? []).map((item) => ({ ...item, out: true })), ...(stock.data?.low ?? []).map((item) => ({ ...item, out: false }))].slice(0, 6);
  const sellers = (best.data?.items ?? []).slice(0, 5);
  const topRevenue = sellers[0]?.revenue ?? 0;

  return (
    <div className="page dx">
      <div className="page-title">
        <h1>Dashboard</h1>
      </div>
      <ErrorNotice error={trend.error ?? month.error ?? orders.error ?? stock.error ?? best.error} />

      {/* today + the last 14 days, and the month so far */}
      <section className="dx-hero">
        <div className="dx-hero-main">
          <div className="dx-today">
            <div className="dx-eyebrow">Today · {todayLabel.format(new Date())}</div>
            <div className="dx-figure">{trend.data ? heroMoney(todaySales) : dots}</div>
            {trend.data && (
              <div className="dx-delta">
                <span className={`dx-chip ${change.dir}`}>{change.text}</span>
                <span>Yesterday {money(yesterdaySales)}</span>
              </div>
            )}
            <div className="dx-trio">
              <Link to="/orders">
                <strong>{trend.data ? count(todayRow?.orders ?? 0) : dots}</strong>
                <span>Orders today</span>
              </Link>
              <Link to="/orders?status=processing">
                <strong>{counts ? count(counts.processing) : dots}</strong>
                <span>To process</span>
              </Link>
              <Link to="/reports?tab=stock">
                <strong>{stock.data ? count(lowOrOut) : dots}</strong>
                <span>Low stock</span>
              </Link>
            </div>
          </div>

          <div className="dx-trend">
            <div className="dx-trend-head">
              <h2>Last 14 days</h2>
              <p>Sales per day</p>
            </div>
            {trend.data ? (
              <DayBars
                seriesName="Sales"
                format={money}
                formatAxis={moneyShort}
                points={trend.data.series.map((row) => ({ key: row.date, label: formatPoint(row.date), value: row.grossSales, note: `${count(row.orders)} ${row.orders === 1 ? "order" : "orders"}` }))}
              />
            ) : (
              <Loading />
            )}
          </div>
        </div>

        <div className="dx-month">
          <div className="dx-month-title">This month</div>
          <div className="dx-stat">
            <span>Gross sales</span>
            <strong>{summary ? money(summary.grossSales) : dots}</strong>
          </div>
          <div className="dx-stat" title="After coupons and refunds">
            <span>Net sales</span>
            <strong>{summary ? money(summary.netSales) : dots}</strong>
          </div>
          <div className="dx-stat">
            <span>Orders</span>
            <strong>{summary ? count(summary.orders) : dots}</strong>
          </div>
          <div className="dx-stat">
            <span>Items sold</span>
            <strong>{summary ? count(summary.items) : dots}</strong>
          </div>
          <div className="dx-stat">
            <span>Average order</span>
            <strong>{summary ? (summary.orders > 0 ? money(summary.grossSales / summary.orders) : "—") : dots}</strong>
          </div>
        </div>
      </section>

      <div className="dx-row dx-row-a">
        <Card title="Order pipeline" sub="Every order, by where it is now" action={<Link to="/orders">All orders{counts ? ` (${count(counts.all)})` : ""}</Link>}>
          {!counts ? (
            <Loading />
          ) : (
            <>
              <div className="dx-stages">
                {STAGES.map(({ status, label }) => (
                  <Link key={status} to={`/orders?status=${status}`} className="dx-stage">
                    <strong>{count(counts[status])}</strong>
                    <span>{label}</span>
                    <Meter value={counts[status]} of={counts.all} label={`${label}: ${counts[status]} of ${counts.all} orders`} />
                  </Link>
                ))}
              </div>
              <div className="dx-ended">
                {ENDED.map(({ status, label }) => (
                  <Link key={status} to={`/orders?status=${status}`}>
                    {label} <strong>{count(counts[status])}</strong>
                  </Link>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card title="Stock watch" sub={stock.data ? `Low means ${count(stock.data.lowStockThreshold)} or fewer` : undefined} action={<Link to="/reports?tab=stock">Stock report</Link>}>
          {!stock.data ? (
            <Loading />
          ) : stockRows.length === 0 ? (
            <p className="dx-empty">Nothing is low or out of stock{stock.data.productsWithStockCount === 0 ? " (no product counts its stock yet — set a quantity on a product to track it)" : ""}.</p>
          ) : (
            <ul className="dx-list">
              {stockRows.map((item) => (
                <li key={item.slug}>
                  <div className="grow">
                    <Link to={`/products?search=${encodeURIComponent(item.name)}`}>{item.name}</Link>
                    <Meter value={item.stockQuantity ?? 0} of={stock.data!.lowStockThreshold} label={`${item.name}: ${item.stockQuantity ?? 0} left`} />
                  </div>
                  {item.out ? <span className="dx-flag">Out</span> : null}
                  <strong>{item.stockQuantity ?? 0}</strong>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="dx-row dx-row-b">
        <Card title="Latest orders" action={<Link to="/orders">View all</Link>}>
          {!orders.data ? (
            <Loading />
          ) : orders.data.items.length === 0 ? (
            <p className="dx-empty">No orders yet.</p>
          ) : (
            <ul className="dx-list dx-orders">
              {orders.data.items.map((order) => (
                <li key={order.number}>
                  <div className="grow">
                    <Link to={`/orders/${order.number}`}>
                      #{order.number} {order.customerName}
                    </Link>
                    <span className="dx-sub">
                      {timeAgo(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <StatusBadge status={order.status} />
                  <strong>{money(order.total)}</strong>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Best sellers" sub="This month, by sales" action={<Link to="/reports">Reports</Link>}>
          {!best.data ? (
            <Loading />
          ) : sellers.length === 0 ? (
            <p className="dx-empty">No sales yet this month.</p>
          ) : (
            <ol className="dx-list dx-sellers">
              {sellers.map((item, index) => (
                <li key={item.slug}>
                  <span className="dx-rank">{index + 1}</span>
                  <div className="grow">
                    <Link to={`/products?search=${encodeURIComponent(item.name)}`}>{item.name}</Link>
                    <Meter value={item.revenue} of={topRevenue} label={`${item.name}: ${money(item.revenue)}`} />
                  </div>
                  <div className="dx-amount">
                    <strong>{money(item.revenue)}</strong>
                    <span className="dx-sub">{count(item.quantity)} sold</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
