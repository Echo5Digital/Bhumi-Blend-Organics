import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "do-ayurvedic-face-serums-really-work-ingredients-that-have-clinical-backing";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
