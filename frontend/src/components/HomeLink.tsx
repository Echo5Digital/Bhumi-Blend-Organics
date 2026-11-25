"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

// A link to the homepage. Next.js keeps the scroll position when a <Link> points at the page
// you are already on, so clicking the logo halfway down the homepage did nothing. Here, when
// the visitor is already on "/", the click scrolls back up to the banner instead. From any
// other page it is an ordinary link (the new page opens at the top).
export function HomeLink({
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, "href">) {
  const pathname = usePathname();

  return (
    <Link
      href="/"
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (
          e.defaultPrevented ||
          pathname !== "/" ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0
        ) {
          return;
        }
        e.preventDefault();
        // Drop a leftover "#section" from the address (e.g. after the footer's category link).
        if (window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    />
  );
}
