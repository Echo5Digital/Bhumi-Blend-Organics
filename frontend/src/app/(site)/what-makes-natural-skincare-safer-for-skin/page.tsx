import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "what-makes-natural-skincare-safer-for-skin";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
