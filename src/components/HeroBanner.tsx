"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// Homepage banner: two photos that cross-fade every 5 seconds, each with its
// own headline, tagline and link(s) on top (gold eyebrow + white serif heading).
//
// Slides are stacked in one grid cell, so the banner is as tall as the taller
// slide and never jumps when it changes.
//  - 1024px and up: an 8:3 box. The cover photo (8:3) fills it; the product
//    photo (16:9) is shown whole at full height on the right, and the dark
//    left side carries the text.
//  - Below 1024px the text sits under the photo on the same dark tone (the
//    photo box is 16:9 on tablets, 4:3.4 on phones; both photos are cropped
//    around their subject).

const AUTOPLAY_MS = 5000;
const SWIPE_PX = 50;

type Slide = {
  id: string;
  src: string;
  alt: string;
  /** Classes for the photo (crop / position at each screen size). */
  photo: string;
  /** Desktop-only darkening on the left so the white text reads. */
  scrim: string;
  heading: string;
  text: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
};

const slides: Slide[] = [
  {
    id: "cover",
    src: "/cover-page-4-1-1-scaled.jpg",
    alt: "A smiling woman with Bhumi Blend Aloevera Gel, Saffron Gel, Anti Ageing Cream and Rosemary Water",
    photo: "object-cover object-[58%_50%] md:object-center",
    scrim:
      "bg-[linear-gradient(90deg,rgba(28,20,11,0.82)_0%,rgba(28,20,11,0.64)_26%,rgba(28,20,11,0.2)_46%,transparent_60%)]",
    heading: "Rooted in nature. Made for your ritual.",
    text: "Ayurveda-inspired care for skin and hair.",
    primary: { label: "Explore the collection", href: "/shop" },
    secondary: { label: "Watch our story", href: "/#about" },
  },
  {
    id: "range",
    src: encodeURI("/Bhumi Blend Organics Product Collection-100kb.jpeg"),
    alt: "The Bhumi Blend range: hair oil, shampoo, rosemary water, aloe vera and saffron gels, soaps, body lotion and creams around a gift box",
    photo: "object-cover object-center lg:object-contain lg:object-right",
    scrim:
      "bg-[linear-gradient(90deg,#1c140b_0%,#1c140b_34%,rgba(28,20,11,0)_58%)]",
    heading: "Pure care for hair, skin & body.",
    text: "Plant-based formulas inspired by Ayurvedic traditions.",
    primary: { label: "Shop all products", href: "/shop" },
  },
];

function PlayIcon() {
  return (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 place-items-center rounded-full border border-white/70 transition-colors duration-300 group-hover:border-[#e0b552] group-hover:text-[#e0b552]"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-[1px] fill-current">
        <path d="M8 5.5v13l11-6.5-11-6.5Z" />
      </svg>
    </span>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

export function HeroBanner() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback(
    (delta: number) => setActive((i) => (i + delta + count) % count),
    [count],
  );

  // Respect "reduce motion": no autoplay.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Autoplay. Depends on `active`, so any change (including a manual one)
  // restarts the 5s countdown; hovering or focusing the banner pauses it.
  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [active, paused, reducedMotion, go]);

  return (
    <div
      className="relative w-full"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) >= SWIPE_PX) go(delta < 0 ? 1 : -1);
      }}
    >
      <div className="grid overflow-hidden">
        {slides.map((slide, index) => {
          const isActive = index === active;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              aria-hidden={!isActive}
              inert={!isActive}
              className={`relative col-start-1 row-start-1 flex flex-col bg-[#1c140b] transition-[opacity,visibility] duration-700 motion-reduce:transition-none lg:block lg:bg-transparent ${
                isActive ? "visible opacity-100" : "invisible opacity-0"
              }`}
            >
              <div className="relative aspect-[4/3.4] w-full shrink-0 overflow-hidden bg-[#1c140b] md:aspect-video lg:aspect-[8/3]">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="100vw"
                  // Served as-is so the photos aren't re-compressed.
                  unoptimized
                  loading={index === 0 ? "eager" : undefined}
                  fetchPriority={index === 0 ? "high" : undefined}
                  className={slide.photo}
                />
                {/* Desktop: darken the left so the white text reads. */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 hidden lg:block ${slide.scrim}`}
                />
                {/* Phones/tablets: melt the bottom edge into the dark text area. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#1c140b] to-transparent lg:hidden"
                />
              </div>

              <div className="relative z-10 flex-1 px-6 pt-3 pb-12 md:px-10 md:pb-14 lg:absolute lg:inset-y-0 lg:left-0 lg:flex lg:w-[48%] lg:flex-none lg:items-center lg:py-0 lg:pr-0 lg:pl-[max(2.5rem,calc((100vw-1240px)/2))]">
                <div>
                  <p className="mb-4 flex items-center gap-3 font-sans text-[12px] font-semibold tracking-[3px] text-[#e0b552] uppercase [text-shadow:0_1px_10px_rgba(0,0,0,0.45)] sm:text-[13px] lg:mb-5">
                    <span aria-hidden="true" className="h-px w-8 bg-[#e0b552]" />
                    Bhumi Blend
                  </p>
                  <h2 className="max-w-[9.2em] font-serif text-[36px] leading-[1.12] font-medium text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.4)] sm:text-[42px] lg:text-[clamp(38px,3.6vw,60px)]">
                    {slide.heading}
                  </h2>
                  <p className="mt-4 max-w-[22em] font-sans text-[16px] leading-7 text-white/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.4)] lg:text-[clamp(15px,1.25vw,19px)] lg:leading-snug">
                    {slide.text}
                  </p>

                  <div className="mt-7 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8 lg:mt-8 lg:flex-col lg:items-start lg:gap-5">
                    <Link
                      href={slide.primary.href}
                      className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-[#e6bd62] to-[#C89B3C] px-8 py-3.5 font-sans text-[15px] font-semibold text-[#2a1a05] shadow-[0_12px_26px_-12px_rgba(200,155,60,0.9)] transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-105"
                    >
                      {slide.primary.label}
                    </Link>
                    {slide.secondary && (
                      <Link
                        href={slide.secondary.href}
                        className="group inline-flex items-center gap-3 font-sans text-[15px] text-white/90 transition-colors duration-300 hover:text-white"
                      >
                        <PlayIcon />
                        {slide.secondary.label}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="absolute top-1/2 left-3 z-20 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/25 text-white transition-colors duration-300 hover:bg-black/45 lg:inline-flex"
      >
        <Chevron direction="left" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => go(1)}
        className="absolute top-1/2 right-3 z-20 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/25 text-white transition-colors duration-300 hover:bg-black/45 lg:inline-flex"
      >
        <Chevron direction="right" />
      </button>

      <div className="absolute bottom-4 left-0 z-20 flex w-full justify-center">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === active}
            onClick={() => setActive(index)}
            // 8px dots; the ::before enlarges the click target without
            // changing the look.
            className={`relative mx-1.5 h-2 w-2 cursor-pointer rounded-full ring-1 ring-black/25 transition-colors duration-300 before:absolute before:-inset-2 before:content-[''] ${
              index === active ? "bg-[#e0b552]" : "bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
