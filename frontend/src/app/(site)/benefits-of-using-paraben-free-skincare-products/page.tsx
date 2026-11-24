import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "benefits-of-using-paraben-free-skincare-products";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
