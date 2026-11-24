import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "what-is-vegan-skincare-the-real-benefits-of-using-vegan-skincare-products";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
