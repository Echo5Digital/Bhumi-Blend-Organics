import type { Metadata } from "next";
import { Suspense } from "react";
import { CartView } from "@/components/CartView";
import { Footer } from "@/components/Footer";
import { PageSkeleton } from "@/components/PageSkeleton";
import { getCatalogue } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Cart | Bhumi Blend Organics",
  description: "The Bhumi Blend Organics products in your cart.",
};

// The catalogue is read behind <Suspense> so a cold cache never blocks the page.
async function Cart() {
  return <CartView catalogue={await getCatalogue()} />;
}

export default function CartPage() {
  return (
    <>
      <main>
        <Suspense fallback={<PageSkeleton className="h-[60vh]" />}>
          <Cart />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
