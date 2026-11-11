import { BestSellers } from "@/components/BestSellers";
import { BrandDifference } from "@/components/BrandDifference";
import { CurrentYear } from "@/components/CurrentYear";
import { HeroSlider } from "@/components/HeroSlider";
import { IngredientTicker } from "@/components/IngredientTicker";
import { ShopByConcern } from "@/components/ShopByConcern";
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

      {/* About / Story */}
      <section id="about" className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-gold">
            Our Story
          </p>
          <h2 className="mt-3 font-serif text-3xl text-gray-900 md:text-4xl">
            Rooted in Kerala&apos;s Ayurvedic Tradition
          </h2>
          <p className="mt-6 text-brand-muted">
            Bhumi Blend brings time-honoured Ayurvedic recipes to modern
            self-care — crafted in small batches using natural ingredients
            sourced from the land of Kerala.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-brand-footer/10 text-gray-900 border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <span className="font-serif text-xl text-brand-footer">
                Bhumi Blend
              </span>
              <p className="mt-3 text-sm text-brand-muted">
                Authentic Ayurvedic organic skin &amp; hair care.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm uppercase tracking-wide text-gray-900 font-medium">
                Shop
              </h4>
              <ul className="space-y-2 text-sm text-brand-muted">
                <li><a href="#best-sellers" className="hover:text-brand-gold">Best Sellers</a></li>
                <li><a href="#categories" className="hover:text-brand-gold">Categories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm uppercase tracking-wide text-gray-900 font-medium">
                Company
              </h4>
              <ul className="space-y-2 text-sm text-brand-muted">
                <li><a href="#about" className="hover:text-brand-gold">Our Story</a></li>
                <li><a href="#contact" className="hover:text-brand-gold">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm uppercase tracking-wide text-gray-900 font-medium">
                Policies
              </h4>
              <ul className="space-y-2 text-sm text-brand-muted">
                <li><a href="#" className="hover:text-brand-gold">Shipping Policy</a></li>
                <li><a href="#" className="hover:text-brand-gold">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-6 text-center text-xs text-brand-muted">
            © <CurrentYear /> Bhumi Blend. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
