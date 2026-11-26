import type { Metadata } from "next";
import { BlogArticlePage } from "@/components/BlogArticle";

const slug = "switching-to-natural-shampoo-cleared-my-flakes";

export const metadata: Metadata = {
  title: "Switching to Natural Shampoo Cleared My Flakes - Bhumi Blend Organics",
  description:
    "I spent years trying every anti-dandruff shampoo on the shelf. The blue bottles, the medicated ones, the clinical-smelling formulas that promised results in",
};

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
