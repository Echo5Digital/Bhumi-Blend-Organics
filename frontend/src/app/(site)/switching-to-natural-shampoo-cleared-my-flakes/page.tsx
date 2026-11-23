import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "switching-to-natural-shampoo-cleared-my-flakes";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
