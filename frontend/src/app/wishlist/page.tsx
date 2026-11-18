import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { PageSkeleton } from "@/components/PageSkeleton";
import { WishlistView } from "@/components/WishlistView";
import { getCatalogue } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Wishlist | Bhumi Blend Organics",
  description: "The Bhumi Blend Organics products you have saved.",
};

// The catalogue is read behind <Suspense> so a cold cache never blocks the page.
async function Wishlist() {
  return <WishlistView catalogue={await getCatalogue()} />;
}

export default function WishlistPage() {
  return (
    <>
      <main>
        <Suspense fallback={<PageSkeleton className="h-[60vh]" />}>
          <Wishlist />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
