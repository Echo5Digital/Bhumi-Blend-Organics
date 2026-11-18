"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { fetchCustomer } from "@/lib/account";
import { ApiError } from "@/lib/api";
import { logout, updateCustomer, useSession } from "@/lib/auth";
import { useHydrated } from "@/lib/persistent-store";
import { AuthForms } from "./AuthForms";

const sections = [
  { label: "Dashboard", href: "/my-account" },
  { label: "Orders", href: "/my-account/orders" },
  { label: "Downloads", href: "/my-account/downloads" },
  { label: "Addresses", href: "/my-account/addresses" },
  { label: "Account Details", href: "/my-account/account-details" },
] as const;

const itemClass =
  "block h-12 shrink-0 cursor-pointer px-5 text-left font-system text-[14px] leading-12 font-semibold whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-gold md:w-full";

// Frame for every /my-account page (it is the layout's only child).
//
// - Not logged in (any /my-account/... address): the Login / Register card.
// - Logged in: the account layout from the live site — a menu on the left, the
//   page's content in a bordered panel on the right. On phones the menu becomes
//   a row that scrolls sideways above the panel.
//
// Whether someone is logged in lives in the browser (lib/auth.ts), so the
// server HTML is an empty placeholder until the page is interactive — a
// logged-in visitor never sees the login form flash by.
export function AccountShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const hydrated = useHydrated();
  const pathname = usePathname();
  const token = session?.token ?? null;
  const loggedIn = hydrated && session !== null;

  // Check the saved login with the backend once per visit: refresh the shown
  // details, or log out if it has expired or the account was switched off.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchCustomer(token)
      .then((customer) => {
        if (!cancelled) updateCustomer(customer);
      })
      .catch((error: unknown) => {
        if (!cancelled && error instanceof ApiError && error.status === 401) logout();
        // Any other failure (backend offline...): keep them logged in, the pages show their own errors.
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1320px] px-6 pt-12 pb-20 md:pt-16 md:pb-28">
        <div className="pb-10 text-center md:pb-12">
          <h1 className="font-serif text-[32px] leading-[1.2] font-medium text-[#222] sm:text-[40px]">My Account</h1>
          <div aria-hidden="true" className="mt-5 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#C89B3C]" />
            <span className="h-2 w-2 rotate-45 bg-[#C89B3C]" />
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#C89B3C]" />
          </div>
        </div>

        {!hydrated && <div aria-hidden="true" className="min-h-[320px]" />}
        {hydrated && !session && <AuthForms />}

        {/* The page's content is always rendered (hidden until someone is logged in)
            so Next can prerender every route segment. `key` starts the page afresh
            whenever the login changes, so forms never keep a previous person's values. */}
        <div hidden={!loggedIn} className={loggedIn ? "md:grid md:grid-cols-[330px_minmax(0,1fr)] md:items-start" : undefined}>
          {loggedIn && (
            <nav
              aria-label="Account"
              className="mb-5 flex gap-0.5 overflow-x-auto md:mb-0 md:block md:space-y-0.5 md:overflow-visible"
            >
              {sections.map((section) => {
                const current = pathname === section.href;
                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    aria-current={current ? "page" : undefined}
                    className={`${itemClass} ${
                      current ? "bg-[#f0f0f1] text-brand-gold-dark" : "bg-[#f7f7f7] text-[#444] hover:text-brand-gold-dark"
                    }`}
                  >
                    {section.label}
                  </Link>
                );
              })}
              <button type="button" onClick={logout} className={`${itemClass} bg-[#f7f7f7] text-[#444] hover:text-brand-gold-dark`}>
                Logout
              </button>
            </nav>
          )}

          <div
            key={session?.customer.id ?? "guest"}
            className="min-w-0 rounded-[3px] border border-[#ddd] bg-white p-6 font-system text-[15px] leading-[1.55] text-[#444] md:p-[30px]"
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
