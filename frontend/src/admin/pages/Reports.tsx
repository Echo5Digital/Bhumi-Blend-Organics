import { useState } from "react";
import { Link, NavLink, useSearchParams } from "react-router";
import { LineChart, RankedBars, StatTile } from "../components/charts";
import { DateRange, presets, type Range } from "../components/DateRange";
import { ErrorNotice, Loading, PageTitle, useTitle } from "../components/ui";
import { downloadCsv } from "../lib/csv";
import { count, formatPoint, money, moneyShort } from "../lib/format";
import type { SalesReport, StockItem, StockReport } from "../lib/types";
import { useApi } from "../lib/useApi";

const rangeQuery = (range: Range) => `from=${range.from}&to=${range.to}`;
const rangeLabel = (range: Range) => (range.from === range.to ? formatPoint(range.from) : `${formatPoint(range.from)} – ${formatPoint(range.to)}`);

// ---- Sales by date ---------------------------------------------------------

type Metric = "grossSales" | "netSales" | "orders";
const METRICS: { key: Metric; label: string }[] = [
  { key: "grossSales", label: "Gross sales" },
  { key: "netSales", label: "Net sales" },
  { key: "orders", label: "Orders" },
];

function SalesByDate({ range }: { range: Range }) {
  const { data, error, loading } = useApi<SalesReport>(`/admin/reports/sales?${rangeQuery(range)}`);
  const [metric, setMetric] = useState<Metric>("grossSales");
  const summary = data?.summary;
  const label = METRICS.find((item) => item.key === metric)!.label;
  const isMoney = metric !== "orders";

  return (
    <div className={loading && data ? "loading-dim" : ""}>
      <ErrorNotice error={error} />
      {!data && !error && <Loading />}
      {data && summary && (
        <>
          <div className="tiles">
            <StatTile label="Gross sales" value={money(summary.grossSales)} note={`${money(summary.averageGrossPerDay)} a day on average`} />
            <StatTile label="Net sales" value={money(summary.netSales)} note="after coupons and refunds" />
            <StatTile label="Orders placed" value={count(summary.orders)} note={`${summary.averageOrdersPerDay} a day on average`} />
            <StatTile label="Items purchased" value={count(summary.items)} />
            <StatTile label="Refunded" value={money(summary.refunds.amount)} note={`${summary.refunds.count} ${summary.refunds.count === 1 ? "order" : "orders"}`} />
            <StatTile label="Charged for shipping" value={money(summary.shipping)} />
            <StatTile label="Worth of coupons used" value={money(summary.couponDiscounts)} />
          </div>

          <section className="chart-card">
            <div className="chart-head">
              <div>
                <h2>
                  {label} by {data.groupBy}
                </h2>
                <p className="sub">{rangeLabel(range)}</p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div className="segmented" role="group" aria-label="What to chart">
                  {METRICS.map((item) => (
                    <button key={item.key} type="button" aria-pressed={metric === item.key} onClick={() => setMetric(item.key)}>
                      {item.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => downloadCsv(`sales-${range.from}-to-${range.to}.csv`, ["Date", "Gross sales", "Net sales", "Orders"], data.series.map((point) => [point.date, point.grossSales, point.netSales, point.orders]))}
                >
                  Export CSV
                </button>
              </div>
            </div>
            <LineChart
              points={data.series.map((point) => ({ key: point.date, label: formatPoint(point.date), value: point[metric] }))}
              seriesName={label}
              format={isMoney ? money : (value) => count(value)}
              formatAxis={isMoney ? moneyShort : (value) => count(value)}
              emptyMax={isMoney ? 1000 : 4}
            />
            {summary.orders === 0 && <p className="hint">No paid orders in this period.</p>}
          </section>
        </>
      )}
    </div>
  );
}

// ---- Sales by product / category ------------------------------------------

type RankedResponse = { items: { slug: string; name: string; quantity: number; revenue: number }[] };

function Ranked({ range, endpoint, title, sub }: { range: Range; endpoint: "products" | "categories"; title: string; sub: string }) {
  const { data, error, loading } = useApi<RankedResponse>(`/admin/reports/${endpoint}?${rangeQuery(range)}`);
  return (
    <div className={loading && data ? "loading-dim" : ""}>
      <ErrorNotice error={error} />
      {!data && !error && <Loading />}
      {data && (
        <section className="chart-card">
          <div className="chart-head">
            <div>
              <h2>{title}</h2>
              <p className="sub">
                {sub} · {rangeLabel(range)}
              </p>
            </div>
            <button type="button" className="btn" onClick={() => downloadCsv(`${endpoint}-${range.from}-to-${range.to}.csv`, ["Name", "Quantity sold", "Revenue"], data.items.map((row) => [row.name, row.quantity, row.revenue]))}>
              Export CSV
            </button>
          </div>
          <RankedBars
            rows={data.items.map((row) => ({ key: row.slug, name: row.name, value: row.revenue, figure: money(row.revenue), sub: `${count(row.quantity)} sold` }))}
            empty="No sales in this period."
          />
        </section>
      )}
    </div>
  );
}

// ---- Coupons ---------------------------------------------------------------

type CouponsResponse = { summary: { ordersWithCoupon: number; totalDiscount: number }; items: { code: string; orders: number; discount: number }[] };

function CouponsReport({ range }: { range: Range }) {
  const { data, error, loading } = useApi<CouponsResponse>(`/admin/reports/coupons?${rangeQuery(range)}`);
  return (
    <div className={loading && data ? "loading-dim" : ""}>
      <ErrorNotice error={error} />
      {!data && !error && <Loading />}
      {data && (
        <>
          <div className="tiles">
            <StatTile label="Worth of coupons used" value={money(data.summary.totalDiscount)} />
            <StatTile label="Orders using a coupon" value={count(data.summary.ordersWithCoupon)} />
          </div>
          <section className="chart-card">
            <h2>Discount given, by coupon</h2>
            <p className="sub">{rangeLabel(range)}</p>
            <RankedBars rows={data.items.map((row) => ({ key: row.code, name: row.code, value: row.discount, figure: money(row.discount), sub: `${row.orders} ${row.orders === 1 ? "order" : "orders"}` }))} empty="No coupons were used in this period." />
          </section>
        </>
      )}
    </div>
  );
}

// ---- Customers -------------------------------------------------------------

type CustomersResponse = {
  summary: { registeredCustomers: number; newCustomers: number; ordersFromAccounts: number; ordersFromGuests: number; revenueFromAccounts: number; revenueFromGuests: number };
  series: { date: string; newCustomers: number }[];
};

function CustomersReport({ range }: { range: Range }) {
  const { data, error, loading } = useApi<CustomersResponse>(`/admin/reports/customers?${rangeQuery(range)}`);
  const summary = data?.summary;
  return (
    <div className={loading && data ? "loading-dim" : ""}>
      <ErrorNotice error={error} />
      {!data && !error && <Loading />}
      {data && summary && (
        <>
          <div className="tiles">
            <StatTile label="Registered customers" value={count(summary.registeredCustomers)} note="in total" />
            <StatTile label="New sign-ups" value={count(summary.newCustomers)} note="in this period" />
            <StatTile label="Orders from accounts" value={count(summary.ordersFromAccounts)} note={money(summary.revenueFromAccounts)} />
            <StatTile label="Orders from guests" value={count(summary.ordersFromGuests)} note={money(summary.revenueFromGuests)} />
          </div>
          <section className="chart-card">
            <h2>New sign-ups by day</h2>
            <p className="sub">{rangeLabel(range)}</p>
            {data.series.length === 0 ? (
              <p className="hint">The daily chart is shown for ranges of up to three months.</p>
            ) : (
              <LineChart points={data.series.map((point) => ({ key: point.date, label: formatPoint(point.date), value: point.newCustomers }))} seriesName="New sign-ups" format={(value) => count(value)} formatAxis={(value) => count(value)} />
            )}
          </section>
        </>
      )}
    </div>
  );
}

// ---- Stock -----------------------------------------------------------------

function StockTable({ title, items, empty }: { title: string; items: StockItem[]; empty: string }) {
  return (
    <section className="card flush">
      <div className="card-head">
        <h2>{title}</h2>
      </div>
      <div className="table-wrap" style={{ border: 0, boxShadow: "none" }}>
        <table className="list">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th className="num">In stock</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="empty">
                  {empty}
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.slug}>
                <td>
                  <Link to={`/products?search=${encodeURIComponent(item.name)}`}>{item.name}</Link>
                </td>
                <td>{item.sku ?? "–"}</td>
                <td className="num">{item.stockQuantity ?? (item.inStock ? "in stock" : "out")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StockReportView() {
  const { data, error, loading } = useApi<StockReport>("/admin/reports/stock");
  return (
    <div className={loading && data ? "loading-dim" : ""}>
      <ErrorNotice error={error} />
      {!data && !error && <Loading />}
      {data && (
        <>
          {data.productsWithStockCount === 0 && <p className="hint">No product counts its stock yet. Set a stock quantity on a product (Products → Edit) to track it here.</p>}
          <StockTable title={`Low in stock (${data.lowStockThreshold} or fewer left)`} items={data.low} empty="Nothing is running low." />
          <StockTable title="Out of stock" items={data.out} empty="Everything is in stock." />
          <StockTable title="Most stocked" items={data.most} empty="No product has a stock count yet." />
        </>
      )}
    </div>
  );
}

// ---- the page ---------------------------------------------------------------

export function Reports() {
  useTitle("Reports");
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "orders";
  const report = params.get("report") ?? "sales";
  const fallback = presets()[2]!.range; // this month so far
  const range: Range = { from: params.get("from") ?? fallback.from, to: params.get("to") ?? fallback.to };

  const go = (changes: Record<string, string>) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(changes)) next.set(key, value);
      return next;
    });

  const tabs = [
    { key: "orders", label: "Orders" },
    { key: "customers", label: "Customers" },
    { key: "stock", label: "Stock" },
  ];
  const reports = [
    { key: "sales", label: "Sales by date" },
    { key: "products", label: "Sales by product" },
    { key: "categories", label: "Sales by category" },
    { key: "coupons", label: "Coupons by date" },
  ];

  return (
    <div className="page">
      <PageTitle title="Reports" />
      <nav className="nav-tabs" aria-label="Report type">
        {tabs.map((item) => (
          <NavLink key={item.key} to={`/reports?tab=${item.key}`} className={tab === item.key ? "active" : ""} onClick={(event) => { event.preventDefault(); go({ tab: item.key }); }}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {tab === "orders" && (
        <ul className="subsubsub">
          {reports.map((item) => (
            <li key={item.key}>
              <a href="#" className={report === item.key ? "current" : ""} onClick={(event) => { event.preventDefault(); go({ report: item.key }); }}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      )}

      {tab !== "stock" && <DateRange range={range} onChange={(next) => go({ from: next.from, to: next.to })} />}

      {tab === "orders" && report === "sales" && <SalesByDate range={range} />}
      {tab === "orders" && report === "products" && <Ranked range={range} endpoint="products" title="Top selling products" sub="By revenue" />}
      {tab === "orders" && report === "categories" && <Ranked range={range} endpoint="categories" title="Sales by category" sub="By revenue; a product in two categories counts in both" />}
      {tab === "orders" && report === "coupons" && <CouponsReport range={range} />}
      {tab === "customers" && <CustomersReport range={range} />}
      {tab === "stock" && <StockReportView />}
    </div>
  );
}
