import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";

// Pieces used only by the dashboard (Home). They are kept apart from components/charts.tsx on
// purpose: that file belongs to the Reports screen, and the dashboard must not change it.

function useWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(560);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(Math.max(240, Math.floor(element.getBoundingClientRect().width)));
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

export type DayPoint = { key: string; label: string; value: number; note?: string };

/**
 * One column per day, one hue, all on one baseline (<= 24px thick, rounded 4px at the top,
 * square at the bottom). Hovering — or the arrow keys — reads a day; the others dim. The last
 * column is labelled "Today". A hidden table gives screen readers every value.
 */
export function DayBars({
  points,
  seriesName,
  format,
  formatAxis,
  emptyMax = 1000,
  height = 250,
}: {
  points: DayPoint[];
  seriesName: string;
  format: (value: number) => string;
  formatAxis: (value: number) => string;
  emptyMax?: number;
  height?: number;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const width = useWidth(holder);
  const [active, setActive] = useState<number | null>(null);

  const margin = { left: 58, right: 8, top: 16, bottom: 30 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const count = points.length;
  const max = Math.max(0, ...points.map((point) => point.value));
  const { yMax, ticks } = niceScale(max > 0 ? max : emptyMax);

  const slot = innerWidth / Math.max(1, count);
  const barWidth = Math.min(24, Math.max(4, slot - 6));
  const baseline = margin.top + innerHeight;
  const x = (index: number) => margin.left + slot * (index + 0.5);
  const barHeight = (value: number) => (value / yMax) * innerHeight;

  // Day names along the bottom, counted back from today so today is always one of them.
  const every = Math.max(1, Math.ceil(54 / slot));
  const labelled = points.map((_, index) => index).filter((index) => (count - 1 - index) % every === 0);

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

  return (
    <div className="dx-bars" ref={holder}>
      <div tabIndex={0} role="group" aria-label={`${seriesName} chart. Use the left and right arrow keys to read each day.`} onKeyDown={onKeyDown} onBlur={() => setActive(null)}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${seriesName}, ${count} days`} onPointerLeave={() => setActive(null)}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line className={tick === 0 ? "axis" : "grid"} x1={margin.left} x2={width - margin.right} y1={baseline - barHeight(tick)} y2={baseline - barHeight(tick)} />
              <text x={margin.left - 10} y={baseline - barHeight(tick) + 4} textAnchor="end">
                {formatAxis(tick)}
              </text>
            </g>
          ))}

          {labelled.map((index) => (
            <text key={points[index]!.key} className={index === count - 1 ? "today" : ""} x={x(index)} y={height - 8} textAnchor="middle">
              {index === count - 1 ? "Today" : points[index]!.label}
            </text>
          ))}

          {points.map((point, index) => {
            const h = barHeight(point.value);
            if (h <= 0) return null; // a day with nothing sold draws nothing
            const left = x(index) - barWidth / 2;
            const right = left + barWidth;
            const top = baseline - h;
            const r = Math.min(4, h, barWidth / 2);
            const d = `M${left},${baseline} V${top + r} Q${left},${top} ${left + r},${top} H${right - r} Q${right},${top} ${right},${top + r} V${baseline} Z`;
            return <path key={point.key} className={`bar ${active !== null && active !== index ? "dim" : ""}`} d={d} />;
          })}

          {/* a full-height target per day, so the pointer only has to be near */}
          {points.map((point, index) => (
            <rect key={point.key} x={margin.left + slot * index} y={margin.top} width={slot} height={innerHeight} fill="transparent" onPointerEnter={() => setActive(index)} onPointerMove={() => setActive(index)} />
          ))}
        </svg>

        {shown && active !== null && (
          <div className="dx-tip" style={{ left: Math.min(Math.max(x(active), 72), width - 72), top: baseline - barHeight(shown.value) - 10 }} role="status">
            <div className="v">{format(shown.value)}</div>
            <div>{shown.label}</div>
            {shown.note && <div>{shown.note}</div>}
          </div>
        )}
      </div>

      <table className="sr-only">
        <caption>{seriesName} per day</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>{seriesName}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.key}>
              <td>{point.label}</td>
              <td>{format(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A thin bar showing `value` out of `of` (an order stage's share, a product's share of the best seller). */
export function Meter({ value, of, label }: { value: number; of: number; label: string }) {
  const share = of > 0 ? Math.min(100, (value / of) * 100) : 0;
  return (
    <span className="dx-meter" role="img" aria-label={label}>
      <span style={{ width: `${value > 0 ? Math.max(3, share) : 0}%` }} />
    </span>
  );
}
