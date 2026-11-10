const categories = [
  {
    name: "Hair Oils",
    description: "Herbal Ayurvedic blends for strong, nourished hair.",
  },
  {
    name: "Face Care",
    description: "Saffron creams and gels for radiant, healthy skin.",
  },
  {
    name: "Natural Shampoos",
    description: "Sulphate-free cleansers rooted in Kerala tradition.",
  },
  {
    name: "Aloe Vera Gel",
    description: "Pure, soothing gel for daily skin and hair care.",
  },
];

const features = [
  { title: "100% Natural", detail: "No parabens, no sulphates, no synthetic fragrance." },
  { title: "Kerala Ayurveda", detail: "Traditional formulations passed down for generations." },
  { title: "Cruelty Free", detail: "Never tested on animals, always kind to the earth." },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <span className="font-serif text-2xl tracking-wide text-brand-gold">
            Bhumi Blend
          </span>
          <nav className="hidden gap-8 text-sm tracking-wide text-brand-muted md:flex">
            <a href="#categories" className="hover:text-brand-gold transition-colors">
              Shop
            </a>
            <a href="#best-sellers" className="hover:text-brand-gold transition-colors">
              Best Sellers
            </a>
            <a href="#about" className="hover:text-brand-gold transition-colors">
              Our Story
            </a>
            <a href="#contact" className="hover:text-brand-gold transition-colors">
              Contact Us
            </a>
          </nav>
          <button className="rounded-full border border-brand-gold px-5 py-2 text-sm text-brand-gold transition-colors hover:bg-brand-gold hover:text-white">
            Cart (0)
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-cream">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:py-32">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-brand-gold">
              Kerala Ayurvedic Beauty
            </p>
            <h1 className="font-serif text-4xl leading-tight text-gray-900 md:text-6xl">
              Discover Natural Ayurvedic Beauty for Skin, Hair &amp; Body
            </h1>
            <p className="mt-6 max-w-md text-brand-muted">
              Authentic herbal hair oils, natural shampoos, aloe vera gel and
              saffron face creams — crafted the traditional way.
            </p>
            <div className="mt-10 flex gap-4">
              <a
                href="#categories"
                className="rounded-full bg-brand-gold px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-gold-dark"
              >
                Shop Now
              </a>
              <a
                href="#about"
                className="rounded-full border border-brand-gold px-8 py-3 text-sm font-medium text-brand-gold transition-colors hover:bg-brand-cream"
              >
                Our Story
              </a>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5" />
        </div>
      </section>

      {/* Features strip */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="text-center">
              <h3 className="font-serif text-lg text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm text-brand-muted">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-14 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-brand-gold">
              Shop by Category
            </p>
            <h2 className="mt-3 font-serif text-3xl text-gray-900 md:text-4xl">
              Explore Our Collections
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <div
                key={c.name}
                className="group rounded-2xl border border-gray-200 p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-5 aspect-square rounded-xl bg-brand-cream" />
                <h3 className="font-serif text-lg text-gray-900">{c.name}</h3>
                <p className="mt-1 text-sm text-brand-muted">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section id="best-sellers" className="bg-brand-cream">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-14 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-brand-gold">
              Customer Favorites
            </p>
            <h2 className="mt-3 font-serif text-3xl text-gray-900 md:text-4xl">
              Best Sellers
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-5 aspect-[4/3] rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5" />
                <h3 className="font-serif text-lg text-gray-900">
                  Product {i}
                </h3>
                <p className="mt-1 text-sm text-brand-muted">
                  Pure Ayurvedic formulation for daily care.
                </p>
                <button className="mt-4 w-full rounded-full bg-brand-gold py-2.5 text-sm text-white transition-colors hover:bg-brand-gold-dark">
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            © {new Date().getFullYear()} Bhumi Blend. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
