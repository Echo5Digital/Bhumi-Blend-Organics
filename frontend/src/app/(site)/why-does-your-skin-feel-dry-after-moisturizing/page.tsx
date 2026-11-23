import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "why-does-your-skin-feel-dry-after-moisturizing";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
