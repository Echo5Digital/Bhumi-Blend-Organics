import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "how-to-choose-the-right-hair-oil-for-you";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
