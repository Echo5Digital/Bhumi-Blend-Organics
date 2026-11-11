"use client";

import { useEffect, useRef } from "react";

// Full-width Vitamin C Face Serum film — just the video and the browser's own
// controls, nothing drawn on top of it.
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
    // 10px side margins at every screen size (same as the live site), so the
    // film doesn't touch the screen edges.
    <section id="serum-film" aria-label="Vitamin C Face Serum film" className="px-[10px]">
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
        className="block aspect-[1880/1080] h-auto w-full bg-black"
      >
        <source src="/Banner-Serum-Video.mp4" type="video/mp4" />
      </video>
    </section>
  );
}
