"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// "Similar Posts" at the end of a blog article: a row of post cards (3 across on a wide screen, 2 on
// a tablet, 1 on a phone) that slides one card at a time with the arrows, the dots, or a swipe. The
// posts are chosen on the server (data/blogRelated.ts) and arrive here ready to show.

export type SimilarPost = {
  href: string;
  title: string;
  image: string;
  /** "By BhumiBlend" (or just "By" when the post shows no author). */
  by: string;
  /** "May 28, 2025". */
  date: string;
  /** "2025-05-28". */
  dateTime: string;
};

const arrowButton =
  "absolute top-[calc(100cqw*0.2765)] z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-brand-gold-dark shadow-[0_8px_20px_-8px_rgba(120,85,20,0.6)] ring-1 ring-[#C89B3C]/55 transition-[opacity,background-color,color] duration-300 hover:bg-brand-gold hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold-dark disabled:pointer-events-none disabled:opacity-0 sm:top-[calc((100cqw-1.25rem)/2*0.2765)] lg:top-[calc((100cqw-2.5rem)/3*0.2765)]";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === "left" ? "m14.5 6-6 6 6 6" : "m9.5 6 6 6-6 6"} />
    </svg>
  );
}

export function SimilarPosts({ posts }: { posts: SimilarPost[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [last, setLast] = useState(0);

  // How far one card slides: its width plus the gap to the next.
  const stepOf = useCallback((el: HTMLUListElement) => {
    const first = el.children[0] as HTMLElement | undefined;
    const second = el.children[1] as HTMLElement | undefined;
    return first && second ? second.offsetLeft - first.offsetLeft : 0;
  }, []);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const step = stepOf(el);
    if (!step) {
      setLast(0);
      setIndex(0);
      setReady(true);
      return;
    }
    const lastIndex = Math.max(0, Math.round((el.scrollWidth - el.clientWidth) / step));
    setLast(lastIndex);
    setIndex(Math.min(lastIndex, Math.max(0, Math.round(el.scrollLeft / step))));
    setReady(true);
  }, [stepOf]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const goTo = (target: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: target * stepOf(el), behavior: "smooth" });
  };

  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="similar-posts-title" className="mx-auto max-w-[1180px] px-4 pb-12 sm:px-6 sm:pb-16">
      <h2 id="similar-posts-title" className="font-serif text-[26px] leading-tight font-bold text-brand-gold-dark sm:text-[32px]">
        Similar Posts
      </h2>

      <div className="@container relative mt-6" role="group" aria-roledescription="carousel" aria-label="Similar posts">
        <button
          type="button"
          aria-label="Previous posts"
          disabled={index <= 0}
          onClick={() => goTo(index - 1)}
          className={`${arrowButton} left-2 sm:-left-3 lg:-left-5 ${ready ? "" : "opacity-0"}`}
        >
          <Chevron direction="left" />
        </button>
        <button
          type="button"
          aria-label="Next posts"
          disabled={index >= last}
          onClick={() => goTo(index + 1)}
          className={`${arrowButton} right-2 sm:-right-3 lg:-right-5 ${ready ? "" : "opacity-0"}`}
        >
          <Chevron direction="right" />
        </button>

        <ul
          ref={track}
          className="flex snap-x snap-mandatory scroll-px-1 gap-5 overflow-x-auto scroll-smooth px-1 pt-1 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {posts.map((post, position) => (
            <li
              key={post.href}
              className="flex shrink-0 basis-full snap-start sm:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-2.5rem)/3)]"
            >
              <article className="group flex w-full flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_14px_34px_-22px_rgba(120,85,20,0.4)] ring-1 ring-[#efe5c9] transition-[transform,box-shadow] duration-500 ease-out [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[0_26px_42px_-24px_rgba(184,121,31,0.5)]">
                <Link href={post.href} tabIndex={-1} aria-hidden="true" className="relative block aspect-850/470 overflow-hidden bg-[#f6efdc]">
                  <Image
                    src={post.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                    loading={position < 3 ? "eager" : "lazy"}
                    className="object-cover transition-transform duration-700 ease-out [@media(hover:hover)]:group-hover:scale-[1.04]"
                  />
                </Link>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="font-serif text-[19px] leading-[1.35] font-semibold text-[#222] sm:text-[21px]">
                    <Link href={post.href} className="transition-colors duration-300 hover:text-brand-gold-dark">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-3 font-system text-[14px] text-[#6d6459]">
                    {post.by} <span aria-hidden="true">•</span> <time dateTime={post.dateTime}>{post.date}</time>
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <div className={`flex min-h-2 justify-center gap-2 transition-opacity duration-300 ${ready && last > 0 ? "opacity-100" : "opacity-0"}`}>
          {Array.from({ length: last + 1 }, (_, dot) => (
            <button
              key={dot}
              type="button"
              aria-label={`Go to slide ${dot + 1}`}
              aria-current={dot === index ? "true" : undefined}
              onClick={() => goTo(dot)}
              className={`h-2 rounded-full transition-[width,background-color] duration-300 ${
                dot === index ? "w-6 bg-brand-gold-dark" : "w-2 bg-[#d9c9a0] hover:bg-brand-gold"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
