import type { Metadata } from "next";
import { BlogArticlePage } from "@/components/BlogArticle";

const slug = "best-moisturizer-for-oily-skin-in-humid-weather-what-should-you-look-for";

export const metadata: Metadata = {
  title: "Best Moisturizer for Oily Skin in Humid Weather: What Should You Look For? - Bhumi Blend Organics",
  description:
    "Oily skin and humid weather are a frustrating combination. Your face feels greasy by noon, makeup slides off, and most moisturizers just seem to add another",
};

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
