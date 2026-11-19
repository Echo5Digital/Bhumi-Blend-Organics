import { Suspense } from "react";
import { BestSellers } from "@/components/BestSellers";
import { BrandDifference } from "@/components/BrandDifference";
import { Footer } from "@/components/Footer";
import { HeroBanner } from "@/components/HeroBanner";
import { HeroSlider } from "@/components/HeroSlider";
import { IngredientTicker } from "@/components/IngredientTicker";
import { PageSkeleton } from "@/components/PageSkeleton";
import { SerumVideoBanner } from "@/components/SerumVideoBanner";
import { ShopByConcern } from "@/components/ShopByConcern";
import { SkinCareEssentials } from "@/components/SkinCareEssentials";
import { TrustBar } from "@/components/TrustBar";
import { WhyChoose } from "@/components/WhyChoose";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero banner. Phones (below 768px) keep the original slider with its
          portrait banners; tablet and desktop get the photo carousel with the
          headline text. Only one is visible at a time (the other is
          display: none and fetches nothing). */}
      <section>
        {/* The live site keeps this h1 in the page but hidden; keep it for SEO/screen readers. */}
        <h1 className="sr-only">
          Discover Natural Ayurvedic Beauty for Skin, Hair &amp; Body
        </h1>
        <div className="md:hidden">
          <HeroSlider mobileOnly />
        </div>
        <div className="hidden md:block">
          <HeroBanner />
        </div>
      </section>

      {/* Trust strip + moving ingredient ticker, flush against the banner */}
      <div>
        <TrustBar />
        <IngredientTicker />
      </div>

      {/* Best Sellers — directly after the ticker, as on the live site */}
      <Suspense fallback={<PageSkeleton className="h-[900px]" />}>
        <BestSellers />
      </Suspense>

      {/* Shop by Concern — next section on the live site (keeps id="categories" for the footer link) */}
      <ShopByConcern />

      {/* The Bhumi Blend Difference — replaces the old placeholder features strip */}
      <BrandDifference />

      {/* Why Choose Bhumi Blend — hands-and-bottle photo with the four promises around it */}
      <WhyChoose />

      {/* Skin Care Essentials — next section after Nature, Ritual, Results */}
      <Suspense fallback={<PageSkeleton className="h-[900px]" />}>
        <SkinCareEssentials />
      </Suspense>

      {/* Vitamin C Face Serum film banner — straight after Skin Care Essentials */}
      <SerumVideoBanner />

      <Footer />
    </div>
  );
}
