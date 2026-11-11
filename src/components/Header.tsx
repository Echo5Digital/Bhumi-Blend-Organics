import Image from "next/image";
import Link from "next/link";
import { CategoryMenu } from "@/components/CategoryMenu";
import { MobileMenu } from "@/components/MobileMenu";
import { navLinkClass } from "@/components/navLinkClass";

// Nav links point at "/#section" (not just "#section") so they still land on
// the homepage section when clicked from any other page.
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#eee] bg-white">
      {/* Desktop: logo | centred nav | cart. Phones (<768px): hamburger | centred
          logo | cart icon. 3 columns either way so the middle item sits on the
          page centre. */}
      <div className="mx-auto grid max-w-[1290px] grid-cols-[1fr_auto_1fr] items-center px-6">
        <MobileMenu />

        <Link
          href="/"
          aria-label="Bhumi Blend Organics – home"
          className="col-start-2 justify-self-center pt-[13px] pb-[19px] md:col-start-1 md:justify-self-start md:py-2 lg:pt-[13px] lg:pb-[19px]"
        >
          <Image
            src="/bb_logo_.png"
            alt="Bhumi Blend Organics"
            width={100}
            height={96}
            loading="eager"
            className="h-auto w-[100px] md:w-16 lg:w-[100px]"
          />
        </Link>

        {/* `relative` so the Category dropdown can sit right under the nav. */}
        <nav
          aria-label="Primary"
          className="relative col-start-2 hidden items-center md:flex"
        >
          <Link href="/" className={navLinkClass}>
            Home
          </Link>
          <Link href="/shop" className={navLinkClass}>
            Shop
          </Link>
          <CategoryMenu />
          <Link href="/product-category/combo" className={navLinkClass}>
            Combo
          </Link>
          <Link href="/#about" className={navLinkClass}>
            Our Story
          </Link>
          <Link href="/#contact" className={navLinkClass}>
            Contact Us
          </Link>
        </nav>

        <button className="col-start-3 hidden justify-self-end rounded-full border border-brand-gold px-5 py-2 text-sm whitespace-nowrap text-brand-gold transition-colors hover:bg-brand-gold hover:text-white md:block">
          Cart (0)
        </button>

        {/* Phones: cart icon with an item-count badge. */}
        <button
          type="button"
          aria-label="Cart, 0 items"
          className="col-start-3 inline-flex items-center gap-1 justify-self-end text-[#444] md:hidden"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-[22px] w-[22px] fill-none stroke-current"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.1L20 8H6.2" />
            <circle cx="9.5" cy="19.5" r="1.3" />
            <circle cx="17" cy="19.5" r="1.3" />
          </svg>
          <span
            aria-hidden="true"
            className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#eee] px-1 text-[10px] leading-none"
          >
            0
          </span>
        </button>
      </div>
    </header>
  );
}
