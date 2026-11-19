import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import type { ReactNode } from "react";
import "@/admin/styles.css";

// The admin back office, served at /adminecho5. It is its own root layout (the storefront's lives in
// app/(site)), so it gets its own <html> and its own stylesheet: nothing of the shop's header or
// Tailwind styles reaches it, and nothing of the admin's styles reaches the shop.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bhumi Blend Admin",
  robots: { index: false, follow: false },
  icons: { icon: "/bb_logo_.png" },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={playfair.variable}>
      <body>{children}</body>
    </html>
  );
}
