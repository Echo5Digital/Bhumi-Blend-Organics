import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "glow-nourish-restore-ayurvedic-beauty-rituals-for-skin-and-scalp-health";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
