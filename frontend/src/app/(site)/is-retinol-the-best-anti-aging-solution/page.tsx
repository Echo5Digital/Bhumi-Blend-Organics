import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "is-retinol-the-best-anti-aging-solution";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
