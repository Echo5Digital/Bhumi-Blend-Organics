"use client";

import { useEffect, useRef } from "react";

// Vitamin C Face Serum film, shown as a framed picture: a thin gold border, a
// white mat and rounded corners, on a soft champagne band. Nothing is drawn on
// top of the video — only the browser's own controls.
//
// The file is ~9 MB, so nothing is downloaded until the banner scrolls into
// view (preload="none" + a poster frame). It then plays muted on a loop and
// pauses again when scrolled away. A pause made with the player's own button
// is respected, and visitors who ask for reduced motion don't get autoplay.
export function SerumVideoBanner() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // React doesn't re-apply `muted` on hydration, and autoplay needs it set.
    video.muted = true;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let inView = false;
    let pausedByUser = false;

    // A pause while the banner is on screen can only have come from the
    // viewer; the pause below (on scrolling away) happens after inView is false.
    const onPause = () => {
      if (inView) pausedByUser = true;
    };
    const onPlay = () => {
      pausedByUser = false;
    };
    video.addEventListener("pause", onPause);
    video.addEventListener("play", onPlay);

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) {
          if (!reduceMotion && !pausedByUser) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(video);

    return () => {
      observer.disconnect();
      video.removeEventListener("pause", onPause);
      video.removeEventListener("play", onPlay);
    };
  }, []);

  return (
    <section
      id="serum-film"
      aria-label="Vitamin C Face Serum film"
      className="bg-[linear-gradient(to_bottom,#ffffff_0%,#fcf6e6_30%,#f9efd6_70%,#ffffff_100%)] px-5 py-12 sm:px-6 md:py-20"
    >
      <div className="mx-auto max-w-[1180px]">
        {/* Gold border, then a white mat, then the film with rounded corners. */}
        <div className="rounded-[22px] bg-gradient-to-br from-[#f0d27e] via-[#c8921f] to-[#9a6a17] p-[2px] shadow-[0_36px_70px_-38px_rgba(120,85,20,0.7)] sm:rounded-[30px] sm:p-[3px]">
          <div className="rounded-[20px] bg-white p-2 sm:rounded-[27px] sm:p-3.5">
            {/* Fixed aspect ratio so the page doesn't jump while the video loads. */}
            <video
              ref={videoRef}
              controls
              controlsList="nodownload"
              muted
              loop
              playsInline
              preload="none"
              poster="/Banner-Serum-Poster.jpg"
              aria-label="Bhumi Blend Vitamin C Face Serum film"
              className="block aspect-[1880/1080] h-auto w-full rounded-[14px] bg-black sm:rounded-[20px]"
            >
              <source src="/Banner-Serum-Video.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}
