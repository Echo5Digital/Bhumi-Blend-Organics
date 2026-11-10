import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Bhumi Blend | Ayurvedic Organic Skin Care Products",
  description:
    "Shop Bhumi Blend for authentic Kerala Ayurvedic beauty products, including herbal hair oils, natural shampoos, aloe vera gel and saffron face creams.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
      </body>
    </html>
  );
}
