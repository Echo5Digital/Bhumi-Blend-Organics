"use client";

import { useEffect, useRef, useState } from "react";

export type ProductTab = {
  /** Also the URL hash that opens the tab (e.g. /product/x#usage). */
  id: string;
  label: string;
  content: React.ReactNode;
};

// Description / Usage Instructions / Reviews / FAQ as tabs. Every panel is
// rendered (inactive ones are `hidden`), so all the text is in the page for
// search engines and the panels need no loading. Left/Right/Home/End move
// between tabs; a #hash in the URL opens that tab.
export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const listRef = useRef<HTMLDivElement>(null);

  // Open the tab named in the URL hash (on load and when the hash changes).
  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.slice(1);
      if (!tabs.some((tab) => tab.id === id)) return;
      setActive(id);
      listRef.current?.scrollIntoView({ block: "start" });
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [tabs]);

  const select = (id: string) => {
    setActive(id);
    // replaceState (unlike assigning location.hash) doesn't scroll the page.
    window.history.replaceState(null, "", `#${id}`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const current = tabs.findIndex((tab) => tab.id === active);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    select(tabs[next].id);
    (listRef.current?.querySelectorAll('[role="tab"]')[next] as HTMLElement | undefined)?.focus();
  };

  return (
    <div>
      {/* The tab row scrolls on its own on narrow phones. Its hairline is drawn
          inside the scrolling strip (not as a border on the scroller), so the
          selected tab can sit on top of it and look joined to the panel. */}
      <div
        ref={listRef}
        role="tablist"
        aria-label="Product information"
        onKeyDown={onKeyDown}
        className="overflow-x-auto [scrollbar-width:none]"
      >
        <div className="relative flex w-max min-w-full gap-1.5 pt-1 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[#e3d6b5] sm:gap-2">
          {tabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => select(tab.id)}
                className={`relative z-10 shrink-0 cursor-pointer rounded-t-lg border px-4 py-3 font-system text-[14px] font-semibold whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-gold sm:px-6 sm:py-3.5 sm:text-[15px] ${
                  isActive
                    ? "border-[#e3d6b5] border-b-white bg-white text-[#222] before:absolute before:-inset-x-px before:-top-px before:h-[3px] before:rounded-t-lg before:bg-brand-gold"
                    : "border-[#eadcb6] bg-[#fbf8ef] text-[#6b5d44] hover:text-brand-gold-dark"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== active}
          className="pt-10 md:pt-12"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
