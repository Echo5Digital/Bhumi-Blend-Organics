import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "monsoon-skincare-survival-guide-lightweight-routine-for-humid-indian-weather";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
