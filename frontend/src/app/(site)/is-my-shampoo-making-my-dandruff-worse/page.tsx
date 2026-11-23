import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "is-my-shampoo-making-my-dandruff-worse";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
