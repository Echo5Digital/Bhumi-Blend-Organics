import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { WishlistView } from "@/components/WishlistView";
import { catalogue } from "@/data/products";

export const metadata: Metadata = {
  title: "Wishlist | Bhumi Blend Organics",
  description: "The Bhumi Blend Organics products you have saved.",
};

export default function WishlistPage() {
  return (
    <>
      <main>
        <WishlistView catalogue={catalogue} />
      </main>
      <Footer />
    </>
  );
}
