"use client";

import { getImageProps } from "next/image";
import Link from "next/link";
import { preload } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";

// Settings and measurements below are taken from the live bhumiblend.com
// (Elementor slides widget): 6s autoplay, 500ms slide transition, infinite
// loop, pause on hover, arrows + dots, 188px tall on tablet (desktop is 475px, 10px more than live).
const AUTOPLAY_MS = 6000;
const TRANSITION_MS = 500;
const SWIPE_THRESHOLD_PX = 50;

// `src` is the wide banner (tablet and desktop); `mobileSrc` is the portrait
// version of the same slide, shown below 768px.
const slides = [
  {
    src: "/baner-3-copy.webp",
    mobileSrc: "/Baner-1-Resize-copy-1-scaled.webp",
    alt: "Deep Hydration for Summer Days – restore moisture the Ayurvedic way",
    buttonColor: "#C98A1D",
  },
  {
    src: "/banner-4-1-scaled.webp",
    mobileSrc: "/Baner-3-Resize-copy-scaled.webp",
    alt: "Buy 6 Essentials at just ₹599",
    buttonColor: "#E8A40D",
  },
  {
    src: "/banner-5-1-scaled.webp",
    mobileSrc: "/Baner-2-Resize-copy-scaled.webp",
    alt: "Nature's Most Potent Vitamin C Serum, powered by Billy Goat Plum and Chamomile – exclusive price ₹599",
    buttonColor: "#683A04",
  },
];

// The portrait mobile banners are all 1974×2560.
const MOBILE_ASPECT = "aspect-[1974/2560]";

const SHOP_HREF = "/#categories";
const count = slides.length;

// The track is [clone of last, ...slides, clone of first]. Position 1 is the
// first real slide; landing on a clone snaps (without animation) to the real
// slide it duplicates, which gives a seamless infinite loop.
const track = [slides[count - 1], ...slides, slides[0]];

function Chevron({ direction }: { direction: "left" | "right" }) {
  // Same glyphs as the live site's slider arrows (Elementor e-eicon-chevron-*).
  const d =
    direction === "left"
      ? "M646 125C629 125 613 133 604 142L308 442C296 454 292 471 292 487 292 504 296 521 308 533L604 854C617 867 629 875 646 875 663 875 679 871 692 858 704 846 713 829 713 812 713 796 708 779 692 767L438 487 692 225C700 217 708 204 708 187 708 171 704 154 692 142 675 129 663 125 646 125Z"
      : "M696 533C708 521 713 504 713 487 713 471 708 454 696 446L400 146C388 133 375 125 354 125 338 125 325 129 313 142 300 154 292 171 292 187 292 204 296 221 308 233L563 492 304 771C292 783 288 800 288 817 288 833 296 850 308 863 321 871 338 875 354 875 371 875 388 867 400 854L696 533Z";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
      className="h-[1em] w-[1em] fill-current"
    >
      <path d={d} />
    </svg>
  );
}

// Art direction: below 768px the browser loads only the portrait mobile image,
// from 768px up only the wide one (the desktop/tablet markup is the same
// <Image fill sizes="100vw"> output as before, just wrapped in a <picture>).
function SlidePicture({
  slide,
  alt,
  highPriority,
}: {
  slide: (typeof slides)[number];
  alt: string;
  highPriority: boolean;
}) {
  const common = {
    alt,
    fill: true,
    sizes: "100vw",
    loading: "eager" as const,
    fetchPriority: highPriority ? ("high" as const) : ("low" as const),
    className: "object-cover object-center",
  };
  const { props: wideProps } = getImageProps({ ...common, src: slide.src });
  const { props: mobileProps } = getImageProps({ ...common, src: slide.mobileSrc });

  // React preloads a high-priority <img>, but not one inside a <picture>, so
  // do it by hand for the first slide — one hint per screen size, so each
  // visitor only preloads the image they will actually see.
  if (highPriority) {
    preload(wideProps.src, {
      as: "image",
      imageSrcSet: wideProps.srcSet,
      imageSizes: "100vw",
      fetchPriority: "high",
      media: "(min-width: 768px)",
    });
    preload(mobileProps.src, {
      as: "image",
      imageSrcSet: mobileProps.srcSet,
      imageSizes: "100vw",
      fetchPriority: "high",
      media: "(max-width: 767px)",
    });
  }

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={wideProps.srcSet} sizes="100vw" />
      <img {...mobileProps} alt={alt} />
    </picture>
  );
}

export function HeroSlider() {
  const [position, setPosition] = useState(1);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const activeIndex = (((position - 1) % count) + count) % count;

  const go = useCallback((delta: number) => {
    setAnimate(true);
    // Clamp so rapid clicks can't run past the clones before they snap back.
    setPosition((p) => Math.min(Math.max(p + delta, 0), count + 1));
  }, []);

  const goTo = useCallback((index: number) => {
    setAnimate(true);
    setPosition(index + 1);
  }, []);

  // Respect "reduce motion": no autoplay, instant slide changes.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // After sliding onto a clone, snap to the matching real slide.
  useEffect(() => {
    if (position !== 0 && position !== count + 1) return;
    const timer = setTimeout(() => {
      setAnimate(false);
      setPosition(position === 0 ? count : 1);
    }, TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [position]);

  // Turn the animation back on once the snap has been painted.
  useEffect(() => {
    if (animate) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setAnimate(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [animate]);

  // Autoplay. Depends on `position`, so any slide change (including a manual
  // one) restarts the 6s countdown; hovering/focusing pauses it.
  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [position, paused, reducedMotion, go]);

  return (
    <div
      className="relative overflow-hidden"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured offers"
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
        if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) go(delta < 0 ? 1 : -1);
      }}
    >
      <div
        className="flex ease-[ease]"
        style={{
          transform: `translateX(-${position * 100}%)`,
          transitionProperty: "transform",
          transitionDuration: animate && !reducedMotion ? `${TRANSITION_MS}ms` : "0ms",
        }}
      >
        {track.map((slide, i) => {
          const isActive = i === position;
          return (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-hidden={!isActive}
              // Mobile: the whole portrait banner. Tablet: 188px. Desktop: 475px
              // (10px taller than the live site's 465px), image covers the box
              // and is centred.
              className={`relative ${MOBILE_ASPECT} w-full shrink-0 overflow-hidden min-[768px]:aspect-auto min-[768px]:h-[188px] min-[1025px]:h-[475px]`}
            >
              <SlidePicture
                slide={slide}
                alt={isActive ? slide.alt : ""}
                highPriority={i === 1}
              />
              {/* Desktop button: same spot on every slide. Hidden on tablet,
                  where the live site's slide is too short for it. */}
              <div className="absolute top-[380px] right-[355px] left-[122px] hidden justify-center min-[1025px]:flex">
                <Link
                  href={SHOP_HREF}
                  tabIndex={isActive ? 0 : -1}
                  className="inline-block rounded-[4px] border-2 border-current bg-transparent px-[30px] py-[15px] font-system text-[16px] leading-none transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ color: slide.buttonColor }}
                >
                  Shop Now
                </Link>
              </div>

              {/* Mobile button (portrait banners): a filled amber button low on
                  the banner, right of centre, in the same spot on every slide.
                  Placed by percentage so it keeps its position as the banner
                  scales with the screen width. */}
              <Link
                href={SHOP_HREF}
                tabIndex={isActive ? 0 : -1}
                className="absolute bottom-[6.8%] left-[67.6%] inline-block -translate-x-1/2 rounded-[3px] bg-[#f4a940] px-7 py-[13px] font-system text-[14.5px] leading-none text-white active:opacity-90 min-[768px]:hidden"
              >
                Shop Now
              </Link>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="absolute top-1/2 left-[10px] z-10 inline-flex -translate-y-1/2 cursor-pointer text-[25px] text-[hsla(0,0%,93%,.9)] max-md:hidden"
      >
        <Chevron direction="left" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => go(1)}
        className="absolute top-1/2 right-[10px] z-10 inline-flex -translate-y-1/2 cursor-pointer text-[25px] text-[hsla(0,0%,93%,.9)] max-md:hidden"
      >
        <Chevron direction="right" />
      </button>

      <div className="absolute bottom-[13px] left-0 z-10 flex w-full justify-center">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === activeIndex}
            onClick={() => goTo(index)}
            // 6px dots with 6px gaps, black; inactive ones at 20% opacity.
            // The ::before enlarges the click target without changing the look.
            className={`relative mx-1.5 h-1.5 w-1.5 cursor-pointer rounded-full bg-black before:absolute before:-inset-2 before:content-[''] ${
              index === activeIndex ? "opacity-100" : "opacity-20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
