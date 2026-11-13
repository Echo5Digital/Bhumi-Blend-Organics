import type { Metadata } from "next";
import { CartView } from "@/components/CartView";
import { Footer } from "@/components/Footer";
import { catalogue } from "@/data/products";

export const metadata: Metadata = {
  title: "Cart | Bhumi Blend Organics",
  description: "The Bhumi Blend Organics products in your cart.",
};

export default function CartPage() {
  return (
    <>
      <main>
        <CartView catalogue={catalogue} />
      </main>
      <Footer />
    </>
  );
}
