import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "vitamin-c-serum-in-ayurveda-inspired-routines";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
