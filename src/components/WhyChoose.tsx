import Image from "next/image";
import { InViewStage } from "@/components/InViewStage";
import { Reveal } from "@/components/Reveal";

// "Why Choose Bhumi Blend": the hands-and-bottle photo in the middle, the four
// promises placed around it and tied to it with gold lines.
//
// From md up everything sits on one 1100×640 stage. The callouts are placed
// by percentage and the connector lines are drawn in an SVG with the same
// 1100×640 viewBox, so the two always line up however wide the stage is. On
// phones the stage collapses to: photo, then the four callouts in a list.
// Animation: the `.why-*` rules in globals.css, started by <InViewStage>.

const STAGE_W = 1100;
const STAGE_H = 640;
const PILL_W = 280;

const pctX = (x: number) => `${(x / STAGE_W) * 100}%`;
const pctY = (y: number) => `${(y / STAGE_H) * 100}%`;

// `x` is the callout's left edge and `cy` its vertical centre, in stage units.
// `line` runs from the callout's inner edge to a point `dot` on the photo
// (cap, label edge, hands) — each promise points at something fitting.
const items = [
  {
    text: "Inspired by Ayurvedic traditions",
    x: 20,
    cy: 130,
    side: "left",
    line: "M300 130 C 390 130, 430 181, 506 181",
    dot: [506, 181],
  },
  {
    text: "Made with plant-based ingredients",
    x: 810,
    cy: 205,
    side: "right",
    line: "M810 205 C 735 205, 690 299, 612 299",
    dot: [612, 299],
  },
  {
    text: "Gentle for daily use",
    x: 60,
    cy: 475,
    side: "left",
    line: "M340 475 C 385 475, 400 400, 440 400",
    dot: [440, 400],
  },
  {
    text: "Crafted for real results",
    x: 790,
    cy: 495,
    side: "right",
    line: "M790 495 C 740 495, 710 452, 668 452",
    dot: [668, 452],
  },
] as const;

const CALLOUT_START_MS = 250;
const CALLOUT_STEP_MS = 160;

function ms(value: number) {
  return `${value}ms`;
}

function CheckBadge({ delay }: { delay: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#eac66e] to-[#b8791f] text-white shadow-[0_8px_16px_-6px_rgba(150,100,20,0.85)] md:h-8 md:w-8 lg:h-10 lg:w-10"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[55%] w-[55%] fill-none stroke-current"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          pathLength="1"
          className="why-check"
          style={{ "--d": delay } as React.CSSProperties}
        />
      </svg>
    </span>
  );
}

function Sparkle({
  x,
  y,
  size,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  delay: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 10})`}>
      <path
        d="M0 -10C1 -3 3 -1 10 0C3 1 1 3 0 10C-1 3 -3 1 -10 0C-3 -1 -1 -3 0 -10Z"
        fill="#d9a63f"
        className="why-twinkle"
        style={{ animationDelay: delay }}
      />
    </g>
  );
}

export function WhyChoose() {
  return (
    <section
      id="why-choose"
      aria-labelledby="why-choose-title"
      className="relative isolate overflow-hidden bg-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_62%_52%_at_50%_58%,#fbf3de,rgba(255,255,255,0)_72%)]"
      />
      {/* Bottom edge: the next section (Skin Care Essentials) opens on a faint
          cream glow, so end this one on the same tone — the fading wrists then
          melt into it with no visible seam. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[200px] bg-[radial-gradient(ellipse_55%_100%_at_50%_100%,#f9f5ec_0%,rgba(249,245,236,0.6)_45%,rgba(249,245,236,0)_100%)]"
      />

      {/* No bottom padding from md up: the stage ends with the photo, so the
          hands run right down to the edge of the section (no empty band). */}
      <div className="mx-auto max-w-[1180px] px-6 pt-16 pb-12 md:pt-20 md:pb-0">
        <Reveal>
          <div className="text-center">
            <h2
              id="why-choose-title"
              className="font-serif text-[32px] leading-tight font-medium text-[#222] sm:text-[40px] lg:text-[48px]"
            >
              Why Choose <span className="why-shimmer">Bhumi Blend</span>
            </h2>
            <div aria-hidden="true" className="mt-5 flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#C89B3C]" />
              <span className="h-2 w-2 rotate-45 bg-[#C89B3C]" />
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#C89B3C]" />
            </div>
          </div>
        </Reveal>

        <InViewStage className="relative mx-auto mt-12 max-w-[1100px] md:mt-14 md:aspect-[1100/640]">
          {/* Backdrop: soft glow, slow-turning gold rings, twinkling sparkles. */}
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
            className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
          >
            <defs>
              <radialGradient id="why-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#f1d58f" stopOpacity="0.55" />
                <stop offset="0.55" stopColor="#f6e6bd" stopOpacity="0.25" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle className="why-breathe" cx="550" cy="320" r="330" fill="url(#why-glow)" />
            <g className="why-spin">
              <circle
                cx="550"
                cy="320"
                r="300"
                fill="none"
                stroke="#C89B3C"
                strokeOpacity="0.55"
                strokeWidth="1.2"
                strokeDasharray="2 10"
                strokeLinecap="round"
              />
              <circle cx="550" cy="20" r="4.5" fill="#d9a63f" />
            </g>
            <g className="why-spin-rev">
              <circle
                cx="550"
                cy="320"
                r="258"
                fill="none"
                stroke="#C89B3C"
                strokeOpacity="0.4"
                strokeWidth="1"
                strokeDasharray="14 10"
              />
              <circle cx="550" cy="578" r="3.5" fill="#e6bd62" />
            </g>
            <circle cx="550" cy="320" r="212" fill="none" stroke="#C89B3C" strokeOpacity="0.22" />
            <Sparkle x={236} y={296} size={13} delay="0s" />
            <Sparkle x={880} y={118} size={16} delay="1.1s" />
            <Sparkle x={930} y={372} size={11} delay="2.2s" />
            <Sparkle x={196} y={62} size={10} delay="1.6s" />
            <Sparkle x={690} y={36} size={9} delay="0.6s" />
          </svg>

          {/* The photo. On phones it sits on its own with a ring of its own. */}
          <div className="relative mx-auto aspect-[528/707] w-[min(74vw,300px)] md:absolute md:top-0 md:left-[28.27%] md:mx-0 md:aspect-auto md:h-full md:w-[43.45%]">
            <div
              aria-hidden="true"
              className="why-spin absolute -inset-5 rounded-full border border-dashed border-[#C89B3C]/50 md:hidden"
            />
            <div className="why-image h-full w-full">
              <div className="why-float why-fade-bottom relative h-full w-full">
                <Image
                  src={encodeURI("/Hands Presenting Premium Ayurvedic Hair Oil (1).png")}
                  alt="Hands presenting a bottle of Bhumi Blend Organic Root Revival Hair Oil"
                  fill
                  sizes="(min-width: 768px) 480px, 74vw"
                  // The PNG is small (102 KB) and has a transparent background:
                  // serve it as-is rather than re-encoding it.
                  unoptimized
                  className="object-contain object-top"
                />
              </div>
            </div>
          </div>

          {/* Connector lines, drawn over the photo (md+ only). */}
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
            className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full md:block"
          >
            {items.map((item, i) => {
              const lineDelay = CALLOUT_START_MS + i * CALLOUT_STEP_MS + 350;
              const dotDelay = lineDelay + 1100;
              return (
                <g key={item.text}>
                  <path
                    d={item.line}
                    pathLength="1"
                    fill="none"
                    stroke="#C89B3C"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    className="why-line"
                    style={{ "--d": ms(lineDelay) } as React.CSSProperties}
                  />
                  <g className="why-spark">
                    <circle r="3.2" fill="#fff4cf" stroke="#d9a63f" strokeWidth="1">
                      <animateMotion
                        dur="3.4s"
                        begin={`${2.6 + i * 0.7}s`}
                        repeatCount="indefinite"
                        path={item.line}
                      />
                    </circle>
                  </g>
                  <g
                    className="why-dot"
                    style={{ "--d": ms(dotDelay) } as React.CSSProperties}
                  >
                    <circle
                      cx={item.dot[0]}
                      cy={item.dot[1]}
                      r="6"
                      fill="#C89B3C"
                      className="why-ping"
                      style={{ animationDelay: `${i * 0.5}s` }}
                    />
                    <circle
                      cx={item.dot[0]}
                      cy={item.dot[1]}
                      r="5.5"
                      fill="#C89B3C"
                      stroke="#fff"
                      strokeWidth="2.5"
                    />
                  </g>
                </g>
              );
            })}
          </svg>

          {/* The four promises. A list on phones; positioned around the photo
              from md up (ul and li are both absolutely placed on the stage). */}
          <ul className="pointer-events-none relative z-30 mt-5 grid list-none gap-3 sm:grid-cols-2 md:absolute md:inset-0 md:mt-0 md:block">
            {items.map((item, i) => {
              const calloutDelay = CALLOUT_START_MS + i * CALLOUT_STEP_MS;
              return (
                <li
                  key={item.text}
                  style={
                    {
                      "--x": pctX(item.x),
                      "--y": pctY(item.cy),
                      "--w": `${(PILL_W / STAGE_W) * 100}%`,
                    } as React.CSSProperties
                  }
                  className="pointer-events-auto md:absolute md:top-[var(--y)] md:left-[var(--x)] md:w-[var(--w)] md:-translate-y-1/2"
                >
                  <div
                    className={`why-callout h-full ${item.side === "right" ? "why-from-right" : ""}`}
                    style={{ "--d": ms(calloutDelay) } as React.CSSProperties}
                  >
                    <article className="group flex h-full items-center gap-3 rounded-[24px] border border-[#C89B3C]/35 bg-white/90 px-4 py-3.5 shadow-[0_18px_40px_-22px_rgba(120,85,20,0.55)] backdrop-blur-sm transition-[transform,box-shadow,border-color] duration-500 ease-out md:gap-2.5 md:px-3 md:py-2.5 lg:gap-3.5 lg:px-5 lg:py-4 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:border-[#C89B3C] [@media(hover:hover)]:hover:shadow-[0_26px_48px_-20px_rgba(200,155,60,0.75)]">
                      <CheckBadge delay={ms(calloutDelay + 450)} />
                      <p className="font-sans text-[15px] leading-snug font-medium text-[#2a2218] md:text-[13px] lg:text-[16.5px]">
                        {item.text}
                      </p>
                    </article>
                  </div>
                </li>
              );
            })}
          </ul>
        </InViewStage>
      </div>
    </section>
  );
}
