import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "menopause-skin-changes-ayurvedic-ingredients-that-help-with-dryness-dullness";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
