import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { Footer } from "@/components/Footer";
import { PageSkeleton } from "@/components/PageSkeleton";
import { getCatalogue } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Checkout | Bhumi Blend Organics",
  description: "Check out securely with Bhumi Blend Organics.",
  // A checkout page is for people with something in their cart, not for search results.
  robots: { index: false, follow: false },
};

// The catalogue is read behind <Suspense> so a cold cache never blocks the page.
async function Checkout() {
  const catalogue = await getCatalogue();
  // Pack size per product ("100g", "450ml"), shown under each name in the order summary.
  const sizes = Object.fromEntries(catalogue.flatMap((product) => (product.weight ? [[product.slug, product.weight]] : [])));
  return <CheckoutView catalogue={catalogue} sizes={sizes} />;
}

export default function CheckoutPage() {
  return (
    <>
      <main>
        <Suspense fallback={<PageSkeleton className="h-[70vh]" />}>
          <Checkout />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
