import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "how-to-pick-a-natural-serum-for-dark-spots";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
