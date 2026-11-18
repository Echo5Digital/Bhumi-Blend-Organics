import Link from "next/link";
import { Suspense } from "react";
import { CurrentYear } from "@/components/CurrentYear";
import { contact as builtInContact } from "@/data/contact";
import { getContact } from "@/lib/catalog";

// Links the live site has but this build has no page for yet point at "#".
const columns = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "Best Sellers", href: "/#best-sellers" },
      { label: "Skin Care", href: "/product-category/face" },
      { label: "Hair Care", href: "/product-category/hair" },
      { label: "Body Care", href: "/product-category/body" },
    ],
  },
  {
    title: "About Us",
    links: [
      { label: "Our Story", href: "/our-story" },
      { label: "Our Formula", href: "#" },
      { label: "Ingredients", href: "/ingredients-benefits" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Us", href: "/contact-us" },
      { label: "Shipping Policy", href: "#" },
      { label: "Refund Policy", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
];

// Palette: deep espresso brown (#21160e / #2c1e13 / #4b3320), gold (#e8c46f,
// #C89B3C) and soft cream text (#e6dcc6).
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8c46f]";

// Each link has a short gold dash in front of it.
const linkClass = `group inline-flex items-center gap-2.5 rounded-sm py-[3px] text-[15px] leading-7 text-[#e6dcc6] transition-colors duration-300 hover:text-[#f6dd96] ${focusRing}`;

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h3 className="font-serif text-[20px] leading-7 text-[#e8c46f]">{children}</h3>
      <span aria-hidden="true" className="mt-2 mb-4 block h-0.5 w-8 rounded-full bg-[#C89B3C]" />
    </>
  );
}

const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  className: "h-[18px] w-[18px] fill-none stroke-current",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// Round gold-edged badge that holds an icon.
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#3a2819] text-[#e8c46f] ring-1 ring-[#C89B3C]/55 transition-colors duration-300 group-hover:bg-[#e8c46f] group-hover:text-[#2a1a05]"
    >
      {children}
    </span>
  );
}

const contactLinkClass = `group flex items-center gap-3 rounded-sm text-[15px] text-[#e6dcc6] transition-colors duration-300 hover:text-[#f6dd96] ${focusRing}`;

const socialClass = `grid h-10 w-10 place-items-center rounded-full text-[#e8c46f] ring-1 ring-[#C89B3C]/60 transition-colors duration-300 hover:bg-[#e8c46f] hover:text-[#2a1a05] ${focusRing}`;

type Contact = typeof builtInContact;

// The footer itself. It takes the contact details as a prop so the same markup
// serves both the real footer and the placeholder shown while they load.
function FooterView({ contact }: { contact: Contact }) {
  return (
    <footer id="contact" className="relative isolate bg-[#21160e] text-[#e6dcc6]">
      {/* Gold line along the top edge, and a faint gold glow in two corners. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#b8791f] via-[#e6bd62] to-[#b8791f]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_45%_55%_at_0%_100%,rgba(200,155,60,0.12),transparent),radial-gradient(ellipse_40%_50%_at_100%_0%,rgba(200,155,60,0.09),transparent)]"
      />

      <div className="mx-auto max-w-[1240px] px-4 pt-12 pb-7 sm:px-6 lg:pt-[72px]">
        {/* One rounded block in two tones: the brand panel, and the links panel.
            Stacked on phones and tablets, side by side from 1024px. Both panels
            use the same side padding, so their contents share one left edge. */}
        <div className="grid overflow-hidden rounded-[24px] ring-1 ring-[#C89B3C]/30 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2.4fr)]">
          <div className="flex flex-col items-start bg-[linear-gradient(155deg,#4b3320_0%,#352214_100%)] px-5 py-9 sm:px-8 lg:p-10">
            <p className="bg-gradient-to-r from-[#f6dd96] via-[#e8c46f] to-[#c89b3c] bg-clip-text font-serif text-[30px] leading-tight text-transparent">
              Bhumi Blend
            </p>
            <span aria-hidden="true" className="mt-4 block h-0.5 w-10 rounded-full bg-[#C89B3C]" />
            <p className="mt-4 max-w-[270px] text-[15px] leading-[26px] text-[#e6dcc6]">
              Ayurvedic beauty rituals inspired by nature, crafted for everyday care.
            </p>
            <div className="mt-8 flex gap-3 lg:mt-auto lg:pt-10">
              <a
                href={contact.facebookHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bhumi Blend on Facebook (opens in a new tab)"
                className={socialClass}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
                  <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.7V21h3Z" />
                </svg>
              </a>
              <a
                href={contact.instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bhumi Blend on Instagram (opens in a new tab)"
                className={socialClass}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-[18px] w-[18px] fill-none stroke-current"
                  strokeWidth="2"
                >
                  <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.3" cy="6.7" r="1" className="fill-current stroke-none" />
                </svg>
              </a>
            </div>
          </div>

          <div className="bg-[#2c1e13] px-5 py-9 sm:px-8 lg:p-10">
            {/* Phones: Shop | About Us, then Support across the full width with its
                links in two columns (same column gap, so they line up with the row
                above). From 640px the three columns sit in one row. */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 sm:gap-x-8">
              {columns.map((column) => (
                <nav
                  key={column.title}
                  aria-label={column.title}
                  className={column.title === "Support" ? "col-span-2 sm:col-span-1" : undefined}
                >
                  <Heading>{column.title}</Heading>
                  <ul
                    className={
                      column.title === "Support"
                        ? "grid grid-cols-2 gap-x-6 sm:grid-cols-1 sm:gap-x-0"
                        : undefined
                    }
                  >
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className={linkClass}>
                          <span
                            aria-hidden="true"
                            className="h-px w-2.5 shrink-0 bg-[#C89B3C]"
                          />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>

            <div className="mt-10 border-t border-[#C89B3C]/25 pt-8">
              <Heading>Connect</Heading>
              <ul className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-10">
                <li>
                  <a href={`mailto:${contact.email}`} className={contactLinkClass}>
                    <Badge>
                      <svg {...iconProps}>
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m3 7 9 6 9-6" />
                      </svg>
                    </Badge>
                    {/* overflow-wrap:anywhere is the safety net: if the space is ever
                        too narrow the address wraps instead of spilling out. */}
                    <span className="min-w-0 [overflow-wrap:anywhere]">{contact.email}</span>
                  </a>
                </li>
                <li>
                  <a href={contact.phoneHref} className={contactLinkClass}>
                    <Badge>
                      <svg {...iconProps}>
                        <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
                      </svg>
                    </Badge>
                    {contact.phoneLabel}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-7 text-left text-[13px] tracking-[0.04em] text-[#b9aa8e] sm:text-center">
          © <CurrentYear /> Bhumi Blend Organics. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

async function FooterWithContact() {
  return <FooterView contact={await getContact()} />;
}

// The contact details (set in the admin's Settings) come from the backend and are
// cached, but that cache can be cold — right after an admin saves Settings, or after
// a restart. Reading them behind <Suspense> means a cold cache never holds the page
// back: the footer shows at once with the built-in details and swaps in the saved
// ones a moment later (same layout, so nothing jumps). When the cache is warm the
// saved details are already part of the page.
export function Footer() {
  return (
    <Suspense fallback={<FooterView contact={builtInContact} />}>
      <FooterWithContact />
    </Suspense>
  );
}
