import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "where-keralas-timeless-ayurvedic-secrets-meet-modern-skincare-science";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
