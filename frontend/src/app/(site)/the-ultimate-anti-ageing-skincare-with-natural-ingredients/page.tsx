import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "the-ultimate-anti-ageing-skincare-with-natural-ingredients";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
