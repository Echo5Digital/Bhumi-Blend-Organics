"use client";

import { useEffect, useRef } from "react";

// Wrapper that tells CSS when its contents scroll into view, so a whole
// choreographed entrance (see the `.why-*` rules in globals.css) can start at
// the right moment.
//
// The server-rendered HTML carries no `data-inview` attribute, which the CSS
// treats as "fully visible" — nothing is hidden without JavaScript. After
// hydration the attribute becomes "pending" (contents tucked away, still below
// the fold) and then "in" once the stage is on screen. Visitors who prefer
// reduced motion never get the attribute at all.
export function InViewStage({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Already on screen when the page loads (tall monitor, reload part-way
    // down): play the entrance now instead of waiting for a scroll.
    const rect = el.getBoundingClientRect();
    const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    if (visible >= rect.height * 0.2 && rect.top < window.innerHeight * 0.92) {
      el.dataset.inview = "in";
      return;
    }

    el.dataset.inview = "pending";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.inview = "in";
        observer.disconnect();
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
