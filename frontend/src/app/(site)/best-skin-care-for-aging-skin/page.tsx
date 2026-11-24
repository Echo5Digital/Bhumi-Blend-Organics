import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "best-skin-care-for-aging-skin";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
