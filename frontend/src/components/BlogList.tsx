import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { blogPageSize, blogPosts, type BlogPost } from "@/data/blog";
import { blogPostHref } from "@/data/blogArticles";

// One page of the blog list: the banner, ten post cards and the page selector. Page 1 is /blog;
// page N is a tiny page file at src/app/(site)/blog/page/N/page.tsx that calls these two
// (the selector links to /blog/page/N for every page the posts fill, so add that file for a new page).

const pageCount = Math.ceil(blogPosts.length / blogPageSize);
const pageHref = (page: number) => (page === 1 ? "/blog" : `/blog/page/${page}`);

export function blogListMetadata(page: number): Metadata {
  return {
    title: page === 1 ? "Blog | Bhumi Blend Organics" : `Blog – Page ${page} | Bhumi Blend Organics`,
    description:
      "Skin care, hair care and body care tips from Bhumi Blend Organics: routines, ingredients and Ayurvedic advice for glowing skin and healthy hair.",
  };
}

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

// Product crops for the banner: each frame shows one product out of a post's picture.
const frames = [
  {
    src: "/2026-06-30-dandruff-shampoo-4e486e.webp",
    position: "50% 50%",
    className: "bottom-0 left-0 h-[78%] w-[30%]",
  },
  {
    src: "/2026-09-02-vitamin-c-serum-for-pigmentation-ae9561.webp",
    position: "8% 50%",
    className: "top-0 left-[33%] h-full w-[34%]",
  },
  {
    src: "/Serum-Blog-poster-6-b-2048x955.jpg",
    position: "78% 50%",
    className: "right-0 bottom-0 h-[78%] w-[30%]",
  },
];

function Banner() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-cream">
      {/* Soft gold light behind the pictures and in the lower-left corner. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_85%_at_82%_45%,rgba(232,196,111,0.34),transparent_70%),radial-gradient(ellipse_40%_70%_at_0%_100%,rgba(232,196,111,0.2),transparent_70%)]"
      />
      <div className="mx-auto grid max-w-[1290px] items-center gap-9 px-6 pt-10 pb-12 sm:pt-12 sm:pb-14 lg:h-[clamp(340px,26vw,400px)] lg:grid-cols-[1fr_1.05fr] lg:gap-6 lg:py-0">
        <div className="text-center lg:text-left">
          <h1 className="font-serif text-[56px] leading-none font-medium sm:text-[68px] lg:text-[clamp(64px,6vw,88px)]">
            <span className="bg-gradient-to-r from-[#a96a12] via-[#d9a63f] to-[#b8791f] bg-clip-text text-transparent">
              Blog
            </span>
          </h1>
          {/* Gold rule with a small diamond in the middle. */}
          <span aria-hidden="true" className="mx-auto mt-5 flex w-40 items-center gap-2.5 lg:mx-0">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-gold" />
            <span className="h-2 w-2 rotate-45 bg-brand-gold" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-gold" />
          </span>
        </div>

        <div
          aria-hidden="true"
          className="relative mx-auto h-[190px] w-full max-w-[340px] sm:h-[240px] sm:max-w-[430px] lg:h-[300px] lg:max-w-[560px] lg:justify-self-end"
        >
          {/* A thin gold arch offset behind the tall middle frame. */}
          <span className="absolute top-3 left-[33%] h-full w-[34%] translate-x-2.5 rounded-t-[999px] rounded-b-[18px] border border-brand-gold/50" />
          {frames.map((frame) => (
            <div
              key={frame.src}
              className={`absolute overflow-hidden rounded-t-[999px] rounded-b-[18px] bg-white shadow-[0_22px_36px_-22px_rgba(120,85,20,0.6)] ring-1 ring-[#e3cd94] ${frame.className}`}
            >
              <Image
                src={frame.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 600px, 440px"
                loading="eager"
                // Each frame shows a small crop of a much wider picture, so Next's
                // frame-sized copy came out blurry. The originals (54-140 KB) go out as they are.
                unoptimized
                className="object-cover"
                style={{ objectPosition: frame.position }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-none stroke-current transition-transform duration-300 group-hover/more:translate-x-1"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h15m-5-5 5 5-5 5" />
    </svg>
  );
}

// A post whose text is in data/blogArticles.ts has its own page at /<slug>; the others have no
// page yet, so their links go to "#".
function BlogCard({ post, first }: { post: BlogPost; first: boolean }) {
  const href = blogPostHref(post.slug);
  return (
    <article className="group flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_14px_34px_-22px_rgba(120,85,20,0.4)] ring-1 ring-[#efe5c9] transition-[transform,box-shadow] duration-500 ease-out [@media(hover:hover)]:hover:-translate-y-1.5 [@media(hover:hover)]:hover:shadow-[0_28px_44px_-24px_rgba(184,121,31,0.5)]">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="relative block aspect-850/470 overflow-hidden bg-[#f6efdc]">
        <Image
          src={post.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          loading={first ? "eager" : "lazy"}
          className="object-cover transition-transform duration-700 ease-out [@media(hover:hover)]:group-hover:scale-[1.04]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <span className="font-system text-[12px] font-bold tracking-[1.5px] text-brand-gold-dark uppercase">
          {post.category ?? "Blog"}
        </span>
        <h2 className="mt-3 font-serif text-[22px] leading-[1.3] font-semibold text-[#222] sm:text-[24px]">
          <Link href={href} className="transition-colors duration-300 hover:text-brand-gold-dark">
            {post.title}
          </Link>
        </h2>
        <p className="mt-4 font-system text-[14px] text-[#6d6459]">
          By{post.author ? ` ${post.author}` : ""} <span aria-hidden="true">•</span>{" "}
          <time dateTime={post.date}>{dateFormat.format(new Date(`${post.date}T00:00:00Z`))}</time>
        </p>
        <p className="mt-4 font-system text-[16px] leading-[1.7] text-[#4a4036]">{post.excerpt}</p>
        <Link
          href={href}
          className="group/more mt-auto inline-flex items-center gap-2 pt-6 font-system text-[14px] font-bold tracking-[1px] text-[#222] uppercase transition-colors duration-300 hover:text-brand-gold-dark"
        >
          Read more
          <span className="sr-only"> about {post.title}</span>
          <ArrowIcon />
        </Link>
      </div>
    </article>
  );
}

const pageButton =
  "grid h-11 min-w-11 place-items-center rounded-lg px-3 font-system text-[16px] font-semibold transition-[background-color,color,box-shadow] duration-300";

// "‹ 1 2 ›": the current page is a gold block, the rest are white buttons.
function Pagination({ page }: { page: number }) {
  if (pageCount <= 1) return null;
  const chevron = (direction: "prev" | "next") => (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === "prev" ? "m14.5 6-6 6 6 6" : "m9.5 6 6 6-6 6"} />
    </svg>
  );
  const idle =
    "bg-white text-[#3b3226] ring-1 ring-[#efe5c9] hover:bg-[#fbf3de] hover:text-brand-gold-dark hover:ring-brand-gold/60";
  return (
    <nav aria-label="Blog pages" className="mt-14 flex flex-wrap justify-center gap-2.5">
      {page > 1 && (
        <Link href={pageHref(page - 1)} aria-label="Previous page" className={`${pageButton} ${idle}`}>
          {chevron("prev")}
        </Link>
      )}
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) =>
        number === page ? (
          <span
            key={number}
            aria-current="page"
            className={`${pageButton} bg-gradient-to-r from-[#e6bd62] to-[#C89B3C] text-[#2a1a05] shadow-[0_10px_20px_-12px_rgba(184,121,31,0.85)]`}
          >
            {number}
          </span>
        ) : (
          <Link key={number} href={pageHref(number)} aria-label={`Page ${number}`} className={`${pageButton} ${idle}`}>
            {number}
          </Link>
        ),
      )}
      {page < pageCount && (
        <Link href={pageHref(page + 1)} aria-label="Next page" className={`${pageButton} ${idle}`}>
          {chevron("next")}
        </Link>
      )}
    </nav>
  );
}

export function BlogListPage({ page }: { page: number }) {
  const posts = blogPosts.slice((page - 1) * blogPageSize, page * blogPageSize);
  return (
    <>
      <main>
        <Banner />
        <section aria-label="Latest posts" className="bg-white">
          <div className="mx-auto max-w-[1290px] px-6 py-14 lg:py-20">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <BlogCard key={post.slug} post={post} first={index < 3} />
              ))}
            </div>
            <Pagination page={page} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
