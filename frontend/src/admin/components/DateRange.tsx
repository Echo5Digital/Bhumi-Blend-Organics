import { useState } from "react";
import { addDays, toDayString } from "../lib/format";

export type Range = { from: string; to: string };

/** The presets WooCommerce's reports offer, as inclusive YYYY-MM-DD ranges in Indian time. */
export function presets(now = new Date()): { key: string; label: string; range: Range }[] {
  const today = toDayString(now);
  const monthStart = `${today.slice(0, 8)}01`;
  const lastMonthEnd = addDays(monthStart, -1);
  return [
    { key: "year", label: "Year", range: { from: `${today.slice(0, 4)}-01-01`, to: today } },
    { key: "last-month", label: "Last month", range: { from: `${lastMonthEnd.slice(0, 8)}01`, to: lastMonthEnd } },
    { key: "month", label: "This month", range: { from: monthStart, to: today } },
    { key: "7day", label: "Last 7 days", range: { from: addDays(today, -6), to: today } },
  ];
}

// "Year | Last month | This month | Last 7 days | Custom: [from] – [to] [Go]" — one row above the
// reports, and everything below it follows the same range.
export function DateRange({ range, onChange }: { range: Range; onChange: (range: Range) => void }) {
  const options = presets();
  const matching = options.find((option) => option.range.from === range.from && option.range.to === range.to);
  const [custom, setCustom] = useState<Range>(range);

  return (
    <div className="range-bar" role="group" aria-label="Date range">
      {options.map((option) => (
        <button key={option.key} type="button" aria-pressed={matching?.key === option.key} onClick={() => { setCustom(option.range); onChange(option.range); }}>
          {option.label}
        </button>
      ))}
      <form
        className="custom"
        onSubmit={(event) => {
          event.preventDefault();
          if (custom.from && custom.to && custom.from <= custom.to) onChange(custom);
        }}
      >
        <strong>Custom:</strong>
        <input type="date" aria-label="From" value={custom.from} max={custom.to} onChange={(event) => setCustom({ ...custom, from: event.target.value })} />
        <span aria-hidden="true">–</span>
        <input type="date" aria-label="To" value={custom.to} min={custom.from} onChange={(event) => setCustom({ ...custom, to: event.target.value })} />
        <button type="submit" className="btn" style={{ padding: "0 12px" }}>
          Go
        </button>
      </form>
    </div>
  );
}
