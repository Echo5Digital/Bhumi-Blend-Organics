import Image from "next/image";
import Link from "next/link";
import { CategoryMenu } from "@/components/CategoryMenu";
import { navLinkClass } from "@/components/navLinkClass";

// Nav links point at "/#section" (not just "#section") so they still land on
// the homepage section when clicked from any other page.
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#eee] bg-white">
      {/* Logo | centred nav | cart — 3 columns so the nav sits on the page centre */}
      <div className="mx-auto grid max-w-[1290px] grid-cols-[1fr_auto_1fr] items-center px-6">
        <Link
          href="/"
          aria-label="Bhumi Blend Organics – home"
          className="col-start-1 justify-self-start py-2 lg:pt-[13px] lg:pb-[19px]"
        >
          <Image
            src="/bb_logo_.png"
            alt="Bhumi Blend Organics"
            width={100}
            height={96}
            loading="eager"
            className="h-auto w-16 lg:w-[100px]"
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
          <Link href="/#best-sellers" className={navLinkClass}>
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

        <button className="col-start-3 justify-self-end rounded-full border border-brand-gold px-5 py-2 text-sm whitespace-nowrap text-brand-gold transition-colors hover:bg-brand-gold hover:text-white">
          Cart (0)
        </button>
      </div>
    </header>
  );
}
