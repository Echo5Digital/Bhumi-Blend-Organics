"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type GalleryImage = { src: string; alt: string };

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

const arrowClass =
  "absolute bottom-3 z-10 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/95 text-[#222] shadow-[0_6px_16px_-4px_rgba(0,0,0,0.3)] transition-colors duration-300 hover:bg-brand-gold hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold sm:bottom-4 sm:h-11 sm:w-11";

// Main photo slides sideways; the thumbnails sit in one horizontal row under it
// on every screen size. Arrows, thumbnails and swiping all change the photo.
// The arrows sit in the bottom corners: most photos are posters with text
// running across the middle, which a mid-height arrow would cover.
export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;

  const go = (index: number) => setActive((index + count) % count);

  return (
    <div className="flex w-full flex-col">
      {/* The thumbnails come first in the markup but are shown below the photo
          (flex `order`). Next's dev-only LCP check keys images by URL and the
          last one rendered wins; the first thumbnail shares its URL with the
          main photo, so the main photo has to render after it. */}
      <ul className="order-2 mt-4 grid grid-cols-6 gap-2 sm:gap-3">
        {images.map((image, index) => (
          <li key={image.src}>
            <button
              type="button"
              aria-label={`Show photo ${index + 1} of ${count}`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => setActive(index)}
              className={`relative block aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-lg bg-white transition-[opacity,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold sm:rounded-xl ${
                index === active
                  ? "opacity-100 ring-2 ring-brand-gold ring-offset-2"
                  : "opacity-65 ring-1 ring-[#e9e1cf] hover:opacity-100"
              }`}
            >
              <Image
                src={image.src}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`${productName} photos`}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const delta = event.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(delta) > 45) go(active + (delta < 0 ? 1 : -1));
        }}
        className="relative order-1 touch-pan-y overflow-hidden rounded-[20px] bg-white shadow-[0_22px_44px_-26px_rgba(120,85,20,0.55)] ring-1 ring-[#eadcb6]"
      >
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {images.map((image, index) => (
            <div
              key={image.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              aria-hidden={index === active ? undefined : true}
              className="relative aspect-[3/4] w-full shrink-0"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                preload={index === 0}
                sizes="(min-width: 1024px) 600px, (min-width: 640px) 80vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          aria-label="Previous photo"
          onClick={() => go(active - 1)}
          className={`${arrowClass} left-2.5 sm:left-3.5`}
        >
          <Chevron direction="left" />
        </button>
        <button
          type="button"
          aria-label="Next photo"
          onClick={() => go(active + 1)}
          className={`${arrowClass} right-2.5 sm:right-3.5`}
        >
          <Chevron direction="right" />
        </button>
      </div>
    </div>
  );
}
