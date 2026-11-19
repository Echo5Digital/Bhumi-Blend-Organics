import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from "react";

// The charts used by Reports and the dashboard. They follow the data-viz rules:
//  - one measure per chart, one hue (never a second y-axis),
//  - a 2px line, 4px-rounded bars that grow from a baseline, hairline grid,
//  - the value labelled where the story is (the end of the line), the rest in a
//    tooltip that tracks the pointer (and the arrow keys) and in a table view,
//  - text in text colours, never in the series colour.

export type Point = { key: string; label: string; value: number };

function useWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(Math.max(260, Math.floor(element.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/** Round-number axis: 0, 500, 1,000 ... up to at least `max`, in about four steps. */
function niceScale(max: number) {
  const raw = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalised = raw / magnitude;
  const step = (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10) * magnitude;
  const ticks: number[] = [];
  for (let value = 0; value < max + step * 0.999; value += step) ticks.push(Math.round(value * 1e6) / 1e6);
  return { yMax: ticks[ticks.length - 1] ?? step, ticks };
}

/**
 * A smooth line through the points that never overshoots them (monotone cubic, Fritsch–Carlson):
 * a day with no sales stays on the baseline instead of dipping below it.
 */
function smoothPath(coords: [number, number][]): string {
  const n = coords.length;
  const at = (index: number) => coords[index]!;
  const move = (index: number) => `${at(index)[0].toFixed(1)},${at(index)[1].toFixed(1)}`;
  if (n < 3) return coords.map((_, index) => `${index === 0 ? "M" : "L"}${move(index)}`).join(" ");

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = at(i + 1)[0] - at(i)[0];
    slope[i] = (at(i + 1)[1] - at(i)[1]) / dx[i]!;
  }
  const tangent: number[] = [slope[0]!];
  for (let i = 1; i < n - 1; i++) tangent[i] = slope[i - 1]! * slope[i]! <= 0 ? 0 : (slope[i - 1]! + slope[i]!) / 2;
  tangent[n - 1] = slope[n - 2]!;
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i]! / slope[i]!;
    const b = tangent[i + 1]! / slope[i]!;
    const size = a * a + b * b;
    if (size > 9) {
      const k = 3 / Math.sqrt(size);
      tangent[i] = k * a * slope[i]!;
      tangent[i + 1] = k * b * slope[i]!;
    }
  }

  let path = `M${move(0)}`;
  for (let i = 0; i < n - 1; i++) {
    const third = dx[i]! / 3;
    const c1 = `${(at(i)[0] + third).toFixed(1)},${(at(i)[1] + tangent[i]! * third).toFixed(1)}`;
    const c2 = `${(at(i + 1)[0] - third).toFixed(1)},${(at(i + 1)[1] - tangent[i + 1]! * third).toFixed(1)}`;
    path += ` C${c1} ${c2} ${move(i + 1)}`;
  }
  return path;
}

type LineChartProps = {
  points: Point[];
  /** Curve between the points instead of straight segments. */
  smooth?: boolean;
  /** What is plotted ("Gross sales"): in the tooltip and the accessible name. */
  seriesName: string;
  /** Full value for the tooltip and the end label (₹1,198.00). */
  format: (value: number) => string;
  /** Short value for the axis (₹1,200). */
  formatAxis: (value: number) => string;
  /** Axis top when every value is zero. */
  emptyMax?: number;
  height?: number;
};

export function LineChart({ points, smooth = false, seriesName, format, formatAxis, emptyMax = 4, height = 260 }: LineChartProps) {
  const holder = useRef<HTMLDivElement>(null);
  const width = useWidth(holder);
  const [active, setActive] = useState<number | null>(null);

  const margin = { left: 60, right: 22, top: 22, bottom: 30 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const count = points.length;
  const max = Math.max(0, ...points.map((point) => point.value));
  const { yMax, ticks } = niceScale(max > 0 ? max : emptyMax);

  const x = (index: number) => (count <= 1 ? margin.left + innerWidth / 2 : margin.left + (index / (count - 1)) * innerWidth);
  const y = (value: number) => margin.top + innerHeight - (value / yMax) * innerHeight;

  const coords = points.map((point, index): [number, number] => [x(index), y(point.value)]);
  const line = smooth ? smoothPath(coords) : points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
  const baseline = margin.top + innerHeight;
  const area = count > 1 ? `${line} L${x(count - 1).toFixed(1)},${baseline} L${x(0).toFixed(1)},${baseline} Z` : "";

  // About seven labels along the bottom on a wide chart, fewer on a narrow one — never crowded.
  const every = Math.max(1, Math.ceil(count / Math.min(7, Math.max(2, Math.floor(innerWidth / 70)))));
  const labelled = points.map((_, index) => index).filter((index) => index % every === 0 && (count - 1 - index >= every / 2 || index === count - 1));

  const nearest = (clientX: number, left: number) => {
    const offset = clientX - left - margin.left;
    return Math.min(count - 1, Math.max(0, Math.round(count <= 1 ? 0 : (offset / innerWidth) * (count - 1))));
  };
  const onPointerMove = (event: PointerEvent<SVGRectElement>) => setActive(nearest(event.clientX, event.currentTarget.ownerSVGElement!.getBoundingClientRect().left));
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const move = (to: number) => {
      event.preventDefault();
      setActive(Math.min(count - 1, Math.max(0, to)));
    };
    if (event.key === "ArrowRight") move((active ?? -1) + 1);
    else if (event.key === "ArrowLeft") move((active ?? count) - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(count - 1);
    else if (event.key === "Escape") setActive(null);
  };

  const shown = active !== null ? points[active] : undefined;
  const last = points[count - 1];

  return (
    <div className="viz" ref={holder}>
      <div
        tabIndex={0}
        role="group"
        aria-label={`${seriesName} chart. Use the left and right arrow keys to read each point; a table follows.`}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${seriesName}, ${count} points`}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line className={tick === 0 ? "axis-line" : "grid-line"} x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} />
              <text x={margin.left - 8} y={y(tick) + 4} textAnchor="end">
                {formatAxis(tick)}
              </text>
            </g>
          ))}
          {labelled.map((index) => (
            <text key={points[index]!.key} x={x(index)} y={height - 8} textAnchor="middle">
              {points[index]!.label}
            </text>
          ))}

          {area && <path className="series-area" d={area} />}
          {count > 1 && <path className="series-line" d={line} />}

          {/* the end of the line is the one value labelled outright */}
          {last && active === null && (
            <>
              <circle className="marker" cx={x(count - 1)} cy={y(last.value)} r={4} />
              <text className="end-label" x={Math.min(x(count - 1), width - margin.right)} y={y(last.value) - 10} textAnchor="end">
                {format(last.value)}
              </text>
            </>
          )}

          {shown && active !== null && (
            <>
              <line className="crosshair" x1={x(active)} x2={x(active)} y1={margin.top} y2={baseline} />
              <circle className="marker" cx={x(active)} cy={y(shown.value)} r={5} />
            </>
          )}

          {/* a wide, invisible target, so the pointer only has to be near */}
          <rect x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} fill="transparent" onPointerMove={onPointerMove} onPointerLeave={() => setActive(null)} />
        </svg>

        {shown && active !== null && (
          <div className="tooltip" style={{ left: Math.min(Math.max(x(active), 80), width - 80), top: y(shown.value) - 12 }} role="status">
            <div className="t-value">{format(shown.value)}</div>
            <div className="t-label">
              <span className="t-key" />
              {seriesName}
            </div>
            <div className="t-label">{shown.label}</div>
          </div>
        )}
      </div>

      <details className="table-view">
        <summary>View as table</summary>
        <div className="table-wrap">
          <table className="list">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">{seriesName}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.key}>
                  <td>{point.label}</td>
                  <td className="num">{format(point.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export type BarRow = { key: string; name: string; value: number; figure: string; sub?: string };

/** One row per item, largest first: the name, a bar, and the figure at the end. */
export function RankedBars({ rows, empty = "Nothing to show for this period." }: { rows: BarRow[]; empty?: string }) {
  if (rows.length === 0) return <p className="hint" style={{ padding: "8px 4px" }}>{empty}</p>;
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <ul className="bar-list">
      {rows.map((row) => (
        <li key={row.key} className="bar-row" tabIndex={0} title={`${row.name}: ${row.figure}${row.sub ? ` (${row.sub})` : ""}`}>
          <span className="name">{row.name}</span>
          <span className="track" aria-hidden="true">
            <span className="bar" style={{ width: `${Math.max(0.5, (row.value / max) * 100)}%` }} />
          </span>
          <span className="figure">
            {row.figure}
            {row.sub && <span className="qty">{row.sub}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export type Slice = { key: string; name: string; value: number; color: string };

/**
 * One whole split into parts (orders by status). The names, counts and shares sit in the
 * legend beside the ring, so no colour has to be decoded alone; hovering (or tabbing to) a
 * legend row or a segment lights it up and shows its count in the middle.
 */
export function DonutChart({ slices, total, centerLabel, formatValue = (value) => String(value) }: { slices: Slice[]; total: number; centerLabel: string; formatValue?: (value: number) => string }) {
  const [active, setActive] = useState<string | null>(null);
  const size = 190;
  const stroke = 26;
  const radius = (size - stroke) / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const gap = slices.length > 1 ? 3 : 0;

  let offset = 0;
  const arcs = slices.map((slice) => {
    const length = (slice.value / total) * circumference;
    const arc = { slice, dash: `${Math.max(0, length - gap)} ${circumference - Math.max(0, length - gap)}`, offset: -offset };
    offset += length;
    return arc;
  });
  const shown = slices.find((slice) => slice.key === active);

  return (
    <div className="donut-wrap">
      <div className="donut">
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${centerLabel}: ${slices.map((slice) => `${slice.name} ${formatValue(slice.value)}`).join(", ")}`}>
          {arcs.map(({ slice, dash, offset: dashOffset }) => (
            <circle
              key={slice.key}
              className={`seg ${active && active !== slice.key ? "dim" : ""}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={slice.color}
              strokeDasharray={dash}
              strokeDashoffset={dashOffset}
              onPointerEnter={() => setActive(slice.key)}
              onPointerLeave={() => setActive(null)}
            >
              <title>{`${slice.name}: ${formatValue(slice.value)}`}</title>
            </circle>
          ))}
        </svg>
        <div className="middle" aria-hidden="true">
          <strong>{formatValue(shown ? shown.value : total)}</strong>
          <span>{shown ? shown.name : centerLabel}</span>
        </div>
      </div>
      <ul className="legend">
        {slices.map((slice) => (
          <li
            key={slice.key}
            className={active === slice.key ? "on" : ""}
            tabIndex={0}
            onPointerEnter={() => setActive(slice.key)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(slice.key)}
            onBlur={() => setActive(null)}
          >
            <span className="swatch" style={{ background: slice.color }} aria-hidden="true" />
            <span className="name">{slice.name}</span>
            <span className="n">{formatValue(slice.value)}</span>
            <span className="pct">{Math.round((slice.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StatTile({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="tile">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {note && <div className="note">{note}</div>}
    </div>
  );
}
