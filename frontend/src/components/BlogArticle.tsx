import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { blogPosts } from "@/data/blog";
import { blogArticles, blogPostHref, type ArticleBlock } from "@/data/blogArticles";

// One blog article: the post's photo, a white card overlapping its lower edge with the title and
// the article's blocks (data/blogArticles.ts; an article can end with a "tags" row, or with the
// "cta" and "promises" blocks), and Previous / Next links under the card. Each article has a tiny page file at its own
// address (src/app/(site)/<slug>/page.tsx) that calls the two exports.

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

// Previous / Next cards under the article.
const navLinkCard =
  "group block rounded-2xl bg-white p-5 shadow-[0_14px_34px_-24px_rgba(120,85,20,0.45)] ring-1 ring-[#efe5c9] transition-[transform,box-shadow] duration-500 ease-out [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:ring-brand-gold/60";
const navLabel =
  "block font-system text-[12px] font-bold tracking-[1.5px] text-brand-gold-dark uppercase";
const navTitle =
  "mt-2 block font-serif text-[17px] leading-snug font-semibold text-[#222] transition-colors duration-300 group-hover:text-brand-gold-dark";

// Reading text is set in Georgia, headings in the site's serif.
const bodyFont = "font-[Georgia,'Times_New_Roman',serif]";

export function blogArticleMetadata(slug: string): Metadata {
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) return {};
  const intro = post.excerpt.replace(/…$/, "").trim();
  // Search results show about 160 characters.
  const description = intro.length > 160 ? `${intro.slice(0, intro.lastIndexOf(" ", 157))}…` : intro;
  return { title: `${post.title} | Bhumi Blend Organics`, description };
}

// In a paragraph or list item, "[[words]]" is a link and "**words**" is bold (see data/blogArticles.ts).
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[\[.+?\]\]|\*\*.+?\*\*)/g).map((part, index) => {
        if (part.startsWith("[[")) {
          return (
            <Link
              key={index}
              href="#"
              className="font-semibold text-brand-gold-dark underline decoration-brand-gold/60 underline-offset-[3px] transition-colors duration-300 hover:text-[#8f6414]"
            >
              {part.slice(2, -2)}
            </Link>
          );
        }
        if (part.startsWith("**")) {
          return (
            <strong key={index} className="font-bold text-[#1f1812]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}

const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  className: "h-5 w-5 fill-none stroke-current",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const promises = [
  {
    title: "Natural Ingredients",
    text: "Ayurvedic botanicals.",
    icon: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />,
  },
  {
    title: "Skin-Safe Formulas",
    text: "Dermatologically tested.",
    icon: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  },
  {
    title: "Cruelty-Free",
    text: "Kind to skin and planet.",
    icon: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />,
  },
  {
    title: "Visible Results",
    text: "Radiant, healthy glow.",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8.5 14a4.2 4.2 0 0 0 7 0M9 9.8h.01M15 9.8h.01" />
      </>
    ),
  },
];

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className={`mt-5 text-[17px] leading-[1.9] whitespace-pre-line text-[#2f261b] sm:text-[18px] ${bodyFont}`}>
          <Inline text={block.text} />
        </p>
      );
    case "h2":
      return (
        <h2 className="mt-12 font-serif text-[26px] leading-tight font-bold whitespace-pre-line text-brand-gold-dark sm:text-[32px]">
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 className="mt-8 font-serif text-[20px] leading-snug font-bold text-[#8f6414] sm:text-[22px]">
          {block.text}
        </h3>
      );
    case "quote":
      return (
        <blockquote
          className={`mt-8 rounded-r-2xl border-l-4 border-brand-gold-dark bg-[#fff8ec] px-6 py-5 text-[19px] leading-[1.6] text-brand-gold-dark italic sm:px-8 sm:py-6 sm:text-[21px] ${bodyFont}`}
        >
          {block.text}
        </blockquote>
      );
    case "ul":
    case "ol": {
      // Bullets, or numbered steps; the markers are gold either way.
      const List = block.type;
      return (
        <List
          className={`mt-6 space-y-3 pl-6 text-[17px] leading-[1.8] text-[#2f261b] marker:font-bold marker:text-brand-gold-dark sm:text-[18px] ${
            block.type === "ol" ? "list-decimal" : "list-disc"
          } ${bodyFont}`}
        >
          {block.items.map((item) => (
            <li key={item} className="pl-1">
              <Inline text={item} />
            </li>
          ))}
        </List>
      );
    }
    case "image":
      return (
        <figure className="mt-9">
          <Image
            src={block.src}
            alt={block.alt}
            width={block.width}
            height={block.height}
            sizes="(min-width: 640px) 744px, 100vw"
            // Photos here are small already (the article's is a 27 KB AVIF): served as they are.
            unoptimized
            className="h-auto w-full rounded-2xl shadow-[0_22px_44px_-30px_rgba(120,85,20,0.55)] ring-1 ring-[#efe5c9]"
          />
        </figure>
      );
    case "callout":
      return (
        <aside className="mt-9 flex flex-col gap-5 rounded-2xl border-2 border-brand-gold-dark/70 bg-[#fff8ec] p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          <span
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-brand-gold-dark ring-1 ring-[#C89B3C]/45"
          >
            <svg {...iconProps}>{promises[0].icon}</svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-[19px] leading-snug font-bold text-brand-gold-dark">{block.title}</p>
            <p className={`mt-1.5 text-[15px] leading-[1.65] text-[#6b4f17] ${bodyFont}`}>{block.text}</p>
          </div>
          <Link
            href={block.cta.href}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#e6bd62] to-[#C89B3C] px-7 py-3 font-sans text-[15px] font-semibold text-[#2a1a05] shadow-[0_12px_24px_-14px_rgba(184,121,31,0.85)] transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-105"
          >
            {block.cta.label}
          </Link>
        </aside>
      );
    case "tags":
      return (
        <div className="mt-10 flex flex-wrap items-center gap-2.5">
          {/* On the live site this label is for screen readers only. */}
          <span className="sr-only">Post Tags:</span>
          {block.items.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#fbf3de] px-3.5 py-1.5 font-system text-[14px] text-[#6b4f17] ring-1 ring-[#C89B3C]/40"
            >
              {tag}
            </span>
          ))}
        </div>
      );
    case "cta":
      return (
        <section className="mt-14 text-center">
          {!block.plain && (
            <>
              <h2 className="font-serif text-[26px] leading-tight font-bold text-brand-gold-dark sm:text-[32px]">
                Discover Your Natural Glow
              </h2>
              <p className={`mx-auto mt-3 max-w-[540px] text-[16px] leading-[1.8] text-[#2f261b] sm:text-[17px] ${bodyFont}`}>
                Explore Bhumi Blend’s range of Ayurvedic skincare — crafted with pure botanicals to brighten, nourish,
                and protect your skin through every season.
              </p>
            </>
          )}
          <Link
            href="/shop"
            className={`${block.plain ? "" : "mt-7 "}inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#e6bd62] to-[#C89B3C] px-9 py-3.5 font-sans text-[16px] font-semibold text-[#2a1a05] shadow-[0_14px_28px_-14px_rgba(184,121,31,0.85)] transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-105`}
          >
            Shop Bhumi Blend
          </Link>
        </section>
      );
    case "promises":
      return (
        <ul className="mt-10 grid grid-cols-2 gap-y-8 rounded-2xl bg-[#f6ecd8] px-3 py-8 lg:grid-cols-4">
          {promises.map((item) => (
            <li
              key={item.title}
              className="flex flex-col items-center px-2 text-center lg:border-l lg:border-[#e0cc9a] lg:first:border-l-0"
            >
              <span
                aria-hidden="true"
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand-gold-dark ring-1 ring-[#C89B3C]/45"
              >
                <svg {...iconProps}>{item.icon}</svg>
              </span>
              <span className="mt-3 font-serif text-[16px] leading-snug font-bold text-brand-gold-dark">{item.title}</span>
              <span className={`mt-1.5 text-[14px] leading-snug text-[#6b4f17] ${bodyFont}`}>{item.text}</span>
            </li>
          ))}
        </ul>
      );
    case "faq":
      return (
        <section className="mt-12">
          <h2 className="font-serif text-[26px] leading-tight font-bold text-brand-gold-dark sm:text-[32px]">
            {block.title}
          </h2>
          <div className="mt-5 divide-y divide-[#e8dfc9] border-y border-[#e8dfc9]">
            {block.items.map((item) => (
              <div key={item.question} className="py-6">
                <h3 className="font-serif text-[18px] leading-snug font-bold text-[#8f6414] sm:text-[20px]">
                  {item.question}
                </h3>
                <p className={`mt-3 text-[16px] leading-[1.8] text-[#2f261b] sm:text-[17px] ${bodyFont}`}>
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      );
  }
}

export function BlogArticlePage({ slug }: { slug: string }) {
  const post = blogPosts.find((item) => item.slug === slug);
  const blocks = blogArticles[slug];
  if (!post || !blocks) notFound();
  const at = blogPosts.indexOf(post);
  const newer = blogPosts[at - 1];
  const older = blogPosts[at + 1];

  return (
    <>
      <main className="overflow-x-clip bg-brand-cream">
        <article>
          {/* Photo 900px wide (948 less the side padding); the file is 850px, so don't go much wider. */}
          <div className="mx-auto max-w-[948px] sm:px-6 sm:pt-10">
            <div className="relative aspect-850/470 overflow-hidden bg-[#f6efdc] shadow-[0_26px_50px_-34px_rgba(120,85,20,0.6)] sm:rounded-[22px]">
              <Image
                src={post.image}
                alt=""
                fill
                sizes="900px"
                loading="eager"
                fetchPriority="high"
                unoptimized
                className="object-cover"
              />
            </div>
          </div>

          <div className="relative mx-auto -mt-8 max-w-[888px] px-3 pb-16 sm:-mt-20 sm:px-6 sm:pb-24">
            <div className="rounded-[20px] bg-white px-5 py-8 shadow-[0_26px_54px_-34px_rgba(120,85,20,0.55)] ring-1 ring-[#efe5c9] sm:px-12 sm:py-12">
              <header>
                <Link
                  href="/blog"
                  className="font-system text-[12px] font-bold tracking-[1.5px] text-brand-gold-dark uppercase transition-colors duration-300 hover:text-[#8f6414]"
                >
                  Blog
                </Link>
                <h1 className="mt-3 font-serif text-[28px] leading-[1.25] font-bold text-[#222] sm:text-[38px]">
                  {post.title}
                </h1>
                <span aria-hidden="true" className="mt-5 block h-[3px] w-14 rounded-full bg-brand-gold" />
                <p className="mt-5 font-system text-[14px] text-[#6d6459]">
                  By{post.author ? ` ${post.author}` : ""} <span aria-hidden="true">•</span>{" "}
                  <time dateTime={post.date}>{dateFormat.format(new Date(`${post.date}T00:00:00Z`))}</time>
                </p>
              </header>

              <div className="[&>*:first-child]:mt-8">
                {blocks.map((block, index) => (
                  <Block key={index} block={block} />
                ))}
              </div>
            </div>

            {/* The posts either side of this one in the blog list (which runs newest first). */}
            <nav aria-label="Post navigation" className="mt-6 grid gap-4 sm:grid-cols-2">
              {older && (
                <Link href={blogPostHref(older.slug)} className={navLinkCard}>
                  <span className={navLabel}>Previous</span>
                  <span className={navTitle}>{older.title}</span>
                </Link>
              )}
              {newer && (
                <Link href={blogPostHref(newer.slug)} className={`${navLinkCard} sm:col-start-2 sm:text-right`}>
                  <span className={navLabel}>Next</span>
                  <span className={navTitle}>{newer.title}</span>
                </Link>
              )}
            </nav>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
