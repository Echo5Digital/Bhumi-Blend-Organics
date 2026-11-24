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

// The phone banners (public/bhumiblend-mobile1-3.jpeg, 1234×1600) have their headline built into the
// bottom-left, on a dark-brown fade that leaves no room for a button. So every phone slide gets a
// strip under the picture, painted in the picture's own bottom-edge colours so that it reads as the
// picture continuing, and the Shop Now button sits across that edge. Those colours were measured from
// the pictures: 21 points evenly spaced from the left edge to the right edge (0%, 5% ... 100%) of the
// last pixel rows: dark brown, easing to tan on the right. The strip also fades in over the picture's
// last PHONE_STRIP_FADE px, so even a few levels of difference could never show as a line.
function edgeGradient(colours: string[]) {
  return `linear-gradient(to right, ${colours.map((colour, i) => `${colour} ${((i / (colours.length - 1)) * 100).toFixed(1)}%`).join(", ")})`;
}
const PHONE_STRIP_FADE = 16; // px of the picture the strip overlaps while fading in (the strip adds 54px below it)
const PHONE_STRIP_MASK = `linear-gradient(to bottom, transparent, #000 ${PHONE_STRIP_FADE}px)`;

// `src` is the wide banner (tablet and desktop); `mobileSrc` is the portrait picture of the same
// slide, shown below 768px, with its description (`mobileAlt`) and the colours of its bottom edge.
const slides = [
  {
    src: "/baner-3-copy.webp",
    mobileSrc: "/bhumiblend-mobile1.jpeg",
    mobileAlt:
      "A smiling woman with Bhumi Blend Aloe Vera Gel, Saffron Gel, Anti-Ageing Cream and Rosemary Water. Rooted in nature. Made for your ritual. Ayurveda-inspired care for skin and hair.",
    mobileStrip: edgeGradient(["#46341e", "#46341e", "#46341e", "#46341e", "#43311b", "#42301a", "#46341e", "#46341e", "#46341e", "#46341e", "#46341e", "#46341e", "#493721", "#4d3b25", "#52402a", "#5a4832", "#63513b", "#6c5a44", "#77654f", "#7f6d57", "#897761"]),
    alt: "Deep Hydration for Summer Days – restore moisture the Ayurvedic way",
    buttonColor: "#C98A1D",
  },
  {
    src: "/banner-4-1-scaled.webp",
    mobileSrc: "/bhumiblend-mobile2.jpeg",
    mobileAlt:
      "The Bhumi Blend range: hair oil, soaps, shampoo, rosemary water, body lotion and creams. Pure care for hair, skin & body. Plant-based formulas inspired by Ayurvedic traditions.",
    mobileStrip: edgeGradient(["#48321b", "#463019", "#463019", "#463019", "#463019", "#463019", "#463019", "#463019", "#463019", "#463019", "#48321b", "#48321b", "#4b351e", "#4d3720", "#533d26", "#5b452e", "#624c35", "#6f5942", "#745e47", "#8e7660", "#8a7560"]),
    alt: "Buy 6 Essentials at just ₹599",
    buttonColor: "#E8A40D",
  },
  {
    src: "/banner-5-1-scaled.webp",
    mobileSrc: "/bhumiblend-mobile3.jpeg",
    mobileAlt: "A woman holding Bhumi Blend Anti-Ageing Cream. Radiant skin, the Ayurvedic way. Ayurveda-inspired care for skin and hair.",
    mobileStrip: edgeGradient(["#483318", "#463116", "#463116", "#463116", "#463116", "#463116", "#463116", "#463116", "#463116", "#483318", "#483318", "#493419", "#4b361b", "#4f3a1f", "#554025", "#5a452a", "#665136", "#6f5a3f", "#755c44", "#867057", "#8a7459"]),
    alt: "Nature's Most Potent Vitamin C Serum, powered by Billy Goat Plum and Chamomile – exclusive price ₹599",
    buttonColor: "#683A04",
  },
];

// The portrait phone pictures are all 1234×1600.
const MOBILE_ASPECT = "aspect-[1234/1600]";

const SHOP_HREF = "/#categories";
/** Where the phone banners' Shop Now button goes. */
const PHONE_SHOP_HREF = "/shop";
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
// 1×1 transparent GIF: with `mobileOnly` the wide <source> points here, so
// screens that match it (768px and up, where this slider is hidden) download
// nothing instead of the real wide banners.
const BLANK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

function SlidePicture({
  slide,
  alt,
  highPriority,
  mobileOnly,
}: {
  slide: (typeof slides)[number];
  alt: string;
  highPriority: boolean;
  mobileOnly: boolean;
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
    if (!mobileOnly) {
      preload(wideProps.src, {
        as: "image",
        imageSrcSet: wideProps.srcSet,
        imageSizes: "100vw",
        fetchPriority: "high",
        media: "(min-width: 768px)",
      });
    }
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
      <source
        media="(min-width: 768px)"
        srcSet={mobileOnly ? BLANK_PIXEL : wideProps.srcSet}
        sizes="100vw"
      />
      <img {...mobileProps} alt={alt} />
    </picture>
  );
}

/** `mobileOnly`: the slider is only shown below 768px (the homepage hides it
    from there up), so skip the wide banners entirely. */
export function HeroSlider({ mobileOnly = false }: { mobileOnly?: boolean }) {
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
            <div key={i} role="group" aria-roledescription="slide" aria-hidden={!isActive} className="relative w-full shrink-0">
              {/* The picture. Mobile: the whole portrait banner. Tablet: 188px. Desktop: 475px
                  (10px taller than the live site's 465px), image covers the box and is centred. */}
              <div
                className={`relative ${MOBILE_ASPECT} w-full overflow-hidden min-[768px]:aspect-auto min-[768px]:h-[188px] min-[1025px]:h-[475px]`}
              >
                <SlidePicture
                  slide={slide}
                  alt={isActive ? (mobileOnly ? slide.mobileAlt : slide.alt) : ""}
                  highPriority={i === 1}
                  mobileOnly={mobileOnly}
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
              </div>

              {/* Phones only. The strip under the picture, in the picture's own bottom-edge colours. It
                  starts PHONE_STRIP_FADE px up inside the picture and fades in over them (the mask), so
                  the join is a soft blend and never a line. 70px = 16 over the picture + 54 below it... */}
              <div
                aria-hidden="true"
                className="relative -mt-[16px] h-[70px] min-[768px]:hidden"
                style={{ background: slide.mobileStrip, WebkitMaskImage: PHONE_STRIP_MASK, maskImage: PHONE_STRIP_MASK }}
              />
              {/* ...and the Shop Now button, in the same spot on every slide: lined up with the text
                  (5.75% in from the left, like the headline), 32px up from the bottom so that it sits
                  across the picture's bottom edge with the dots in a row of their own below it. */}
              <Link
                href={PHONE_SHOP_HREF}
                tabIndex={isActive ? 0 : -1}
                className="absolute bottom-[32px] left-[5.75%] inline-flex h-[40px] items-center justify-center rounded-md bg-gradient-to-r from-[#e6bd62] to-[#C89B3C] px-7 font-sans text-[15px] leading-none font-semibold text-[#2a1a05] shadow-[0_12px_26px_-12px_rgba(200,155,60,0.9)] active:brightness-95 min-[768px]:hidden"
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

      {/* The dots, centred at the bottom of the banner (on phones, in the strip under the Shop Now
          button, and in white because the phone pictures are dark along their bottom). The row itself
          ignores the pointer so it can never block anything; only the dots take clicks. */}
      <div className="pointer-events-none absolute bottom-[13px] left-0 z-10 flex w-full justify-center">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === activeIndex}
            onClick={() => goTo(index)}
            // 6px dots with 6px gaps, black; inactive ones at 20% opacity (phones: white, 50%).
            // The ::before enlarges the click target without changing the look.
            className={`pointer-events-auto relative mx-1.5 h-1.5 w-1.5 cursor-pointer rounded-full bg-black before:absolute before:-inset-2 before:content-[''] max-md:bg-white ${
              index === activeIndex ? "opacity-100" : "opacity-20 max-md:opacity-50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
