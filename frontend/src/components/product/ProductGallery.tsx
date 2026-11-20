"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// `fit: "contain"` shows a photo whole (for a square or wide picture whose text
// would otherwise be cropped by the tall frame); the default fills the frame.
// `kind: "video"` is a video file: it plays in the frame with its own controls, and its
// thumbnail is the still frame (`poster`) with a play mark.
type GalleryImage = { src: string; alt: string; fit?: "contain"; kind?: "video"; poster?: string };

function PlayMark() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-brand-gold shadow-[0_4px_12px_-4px_rgba(0,0,0,0.35)] sm:h-9 sm:w-9">
        <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-current">
          <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
        </svg>
      </span>
    </span>
  );
}

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
  "absolute z-10 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/95 text-[#222] shadow-[0_6px_16px_-4px_rgba(0,0,0,0.3)] transition-colors duration-300 hover:bg-brand-gold hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold sm:h-11 sm:w-11";
// The arrows sit in the bottom corners; over a video they would cover its play and
// full-screen buttons, so there they sit above the video's control bar.
const arrowSpot = (onVideo: boolean) => (onVideo ? "bottom-16 sm:bottom-[4.5rem]" : "bottom-3 sm:bottom-4");

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
  const thumbsRef = useRef<HTMLUListElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const count = images.length;
  const onVideo = images[active]?.kind === "video";

  const go = (index: number) => setActive((index + count) % count);

  // A video stops when another photo is shown.
  useEffect(() => {
    slidesRef.current?.querySelectorAll("video").forEach((video) => {
      if (Number(video.dataset.slide) !== active) video.pause();
    });
  }, [active]);

  // With more photos than fit in one row, the thumbnails scroll sideways;
  // keep the selected one centred in view. Only the strip scrolls (not the page).
  useEffect(() => {
    const list = thumbsRef.current;
    const thumb = list?.children[active] as HTMLElement | undefined;
    if (!list || !thumb || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({
      left: thumb.offsetLeft - (list.clientWidth - thumb.clientWidth) / 2,
      behavior: "smooth",
    });
  }, [active]);

  return (
    <div className="flex w-full min-w-0 flex-col">
      {/* The thumbnails come first in the markup but are shown below the photo
          (flex `order`). Next's dev-only LCP check keys images by URL and the
          last one rendered wins; the first thumbnail shares its URL with the
          main photo, so the main photo has to render after it. */}
      {/* Six thumbnails fill the row; any more scroll sideways at the same
          size. The padding (with matching negative margins) keeps the active
          ring from being clipped by the scroll area. */}
      {count > 1 && (
      <ul
        ref={thumbsRef}
        className="relative order-2 -mx-1 mt-3 grid auto-cols-[calc((100%-2.5rem)/6)] grid-flow-col gap-2 overflow-x-auto px-1 py-1.5 [scrollbar-width:none] sm:auto-cols-[calc((100%-3.75rem)/6)] sm:gap-3"
      >
        {images.map((image, index) => (
          <li key={`${image.src}-${index}`}>
            <button
              type="button"
              aria-label={`Show ${image.kind === "video" ? "video" : "photo"} ${index + 1} of ${count}`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => setActive(index)}
              className={`relative block aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-lg bg-white transition-[opacity,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold sm:rounded-xl ${
                index === active
                  ? "opacity-100 ring-2 ring-brand-gold ring-offset-2"
                  : "opacity-65 ring-1 ring-[#e9e1cf] hover:opacity-100"
              }`}
            >
              {image.kind === "video" ? (
                <>
                  {image.poster ? (
                    <Image src={image.poster} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    // no still frame: the thumbnail is the video's first frame
                    <video
                      src={`${image.src}#t=0.1`}
                      muted
                      playsInline
                      preload="metadata"
                      tabIndex={-1}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <PlayMark />
                </>
              ) : (
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="80px"
                  className={image.fit === "contain" ? "object-contain" : "object-cover"}
                />
              )}
            </button>
          </li>
        ))}
      </ul>
      )}

      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`${productName} photos`}
        onTouchStart={(event) => {
          // dragging a video's seek bar is not a swipe to the next photo
          touchStartX.current = (event.target as Element).closest("video") ? null : event.touches[0].clientX;
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
          ref={slidesRef}
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {images.map((image, index) => (
            <div
              key={`${image.src}-${index}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              aria-hidden={index === active ? undefined : true}
              // keeps a video's controls out of the tab order while it is off screen
              inert={index === active ? undefined : true}
              className="relative aspect-[3/4] w-full shrink-0"
            >
              {image.kind === "video" ? (
                <video
                  data-slide={index}
                  src={image.src}
                  poster={image.poster}
                  aria-label={image.alt}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full bg-white object-contain"
                />
              ) : (
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  preload={index === 0}
                  sizes="(min-width: 1024px) 600px, (min-width: 640px) 80vw, 100vw"
                  className={image.fit === "contain" ? "object-contain" : "object-cover"}
                />
              )}
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
        <button
          type="button"
          aria-label="Previous photo"
          onClick={() => go(active - 1)}
          className={`${arrowClass} ${arrowSpot(onVideo)} left-2.5 sm:left-3.5`}
        >
          <Chevron direction="left" />
        </button>
        <button
          type="button"
          aria-label="Next photo"
          onClick={() => go(active + 1)}
          className={`${arrowClass} ${arrowSpot(onVideo)} right-2.5 sm:right-3.5`}
        >
          <Chevron direction="right" />
        </button>
          </>
        )}
      </div>
    </div>
  );
}
