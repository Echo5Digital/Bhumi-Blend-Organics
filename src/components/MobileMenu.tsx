"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

// Same destinations as the desktop navbar (the Category dropdown is flattened
// into its three categories). Phones only: from 768px up the navbar shows.
const links = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Haircare", href: "/product-category/hair" },
  { label: "Skincare", href: "/product-category/face" },
  { label: "Bodycare", href: "/product-category/body" },
  { label: "Combo", href: "/product-category/combo" },
  { label: "Our Story", href: "/#about" },
  { label: "Contact Us", href: "/#contact" },
];

// Renders the hamburger button (a cell of the header grid) and the dropdown
// panel, which is positioned against the sticky <header>, right under it.
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className="col-start-1 -ml-2 grid h-10 w-10 place-items-center justify-self-start text-[#444] md:hidden"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-6 w-6 fill-none stroke-current"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d={open ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} />
        </svg>
      </button>

      <nav
        id={panelId}
        aria-label="Mobile"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-[#eee] bg-white shadow-[0_16px_28px_-18px_rgba(0,0,0,0.35)] md:hidden"
      >
        <ul className="px-6 py-2">
          {links.map((link) => (
            <li key={link.label} className="border-b border-[#f1f1f1] last:border-0">
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="block py-3 font-system text-[16px] tracking-[0.5px] text-black uppercase transition-colors duration-300 hover:text-[#C89B3C]"
              >
                {link.label}
              </Link>
            </li>
          ))}
          {/* Under 360px the header drops its Login icon to leave room for the
              logo, so Login lives here instead. */}
          <li className="min-[360px]:hidden">
            <Link
              href="/my-account"
              prefetch={false}
              onClick={() => setOpen(false)}
              className="block py-3 font-system text-[16px] tracking-[0.5px] text-black uppercase transition-colors duration-300 hover:text-[#C89B3C]"
            >
              Login
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
