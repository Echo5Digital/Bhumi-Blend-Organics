import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "My Account | Bhumi Blend Organics",
  description: "Log in or register, and manage your Bhumi Blend Organics orders, addresses and details.",
  // Personal pages: nothing here belongs in search results.
  robots: { index: false, follow: false },
};

// Every /my-account page shares this frame: the login / register card for
// visitors, the account menu + panel for logged-in shoppers.
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main>
        <AccountShell>{children}</AccountShell>
      </main>
      <Footer />
    </>
  );
}
