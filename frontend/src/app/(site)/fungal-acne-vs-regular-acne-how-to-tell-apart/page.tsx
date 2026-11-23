import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "fungal-acne-vs-regular-acne-how-to-tell-apart";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
