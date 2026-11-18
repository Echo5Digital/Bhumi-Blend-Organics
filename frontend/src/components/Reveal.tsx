"use client";

import { useEffect, useRef } from "react";

// Fades + lifts its children into place the first time they scroll into view.
//
// Content is visible in the server-rendered HTML, so nothing is ever hidden
// without JavaScript. After hydration, only elements that start *below* the
// fold are hidden and then revealed — anything already on screen stays put.
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  /** Stagger, in milliseconds. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.dataset.reveal = "pending";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = "done";
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-700 ease-out data-[reveal=pending]:translate-y-8 data-[reveal=pending]:opacity-0 ${className}`}
    >
      {children}
    </div>
  );
}
