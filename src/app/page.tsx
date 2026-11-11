import { BestSellers } from "@/components/BestSellers";
import { BrandDifference } from "@/components/BrandDifference";
import { Footer } from "@/components/Footer";
import { HeroSlider } from "@/components/HeroSlider";
import { IngredientTicker } from "@/components/IngredientTicker";
import { SerumVideoBanner } from "@/components/SerumVideoBanner";
import { ShopByConcern } from "@/components/ShopByConcern";
import { SkinCareEssentials } from "@/components/SkinCareEssentials";
import { TrustBar } from "@/components/TrustBar";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero banner slider */}
      <section>
        {/* The live site keeps this h1 in the page but hidden; keep it for SEO/screen readers. */}
        <h1 className="sr-only">
          Discover Natural Ayurvedic Beauty for Skin, Hair &amp; Body
        </h1>
        <HeroSlider />
      </section>

      {/* Trust strip + moving ingredient ticker (20px gap above, none between) */}
      <div className="mt-5">
        <TrustBar />
        <IngredientTicker />
      </div>

      {/* Best Sellers — directly after the ticker, as on the live site */}
      <BestSellers />

      {/* Shop by Concern — next section on the live site (keeps id="categories" for the footer link) */}
      <ShopByConcern />

      {/* The Bhumi Blend Difference — replaces the old placeholder features strip */}
      <BrandDifference />

      {/* Skin Care Essentials — next section after Nature, Ritual, Results */}
      <SkinCareEssentials />

      {/* Vitamin C Face Serum film banner — straight after Skin Care Essentials */}
      <SerumVideoBanner />

      <Footer />
    </div>
  );
}
