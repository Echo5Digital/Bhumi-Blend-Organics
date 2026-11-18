"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";

// Login · Wishlist · Cart, the cluster at the right end of the header: outline
// icon (+ label) with a red count badge on the wishlist and the cart, as in the
// top-right of bhumiblend.com.
//
// - Badges appear only once there is something to count; with nothing saved
//   or in the cart the icons are bare.
// - Wishlist: the badge counts the hearts saved on the product cards
//   (lib/wishlist.ts) and the link opens /wishlist. Like the live site's heart
//   it is icon-only (name via tooltip / screen reader), which is what leaves
//   room for the spacing around the navbar.
// - Cart: the badge is the total number of items added with the "Add to cart"
//   buttons (lib/cart.ts) and the link opens /cart.
// - Login: no account backend yet, so it points at where that page will live
//   (/my-account is the live site's login page); the page doesn't exist yet.
//
// Labels show from 1280px; narrower than that — where the navbar needs the
// room — only the icons show.

const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  // 24px on phones, 20px on tablets (the navbar is tightest there: this keeps
  // a clear gap after "Contact Us"), 22px from 1024px.
  className: "h-6 w-6 md:h-5 md:w-5 lg:h-[22px] lg:w-[22px]",
} as const;

function UserIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.2 3.6-6.8 8-6.8s8 2.6 8 6.8" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.1L20 8H6.2" />
      <circle cx="9.5" cy="19.5" r="1.3" />
      <circle cx="17" cy="19.5" r="1.3" />
    </svg>
  );
}

function CountBadge({ count, bumped }: { count: number; bumped: boolean }) {
  return (
    <span
      aria-hidden="true"
      // Top-right corner of the icon, clear of the label that follows it.
      className={`absolute -top-2.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#cc0000] px-1 font-system text-[10px] leading-none font-semibold text-white ${
        bumped ? "badge-bump" : ""
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function ActionLink({
  href,
  label,
  count,
  bump = 0,
  showLabel = true,
  placeholder = false,
  className = "",
  children,
}: {
  href: string;
  label: string;
  /** Red badge with this number — shown only while it is above 0. */
  count?: number;
  /** Changes whenever the count has just changed: replays the badge's pop. */
  bump?: number;
  /** Show the text next to the icon from 1280px up. */
  showLabel?: boolean;
  /** The page doesn't exist yet: don't prefetch a route that isn't there. */
  placeholder?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const hasCount = count !== undefined && count > 0;
  const name = hasCount ? `${label}, ${count} ${count === 1 ? "item" : "items"}` : label;

  return (
    <Link
      href={href}
      prefetch={placeholder ? false : undefined}
      aria-label={name}
      title={label}
      className={`group inline-flex h-10 w-[34px] items-center justify-center gap-2 rounded-sm font-system text-[15px] leading-none text-black transition-colors duration-300 hover:text-[#C89B3C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C89B3C] md:w-auto md:justify-start ${className}`}
    >
      <span className="relative grid place-items-center transition-transform duration-300 group-hover:-translate-y-0.5">
        {children}
        {hasCount && <CountBadge key={bump} count={count} bumped={bump > 0} />}
      </span>
      {showLabel && (
        <span aria-hidden="true" className="hidden xl:inline">
          {label}
        </span>
      )}
    </Link>
  );
}

export function HeaderActions() {
  const wishlist = useWishlist();
  const cart = useCart();

  return (
    // md:pt-6 moves the row's centre line down 12px: the navbar links are
    // 40px boxes whose text sits 12px below the box centre (metrics copied
    // from the live site), so this puts icons and labels on the same line as
    // the nav text. max-md:-mr-[5px] makes the last phone icon end exactly at
    // the page margin, mirroring the hamburger on the left.
    <div className="col-start-3 flex items-center justify-self-end max-md:-mr-[5px] md:gap-2 md:pt-6 lg:gap-4 xl:gap-7">
      {/* On very narrow phones (<360px) the three icons would crowd the logo, so
          Login moves into the menu there (see MobileMenu). */}
      <ActionLink
        href="/my-account"
        label="Login"
        placeholder
        className="max-[359px]:hidden"
      >
        <UserIcon />
      </ActionLink>
      <ActionLink
        href="/wishlist"
        label="Wishlist"
        showLabel={false}
        count={wishlist.slugs.length}
        bump={wishlist.version}
      >
        <HeartIcon />
      </ActionLink>
      <ActionLink href="/cart" label="Cart" count={cart.count} bump={cart.version}>
        <CartIcon />
      </ActionLink>
    </div>
  );
}
