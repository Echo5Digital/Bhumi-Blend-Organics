"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { navLinkClass } from "@/components/navLinkClass";

const categories = [
  {
    name: "Haircare",
    href: "/product-category/hair",
    image: "/box-design-3B-copy-H-274x320.webp",
  },
  {
    name: "Skincare",
    href: "/product-category/face",
    image: "/box-design-1B-copy-S-274x320.webp",
  },
  {
    name: "Bodycare",
    href: "/product-category/body",
    image: "/box-design-2B-copy-B-274x320.webp",
  },
];

// Same hover-intent timings as the live site's menu plugin.
const OPEN_DELAY_MS = 100;
const CLOSE_DELAY_MS = 300;

export function CategoryMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const scheduleOpen = useCallback(
    (value: boolean, delay: number) => {
      clearTimer();
      timer.current = setTimeout(() => setOpen(value), delay);
    },
    [clearTimer],
  );

  useEffect(() => clearTimer, [clearTimer]);

  // Close on a click/tap anywhere outside the menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      // Hover only counts for a real mouse; on touch the tap toggles instead.
      onPointerEnter={(e) => e.pointerType === "mouse" && scheduleOpen(true, OPEN_DELAY_MS)}
      onPointerLeave={(e) => e.pointerType === "mouse" && scheduleOpen(false, CLOSE_DELAY_MS)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
      onBlur={(e) => {
        // Keyboard focus moved out of the whole menu -> close it.
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        onClick={() => {
          clearTimer();
          setOpen((value) => !value);
        }}
        className={`${navLinkClass} cursor-pointer`}
      >
        Category
        <svg
          aria-hidden="true"
          viewBox="0 0 12.5 6"
          className="ml-1.5 inline-block h-[6px] w-[12.5px] fill-current align-middle"
        >
          {/* 10px-wide triangle centred in a 12.5px box = the live caret's footprint */}
          <path d="M1.25 0h10L6.25 6z" />
        </svg>
      </button>

      {/* Dropdown: 731px wide, centred under the nav, fades up over 200ms.
          Rendered (hidden) even when closed so its images are already loaded. */}
      <div
        id={panelId}
        className={`absolute top-full left-1/2 z-[999] grid w-[731px] max-w-[calc(100vw-24px)] -translate-x-1/2 grid-cols-3 bg-[#f1f1f1] transition-[opacity,transform,visibility] duration-200 ease-in ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible translate-y-[10px] opacity-0"
        }`}
      >
        {categories.map((category) => (
          <div key={category.name}>
            <div className="p-[15px]">
              <Image
                src={category.image}
                alt=""
                width={274}
                height={320}
                sizes="214px"
                className="block h-auto w-full"
              />
            </div>
            <div className="p-[15px]">
              <h2 className="font-system text-[28px] leading-[42px] font-bold text-[#1a202c]">
                {category.name}
              </h2>
            </div>
            {/* "Shop Now" is an inline link inside a 30.6px line, exactly like
                the live site, so its white box overhangs the line by 9px. */}
            <div className="p-[15px] font-system text-[18px] leading-[30.6px]">
              <Link
                href={category.href}
                onClick={() => setOpen(false)}
                className="bg-white px-5 py-3 tracking-[0.5px] text-black uppercase transition-colors duration-300 hover:text-[#C89B3C] hover:underline"
              >
                Shop Now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
