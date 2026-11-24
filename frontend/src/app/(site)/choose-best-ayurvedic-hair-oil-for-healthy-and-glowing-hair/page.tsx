import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "choose-best-ayurvedic-hair-oil-for-healthy-and-glowing-hair";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
