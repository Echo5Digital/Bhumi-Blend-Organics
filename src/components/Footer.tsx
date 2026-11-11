import Link from "next/link";
import { CurrentYear } from "@/components/CurrentYear";

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
      { label: "Our Story", href: "#" },
      { label: "Our Formula", href: "#" },
      { label: "Ingredients", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Us", href: "/#contact" },
      { label: "Shipping Policy", href: "#" },
      { label: "Refund Policy", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
];

const linkClass =
  "rounded-sm text-[14.5px] leading-7 text-[#e6dcc6] transition-colors duration-300 hover:text-[#e8c46f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold";

const headingClass = "font-serif text-[19px] leading-7 text-[#f3ead6]";

export function Footer() {
  return (
    // Orange frame (the brand footer colour) around a dark panel.
    <footer id="contact" className="bg-brand-footer px-3 py-8 sm:px-6">
      <div className="mx-auto max-w-[1240px] bg-[#1f1d19] px-5 pt-14 pb-7 text-center lg:pt-[60px]">
        {/* 5 equal columns from 1024px. Below that the brand has its own row and
            the link columns sit two to a row (Shop | About Us, Support | Connect
            from 640px). On phones Support and Connect take a full row each: a
            half-width column is only ~130px, too narrow for the email address. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <p className="font-serif text-[28px] leading-tight text-[#f3ead6]">Bhumi Blend</p>
            {/* Short gold rule, left-aligned under the name like the live site. */}
            <span
              aria-hidden="true"
              className="mx-auto mt-5 block h-0.5 w-10 bg-brand-gold lg:mx-0"
            />
            <p className="mx-auto mt-4 max-w-[250px] text-[14.5px] leading-[25px] text-[#cfc7b6]">
              Ayurvedic beauty rituals inspired by nature, crafted for everyday care.
            </p>
          </div>

          {columns.map((column) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className={column.title === "Support" ? "col-span-2 sm:col-span-1" : undefined}
            >
              <h3 className={headingClass}>{column.title}</h3>
              <ul className="mt-4">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 sm:col-span-1">
            <h3 className={headingClass}>Connect</h3>
            <ul className="mt-4">
              <li>
                {/* overflow-wrap:anywhere is the safety net: if a column is ever
                    too narrow the address wraps instead of spilling out. */}
                <a
                  href="mailto:support@bhumiblend.com"
                  className={`${linkClass} [overflow-wrap:anywhere]`}
                >
                  support@bhumiblend.com
                </a>
              </li>
              <li>
                <a href="tel:+918921410904" className={linkClass}>
                  +91 89214 10904
                </a>
              </li>
            </ul>
            <div className="mt-3.5 flex justify-center gap-3.5 text-brand-gold">
              <a
                href="#"
                aria-label="Bhumi Blend on Facebook"
                className="rounded-sm transition-colors duration-300 hover:text-[#e8c46f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
                  <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.7V21h3Z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="Bhumi Blend on Instagram"
                className="rounded-sm transition-colors duration-300 hover:text-[#e8c46f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
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
        </div>

        <div className="mt-9 border-t border-white/10 pt-5 text-[13px] tracking-[0.03em] text-[#8f897e]">
          © <CurrentYear /> Bhumi Blend Organics. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
