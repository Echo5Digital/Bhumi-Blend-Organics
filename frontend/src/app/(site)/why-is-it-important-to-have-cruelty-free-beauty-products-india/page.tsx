import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "why-is-it-important-to-have-cruelty-free-beauty-products-india";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
